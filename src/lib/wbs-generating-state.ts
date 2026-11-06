import { AI_GENERATION_LEASE_MS } from '@/lib/ai-generation';

/** Tiempo máximo que recordamos una generación WBS: el plazo del backend para darla por muerta. */
export const WBS_GENERATING_MAX_MS = AI_GENERATION_LEASE_MS;

export function wbsGeneratingStorageKey(opportunityId: string): string {
  return `bidtory:wbs-generating:${opportunityId}`;
}

export function markWbsGenerating(opportunityId: string): void {
  if (typeof window === 'undefined') return;
  sessionStorage.setItem(wbsGeneratingStorageKey(opportunityId), String(Date.now()));
}

export function clearWbsGenerating(opportunityId: string): void {
  if (typeof window === 'undefined') return;
  sessionStorage.removeItem(wbsGeneratingStorageKey(opportunityId));
}

export function isWbsGenerating(opportunityId: string): boolean {
  if (typeof window === 'undefined') return false;
  const raw = sessionStorage.getItem(wbsGeneratingStorageKey(opportunityId));
  if (!raw) return false;
  const started = parseInt(raw, 10);
  if (Number.isNaN(started) || Date.now() - started > WBS_GENERATING_MAX_MS) {
    sessionStorage.removeItem(wbsGeneratingStorageKey(opportunityId));
    return false;
  }
  return true;
}
