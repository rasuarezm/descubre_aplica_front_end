import apiClient, { ApiError } from '@/lib/api-client';

export interface ProposalUploadInput {
  file: File;
  customerId: string;
  opportunityId: string;
  versionLabel?: string;
  description?: string;
  status?: string;
  parentDocumentId?: string | null;
}

/** Archivo ya cargado en Storage cuya finalización todavía no se confirmó. */
export interface PendingProposalUpload {
  file: File;
  gcsUri: string;
}

/**
 * Sube un documento de propuesta y lo registra en el backend.
 * `pendingUpload` conserva el objeto ya cargado: si la finalización falla por un error transitorio,
 * reintentar con el mismo archivo solo repite la finalización y no deja otro objeto huérfano.
 */
export async function uploadProposalDocument(
  input: ProposalUploadInput,
  pendingUpload: { current: PendingProposalUpload | null }
): Promise<void> {
  const { file, customerId, opportunityId, versionLabel, description, status, parentDocumentId } = input;

  if (pendingUpload.current?.file !== file) {
    pendingUpload.current = null;

    // Endpoint genérico con document_context='proposal': define la ruta en el bucket.
    const { upload_url, gcs_uri } = await apiClient.post<{ upload_url: string; gcs_uri: string }>(
      '/generate_document_upload_url',
      {
        metadata: {
          filename: file.name,
          content_type: file.type,
          customer_id: customerId,
          opportunity_id: opportunityId,
          document_context: 'proposal',
          proposal_doc_category: 'propuesta',
          version_label: versionLabel || 'v1',
          parent_document_id: parentDocumentId || '',
        },
      }
    );

    // URL firmada de Cloud Storage: va directa, no pasa por el gateway.
    const uploadResponse = await fetch(upload_url, {
      method: 'PUT',
      headers: { 'Content-Type': file.type },
      body: file,
    });
    if (!uploadResponse.ok) throw new Error('Error al subir a Cloud Storage.');

    pendingUpload.current = { file, gcsUri: gcs_uri };
  }

  try {
    await apiClient.post('/finalize_proposal_document_upload', {
      opportunity_id: opportunityId,
      customer_id: customerId,
      gcs_uri: pendingUpload.current.gcsUri,
      filename: file.name,
      content_type: file.type,
      category: 'propuesta',
      version_label: versionLabel || 'v1',
      description: description || '',
      status,
      parent_document_id: parentDocumentId || null,
    });
  } catch (error) {
    // Un 4xx es un rechazo definitivo (la concesión de subida se consume una sola vez, caduca o no
    // admite el archivo): reintentar con el mismo objeto no serviría, hay que cargarlo de nuevo.
    if (error instanceof ApiError && error.status < 500) pendingUpload.current = null;
    throw error;
  }

  pendingUpload.current = null;
}
