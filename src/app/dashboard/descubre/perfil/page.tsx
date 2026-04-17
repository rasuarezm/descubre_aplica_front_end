'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useDescubre } from '@/contexts/descubre-context';
import descubreApiClient, { ApiError } from '@/lib/descubre-api-client';
import type { DescubreClienteProfile, FuenteSecop } from '@/types';
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Loader2, AlertCircle, ArrowLeft, Building2, Search, Bell, Rss, CheckCircle2, Plus, Minus } from 'lucide-react';

function arrayToLines(arr: string[] | undefined): string {
  if (!arr || arr.length === 0) return '';
  return arr.join('\n');
}

/** Normalización para enviar al API (sin líneas vacías ni ruido). */
function linesToArray(text: string): string[] {
  return text.split('\n').map((s) => s.trim()).filter(Boolean);
}

/** Mientras el usuario edita el textarea: conserva saltos de línea y espacios por línea. */
function splitLinesRaw(text: string): string[] {
  return text.split('\n');
}

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

const MODALIDADES_SECOP = [
  'Licitación Pública',
  'Selección Abreviada',
  'Concurso de Méritos',
  'Mínima Cuantía',
  'Régimen Especial',
  'Acuerdo Marco de Precios',
];

export default function DescubrePerfilPage() {
  const { descubreData, loading, tieneDescubre, refreshDescubreProfile } = useDescubre();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<Partial<DescubreClienteProfile> | null>(null);
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);

  useEffect(() => {
    if (descubreData?.cliente && !form) {
      setForm(descubreData.cliente);
    }
  }, [descubreData, form]);

  const updateField = <K extends keyof DescubreClienteProfile>(key: K, value: DescubreClienteProfile[K]) => {
    setForm((prev) => (prev ? { ...prev, [key]: value } : prev));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form) return;
    setSaving(true);
    try {
      const payload: Record<string, unknown> = {
        nombre_empresa: form.nombre_empresa || null,
        nombre_persona_contacto: form.nombre_persona_contacto || null,
        cargo_persona_contacto: form.cargo_persona_contacto || null,
        email_contacto_principal: form.email_contacto_principal || null,
        tipos_servicio: linesToArray(typeof form.tipos_servicio === 'string' ? form.tipos_servicio : arrayToLines(form.tipos_servicio)),
        palabras_clave_positivas: linesToArray(typeof form.palabras_clave_positivas === 'string' ? form.palabras_clave_positivas : arrayToLines(form.palabras_clave_positivas)),
        palabras_clave_negativas: linesToArray(typeof form.palabras_clave_negativas === 'string' ? form.palabras_clave_negativas : arrayToLines(form.palabras_clave_negativas)),
        valor_minimo_interes: form.valor_minimo_interes ?? null,
        ubicaciones_preferidas: linesToArray(typeof form.ubicaciones_preferidas === 'string' ? form.ubicaciones_preferidas : arrayToLines(form.ubicaciones_preferidas)),
        entidades_interes: linesToArray(typeof form.entidades_interes === 'string' ? form.entidades_interes : arrayToLines(form.entidades_interes)),
        send_notifications: linesToArray(typeof form.send_notifications === 'string' ? form.send_notifications : arrayToLines(form.send_notifications)),
        modalidades_preferidas: form.modalidades_preferidas || [],
      };

      if (descubreData?.plan_actual?.features_habilitadas?.palabra_clave_dorada_config && form.palabras_clave_doradas !== undefined) {
        payload.palabras_clave_doradas = linesToArray(typeof form.palabras_clave_doradas === 'string' ? form.palabras_clave_doradas : arrayToLines(form.palabras_clave_doradas));
      }

      await descubreApiClient.post('/v1/profile', payload);
      toast({ title: 'Perfil actualizado', description: 'Los cambios se guardaron correctamente.' });
      await refreshDescubreProfile();
    } catch (e) {
      toast({
        title: 'Error al guardar',
        description: e instanceof ApiError ? e.message : 'Error desconocido',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

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
          <p className="text-muted-foreground">Cargando perfil...</p>
        </div>
      </div>
    );
  }

  if (!tieneDescubre) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="max-w-md border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />Sin acceso
            </CardTitle>
            <CardDescription>No tiene un perfil Descubre activo.</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/dashboard/descubre"><Button variant="outline">Volver</Button></Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!form) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="text-muted-foreground">Cargando perfil...</p>
        </div>
      </div>
    );
  }

  const limites = descubreData?.plan_actual?.limites ?? {};
  const maxTipos = limites.max_tipos_servicio_items ?? 10;
  const maxPos = limites.max_palabras_clave_positivas ?? 20;
  const maxNeg = limites.max_palabras_clave_negativas ?? 20;
  const maxEmails = limites.max_destinatarios_correo ?? 3;
  const maxFuentes = limites.max_fuentes_secop_rss ?? 0;
  const fuentesSuscritas = descubreData?.fuentes_suscritas ?? [];
  const fuentesDisponibles = descubreData?.fuentes_secop_disponibles_para_suscripcion ?? [];
  const limiteAlcanzado = fuentesSuscritas.length >= maxFuentes;
  const fuentesNoSuscritas = fuentesDisponibles.filter((f) => {
    const fid = fuenteId(f);
    return !fuentesSuscritas.some((s) => fuenteId(s) === fid);
  });

  return (
    <div className="space-y-6">
      <div>
        <Link href="/dashboard/descubre" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-2">
          <ArrowLeft className="mr-2 h-4 w-4" />Volver al dashboard
        </Link>
        <h1 className="text-2xl font-semibold">Perfil Descubre</h1>
        <p className="text-muted-foreground mt-1">Edite sus preferencias de búsqueda y datos de contacto</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Contacto */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Building2 className="h-5 w-5" />Información de contacto</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="nombre_empresa">Nombre de la empresa</Label>
                <Input id="nombre_empresa" value={form.nombre_empresa ?? ''} onChange={(e) => updateField('nombre_empresa', e.target.value)} placeholder="Mi Empresa SAS" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="nombre_persona_contacto">Persona de contacto</Label>
                <Input id="nombre_persona_contacto" value={form.nombre_persona_contacto ?? ''} onChange={(e) => updateField('nombre_persona_contacto', e.target.value)} placeholder="Nombre completo" />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="cargo">Cargo</Label>
                <Input id="cargo" value={form.cargo_persona_contacto ?? ''} onChange={(e) => updateField('cargo_persona_contacto', e.target.value)} placeholder="Gerente Comercial" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email_contacto_principal">Email de contacto</Label>
                <Input id="email_contacto_principal" type="email" value={form.email_contacto_principal ?? ''} onChange={(e) => updateField('email_contacto_principal', e.target.value)} placeholder="contacto@empresa.com" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Preferencias */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Search className="h-5 w-5" />Preferencias de búsqueda</CardTitle>
            <CardDescription>Un valor por línea.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Tipos de servicio (máx. {maxTipos})</Label>
              <Textarea value={arrayToLines(form.tipos_servicio)} onChange={(e) => updateField('tipos_servicio', splitLinesRaw(e.target.value))} placeholder={'Consultoría TI\nDesarrollo Web'} rows={3} />
            </div>
            <div className="space-y-2">
              <Label>Palabras clave positivas (máx. {maxPos})</Label>
              <Textarea value={arrayToLines(form.palabras_clave_positivas)} onChange={(e) => updateField('palabras_clave_positivas', splitLinesRaw(e.target.value))} placeholder={'IA\nBig Data'} rows={3} />
            </div>
            <div className="space-y-2">
              <Label>Palabras clave negativas (máx. {maxNeg})</Label>
              <Textarea value={arrayToLines(form.palabras_clave_negativas)} onChange={(e) => updateField('palabras_clave_negativas', splitLinesRaw(e.target.value))} placeholder={'Manual\nObsoleto'} rows={2} />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Valor mínimo (COP)</Label>
                <Input type="number" min={0} value={form.valor_minimo_interes ?? ''} onChange={(e) => updateField('valor_minimo_interes', e.target.value === '' ? undefined : Number(e.target.value))} placeholder="10000000" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Ubicaciones preferidas</Label>
              <Textarea value={arrayToLines(form.ubicaciones_preferidas)} onChange={(e) => updateField('ubicaciones_preferidas', splitLinesRaw(e.target.value))} placeholder={'Bogotá D.C.\nNacional'} rows={2} />
            </div>
            <div className="space-y-2">
              <Label>Entidades de interés</Label>
              <Textarea value={arrayToLines(form.entidades_interes)} onChange={(e) => updateField('entidades_interes', splitLinesRaw(e.target.value))} placeholder={'Ministerio TIC\nColpensiones'} rows={2} />
            </div>
            {descubreData?.plan_actual?.features_habilitadas?.palabra_clave_dorada_config && (
              <div className="space-y-2">
                <Label>Palabras clave doradas</Label>
                <Textarea value={arrayToLines(form.palabras_clave_doradas)} onChange={(e) => updateField('palabras_clave_doradas', splitLinesRaw(e.target.value))} placeholder="Urgencia Manifiesta" rows={2} />
              </div>
            )}
            <div className="space-y-2">
              <Label>Modalidades SECOP preferidas</Label>
              <div className="flex flex-wrap gap-3 pt-2">
                {MODALIDADES_SECOP.map((mod) => {
                  const selected = form.modalidades_preferidas?.includes(mod) ?? false;
                  return (
                    <label key={mod} className="flex items-center gap-2 cursor-pointer text-sm">
                      <input
                        type="checkbox"
                        checked={selected}
                        onChange={(e) => {
                          const arr = form.modalidades_preferidas ?? [];
                          updateField('modalidades_preferidas', e.target.checked ? [...arr, mod] : arr.filter((m) => m !== mod));
                        }}
                        className="rounded border-input"
                      />
                      {mod}
                    </label>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Notificaciones */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Bell className="h-5 w-5" />Notificaciones</CardTitle>
            <CardDescription>Emails que recibirán las alertas de nuevas oportunidades (máx. {maxEmails})</CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea value={arrayToLines(form.send_notifications)} onChange={(e) => updateField('send_notifications', splitLinesRaw(e.target.value))} placeholder={'alerta1@empresa.com\nalerta2@empresa.com'} rows={3} />
          </CardContent>
        </Card>

        <div className="flex justify-end gap-4">
          <Link href="/dashboard/descubre"><Button type="button" variant="outline">Cancelar</Button></Link>
          <Button type="submit" disabled={saving}>
            {saving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Guardando...</> : 'Guardar cambios'}
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Rss className="h-5 w-5" />
              Fuentes SECOP
            </CardTitle>
            <CardDescription>
              <Badge variant="secondary" className="mr-2">{fuentesSuscritas.length}</Badge>
              de {maxFuentes} fuente(s) activa(s) en su plan
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {fuentesSuscritas.length > 0 ? (
              <ul className="space-y-2">
                {fuentesSuscritas.map((f, i) => {
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
              <p className="text-muted-foreground text-sm">No tiene fuentes activas. Suscríbase para recibir oportunidades.</p>
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
                          title={limiteAlcanzado ? 'Límite de fuentes alcanzado en su plan' : undefined}
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
      </form>
    </div>
  );
}
