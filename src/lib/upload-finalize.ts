import apiClient, { ApiError } from '@/lib/api-client';

/**
 * Llama a un finalizador de subida. Un 403 `already_finalized` significa que la subida ya se guardó
 * y se perdió la respuesta: es un éxito, y el `id` que trae es el del documento.
 */
export async function finalizeUpload<T extends { id?: string }>(endpoint: string, body: unknown): Promise<T> {
  try {
    return await apiClient.post<T>(endpoint, body);
  } catch (error) {
    if (error instanceof ApiError && error.status === 403 && error.data?.reason === 'already_finalized') {
      return { id: error.data.id } as T;
    }
    throw error;
  }
}
