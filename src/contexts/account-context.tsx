'use client';

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useDescubre } from '@/contexts/descubre-context';
import { fetchAplicaAccount, isAccountSuspended } from '@/lib/account-status';
import type { CuentaInfo } from '@/types';

interface AccountContextType {
  suspended: boolean;
}

export const AccountContext = createContext<AccountContextType>({ suspended: false });

/**
 * Estado de la cuenta del cliente. Un admin no tiene cuenta propia aquí: si actúa por un cliente
 * suspendido, el servidor responde 403 y el error se muestra como cualquier otro.
 */
export function AccountProvider({ children }: { children: ReactNode }) {
  const { userProfile } = useAuth();
  const { descubreData } = useDescubre();
  const [aplicaCuenta, setAplicaCuenta] = useState<CuentaInfo | null>(null);

  const customerUid = userProfile?.role === 'customer' ? userProfile.uid : null;

  useEffect(() => {
    setAplicaCuenta(null);
    if (!customerUid) return;
    let cancelled = false;
    void fetchAplicaAccount().then((cuenta) => {
      if (!cancelled) setAplicaCuenta(cuenta);
    });
    return () => {
      cancelled = true;
    };
  }, [customerUid]);

  const value = useMemo(
    () => ({ suspended: isAccountSuspended(aplicaCuenta, descubreData?.cuenta) }),
    [aplicaCuenta, descubreData?.cuenta],
  );

  return <AccountContext.Provider value={value}>{children}</AccountContext.Provider>;
}

export const useAccount = () => useContext(AccountContext);
