
"use client";

import { useState, useEffect, useCallback } from 'react';
import type {
  CustomerDocument,
  CustomerFinancialProfile,
  CustomerFinancialProfileResponse,
  FinancialIndicators,
  ExperienceSector,
} from '@/types';
import apiClient from '@/lib/api-client';
import { useExtractionProgress } from '@/hooks/useExtractionProgress';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  TrendingUp, AlertTriangle, XCircle, CheckCircle2, ChevronDown, ChevronUp,
  Clock, Building2, Award, Landmark, Info,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ─── Rangos estándar de contratación colombiana ─────────────────────────────

type TrafficLight = 'green' | 'yellow' | 'red' | 'neutral';

function getIndicatorColor(key: keyof FinancialIndicators, value: number | null | undefined): TrafficLight {
  if (value == null) return 'neutral';
  switch (key) {
    case 'liquidez':
      return value >= 1.5 ? 'green' : value >= 1.0 ? 'yellow' : 'red';
    case 'endeudamiento':
      return value <= 0.60 ? 'green' : value <= 0.75 ? 'yellow' : 'red';
    case 'razon_cobertura_intereses':
      return value >= 1.0 ? 'green' : 'red';
    case 'rentabilidad_patrimonio':
      return value >= 0.05 ? 'green' : value >= 0 ? 'yellow' : 'red';
    case 'rentabilidad_activo':
      return value >= 0.03 ? 'green' : value >= 0 ? 'yellow' : 'red';
    default:
      return 'neutral';
  }
}

const INDICATOR_META: Record<keyof FinancialIndicators, { label: string; format: 'ratio' | 'percent' | 'currency' }> = {
  liquidez:                    { label: 'Índice de Liquidez',          format: 'ratio'    },
  endeudamiento:               { label: 'Nivel de Endeudamiento',      format: 'ratio'    },
  razon_cobertura_intereses:   { label: 'Cobertura de Intereses',      format: 'ratio'    },
  rentabilidad_patrimonio:     { label: 'Rentabilidad del Patrimonio', format: 'percent'  },
  rentabilidad_activo:         { label: 'Rentabilidad del Activo',     format: 'percent'  },
  capital_de_trabajo:          { label: 'Capital de Trabajo',          format: 'currency' },
};

