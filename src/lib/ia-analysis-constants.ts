/**
 * Estados en los que el análisis de IA aún no ha terminado (sigue procesándose).
 * Debe coincidir con la lógica de polling en la página de oportunidad.
 */
export const IA_ANALYSIS_IN_PROGRESS_STATUSES = [
  'pending_upload',
  'pending_analysis',
  'pending',
  'in_progress',
] as const;

export const IA_ANALYSIS_ERROR_STATUSES = ['error', 'failed'] as const;
