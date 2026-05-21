'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { isSameDay } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';
import { useDescubre } from '@/contexts/descubre-context';
import descubreApiClient from '@/lib/descubre-api-client';
import type {
  FuenteSecop,
  OportunidadDescubre,
  OportunidadesDescubreResponse,
} from '@/types';
import {
  Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Info,
  Search,
  ExternalLink,
  Settings,
  AlertCircle,
  MessageCircle,
  CalendarDays,
  MapPin,
  Tag,
  Clock,
  X,
  ChevronDown,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { getUrgencyInfo, parseDescubreFechaLimiteOfertas, type UrgencyInfo } from '@/lib/date-utils';
import {
  codigoFuenteParaDisplay,
  getFuenteDocumentId,
  nombreFuenteSecop,
} from '@/lib/descubre-fuente-utils';

const BOGOTA_TZ = 'America/Bogota';

type DescubreSegment = 'all' | 'high' | 'closing';

type EnrichedOportunidadDescubre = OportunidadDescubre & {
  hasFechaLimite: boolean;
  deadlineDate: Date | null;
  urgencyInfo: UrgencyInfo | null;
  rankingScore: number | null;
  showRanking: boolean;
  isHighAffinity: boolean;
  isClosingWithin7d: boolean;
};

function isFechaProcesamientoTodayBogota(raw: string | undefined): boolean {
  if (!raw?.trim()) return false;
  const s = raw.trim();
  let d: Date | null = null;
  if (/^\d{4}-\d{2}-\d{2}/.test(s) || s.includes('T')) {
    const x = new Date(s.replace('Z', '+00:00'));
    if (!Number.isNaN(x.getTime())) d = x;
  }
  if (!d) {
    const m = s.match(/^(\d{2})\/(\d{2})\/(\d{4})/);
    if (m) {
      const [, dd, mm, yyyy] = m;
      d = new Date(`${yyyy}-${mm}-${dd}T12:00:00-05:00`);
    }
  }
  if (!d || Number.isNaN(d.getTime())) return false;
  const todayB = toZonedTime(new Date(), BOGOTA_TZ);
  const procB = toZonedTime(d, BOGOTA_TZ);
  return isSameDay(procB, todayB);
}

/** Borde izquierdo por urgencia de plazo — misma semántica que Aplica (no final / no enviada). */
function descubreCardLeftBorderClass(urgencyInfo: UrgencyInfo | null): string {
  if (!urgencyInfo) return 'border-l-primary';
  if (urgencyInfo.status === 'overdue') return 'border-l-urgency';
  if (urgencyInfo.status === 'urgent' || urgencyInfo.status === 'upcoming') return 'border-l-highlight';
  return 'border-l-primary';
}

function isPremiumValue(val: string | number | undefined): boolean {
  if (val == null || val === '') return false;
  const s = String(val).trim();
  return s !== 'N/A*' && s.toLowerCase() !== 'n/a';
}

function parseRankingScore(raw: string | number | undefined): number | null {
  if (raw == null || raw === '') return null;
  const m = String(raw).trim().match(/(\d+(?:[.,]\d+)?)/);
  if (!m) return null;
  const n = parseFloat(m[1].replace(',', '.'));
  if (Number.isNaN(n)) return null;
  return Math.min(10, Math.max(0, n));
}

function enrichDescubreOpportunity(op: OportunidadDescubre): EnrichedOportunidadDescubre {
  const showRanking = isPremiumValue(op.ranking_interes);
  const rankingScore = parseRankingScore(op.ranking_interes);
  const hasFechaLimite = !!(op.fecha_limite_ofertas && op.fecha_limite_ofertas !== 'No especificada');
  const deadlineDate = hasFechaLimite ? parseDescubreFechaLimiteOfertas(op.fecha_limite_ofertas) : null;
  const urgencyInfo = deadlineDate ? getUrgencyInfo(deadlineDate) : null;
  const isHighAffinity = showRanking && rankingScore != null && rankingScore >= 8;
  const isClosingWithin7d = urgencyInfo?.status === 'urgent';
  return {
    ...op,
    hasFechaLimite,
    deadlineDate,
    urgencyInfo,
    rankingScore,
    showRanking,
    isHighAffinity,
    isClosingWithin7d,
  };
}

function fuenteNombreYCodigo(f: FuenteSecop, index: number): string {
  const nombre = nombreFuenteSecop(f, index);
  const codigo = codigoFuenteParaDisplay(getFuenteDocumentId(f, index));
  return codigo && codigo !== '—' ? `${nombre} · ${codigo}` : nombre;
}

function titleForDisplay(raw: string | undefined): string {
  const t = (raw ?? '').replace(/\s+/g, ' ').trim();
  if (!t) return 'Oportunidad sin título';
  const letters = t.replace(/[^A-Za-zÁÉÍÓÚÜáéíóúüÑñ]/g, '');
  if (letters.length >= 4 && t === t.toUpperCase()) {
    return t.charAt(0) + t.slice(1).toLowerCase();
  }
  return t;
}

function DescubreScoreBadge({ score, showRanking }: { score: number | null; showRanking: boolean }) {
  if (!showRanking || score == null) {
    return (
      <div
        className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-border/80 bg-muted/60 font-headline text-lg font-semibold text-muted-foreground"
        aria-label="Sin puntuación de encaje"
        title="Sin puntuación de encaje"
      >
        —
      </div>
    );
  }
  const tier = score >= 8 ? 'high' : score >= 5 ? 'mid' : 'low';
  return (
    <div
      className={cn(
        'flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border font-headline text-xl font-semibold',
        /* Alto (8+): verde encaje del mock (#00857c), no el primary azul del tema */
        tier === 'high' &&
          'border-[#00857c]/40 bg-[#00857c]/16 text-[#00857c] dark:border-teal-400/45 dark:bg-teal-400/14 dark:text-teal-200',
        /* Medio (5–7): mostaza + ámbar legible (#8b5e16) como en la maqueta */
        tier === 'mid' &&
          'border-highlight/50 bg-highlight/28 text-[#8b5e16] dark:border-highlight/55 dark:bg-highlight/22 dark:text-amber-100',
        /* Bajo (<5): gris neutro */
        tier === 'low' &&
          'border-border/90 bg-muted/55 text-muted-foreground dark:border-border dark:bg-muted/40 dark:text-muted-foreground',
      )}
      aria-label={`Encaje ${score} de 10`}
      title={`Encaje ${score} de 10`}
    >
      {Math.round(score)}
    </div>
  );
}

function closingPillLabels(urgencyInfo: UrgencyInfo): { short: string; long: string; aria: string } {
  if (urgencyInfo.status === 'overdue') {
    return { short: 'Vencida', long: 'Plazo cumplido', aria: 'Plazo cumplido' };
  }
  if (urgencyInfo.timeUnit === 'minutos') {
    const v = urgencyInfo.timeValue;
    return {
      short: `${v} min`,
      long: v === 1 ? 'Cierra en 1 min' : `Cierra en ${v} min`,
      aria: v === 1 ? 'Cierra en 1 minuto' : `Cierra en ${v} minutos`,
    };
  }
  if (urgencyInfo.timeUnit === 'horas') {
    const v = urgencyInfo.timeValue;
    return {
      short: `${v} h`,
      long: v === 1 ? 'Cierra en 1 h' : `Cierra en ${v} h`,
      aria: v === 1 ? 'Cierra en 1 hora' : `Cierra en ${v} horas`,
    };
  }
  const d = urgencyInfo.timeValue;
  return {
    short: `${d} d`,
    long: d === 1 ? 'Cierra en 1 día' : `Cierra en ${d} días`,
    aria: d === 1 ? 'Cierra en 1 día' : `Cierra en ${d} días`,
  };
}

function ClosingUrgencyPill({
  urgencyInfo,
  hasFecha,
}: {
  urgencyInfo: UrgencyInfo | null;
  hasFecha: boolean;
}) {
  if (!hasFecha) {
    return (
      <span className="inline-flex max-w-[14rem] items-center justify-center rounded-full border border-border bg-muted/45 px-2.5 py-0.5 text-center text-[10px] font-medium text-muted-foreground sm:text-[11px]">
        Sin fecha
      </span>
    );
  }
  if (!urgencyInfo) {
    return (
      <span className="inline-flex max-w-[14rem] items-center justify-center rounded-full border border-border bg-muted/45 px-2.5 py-0.5 text-center text-[10px] font-medium text-muted-foreground sm:text-[11px]">
        Fecha por confirmar
      </span>
    );
  }

  const { short, long, aria } = closingPillLabels(urgencyInfo);

  return (
    <span
      className={cn(
        'inline-flex max-w-[14rem] items-center justify-center rounded-full border px-2 py-0.5 text-center text-[10px] font-semibold tabular-nums tracking-tight sm:max-w-[17rem] sm:px-2.5 sm:text-[11px]',
        urgencyInfo.status === 'overdue' && 'border-urgency/40 bg-urgency/10 text-urgency',
        (urgencyInfo.status === 'urgent' || urgencyInfo.status === 'upcoming') &&
          'border-highlight/50 bg-highlight/15 text-highlight-foreground',
        urgencyInfo.status === 'normal' && 'border-primary/35 bg-primary/12 text-primary',
      )}
      title={urgencyInfo.deadlineFormatted}
      aria-label={aria}
    >
      <span className="sm:hidden">{short}</span>
      <span className="hidden sm:inline">{long}</span>
    </span>
  );
}

/** Decorativo (sin serie temporal); solo refuerza el look & feel del KPI principal. */
function KpiHeroSparkline() {
  return (
    <svg
      className="absolute right-3 top-3 h-10 w-20 shrink-0 opacity-[0.28]"
      viewBox="0 0 80 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <path
        d="M2 24 L14 18 L26 22 L38 10 L50 14 L62 6 L74 12"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

type DescubreKpiSnapshot = {
  nTotal: number;
  nHigh: number;
  nClosing: number;
  nToday: number;
  avgEncaje: number | null;
};

function DescubreKpiRow({ kpis, fuentes }: { kpis: DescubreKpiSnapshot; fuentes: FuenteSecop[] }) {
  const { nTotal, nHigh, nClosing, nToday, avgEncaje } = kpis;
  const avgLabel =
    avgEncaje != null
      ? `${avgEncaje.toLocaleString('es-CO', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} /10`
      : '—';
  const namesPreview = fuentes.slice(0, 4).map((f, i) => fuenteNombreYCodigo(f, i));
  const namesText =
    namesPreview.length > 0
      ? `${namesPreview.join(' · ')}${fuentes.length > 4 ? '…' : ''}`
      : 'Ninguna fuente configurada';

  return (
    <section
      aria-label="Indicadores de Descubre"
      className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"
    >
      <div className="relative overflow-hidden rounded-xl bg-secondary px-4 py-4 text-secondary-foreground shadow-md">
        <KpiHeroSparkline />
        <p className="relative pr-20 text-[0.65rem] font-semibold uppercase tracking-wider text-secondary-foreground/90">
          Oportunidades en vista
        </p>
        <p className="relative mt-1 font-headline text-3xl font-semibold tabular-nums">{nTotal}</p>
        <p className="relative mt-2 text-xs leading-snug text-secondary-foreground/80">
          + {nToday} hoy · {nHigh} de alta afinidad
        </p>
        <p className="relative mt-1 text-[10px] leading-snug text-secondary-foreground/65">
          Oportunidades activas de los últimos 60 días en esta pantalla.
        </p>
      </div>

      <div className="rounded-xl border border-border bg-card px-4 py-4 shadow-sm">
        <p className="text-[0.65rem] font-semibold uppercase tracking-wider text-muted-foreground">
          Encaje promedio
        </p>
        <p className="mt-1 font-headline text-3xl font-semibold tabular-nums text-foreground">{avgLabel}</p>
        <p className="mt-2 text-xs text-muted-foreground">
          Solo oportunidades con encaje visible en esta lista. Sin comparación con semanas anteriores.
        </p>
      </div>

      <div className="rounded-xl border border-border bg-card px-4 py-4 shadow-sm">
        <p className="text-[0.65rem] font-semibold uppercase tracking-wider text-muted-foreground">
          Cierre ≤ 7 días
        </p>
        <p className="mt-1 font-headline text-3xl font-semibold tabular-nums text-popular">{nClosing}</p>
        <p className="mt-2 text-xs font-medium text-popular/90">
          Plazo crítico por fecha límite (incluye horas y minutos).
        </p>
      </div>

      <div className="rounded-xl border border-border bg-card px-4 py-4 shadow-sm">
        <p className="text-[0.65rem] font-semibold uppercase tracking-wider text-muted-foreground">
          Fuentes monitoreadas
        </p>
        <p className="mt-1 font-headline text-3xl font-semibold tabular-nums text-foreground">
          {fuentes.length}
        </p>
        <p className="mt-2 line-clamp-2 text-xs text-muted-foreground" title={namesText}>
          {namesText}
        </p>
        <Link
          href="/dashboard/descubre/perfil"
          className="mt-2 inline-block text-xs font-medium text-accent hover:underline"
        >
          Gestionar fuentes
        </Link>
      </div>
    </section>
  );
}

function DescubreSegmentTabs({
  segment,
  onSegment,
  counts,
}: {
  segment: DescubreSegment;
  onSegment: (s: DescubreSegment) => void;
  counts: { all: number; high: number; closing: number };
}) {
  const items: { id: DescubreSegment; label: string; count: number }[] = [
    { id: 'all', label: 'Todas', count: counts.all },
    { id: 'high', label: 'Alta afinidad', count: counts.high },
    { id: 'closing', label: 'Cierre próximo', count: counts.closing },
  ];

  return (
    <div
      role="tablist"
      aria-label="Filtrar oportunidades"
      className="flex flex-wrap gap-1 border-b border-border pb-0.5"
    >
      {items.map(({ id, label, count }) => {
        const selected = segment === id;
        return (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={selected}
            className={cn(
              '-mb-px rounded-t-md px-3 py-2 text-sm font-medium transition-colors',
              selected
                ? 'border-b-2 border-accent text-foreground'
                : 'text-muted-foreground hover:text-foreground',
            )}
            onClick={() => onSegment(id)}
          >
            {label}
            <span
              className={cn(
                'ml-1.5 tabular-nums text-xs',
                selected ? 'text-muted-foreground' : 'text-muted-foreground/80',
              )}
            >
              {count}
            </span>
          </button>
        );
      })}
    </div>
  );
}

/** Placeholder visual mientras cargan el contexto Descubre y el listado de oportunidades. */
function DescubreDashboardSkeleton() {
  return (
    <div
      className="space-y-8"
      aria-busy="true"
      aria-label="Cargando sus oportunidades"
    >
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="min-w-0 flex-1 space-y-2">
          <Skeleton className="h-9 w-[min(100%,17rem)] md:h-10" />
          <Skeleton className="h-4 w-48 max-w-full" />
          <div className="flex flex-wrap items-center gap-2">
            <Skeleton className="h-5 w-24 rounded-full" />
            <Skeleton className="h-4 w-4 rounded-full" />
            <Skeleton className="h-4 w-28" />
          </div>
        </div>
        <Skeleton className="h-9 w-[9.5rem] shrink-0 rounded-md" />
      </div>

      <section aria-hidden className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-xl bg-secondary/80 px-4 py-4 shadow-md">
          <Skeleton className="h-3 w-40 bg-secondary-foreground/25" />
          <Skeleton className="mt-3 h-9 w-14 bg-secondary-foreground/30" />
          <Skeleton className="mt-3 h-3 w-full max-w-[14rem] bg-secondary-foreground/20" />
        </div>
        {[0, 1, 2].map((i) => (
          <div key={i} className="rounded-xl border border-border bg-card px-4 py-4 shadow-sm">
            <Skeleton className="h-3 w-28" />
            <Skeleton className="mt-3 h-9 w-16" />
            <Skeleton className="mt-3 h-8 w-full max-w-xs" />
          </div>
        ))}
      </section>

      <section className="space-y-6 border-t border-border pt-8">
        <div className="space-y-2">
          <Skeleton className="h-8 w-[min(100%,14rem)]" />
          <Skeleton className="h-4 w-full max-w-xl" />
        </div>
        <div className="flex flex-wrap gap-2 border-b border-border pb-1">
          <Skeleton className="h-9 w-24 rounded-md" />
          <Skeleton className="h-9 w-32 rounded-md" />
          <Skeleton className="h-9 w-36 rounded-md" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 min-[1800px]:grid-cols-5">
          {[0, 1, 2].map((i) => (
            <Card
              key={i}
              className="overflow-hidden border-l-4 border-muted-foreground/20 shadow-sm"
            >
              <CardHeader className="space-y-3 pb-2">
                <div className="flex items-start justify-between gap-2">
                  <Skeleton className="h-12 w-12 shrink-0 rounded-xl" />
                  <Skeleton className="h-6 w-16 shrink-0 rounded-full" />
                </div>
                <Skeleton className="h-6 w-full" />
                <Skeleton className="h-3.5 w-48 max-w-full" />
              </CardHeader>
              <CardContent className="space-y-2">
                <Skeleton className="h-14 w-full rounded-md" />
                <div className="grid gap-2 sm:grid-cols-2">
                  <Skeleton className="h-[3.25rem] w-full rounded-md" />
                  <Skeleton className="h-[3.25rem] w-full rounded-md" />
                </div>
                <div className="flex flex-wrap gap-2 pt-0.5">
                  <Skeleton className="h-5 w-24 rounded-full" />
                  <Skeleton className="h-5 w-20 rounded-full" />
                </div>
              </CardContent>
              <CardFooter className="flex flex-row flex-wrap gap-2 border-t border-border/60 pt-3">
                <Skeleton className="h-9 w-full rounded-md" />
              </CardFooter>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}

export default function DescubreDashboardPage() {
  const { descubreData, loading: contextLoading, tieneDescubre } = useDescubre();
  const [data, setData] = useState<OportunidadesDescubreResponse | null>(null);
  const [loadingOportunidades, setLoadingOportunidades] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [segment, setSegment] = useState<DescubreSegment>('all');
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());
  const [showDismissed, setShowDismissed] = useState(false);

  const loadOportunidades = useCallback(async () => {
    setLoadingOportunidades(true);
    setError(null);
    try {
      const res = await descubreApiClient.get<OportunidadesDescubreResponse>('/v1/opportunities');
      setData(res);
    } catch (e) {
      setError(
        e instanceof Error ? e.message : 'No se pudieron cargar las oportunidades.',
      );
    } finally {
      setLoadingOportunidades(false);
    }
  }, []);

  useEffect(() => {
    if (contextLoading) {
      return;
    }
    if (!tieneDescubre) {
      setLoadingOportunidades(false);
      return;
    }
    void loadOportunidades();
  }, [contextLoading, tieneDescubre, loadOportunidades]);

  useEffect(() => {
    if (data?.oportunidades) {
      setDismissedIds(
        new Set(
          data.oportunidades
            .filter((o) => o.dismissed === true && o.doc_id)
            .map((o) => o.doc_id as string),
        ),
      );
    }
  }, [data]);

  const handleDismiss = useCallback(async (docId: string, dismiss: boolean) => {
    setDismissedIds((prev) => {
      const next = new Set(prev);
      if (dismiss) next.add(docId);
      else next.delete(docId);
      return next;
    });
    try {
      await descubreApiClient.post('/v1/dismiss_opportunity', { doc_id: docId, dismissed: dismiss });
    } catch {
      setDismissedIds((prev) => {
        const next = new Set(prev);
        if (dismiss) next.delete(docId);
        else next.add(docId);
        return next;
      });
    }
  }, []);

  const oportunidades = data?.oportunidades ?? [];

  const enrichedOportunidades = useMemo(
    () => oportunidades.map(enrichDescubreOpportunity),
    [oportunidades],
  );

  const oportunidadesActivas = useMemo(
    () => enrichedOportunidades.filter((op) => op.doc_id && !dismissedIds.has(op.doc_id)),
    [enrichedOportunidades, dismissedIds],
  );

  const oportunidadesDescartadas = useMemo(
    () => enrichedOportunidades.filter((op) => op.doc_id && dismissedIds.has(op.doc_id)),
    [enrichedOportunidades, dismissedIds],
  );

  const descubreKpis = useMemo((): DescubreKpiSnapshot => {
    let nHigh = 0;
    let nClosing = 0;
    let nToday = 0;
    const scores: number[] = [];
    for (const e of oportunidadesActivas) {
      if (e.isHighAffinity) nHigh += 1;
      if (e.isClosingWithin7d) nClosing += 1;
      if (isFechaProcesamientoTodayBogota(e.fecha_procesamiento)) nToday += 1;
      if (e.showRanking && e.rankingScore != null) scores.push(e.rankingScore);
    }
    const avgEncaje =
      scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : null;
    return {
      nTotal: oportunidadesActivas.length,
      nHigh,
      nClosing,
      nToday,
      avgEncaje,
    };
  }, [oportunidadesActivas]);

  const filteredEnriched = useMemo(() => {
    if (segment === 'high') return oportunidadesActivas.filter((e) => e.isHighAffinity);
    if (segment === 'closing') return oportunidadesActivas.filter((e) => e.isClosingWithin7d);
    return oportunidadesActivas;
  }, [oportunidadesActivas, segment]);

  const segmentCounts = useMemo(
    () => ({
      all: oportunidadesActivas.length,
      high: oportunidadesActivas.filter((e) => e.isHighAffinity).length,
      closing: oportunidadesActivas.filter((e) => e.isClosingWithin7d).length,
    }),
    [oportunidadesActivas],
  );

  if (contextLoading || loadingOportunidades) {
    return <DescubreDashboardSkeleton />;
  }

  if (!tieneDescubre || !descubreData) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="max-w-md text-center">
          <CardHeader>
            <CardTitle className="flex items-center justify-center gap-2">
              <Search className="h-6 w-6" />
              Bidtory Descubre
            </CardTitle>
            <CardDescription>
              Descubra oportunidades de licitación con IA. Este módulo no está activo en su cuenta actual.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <a href="mailto:hola@bidtory.com">Activar Descubre</a>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { cliente, plan_actual, fuentes_suscritas, estado_bidtory_info } = descubreData;
  const isActive = estado_bidtory_info?.code === 'ACTIVO_BUSCANDO';

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="space-y-2 min-w-0">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
            Mis oportunidades
          </h1>
          <p className="text-sm text-muted-foreground">
            Le damos la bienvenida,{' '}
            <span className="font-medium text-foreground/80">
              {cliente?.nombre_empresa || 'Bidtory'}
            </span>
            .
          </p>
          <div className="flex flex-wrap items-center gap-2 text-sm text-foreground/65">
            <Badge variant="secondary">{plan_actual?.nombre_visible ?? cliente.nivel_suscripcion}</Badge>
            <span className={cn('inline-flex h-2.5 w-2.5 rounded-full', isActive ? 'bg-accent' : 'bg-amber-500')} />
            <span>{isActive ? 'Búsqueda activa' : 'Requiere ajustes'}</span>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 shrink-0">
          <Button
            size="sm"
            asChild
            className="bg-accent text-accent-foreground shadow-sm hover:bg-accent/90"
          >
            <Link href="/dashboard/descubre/perfil">
              <Settings className="h-4 w-4 mr-2" />
              Editar perfil
            </Link>
          </Button>
        </div>
      </div>

      {!isActive && (
        <Card className="border-amber-500/40 bg-amber-500/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-amber-700 dark:text-amber-400">
              <Info className="h-5 w-5" />
              Recomendaciones para mejorar resultados
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-sm text-muted-foreground">{estado_bidtory_info?.message || 'Ajuste sus preferencias para activar el monitoreo.'}</p>
            {estado_bidtory_info?.sugerencias && estado_bidtory_info.sugerencias.length > 0 && (
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                {estado_bidtory_info.sugerencias.map((s, i) => (
                  <li key={`sug-${i}-${s}`}>{s}</li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      )}

      <DescubreKpiRow kpis={descubreKpis} fuentes={fuentes_suscritas ?? []} />

      {error ? (
        <section
          aria-labelledby="descubre-error-heading"
          className="space-y-4 border-t border-border pt-8"
        >
          <div className="space-y-2">
            <h2
              id="descubre-error-heading"
              className="flex items-center gap-2 text-lg font-semibold tracking-tight text-foreground md:text-xl"
            >
              <AlertCircle className="h-5 w-5 shrink-0 text-destructive" aria-hidden />
              No se pudieron cargar las oportunidades
            </h2>
            <p className="text-sm leading-relaxed text-muted-foreground">{error}</p>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Compruebe su conexión e inténtelo de nuevo. Si el problema continúa, escríbanos a{' '}
              <a
                href="mailto:hola@bidtory.com"
                className="font-medium text-accent underline-offset-4 hover:underline"
              >
                hola@bidtory.com
              </a>
              .
            </p>
          </div>
          <Card className="border-destructive/30 bg-destructive/[0.04] shadow-sm">
            <CardContent className="flex flex-col gap-4 py-5 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-muted-foreground">
                Puede volver a intentar la carga cuando desee.
              </p>
              <Button
                type="button"
                variant="secondary"
                className="shrink-0"
                onClick={loadOportunidades}
              >
                Reintentar
              </Button>
            </CardContent>
          </Card>
        </section>
      ) : oportunidades.length > 0 ? (
        <section
          aria-labelledby="oportunidades-recientes-heading"
          className="space-y-6 border-t border-border pt-8"
        >
          <div className="space-y-1.5">
            <h2
              id="oportunidades-recientes-heading"
              className="text-lg font-semibold tracking-tight text-foreground md:text-xl"
            >
              Oportunidades recientes
            </h2>
            <p className="text-sm leading-relaxed text-muted-foreground">
              <span>Oportunidades de los últimos 60 días, ordenadas por fecha de cierre.</span>
            </p>
          </div>

          <DescubreSegmentTabs segment={segment} onSegment={setSegment} counts={segmentCounts} />

          {filteredEnriched.length === 0 ? (
            <p className="rounded-lg border border-dashed border-border bg-muted/30 px-4 py-8 text-center text-sm text-muted-foreground">
              No hay oportunidades en este segmento con la lista actual. Pruebe otro filtro o revise más
              tarde.
            </p>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 min-[1800px]:grid-cols-5">
              {filteredEnriched.map((enriched, i) => (
                <OportunidadCard
                  key={enriched.doc_id ?? `active-${i}`}
                  enriched={enriched}
                  onDismiss={() => {
                    if (enriched.doc_id) void handleDismiss(enriched.doc_id, true);
                  }}
                />
              ))}
            </div>
          )}

          {oportunidadesDescartadas.length > 0 && (
            <section className="space-y-4 border-t border-border pt-6">
              <button
                type="button"
                className="flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
                onClick={() => setShowDismissed((v) => !v)}
              >
                <ChevronDown
                  className={cn('h-4 w-4 transition-transform', showDismissed && 'rotate-180')}
                />
                Descartadas ({oportunidadesDescartadas.length})
              </button>
              {showDismissed && (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                  {oportunidadesDescartadas.map((enriched, i) => (
                    <OportunidadCard
                      key={`dismissed-${enriched.doc_id ?? i}`}
                      enriched={enriched}
                      onDismiss={() => {
                        if (enriched.doc_id) void handleDismiss(enriched.doc_id, false);
                      }}
                      isDismissed
                    />
                  ))}
                </div>
              )}
            </section>
          )}
        </section>
      ) : (
        <section
          aria-labelledby="oportunidades-vacio-heading"
          className="space-y-4 border-t border-border pt-8"
        >
          <h2
            id="oportunidades-vacio-heading"
            className="text-lg font-semibold tracking-tight text-foreground md:text-xl"
          >
            Sin resultados por ahora
          </h2>
          <Card className="shadow-sm">
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">
                {data?.message ||
                  'Por ahora no hay oportunidades nuevas. Seguimos buscando según sus preferencias.'}
              </p>
            </CardContent>
          </Card>
        </section>
      )}
    </div>
  );
}

function OportunidadCard({
  enriched,
  onDismiss,
  isDismissed = false,
}: {
  enriched: EnrichedOportunidadDescubre;
  onDismiss: () => void;
  isDismissed?: boolean;
}) {
  const op = enriched;
  const showEntidad = isPremiumValue(op.entidad_contratante);
  const showValor = isPremiumValue(op.valor_estimado);
  const { showRanking, rankingScore, hasFechaLimite, urgencyInfo } = enriched;

  const hasModalidad = op.modalidad_contratacion && op.modalidad_contratacion !== 'No especificada';
  const hasUbicacion = op.ubicacion_entidad && op.ubicacion_entidad !== 'No especificada';

  const actionUrl = op.is_fallback_url === true && op.fallback_search_url
    ? op.fallback_search_url
    : op.link_directo;
  const isFallback = op.is_fallback_url === true && !!op.fallback_search_url;

  const isHighValue = op.cta_eligible === true;

  return (
    <Card
      className={cn(
        'flex flex-col overflow-hidden border-l-4 shadow-sm transition-shadow duration-300 hover:shadow-md',
        descubreCardLeftBorderClass(urgencyInfo),
        isDismissed && 'opacity-60',
      )}
    >
      <CardHeader className="space-y-2 px-4 pb-2 pt-4">
        <div className="flex items-start justify-between gap-3">
          <DescubreScoreBadge score={rankingScore} showRanking={showRanking} />
          <ClosingUrgencyPill urgencyInfo={urgencyInfo} hasFecha={hasFechaLimite} />
        </div>
        <CardTitle className="font-headline text-lg font-semibold leading-snug tracking-tight text-foreground line-clamp-2 normal-case">
          {titleForDisplay(op.titulo)}
        </CardTitle>
        {hasFechaLimite && (
          <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <CalendarDays className="h-3.5 w-3.5 shrink-0 opacity-80" aria-hidden />
            <span className="min-w-0 truncate">
              {urgencyInfo ? urgencyInfo.deadlineFormatted : op.fecha_limite_ofertas}
            </span>
          </p>
        )}
        {op.fecha_procesamiento && (
          <CardDescription className="flex items-center gap-1.5 text-[11px] text-foreground/55">
            <Clock className="h-3.5 w-3.5 shrink-0 opacity-70" aria-hidden />
            <span>Procesado: {op.fecha_procesamiento}</span>
          </CardDescription>
        )}
      </CardHeader>
      <CardContent className="flex-grow space-y-2.5 px-4 pb-4">
        {op.resumen_relevancia && isPremiumValue(op.resumen_relevancia) && (
          <div
            className="rounded-lg border border-primary/15 bg-primary/[0.06] px-2.5 py-2 text-xs leading-snug text-foreground/85"
            title={op.resumen_relevancia}
          >
            <p className="line-clamp-3">{op.resumen_relevancia}</p>
            <p className="mt-1 text-[10px] font-medium uppercase tracking-wide text-primary/80">
              Análisis IA
            </p>
          </div>
        )}
        {(hasModalidad || hasUbicacion) && (
          <div className="grid gap-2 text-sm sm:grid-cols-2">
            {hasModalidad && (
              <div className="flex min-w-0 gap-2 rounded-md border border-border/70 bg-background/80 px-2.5 py-1.5">
                <Tag className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-hidden />
                <div className="min-w-0 space-y-0.5">
                  <p className="text-[0.6rem] font-medium uppercase tracking-wide text-muted-foreground">
                    Modalidad
                  </p>
                  <p className="line-clamp-2 text-[13px] leading-snug text-foreground/90">{op.modalidad_contratacion}</p>
                </div>
              </div>
            )}
            {hasUbicacion && (
              <div className="flex min-w-0 gap-2 rounded-md border border-border/70 bg-background/80 px-2.5 py-1.5">
                <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-hidden />
                <div className="min-w-0 space-y-0.5">
                  <p className="text-[0.6rem] font-medium uppercase tracking-wide text-muted-foreground">
                    Ubicación
                  </p>
                  <p className="line-clamp-2 text-[13px] leading-snug text-foreground/90">{op.ubicacion_entidad}</p>
                </div>
              </div>
            )}
          </div>
        )}
        <div className="flex flex-wrap gap-1.5 pt-0.5">
          {showEntidad && (
            <Badge variant="outline" className="max-w-full border-border/90 font-normal text-muted-foreground">
              <span className="truncate">{op.entidad_contratante}</span>
            </Badge>
          )}
          {showValor && <Badge variant="secondary">{op.valor_estimado}</Badge>}
        </div>
        {isFallback && op.fallback_reference_process && (
          <p className="rounded-md bg-muted/50 px-2 py-1.5 text-xs text-foreground/60">
            Referencia:{' '}
            <strong className="font-medium text-foreground/80">{op.fallback_reference_process}</strong>
          </p>
        )}
      </CardContent>
      <CardFooter className="flex flex-col gap-2 border-t border-border/60 px-4 pb-4 pt-3">
        <div className="flex flex-wrap items-center gap-2">
          {actionUrl ? (
            <Button variant="outline" size="sm" className="min-w-0 w-full gap-1.5 text-xs sm:flex-1" asChild>
              <a href={actionUrl} target="_blank" rel="noopener noreferrer">
                {isFallback ? (
                  <>
                    <Search className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">SECOP II</span>
                  </>
                ) : (
                  <>
                    <ExternalLink className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">Ver detalle</span>
                  </>
                )}
              </a>
            </Button>
          ) : (
            <p className="flex-1 text-center text-xs italic text-muted-foreground">Sin enlace</p>
          )}
          <Button
            variant="ghost"
            size="sm"
            className="w-full gap-1.5 text-xs text-muted-foreground hover:text-destructive"
            onClick={onDismiss}
          >
            <X className="h-3.5 w-3.5" />
            {isDismissed ? 'Restaurar' : 'No me interesa'}
          </Button>
        </div>
        {isHighValue && (
          <a
            href="https://wa.me/573208691817?text=Hola%2C%20encontré%20una%20licitación%20relevante%20en%20Bidtory%20y%20quisiera%20apoyo%20para%20aplicar."
            target="_blank"
            rel="noopener noreferrer"
            className="w-full"
          >
            <Button
              variant="outline"
              size="sm"
              className="w-full gap-2 border-accent/35 text-accent hover:bg-accent/10 hover:text-accent text-xs"
            >
              <MessageCircle className="h-3.5 w-3.5 shrink-0" />
              Apoyo para aplicar
            </Button>
          </a>
        )}
      </CardFooter>
    </Card>
  );
}
