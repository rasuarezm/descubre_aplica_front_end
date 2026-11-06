import type { PlanLimit } from '@/types';

export function limitLabel(limit: PlanLimit): string {
  return limit === 'sin_limite' ? 'sin límite' : `máx. ${limit}`;
}

export function isLimitReached(used: number, limit: PlanLimit): boolean {
  return limit !== 'sin_limite' && used >= limit;
}

export function fuentesActivasLabel(limit: PlanLimit): string {
  return limit === 'sin_limite'
    ? 'fuente(s) activa(s) en su plan, sin límite'
    : `de ${limit} fuente(s) activa(s) en su plan`;
}