function formatIndicatorValue(value: number | null | undefined, format: 'ratio' | 'percent' | 'currency'): string {
  if (value == null) return '—';
  switch (format) {
    case 'ratio':
      return value.toLocaleString('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    case 'percent':
      return `${(value * 100).toLocaleString('es-CO', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%`;
    case 'currency':
      return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(value);
  }
}

function formatExtractionElapsed(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function TrafficDot({ color }: { color: TrafficLight }) {
  return (
    <span className={cn('inline-block w-2 h-2 rounded-full shrink-0', {
      'bg-green-500': color === 'green',
      'bg-yellow-400': color === 'yellow',
      'bg-red-500': color === 'red',
      'bg-muted-foreground/30': color === 'neutral',
    })} />
  );
}

// ─── Componente principal ────────────────────────────────────────────────────

interface FinancialProfileWidgetProps {
  customerId: string;
  /** Lista de documentos de la categoría correspondiente para detectar estado 'processing' */
  categoryDocuments: CustomerDocument[];
  /** 'rup' o 'financial_statements' — qué perfil mostrar */
  sourceType: 'rup' | 'financial_statements';
}

export function FinancialProfileWidget({ customerId, categoryDocuments, sourceType }: FinancialProfileWidgetProps) {
  const [profile, setProfile] = useState<CustomerFinancialProfile | null>(null);
  const [history, setHistory] = useState<CustomerFinancialProfile[]>([]);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [historyOpen, setHistoryOpen] = useState(false);

  const fetchProfile = useCallback(async () => {
    try {
      const data = await apiClient.get<CustomerFinancialProfileResponse>(
        `/get_financial_profile?customer_id=${customerId}`
      );
      if (data) {
        setProfile(sourceType === 'rup' ? data.rup : data.financial_statements);
        setHistory(data.history.filter(h => h.source_type === sourceType));
      }
    } catch {
      // Sin perfil aún — silencioso
    } finally {
      setLoadingProfile(false);
    }
  }, [customerId, sourceType]);

  // Hook de progreso en tiempo real (Firestore onSnapshot)
  const extractionProgress = useExtractionProgress(customerId, categoryDocuments);
  const isActive =
    extractionProgress?.status === 'queued' ||
    extractionProgress?.status === 'processing';

  // Cronómetro basado en startedAt de Firestore — consistente tras navegar
  const [elapsedSec, setElapsedSec] = useState(0);

  useEffect(() => {
    if (!isActive || !extractionProgress?.startedAt) {
      setElapsedSec(0);
      return;
    }
    const tick = () =>
      setElapsedSec(
        Math.floor((Date.now() - extractionProgress.startedAt!.getTime()) / 1000)
      );
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, [isActive, extractionProgress?.startedAt]);

  // Cuando la extracción termina, recargar el perfil financiero
  useEffect(() => {
    if (extractionProgress?.status === 'completed') {
      fetchProfile();
    }
  }, [extractionProgress?.status, fetchProfile]);

  // Carga inicial
  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  // Sin documentos en esta categoría (p. ej. borraste el RUP): vaciar indicadores sin esperar otro fetch.
  useEffect(() => {
    if (categoryDocuments.length === 0) {
      setProfile(null);
      setHistory([]);
      setLoadingProfile(false);
    }
  }, [categoryDocuments.length]);

  // ── Estado: procesando ──
  if (isActive && !profile) {
    return (
      <Card className="border-blue-200 bg-blue-950/20 dark:border-blue-800">
        <CardContent className="pt-5 pb-5 space-y-3">

          {/* Cabecera: icono + paso actual */}
          <div className="flex items-center gap-3">
            <Clock className="h-5 w-5 text-blue-400 animate-pulse shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-blue-300 truncate">
                {extractionProgress?.step ?? 'Procesando…'}
              </p>
              <p className="text-xs text-blue-400/70 mt-0.5">
                {extractionProgress?.startedAt
                  ? <>Tiempo transcurrido: <span className="tabular-nums">{formatExtractionElapsed(elapsedSec)}</span></>
                  : 'En cola, iniciando pronto…'
                }
              </p>
            </div>
          </div>

          {/* Barra de progreso */}
          <div className="space-y-1">
            <div className="flex justify-between items-center">
              <span className="text-xs text-blue-400/70">Progreso</span>
              <span className="text-xs font-mono text-blue-300 tabular-nums">
                {extractionProgress?.progress ?? 0}%
              </span>
            </div>
            <div className="w-full bg-blue-950/40 rounded-full h-2 overflow-hidden">
              <div
                className="h-2 rounded-full bg-blue-400 transition-all duration-700 ease-out"
                style={{ width: `${extractionProgress?.progress ?? 0}%` }}
              />
            </div>
          </div>

          {/* Nota informativa */}
          <p className="text-xs text-blue-400/50">
            Puedes navegar a otra sección y volver — el progreso se mantiene.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (extractionProgress?.status === 'failed') {
    return (
      <Card className="border-red-200 bg-red-950/20 dark:border-red-800">
        <CardContent className="flex items-start gap-3 pt-5 pb-5">
          <XCircle className="h-5 w-5 text-red-400 shrink-0 mt-0.5" />
          <div className="min-w-0">
            <p className="text-sm font-medium text-red-300">
              Error en la extracción
            </p>
            <p className="text-xs text-red-400/70 mt-0.5">
              {extractionProgress.error ?? 'Ocurrió un error inesperado.'}
            </p>
            <p className="text-xs text-red-400/50 mt-1">
              Puedes volver a subir el documento para reintentarlo.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // ── Estado: cargando desde API ──
  if (loadingProfile) {
    return (
      <div className="space-y-2 pt-1">
        <Skeleton className="h-5 w-1/3" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
        <Skeleton className="h-4 w-4/6" />
      </div>
    );
  }

  // ── Estado: sin perfil aún ──
  if (!profile) return null;

  const isRup = sourceType === 'rup';
  const indicators = profile.financial_indicators ?? {};

  return (
    <div className="space-y-3 mt-3">
      <Card className="border-secondary/50">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <CardTitle className="text-base flex items-center gap-2">
              {isRup
                ? <Award className="h-4 w-4 text-highlight shrink-0" />
                : <Landmark className="h-4 w-4 text-accent shrink-0" />
              }
              Indicadores Financieros — {profile.fiscal_year ?? '—'}
            </CardTitle>
            <div className="flex items-center gap-2 flex-wrap">
              {isRup
                ? <Badge variant="outline" className="text-xs border-highlight/40 text-highlight">Fuente oficial · RUP</Badge>
                : <Badge variant="outline" className="text-xs border-accent/40 text-accent">Calculado por IA</Badge>
              }
              {profile.rup_renewal_date && (
                <span className="text-xs text-muted-foreground">
                  Vigente hasta {new Date(profile.rup_renewal_date).toLocaleDateString('es-CO', { month: 'short', year: 'numeric' })}
                </span>
              )}
            </div>
          </div>
          {!isRup && (
            <CardDescription className="flex items-center gap-1.5 text-xs mt-1">
              <Info className="h-3 w-3 shrink-0" />
              Indicadores calculados a partir de los estados financieros. Para validez oficial ante entidades, se requiere el RUP.
            </CardDescription>
          )}
        </CardHeader>
        <CardContent className="space-y-4">

          {/* Tabla de indicadores */}
          <div className="rounded-md border border-secondary/30 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/40 border-b border-secondary/30">
                  <th className="text-left px-3 py-2 font-medium text-muted-foreground text-xs uppercase tracking-wide">Indicador</th>
                  <th className="text-right px-3 py-2 font-medium text-muted-foreground text-xs uppercase tracking-wide">Valor</th>
                  <th className="text-center px-3 py-2 font-medium text-muted-foreground text-xs uppercase tracking-wide w-10">Estado</th>
                </tr>
              </thead>
              <tbody>
                {(Object.keys(INDICATOR_META) as (keyof FinancialIndicators)[]).map((key, i) => {
                  const meta = INDICATOR_META[key];
                  const value = indicators[key];
                  const color = getIndicatorColor(key, value);
                  return (
                    <tr key={key} className={cn('border-b border-secondary/20 last:border-0', i % 2 === 0 ? 'bg-card' : 'bg-muted/20')}>
                      <td className="px-3 py-2 text-foreground/80">{meta.label}</td>
                      <td className="px-3 py-2 text-right font-mono font-medium">
                        {formatIndicatorValue(value, meta.format)}
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex justify-center">
                          <TrafficDot color={color} />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* K de contratación y capacidad residual (solo RUP) */}
          {isRup && (profile.k_contratacion != null || profile.capacidad_residual != null) && (
            <div className="grid grid-cols-2 gap-3">
              {profile.k_contratacion != null && (
                <div className="rounded-md border border-secondary/30 p-3 bg-muted/20">
                  <p className="text-xs text-muted-foreground mb-0.5">K de Contratación</p>
                  <p className="font-semibold text-sm">
                    {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(profile.k_contratacion)}
                  </p>
                </div>
              )}
              {profile.capacidad_residual != null && (
                <div className="rounded-md border border-secondary/30 p-3 bg-muted/20">
                  <p className="text-xs text-muted-foreground mb-0.5">Capacidad Residual</p>
                  <p className="font-semibold text-sm">
                    {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(profile.capacidad_residual)}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Experiencia por sector (solo RUP) */}
          {isRup && profile.experience_by_sector && profile.experience_by_sector.length > 0 && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5">
                <Building2 className="h-3.5 w-3.5" />
                Experiencia por Sector
              </p>
              <div className="space-y-2">
                {profile.experience_by_sector.map((sector: ExperienceSector, i: number) => (
                  <div key={i} className="rounded-md border border-secondary/30 p-3 bg-muted/20">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{sector.sector_description}</p>
                        {sector.unspsc_code && (
                          <p className="text-xs text-muted-foreground font-mono">UNSPSC: {sector.unspsc_code}</p>
                        )}
                      </div>
                      <Badge variant="secondary" className="shrink-0 text-xs">
                        {sector.total_contracts} contrato{sector.total_contracts !== 1 ? 's' : ''}
                      </Badge>
                    </div>
                    {(sector.total_value_cop != null || sector.largest_single_contract_cop != null) && (
                      <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
                        {sector.total_value_cop != null && (
                          <span>Total: <span className="font-medium text-foreground/80">
                            {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', notation: 'compact', maximumFractionDigits: 1 }).format(sector.total_value_cop)}
                          </span></span>
                        )}
                        {sector.largest_single_contract_cop != null && (
                          <span>Máx: <span className="font-medium text-foreground/80">
                            {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', notation: 'compact', maximumFractionDigits: 1 }).format(sector.largest_single_contract_cop)}
                          </span></span>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Leyenda semáforo */}
          <div className="flex items-center gap-4 text-xs text-muted-foreground pt-1">
            <span className="flex items-center gap-1"><TrafficDot color="green" /> Cumple</span>
            <span className="flex items-center gap-1"><TrafficDot color="yellow" /> Marginal</span>
            <span className="flex items-center gap-1"><TrafficDot color="red" /> Por debajo</span>
            <span className="flex items-center gap-1"><TrafficDot color="neutral" /> Sin datos</span>
          </div>
        </CardContent>
      </Card>

      {/* Historial de años anteriores */}
      {history.length > 0 && (
        <div>
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground hover:text-foreground w-full justify-start gap-2 h-8"
            onClick={() => setHistoryOpen(prev => !prev)}
          >
            {historyOpen ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
            Historial · {history.length} año{history.length !== 1 ? 's' : ''} anterior{history.length !== 1 ? 'es' : ''}
          </Button>
          {historyOpen && (
            <div className="space-y-2 pt-1">
              {history.map(h => (
                <div key={h.id} className="rounded-md border border-secondary/20 p-3 bg-muted/10 opacity-70">
                  <p className="text-xs font-semibold text-muted-foreground mb-2">Año fiscal {h.fiscal_year ?? '—'}</p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-1">
                    {(Object.keys(INDICATOR_META) as (keyof FinancialIndicators)[]).map(key => {
                      const meta = INDICATOR_META[key];
                      const value = h.financial_indicators?.[key];
                      if (value == null) return null;
                      return (
                        <div key={key} className="flex justify-between gap-1 text-xs">
                          <span className="text-muted-foreground truncate">{meta.label.split(' ')[0]}</span>
                          <span className="font-mono font-medium shrink-0">{formatIndicatorValue(value, meta.format)}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
