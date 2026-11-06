import apiClient from '@/lib/api-client';
import type { CuentaInfo } from '@/types';

/** Cómo se ofrece una acción: normal, deshabilitada por la cuenta, o no se ofrece por el rol. */
export type ActionAccess = 'allowed' | 'suspended' | 'denied';

/** Categorías cuya subida lanza una extracción con IA: con la cuenta suspendida responden 403. */
const CATEGORIES_WITH_EXTRACTION = ['rup', 'financial_statements', 'experience'];

export function actionAccess(canAct: boolean, accountSuspended: boolean): ActionAccess {
  if (!canAct) return 'denied';
  return accountSuspended ? 'suspended' : 'allowed';
}

export function uploadBlockedBySuspension(category: string | null | undefined, accountSuspended: boolean): boolean {
  return accountSuspended && CATEGORIES_WITH_EXTRACTION.includes(category ?? '');
}

export function isAccountSuspended(...cuentas: (CuentaInfo | null | undefined)[]): boolean {
  return cuentas.some((cuenta) => cuenta?.estado === 'suspendida');
}

/**
 * `cuenta` de la zona Aplica. El inicio de sesión no la trae: solo está en get_my_profile.
 * Un fallo, o un backend que aún no la envía, no debe bloquear nada: decide el servidor.
 */
export async function fetchAplicaAccount(): Promise<CuentaInfo | null> {
  try {
    const profile = await apiClient.get<{ cuenta?: CuentaInfo | null }>('/get_my_profile');
    return profile?.cuenta ?? null;
  } catch (error) {
    console.warn('[account-status] No se pudo leer la cuenta:', error);
    return null;
  }
}
