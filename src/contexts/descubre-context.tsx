'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import descubreApiClient, { ApiError } from '@/lib/descubre-api-client';
import { useAuth } from '@/contexts/auth-context';
import type {
  DescubreDashboardData,
  NivelSuscripcion,
  OportunidadesDescubreResponse,
} from '@/types';

interface DescubreContextType {
  descubreData: DescubreDashboardData | null;
  nivelSuscripcion: NivelSuscripcion | null;
  tieneDescubre: boolean;
  tieneAplica: boolean;
  /** Carga inicial del perfil Descubre (dashboard_data). */
  loading: boolean;
  error: string | null;
  refreshDescubreProfile: () => Promise<void>;
  oportunidadesData: OportunidadesDescubreResponse | null;
  /** true solo en la primera carga de oportunidades (sin datos en memoria). */
  oportunidadesLoading: boolean;
  oportunidadesError: string | null;
  refreshOportunidades: (options?: { background?: boolean }) => Promise<void>;
}

const DescubreContext = createContext<DescubreContextType | undefined>(undefined);

export function DescubreProvider({ children }: { children: ReactNode }) {
  const { user, userProfile, loading: authLoading } = useAuth();
  const [descubreData, setDescubreData] = useState<DescubreDashboardData | null>(null);
  const [nivelSuscripcion, setNivelSuscripcion] = useState<NivelSuscripcion | null>(null);
  const [tieneDescubre, setTieneDescubre] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [oportunidadesData, setOportunidadesData] =
    useState<OportunidadesDescubreResponse | null>(null);
  const [oportunidadesLoading, setOportunidadesLoading] = useState(false);
  const [oportunidadesError, setOportunidadesError] = useState<string | null>(null);

  const descubreLoadedRef = useRef(false);
  const oportunidadesLoadedRef = useRef(false);
  const lastCustomerUidRef = useRef<string | null>(null);

  const loadDashboard = useCallback(
    async (options?: { background?: boolean }) => {
      if (!user || !userProfile || userProfile.role !== 'customer') {
        setDescubreData(null);
        setNivelSuscripcion(null);
        setTieneDescubre(false);
        setError(null);
        setFetchLoading(false);
        descubreLoadedRef.current = false;
        return;
      }
      const background = options?.background === true && descubreLoadedRef.current;
      if (!background) {
        setFetchLoading(true);
      }
      setError(null);
      try {
        const data = await descubreApiClient.get<DescubreDashboardData>(
          '/v1/dashboard_data',
        );
        setDescubreData(data);
        setNivelSuscripcion(data.cliente.nivel_suscripcion);
        setTieneDescubre(true);
        descubreLoadedRef.current = true;
      } catch (e) {
        if (e instanceof ApiError && e.status === 404) {
          setDescubreData(null);
          setNivelSuscripcion(null);
          setTieneDescubre(false);
          setError(null);
          descubreLoadedRef.current = false;
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
    },
    [user, userProfile],
  );

  const loadOportunidades = useCallback(
    async (options?: { background?: boolean }) => {
      if (!tieneDescubre) {
        setOportunidadesData(null);
        setOportunidadesError(null);
        setOportunidadesLoading(false);
        oportunidadesLoadedRef.current = false;
        return;
      }
      const background = options?.background === true && oportunidadesLoadedRef.current;
      if (!background) {
        setOportunidadesLoading(true);
      }
      setOportunidadesError(null);
      try {
        const res = await descubreApiClient.get<OportunidadesDescubreResponse>(
          '/v1/opportunities',
        );
        setOportunidadesData(res);
        oportunidadesLoadedRef.current = true;
      } catch (e) {
        setOportunidadesError(
          e instanceof Error ? e.message : 'No se pudieron cargar las oportunidades.',
        );
        if (!background) {
          setOportunidadesData(null);
        }
      } finally {
        setOportunidadesLoading(false);
      }
    },
    [tieneDescubre],
  );

  const customerUid =
    userProfile?.role === 'customer' && user ? user.uid : null;

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
      setOportunidadesData(null);
      setOportunidadesError(null);
      setOportunidadesLoading(false);
      descubreLoadedRef.current = false;
      oportunidadesLoadedRef.current = false;
      lastCustomerUidRef.current = null;
      return;
    }
    if (!customerUid) {
      setDescubreData(null);
      setNivelSuscripcion(null);
      setTieneDescubre(false);
      setError(null);
      setFetchLoading(false);
      setOportunidadesData(null);
      setOportunidadesError(null);
      setOportunidadesLoading(false);
      descubreLoadedRef.current = false;
      oportunidadesLoadedRef.current = false;
      lastCustomerUidRef.current = null;
      return;
    }

    const uidChanged = lastCustomerUidRef.current !== customerUid;
    lastCustomerUidRef.current = customerUid;

    if (uidChanged) {
      descubreLoadedRef.current = false;
      oportunidadesLoadedRef.current = false;
      setOportunidadesData(null);
    }

    void loadDashboard({ background: !uidChanged && descubreLoadedRef.current });
  }, [authLoading, user, customerUid, loadDashboard]);

  useEffect(() => {
    if (authLoading || !tieneDescubre) {
      if (!tieneDescubre) {
        setOportunidadesData(null);
        setOportunidadesError(null);
        setOportunidadesLoading(false);
        oportunidadesLoadedRef.current = false;
      }
      return;
    }
    void loadOportunidades({
      background: oportunidadesLoadedRef.current,
    });
  }, [authLoading, tieneDescubre, loadOportunidades]);

  const refreshDescubreProfile = useCallback(async () => {
    await loadDashboard({ background: descubreLoadedRef.current });
  }, [loadDashboard]);

  const refreshOportunidades = useCallback(
    async (options?: { background?: boolean }) => {
      await loadOportunidades({
        background: options?.background ?? oportunidadesLoadedRef.current,
      });
    },
    [loadOportunidades],
  );

  const tieneAplica =
    nivelSuscripcion === 'profesional' || nivelSuscripcion === 'experto';

  const loading =
    authLoading || (!!customerUid && fetchLoading && descubreData === null);

  const value = useMemo(
    () => ({
      descubreData,
      nivelSuscripcion,
      tieneDescubre,
      tieneAplica,
      loading,
      error,
      refreshDescubreProfile,
      oportunidadesData,
      oportunidadesLoading,
      oportunidadesError,
      refreshOportunidades,
    }),
    [
      descubreData,
      nivelSuscripcion,
      tieneDescubre,
      tieneAplica,
      loading,
      error,
      refreshDescubreProfile,
      oportunidadesData,
      oportunidadesLoading,
      oportunidadesError,
      refreshOportunidades,
    ],
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
