import type { FuenteSecop } from '@/types';

export function getFuenteDocumentId(f: FuenteSecop, index?: number): string {
  return f.id_documento_fuente || f.id_fuente || f.id || (index !== undefined ? `idx-${index}` : '');
}

/**
 * Identificador corto de la fuente: parte UNSPSC cuando el id del documento
 * es `colcompra-rss-<codigo>`; en otro caso, el id completo.
 */
export function codigoFuenteParaDisplay(documentId: string): string {
  const id = documentId.trim();
  if (!id) return '—';
  const m = /^colcompra-rss-(.+)$/i.exec(id);
  return m ? m[1] : id;
}

export function nombreFuenteSecop(f: FuenteSecop, index?: number): string {
  return (
    f.nombre_visible?.trim() ||
    f.nombre_descriptivo_fuente?.trim() ||
    f.descripcion_corta?.trim() ||
    f.descripcion_fuente?.trim() ||
    f.url?.trim() ||
    getFuenteDocumentId(f, index) ||
    'Fuente'
  );
}
