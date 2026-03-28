/**
 * Debe coincidir con `DOCUMENTS_BUCKET_NAME` en `aplica_functions/config.py`.
 * Opcional: `NEXT_PUBLIC_DOCUMENTS_BUCKET_NAME` en `.env.local` si el despliegue usa otro nombre.
 * Evita usar URLs firmadas de buckets legacy que devuelven 403.
 */
export const DOCUMENTS_BUCKET_NAME =
  (typeof process !== 'undefined' && process.env.NEXT_PUBLIC_DOCUMENTS_BUCKET_NAME?.trim()) ||
  'aplica-documents-pc-sitioweb';

/** True si la URL firmada GCS apunta al bucket de documentos de Aplica. */
export function gcsSignedUrlInDocumentsBucket(url: string | null | undefined): boolean {
  if (!url || !url.startsWith('http')) return false;
  try {
    const u = new URL(url);
    const host = u.hostname.toLowerCase();
    if (host === 'storage.googleapis.com') {
      const first = u.pathname.split('/').filter(Boolean)[0];
      return first === DOCUMENTS_BUCKET_NAME;
    }
    if (host === `${DOCUMENTS_BUCKET_NAME}.storage.googleapis.com`) return true;
    return false;
  } catch {
    return false;
  }
}

/** src seguro para <img> del logo de cliente: solo firmas de nuestro bucket; si no, placeholder. */
export function customerLogoImgSrc(
  logoSignedUrl: string | null | undefined,
  placeholderUrl: string
): string {
  return gcsSignedUrlInDocumentsBucket(logoSignedUrl) ? logoSignedUrl! : placeholderUrl;
}
