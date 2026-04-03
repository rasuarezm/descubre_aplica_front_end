'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useDescubre } from '@/contexts/descubre-context';
import descubreApiClient, { ApiError } from '@/lib/descubre-api-client';
import type { FuenteSecop } from '@/types';
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import {
  Loader2, CheckCircle2, Info, Rss,
  Building2, Settings, Plus, Minus, Search,
} from 'lucide-react';

function formatList(items: string[] | undefined): string {
  if (!items || items.length === 0) return '-';
  return items.join(', ');
}

function formatCurrency(value: number | undefined): string {
  if (value === undefined) return '-';
  return new Intl.NumberFormat('es-CO', {
    style: 'currency', currency: 'COP', minimumFractionDigits: 0,
  }).format(value);
}

/** Id estable para comparar suscrito/disponible (el API puede usar id_documento_fuente o id_fuente). */
function fuenteId(f: FuenteSecop, index?: number): string {
  return f.id_documento_fuente || f.id_fuente || f.id || (index !== undefined ? `idx-${index}` : '');
}

function fuenteEtiqueta(f: FuenteSecop, index?: number): string {
  const id = fuenteId(f, index);
  return (
    f.nombre_visible ||
    f.nombre_descriptivo_fuente ||
    f.descripcion_corta ||
    f.descripcion_fuente ||
    f.url ||
    id ||
    'Fuente'
  );
}

