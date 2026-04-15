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
import {
  Loader2, Info, Search, ExternalLink, Settings, AlertCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';

function isPremiumValue(val: string | number | undefined): boolean {
  if (val == null || val === '') return false;
  const s = String(val).trim();
  return s !== 'N/A*' && s.toLowerCase() !== 'n/a';
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
      setError(e instanceof Error ? e.message : 'Error al cargar las oportunidades.');
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
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="text-muted-foreground">Buscando sus oportunidades...</p>
        </div>
      </div>
    );
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
              Descubre oportunidades de licitación con IA. Este módulo no está activo en tu cuenta.
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
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold">Bienvenido, {cliente?.nombre_empresa || 'Bidtory'}</h1>
          <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            <Badge variant="secondary">{plan_actual?.nombre_visible ?? cliente.nivel_suscripcion}</Badge>
            <span className={cn('inline-flex h-2.5 w-2.5 rounded-full', isActive ? 'bg-green-500' : 'bg-amber-500')} />
            <span>{isActive ? 'Activo buscando' : 'Requiere ajustes'}</span>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" asChild>
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
            <p className="text-sm text-muted-foreground">{estado_bidtory_info?.message || 'Ajusta tus preferencias para activar el monitoreo.'}</p>
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

      <div className="grid gap-3 md:grid-cols-3">
        <Card className="bg-muted/40">
          <CardContent className="py-3 text-sm">
            <div className="text-muted-foreground">Oportunidades encontradas</div>
            <div className="text-lg font-semibold">{oportunidades.length}</div>
          </CardContent>
        </Card>
        <Card className="bg-muted/40">
          <CardContent className="py-3 text-sm">
            <div className="text-muted-foreground">Fuentes activas</div>
            <div className="text-lg font-semibold">{totalFuentes}</div>
          </CardContent>
        </Card>
        <Card className="bg-muted/40">
          <CardContent className="py-3 text-sm">
            <Link href="/dashboard/descubre/perfil" className="inline-flex items-center gap-2 text-primary hover:underline">
              <Settings className="h-4 w-4" />
              Editar preferencias
            </Link>
          </CardContent>
        </Card>
      </div>

      {error ? (
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />Error
            </CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" onClick={loadOportunidades}>Reintentar</Button>
          </CardContent>
        </Card>
      ) : oportunidades.length > 0 ? (
        <>
          <div className="rounded-lg border border-border bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
            Se muestran las últimas <strong>30</strong> oportunidades. Para anteriores consulta el correo.
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {oportunidades.map((op, i) => (
              <OportunidadCard key={op.titulo ? `${op.titulo}-${i}` : i} op={op} />
            ))}
          </div>
        </>
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">
              {data?.message || 'No hay oportunidades nuevas por ahora. Bidtory sigue buscando para ti.'}
            </p>
          </CardContent>
        </Card>
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

  return (
    <Card className={cn('flex flex-col hover:shadow-lg transition-shadow duration-300 border-l-4 border-primary')}>
      <CardHeader>
        <CardTitle className="text-lg font-semibold line-clamp-2">
          {op.titulo || 'Oportunidad sin título'}
        </CardTitle>
        {op.fecha_procesamiento && (
          <CardDescription>Procesado: {op.fecha_procesamiento}</CardDescription>
        )}
      </CardHeader>
      <CardContent className="flex-grow space-y-3">
        {op.resumen_relevancia && isPremiumValue(op.resumen_relevancia) && (
          <p className="text-sm italic text-muted-foreground line-clamp-2">
            &quot;{op.resumen_relevancia}&quot;
          </p>
        )}
        <div className="space-y-1.5 text-sm">
          {op.modalidad_contratacion && op.modalidad_contratacion !== 'No especificada' && (
            <p className="text-muted-foreground"><strong>Modalidad:</strong> {op.modalidad_contratacion}</p>
          )}
          {op.fecha_limite_ofertas && op.fecha_limite_ofertas !== 'No especificada' && (
            <p className="text-muted-foreground"><strong>Fecha límite:</strong> {op.fecha_limite_ofertas}</p>
          )}
          {op.ubicacion_entidad && op.ubicacion_entidad !== 'No especificada' && (
            <p className="text-muted-foreground"><strong>Ubicación:</strong> {op.ubicacion_entidad}</p>
          )}
        </div>
        <div className="flex gap-2 flex-wrap">
          {showEntidad && <Badge variant="secondary">{op.entidad_contratante}</Badge>}
          {showValor && <Badge variant="outline">{op.valor_estimado}</Badge>}
          {showRanking && <Badge variant="outline">Ranking: {op.ranking_interes}/10</Badge>}
        </div>
        {isFallback && op.fallback_reference_process && (
          <p className="text-xs text-muted-foreground">Referencia: <strong>{op.fallback_reference_process}</strong></p>
        )}
      </CardContent>
      <CardFooter>
        {actionUrl ? (
          <a href={actionUrl} target="_blank" rel="noopener noreferrer" className="w-full">
            <Button variant="outline" className="w-full gap-2">
              {isFallback ? (
                <><Search className="h-4 w-4" />Buscar en SECOP II</>
              ) : (
                <><ExternalLink className="h-4 w-4" />Ver detalle</>
              )}
            </Button>
          </a>
        ) : (
          <p className="text-sm text-muted-foreground italic">Enlace no disponible.</p>
        )}
      </CardFooter>
    </Card>
  );
}
