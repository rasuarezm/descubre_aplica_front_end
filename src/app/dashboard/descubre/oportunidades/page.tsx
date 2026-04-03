'use client';

import { useEffect, useState, useCallback } from 'react';
import { useDescubre } from '@/contexts/descubre-context';
import descubreApiClient from '@/lib/descubre-api-client';
import type { OportunidadDescubre, OportunidadesDescubreResponse } from '@/types';
import {
  Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, AlertCircle, ExternalLink, Search } from 'lucide-react';
import { cn } from '@/lib/utils';

function isPremiumValue(val: string | number | undefined): boolean {
  if (val == null || val === '') return false;
  const s = String(val).trim();
  return s !== 'N/A*' && s.toLowerCase() !== 'n/a';
}

export default function DescubreOportunidadesPage() {
  const { tieneDescubre, loading: contextLoading } = useDescubre();
  const [data, setData] = useState<OportunidadesDescubreResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadOportunidades = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await descubreApiClient.get<OportunidadesDescubreResponse>('/v1/opportunities');
      setData(res);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al cargar las oportunidades.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!contextLoading && tieneDescubre) {
      void loadOportunidades();
    } else if (!contextLoading && !tieneDescubre) {
      setLoading(false);
    }
  }, [contextLoading, tieneDescubre, loadOportunidades]);

  if (contextLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="text-muted-foreground">Buscando sus oportunidades...</p>
        </div>
      </div>
    );
  }

  if (!tieneDescubre) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="max-w-md text-center">
          <CardHeader>
            <CardTitle>Módulo no disponible</CardTitle>
            <CardDescription>Activa Bidtory Descubre para ver oportunidades.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="max-w-md border-destructive">
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
      </div>
    );
  }

  const oportunidades = data?.oportunidades ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Mis oportunidades</h1>
        <p className="text-muted-foreground mt-1">Oportunidades de licitación encontradas para tu perfil</p>
      </div>

      {oportunidades.length > 0 && (
        <div className="rounded-lg border border-border bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
          Se muestran las últimas <strong>30</strong> oportunidades. Para anteriores consulta el correo.
        </div>
      )}

      {oportunidades.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {oportunidades.map((op, i) => (
            <OportunidadCard key={op.titulo ? `${op.titulo}-${i}` : i} op={op} />
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">
              {data?.message || 'No hay oportunidades nuevas por ahora. Bidtory sigue buscando las mejores para ti.'}
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