export default function DescubreDashboardPage() {
  const { descubreData, loading, tieneDescubre, refreshDescubreProfile } = useDescubre();
  const { toast } = useToast();
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);

  const handleSubscribe = async (fuente: FuenteSecop) => {
    const docId = fuente.id_documento_fuente || fuente.id_fuente || fuente.id;
    setActionInProgress(docId ?? null);
    try {
      const res = await descubreApiClient.post('/v1/subscribe_feed', {
        id_documento_fuente: docId,
      });
      toast({ title: 'Suscripción exitosa', description: (res as { message?: string }).message || 'Suscrito correctamente.' });
      await refreshDescubreProfile();
    } catch (e) {
      toast({
        title: 'Error al suscribirse',
        description: e instanceof ApiError ? e.message : 'Error desconocido',
        variant: 'destructive',
      });
    } finally {
      setActionInProgress(null);
    }
  };

  const handleUnsubscribe = async (fuente: FuenteSecop) => {
    const docId = fuente.id_documento_fuente || fuente.id_fuente || fuente.id;
    setActionInProgress(docId ?? null);
    try {
      const res = await descubreApiClient.post('/v1/unsubscribe_feed', {
        id_documento_fuente: docId,
      });
      toast({ title: 'Desuscripción exitosa', description: (res as { message?: string }).message || 'Desuscrito correctamente.' });
      await refreshDescubreProfile();
    } catch (e) {
      toast({
        title: 'Error al desuscribirse',
        description: e instanceof ApiError ? e.message : 'Error desconocido',
        variant: 'destructive',
      });
    } finally {
      setActionInProgress(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="text-muted-foreground">Cargando Descubre...</p>
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

  const { cliente, plan_actual, fuentes_suscritas, fuentes_secop_disponibles_para_suscripcion, estado_bidtory_info } = descubreData;
  const isActive = estado_bidtory_info?.code === 'ACTIVO_BUSCANDO';
  const maxFuentes = plan_actual?.limites?.max_fuentes_secop_rss ?? 0;
  const limiteAlcanzado = (fuentes_suscritas?.length ?? 0) >= maxFuentes;
  const fuentesNoSuscritas = fuentes_secop_disponibles_para_suscripcion?.filter((f) => {
    const fid = fuenteId(f);
    return !fuentes_suscritas?.some((s) => fuenteId(s) === fid);
  }) ?? [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">
            Bienvenido, {cliente?.nombre_empresa || 'Bidtory'}
          </h1>
          <div className="text-muted-foreground mt-1 flex items-center gap-2">
            Bidtory Descubre
            <Badge variant="secondary">{plan_actual?.nombre_visible ?? cliente.nivel_suscripcion}</Badge>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href="/dashboard/descubre/oportunidades">
              <Search className="h-4 w-4 mr-2" />
              Ver oportunidades
            </Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href="/dashboard/descubre/perfil">
              <Settings className="h-4 w-4 mr-2" />
              Editar perfil
            </Link>
          </Button>
        </div>
      </div>

      {/* Estado del servicio */}
      <Card className="border-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {isActive ? (
              <CheckCircle2 className="h-5 w-5 text-green-500" />
            ) : (
              <Info className="h-5 w-5 text-amber-500" />
            )}
            Estado del servicio
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p>{estado_bidtory_info?.message || 'Cargando estado...'}</p>
          {estado_bidtory_info?.sugerencias && estado_bidtory_info.sugerencias.length > 0 && (
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-2">Sugerencias:</p>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                {estado_bidtory_info.sugerencias.map((s, i) => (
                  <li key={`sug-${i}-${s}`}>{s}</li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Info contacto */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Información de contacto
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div><span className="text-muted-foreground">Empresa:</span> {cliente?.nombre_empresa || '-'}</div>
            <div><span className="text-muted-foreground">Contacto:</span> {cliente?.nombre_persona_contacto || '-'}</div>
            <div><span className="text-muted-foreground">Cargo:</span> {cliente?.cargo_persona_contacto || '-'}</div>
            <div><span className="text-muted-foreground">Email:</span> {cliente?.email_contacto_principal || '-'}</div>
          </CardContent>
        </Card>

        {/* Plan */}
        <Card>
          <CardHeader>
            <CardTitle>Mi plan Descubre</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div><span className="text-muted-foreground">Plan:</span> {plan_actual?.nombre_visible ?? cliente.nivel_suscripcion}</div>
            {plan_actual?.descripcion_corta && (
              <p className="text-muted-foreground pt-1">{plan_actual.descripcion_corta}</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Preferencias resumen */}
      <Card>
        <CardHeader>
          <CardTitle>Preferencias de búsqueda</CardTitle>
          <CardDescription>Perfil de intereses configurado para la IA</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div><span className="text-muted-foreground">Tipos de servicio:</span> {formatList(cliente?.tipos_servicio)}</div>
          <div><span className="text-muted-foreground">Palabras clave positivas:</span> {formatList(cliente?.palabras_clave_positivas)}</div>
          <div><span className="text-muted-foreground">Palabras clave negativas:</span> {formatList(cliente?.palabras_clave_negativas)}</div>
          <div><span className="text-muted-foreground">Valor mínimo (COP):</span> {cliente?.valor_minimo_interes != null ? formatCurrency(cliente.valor_minimo_interes) : '-'}</div>
          <div><span className="text-muted-foreground">Ubicaciones:</span> {formatList(cliente?.ubicaciones_preferidas)}</div>
          <div><span className="text-muted-foreground">Emails de notificación:</span> {formatList(cliente?.send_notifications)}</div>
        </CardContent>
      </Card>

      {/* Fuentes SECOP */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Rss className="h-5 w-5" />
            Mis fuentes SECOP
          </CardTitle>
          <CardDescription>
            {fuentes_suscritas?.length ?? 0} de {maxFuentes} fuente(s) activa(s) en tu plan
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {fuentes_suscritas && fuentes_suscritas.length > 0 ? (
            <ul className="space-y-2">
              {fuentes_suscritas.map((f, i) => {
                const fid = fuenteId(f, i);
                const isProcessing = actionInProgress === fid;
                return (
                  <li key={`suscrita-${fid}`} className="flex items-center justify-between gap-2 py-2 border-b border-border last:border-0">
                    <div className="flex items-center gap-2 text-sm min-w-0">
                      <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                      <span className="truncate">{fuenteEtiqueta(f, i)}</span>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="shrink-0 gap-1 border-red-500 text-red-600 hover:bg-red-50"
                      onClick={() => handleUnsubscribe(f)}
                      disabled={!!actionInProgress}
                    >
                      {isProcessing ? <Loader2 className="h-3 w-3 animate-spin" /> : <Minus className="h-3 w-3" />}
                      Desuscribirse
                    </Button>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="text-muted-foreground text-sm">No tienes fuentes activas. Suscríbete para recibir oportunidades.</p>
          )}

          {fuentesNoSuscritas.length > 0 && (
            <div className="pt-4 border-t border-border">
              <p className="text-sm font-medium mb-3">Fuentes disponibles</p>
              <ul className="space-y-2">
                {fuentesNoSuscritas.map((f, i) => {
                  const fid = fuenteId(f, i);
                  const isProcessing = actionInProgress === fid;
                  return (
                    <li key={`disponible-${fid}`} className="flex items-center justify-between gap-2 py-2 px-3 rounded-md bg-muted/50">
                      <span className="text-sm truncate flex-1 min-w-0">{fuenteEtiqueta(f, i)}</span>
                      <Button
                        variant="default"
                        size="sm"
                        className="shrink-0 gap-1"
                        onClick={() => handleSubscribe(f)}
                        disabled={limiteAlcanzado || !!actionInProgress}
                        title={limiteAlcanzado ? 'Límite de fuentes alcanzado en tu plan' : undefined}
                      >
                        {isProcessing ? <Loader2 className="h-3 w-3 animate-spin" /> : <Plus className="h-3 w-3" />}
                        Suscribirse
                      </Button>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
