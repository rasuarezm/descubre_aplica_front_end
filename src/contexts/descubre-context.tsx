'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import descubreApiClient, { ApiError } from '@/lib/descubre-api-client';
import { useAuth } from '@/contexts/auth-context';
import type { DescubreDashboardData, NivelSuscripcion } from '@/types';

interface DescubreContextType {
  descubreData: DescubreDashboardData | null;
  nivelSuscripcion: NivelSuscripcion | null;
  tieneDescubre: boolean;
  tieneAplica: boolean;
  loading: boolean;
  error: string | null;
  refreshDescubreProfile: () => Promise<void>;
}

const DescubreContext = createContext<DescubreContextType | undefined>(undefined);

export function DescubreProvider({ children }: { children: ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const [descubreData, setDescubreData] = useState<DescubreDashboardData | null>(null);
  const [nivelSuscripcion, setNivelSuscripcion] = useState<NivelSuscripcion | null>(null);
  const [tieneDescubre, setTieneDescubre] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadDashboard = useCallback(async () => {
    if (!user) {
      return;
    }
    setFetchLoading(true);
    setError(null);
    try {
      const data = await descubreApiClient.get<DescubreDashboardData>(
        '/v1/dashboard_data'
      );
      setDescubreData(data);
      setNivelSuscripcion(data.cliente.nivel_suscripcion);
      setTieneDescubre(true);
    } catch (e) {
      if (e instanceof ApiError && e.status === 404) {
        setDescubreData(null);
        setNivelSuscripcion(null);
        setTieneDescubre(false);
        setError(null);
      } else {
        console.error('DescubreProvider: failed to load dashboard', e);
        setDescubreData(null);
        setNivelSuscripcion(null);
        setTieneDescubre(false);
        setError(null);
      }
    } finally {
      setFetchLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (authLoading) {
      return;
    }
    if (!user) {
      setDescubreData(null);
      setNivelSuscripcion(null);
      setTieneDescubre(false);
      setError(null);
      setFetchLoading(false);
      return;
    }
    void loadDashboard();
  }, [user, authLoading, loadDashboard]);

  const refreshDescubreProfile = useCallback(async () => {
    await loadDashboard();
  }, [loadDashboard]);

  const tieneAplica =
    nivelSuscripcion === 'profesional' || nivelSuscripcion === 'experto';

  const loading = authLoading || (!!user && fetchLoading);

  const value = useMemo(
    () => ({
      descubreData,
      nivelSuscripcion,
      tieneDescubre,
      tieneAplica,
      loading,
      error,
      refreshDescubreProfile,
    }),
    [
      descubreData,
      nivelSuscripcion,
      tieneDescubre,
      tieneAplica,
      loading,
      error,
      refreshDescubreProfile,
    ]
  );

  return <DescubreContext.Provider value={value}>{children}</DescubreContext.Provider>;
}

export function useDescubre(): DescubreContextType {
  const ctx = useContext(DescubreContext);
  if (ctx === undefined) {
    throw new Error('useDescubre must be used within a DescubreProvider');
  }
  return ctx;
}
