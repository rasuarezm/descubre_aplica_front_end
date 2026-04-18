'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useDescubre } from '@/contexts/descubre-context';
import descubreApiClient from '@/lib/descubre-api-client';
import type { OportunidadDescubre, OportunidadesDescubreResponse } from '@/types';
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
  Mail,
} from 'lucide-react';
import { cn } from '@/lib/utils';

function isPremiumValue(val: string | number | undefined): boolean {
  if (val == null || val === '') return false;
  const s = String(val).trim();
  return s !== 'N/A*' && s.toLowerCase() !== 'n/a';
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

      <section
        aria-hidden
        className="rounded-xl border border-border bg-card px-4 py-4 shadow-sm sm:px-5"
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-stretch sm:divide-x sm:divide-border">
          <div className="flex flex-1 flex-col justify-center gap-2 sm:pr-4">
            <Skeleton className="h-3 w-36" />
            <Skeleton className="h-8 w-10" />
          </div>
          <div className="flex flex-1 flex-col justify-center gap-2 sm:pl-4">
            <Skeleton className="h-3 w-28" />
            <Skeleton className="h-8 w-8" />
          </div>
        </div>
      </section>

      <section className="space-y-6 border-t border-border pt-8">
        <div className="space-y-2">
          <Skeleton className="h-8 w-[min(100%,14rem)]" />
          <Skeleton className="h-4 w-full max-w-xl" />
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <Card
              key={i}
              className="overflow-hidden border-l-4 border-accent/25 shadow-sm"
            >
              <CardHeader className="space-y-2 pb-3">
                <Skeleton className="h-6 w-full" />
                <Skeleton className="h-5 w-[85%]" />
                <Skeleton className="h-3.5 w-28" />
              </CardHeader>
              <CardContent className="space-y-3">
                <Skeleton className="h-[3.25rem] w-full rounded-md" />
                <Skeleton className="h-[3.5rem] w-full rounded-lg" />
                <div className="grid gap-2 sm:grid-cols-2">
                  <Skeleton className="h-[3.25rem] w-full rounded-md" />
                  <Skeleton className="h-[3.25rem] w-full rounded-md" />
                </div>
                <div className="flex flex-wrap gap-2 pt-0.5">
                  <Skeleton className="h-5 w-20 rounded-full" />
                  <Skeleton className="h-5 w-24 rounded-full" />
                </div>
              </CardContent>
              <CardFooter className="flex flex-col gap-2">
                <Skeleton className="h-10 w-full rounded-md" />
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
  const oportunidades = data?.oportunidades ?? [];
  const totalFuentes = fuentes_suscritas?.length ?? 0;

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

      <section
        aria-label="Resumen"
        className="rounded-xl border border-border bg-card px-4 py-4 shadow-sm sm:px-5"
      >
        <p className="sr-only">Resumen de métricas de su cuenta Descubre</p>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-stretch sm:divide-x sm:divide-border">
          <div className="flex flex-1 flex-col justify-center gap-0.5 sm:pr-4">
            <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Oportunidades encontradas
            </span>
            <span className="text-2xl font-semibold tabular-nums text-foreground">{oportunidades.length}</span>
          </div>
          <div className="flex flex-1 flex-col justify-center gap-0.5 sm:pl-4 sm:pr-0">
            <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Fuentes activas
            </span>
            <span className="text-2xl font-semibold tabular-nums text-foreground">{totalFuentes}</span>
          </div>
        </div>
      </section>

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
            <p className="flex gap-2 text-sm leading-relaxed text-muted-foreground">
              <Mail className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground/80" aria-hidden />
              <span>
                Se muestran las últimas{' '}
                <strong className="font-medium text-foreground/90">30</strong> oportunidades. Las
                anteriores las recibirá por correo.
              </span>
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3">
            {oportunidades.map((op, i) => (
              <OportunidadCard key={op.titulo ? `${op.titulo}-${i}` : i} op={op} />
            ))}
          </div>
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

function OportunidadCard({ op }: { op: OportunidadDescubre }) {
  const showEntidad = isPremiumValue(op.entidad_contratante);
  const showValor = isPremiumValue(op.valor_estimado);
  const showRanking = isPremiumValue(op.ranking_interes);

  const actionUrl = op.is_fallback_url === true && op.fallback_search_url
    ? op.fallback_search_url
    : op.link_directo;
  const isFallback = op.is_fallback_url === true && !!op.fallback_search_url;

  const isHighValue = op.cta_eligible === true;

  const hasModalidad = op.modalidad_contratacion && op.modalidad_contratacion !== 'No especificada';
  const hasFechaLimite = op.fecha_limite_ofertas && op.fecha_limite_ofertas !== 'No especificada';
  const hasUbicacion = op.ubicacion_entidad && op.ubicacion_entidad !== 'No especificada';

  return (
    <Card
      className={cn(
        'flex flex-col overflow-hidden border-l-4 border-accent shadow-md transition-shadow duration-300 hover:shadow-xl',
      )}
    >
      <CardHeader className="space-y-2 pb-3">
        <CardTitle className="text-xl font-semibold leading-snug tracking-tight text-foreground line-clamp-2">
          {op.titulo || 'Oportunidad sin título'}
        </CardTitle>
        {op.fecha_procesamiento && (
          <CardDescription className="flex items-center gap-1.5 text-foreground/55">
            <Clock className="h-3.5 w-3.5 shrink-0 opacity-70" aria-hidden />
            <span>Procesado: {op.fecha_procesamiento}</span>
          </CardDescription>
        )}
      </CardHeader>
      <CardContent className="flex-grow space-y-3">
        {op.resumen_relevancia && isPremiumValue(op.resumen_relevancia) && (
          <blockquote className="border-l-2 border-accent/35 bg-muted/40 py-2 pl-3 pr-2 text-sm italic leading-relaxed text-foreground/65">
            &quot;{op.resumen_relevancia}&quot;
          </blockquote>
        )}
        {hasFechaLimite && (
          <div className="rounded-lg border border-accent/25 bg-accent/[0.06] px-3 py-2.5">
            <div className="flex gap-2.5">
              <CalendarDays className="mt-0.5 h-4 w-4 shrink-0 text-accent" aria-hidden />
              <div className="min-w-0 space-y-0.5">
                <p className="text-[0.65rem] font-semibold uppercase tracking-wide text-muted-foreground">
                  Fecha límite
                </p>
                <p className="text-sm font-semibold leading-snug text-foreground">{op.fecha_limite_ofertas}</p>
              </div>
            </div>
          </div>
        )}
        {(hasModalidad || hasUbicacion) && (
          <div className="grid gap-2.5 text-sm sm:grid-cols-2 sm:gap-3">
            {hasModalidad && (
              <div className="flex min-w-0 gap-2 rounded-md border border-border/80 bg-background/80 px-2.5 py-2">
                <Tag className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
                <div className="min-w-0 space-y-0.5">
                  <p className="text-[0.65rem] font-medium uppercase tracking-wide text-muted-foreground">
                    Modalidad
                  </p>
                  <p className="leading-snug text-foreground/90">{op.modalidad_contratacion}</p>
                </div>
              </div>
            )}
            {hasUbicacion && (
              <div className="flex min-w-0 gap-2 rounded-md border border-border/80 bg-background/80 px-2.5 py-2">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
                <div className="min-w-0 space-y-0.5">
                  <p className="text-[0.65rem] font-medium uppercase tracking-wide text-muted-foreground">
                    Ubicación
                  </p>
                  <p className="leading-snug text-foreground/90">{op.ubicacion_entidad}</p>
                </div>
              </div>
            )}
          </div>
        )}
        <div className="flex gap-2 flex-wrap pt-0.5">
          {showEntidad && <Badge variant="secondary">{op.entidad_contratante}</Badge>}
          {showValor && <Badge variant="outline">{op.valor_estimado}</Badge>}
          {showRanking && <Badge variant="outline">Ranking: {op.ranking_interes}/10</Badge>}
        </div>
        {isFallback && op.fallback_reference_process && (
          <p className="rounded-md bg-muted/50 px-2 py-1.5 text-xs text-foreground/60">
            Referencia:{' '}
            <strong className="font-medium text-foreground/80">{op.fallback_reference_process}</strong>
          </p>
        )}
      </CardContent>
      <CardFooter className="flex flex-col gap-2">
        {actionUrl ? (
          <a href={actionUrl} target="_blank" rel="noopener noreferrer" className="w-full">
            <Button
              variant="outline"
              className="w-full gap-2 border-accent/40 text-accent hover:bg-accent/10 hover:text-accent"
            >
              {isFallback ? (
                <><Search className="h-4 w-4" />Buscar en SECOP II</>
              ) : (
                <><ExternalLink className="h-4 w-4" />Ver detalle</>
              )}
            </Button>
          </a>
        ) : (
          <p className="text-sm italic text-foreground/55">Enlace no disponible por el momento.</p>
        )}
        {isHighValue && (
          <a
            href="https://wa.me/573208691817?text=Hola%2C%20encontré%20una%20licitación%20relevante%20en%20Bidtory%20y%20quisiera%20apoyo%20para%20aplicar."
            target="_blank"
            rel="noopener noreferrer"
            className="w-full"
          >
            <Button className="w-full gap-2 bg-accent hover:bg-accent/90 text-accent-foreground text-xs">
              <MessageCircle className="h-4 w-4" />
              ¿Necesita apoyo para aplicar? Hable con un experto
            </Button>
          </a>
        )}
      </CardFooter>
    </Card>
  );
}
