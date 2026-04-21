"use client";

import { useEffect, useState, useCallback } from 'react';
import Image from "next/image";
import Link from "next/link";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/auth-context";
import type { Customer } from "@/types";
import { Users, PlusCircle, ArrowRight, Loader2, AlertCircle, Search, Briefcase, CheckCircle2, Settings, TrendingDown, UserCheck, Building2 } from "lucide-react";
import { DashboardSkeleton } from "@/components/dashboard/DashboardSkeleton";
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from '@/hooks/use-toast';
import apiClient from '@/lib/api-client';
import { customerLogoImgSrc } from '@/lib/gcs-display';
import { cn } from '@/lib/utils';
import { useDescubre } from '@/contexts/descubre-context';
import descubreApiClient from '@/lib/descubre-api-client';
import { getUrgencyInfo } from '@/lib/date-utils';
import type { OportunidadesDescubreResponse, Opportunity } from '@/types';

function StatChip({
  value,
  label,
  loading,
  danger = false,
  highlight = false,
}: {
  value: number | undefined;
  label: string;
  loading: boolean;
  danger?: boolean;
  highlight?: boolean;
}) {
  return (
    <div
      className="flex flex-col items-center text-center"
      aria-label={`${value ?? '–'} ${label}`}
    >
      {loading || value === undefined ? (
        <Skeleton className="h-6 w-8 mb-1" />
      ) : (
        <span
          className={cn(
            'text-xl font-bold font-headline leading-none',
            danger && value > 0
              ? 'text-destructive'
              : highlight && value > 0
                ? 'text-[hsl(var(--accent))]'
                : 'text-foreground'
          )}
        >
          {value}
        </span>
      )}
      <span className="text-[11px] text-muted-foreground leading-tight mt-1">{label}</span>
    </div>
  );
}

interface DescubreSummary {
  total: number;
  highRanking: number;
}

interface AplicaSummary {
  total: number;
  urgent: number;
  overdue: number;
}

interface AdminCustomer {
  id: string;
  name: string;
  logo_url: string | null;
  logo_signed_url: string | null;
  owner_user_id: string | null;
  is_archived: boolean;
  created_at: string | null;
  bidtory_access?: {
    granted: boolean;
    granted_at?: string | null;
    level?: string | null;
  } | null;
  subscription?: {
    nivel_suscripcion?: string | null;
    estado_pago?: string | null;
    fecha_inicio_suscripcion?: string | null;
    fecha_proximo_pago?: string | null;
    is_active?: boolean;
    subscription_state?: string | null;
    missing_reason?: string | null;
  } | null;
}

export default function DashboardClient() {
  const { userProfile, getIdToken, loading: authLoading } = useAuth();
  const { tieneDescubre, tieneAplica, loading: descubreLoading, descubreData } = useDescubre();
  const [adminCustomers, setAdminCustomers] = useState<AdminCustomer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [descubreSummary, setDescubreSummary] = useState<DescubreSummary | null>(null);
  const [descubreSummaryLoading, setDescubreSummaryLoading] = useState(false);
  const [aplicaSummary, setAplicaSummary] = useState<AplicaSummary | null>(null);
  const [aplicaSummaryLoading, setAplicaSummaryLoading] = useState(false);

  const { toast } = useToast();
  const [isCreateZoneDialogOpen, setIsCreateZoneDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newCustomerData, setNewCustomerData] = useState({ name: '', description: '' });

  const fetchAdminCustomers = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await apiClient.get<{ customers: AdminCustomer[]; meta: object }>('/get_admin_customers');
      setAdminCustomers(data.customers ?? []);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error desconocido.';
      setError(msg);
      toast({ title: 'Error', description: msg, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    if (!authLoading && !descubreLoading) {
      if (userProfile?.role === 'admin') {
        fetchAdminCustomers();
      } else {
        setLoading(false);
      }
    }
  }, [userProfile, authLoading, descubreLoading, fetchAdminCustomers]);

  useEffect(() => {
    if (authLoading || descubreLoading) return;
    if (userProfile?.role !== 'customer') return;

    if (!tieneDescubre) setDescubreSummary(null);
    if (!tieneAplica) setAplicaSummary(null);

    if (tieneDescubre) {
      setDescubreSummaryLoading(true);
      // TODO: centralizar con React Query o contexto compartido para evitar
      // duplicar la llamada que ya hace AppSidebar en /get_opportunities
      descubreApiClient
        .get<OportunidadesDescubreResponse>('/v1/opportunities')
        .then((data) => {
          const ops = data.oportunidades ?? [];
          setDescubreSummary({
            total: ops.length,
            highRanking: ops.filter((op) => Number(op.ranking_interes) >= 7).length,
          });
        })
        .catch(() => setDescubreSummary({ total: 0, highRanking: 0 }))
        .finally(() => setDescubreSummaryLoading(false));
    }

    if ((tieneAplica || !!userProfile?.customer_id) && userProfile?.customer_id) {
      setAplicaSummaryLoading(true);
      apiClient
        .get<Opportunity[]>(`/get_opportunities?customer_id=${userProfile.customer_id}`)
        .then((data) => {
          const active = data.filter((opp) => !opp.is_archived);
          let urgent = 0;
          let overdue = 0;
          active.forEach((opp) => {
            if (opp.deadline) {
              const info = getUrgencyInfo(new Date(opp.deadline));
              if (info.status === 'overdue') overdue++;
              else if (info.status === 'urgent') urgent++;
            }
          });
          setAplicaSummary({ total: active.length, urgent, overdue });
        })
        .catch(() => setAplicaSummary({ total: 0, urgent: 0, overdue: 0 }))
        .finally(() => setAplicaSummaryLoading(false));
    }
  }, [
    tieneDescubre,
    tieneAplica,
    authLoading,
    descubreLoading,
    userProfile?.role,
    userProfile?.customer_id,
  ]);

  const handleCreateCustomer = async () => {
    if (!newCustomerData.name.trim()) {
      toast({
        title: "Error de Validación",
        description: "El nombre del cliente es obligatorio.",
        variant: "destructive",
      });
      return;
    }
    
    setIsSubmitting(true);
    try {
        await apiClient.post('/create_customer', {
            name: newCustomerData.name,
            description: newCustomerData.description,
        });
        
        toast({
            title: "¡Éxito!",
            description: `El cliente "${newCustomerData.name}" ha sido creado.`,
        });
        
        setIsCreateZoneDialogOpen(false);
        setNewCustomerData({ name: '', description: '' });
        fetchAdminCustomers();
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Ocurrió un error desconocido';
        toast({ title: 'Error al Crear', description: errorMessage, variant: 'destructive' });
    } finally {
        setIsSubmitting(false);
    }
  };


  if (authLoading || descubreLoading || loading) {
    return <DashboardSkeleton />;
  }

  if (error) {
     return (
        <div className="flex flex-col items-center justify-center min-h-[calc(100vh-theme(spacing.28))]">
           <AlertCircle className="h-10 w-10 text-destructive" />
           <p className="mt-4 text-lg font-semibold">No se pudieron cargar los datos</p>
          <p className="text-muted-foreground">{error}</p>
        </div>
      );
  }
  
  if (userProfile?.role === 'customer') {
    const isAplicaUser = tieneAplica || !!userProfile?.customer_id;
    if (!tieneDescubre && !isAplicaUser) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[calc(100vh-theme(spacing.28))] text-center">
          <Users className="h-12 w-12 text-muted-foreground" />
          <h1 className="mt-4 text-2xl font-headline">¡Bienvenido!</h1>
          <p className="text-muted-foreground">
            Su zona de cliente está siendo preparada. Por favor, contacte a un administrador.
          </p>
        </div>
      );
    }

    const estadoBidtory = descubreData?.estado_bidtory_info;
    const isDescubreMonitoreoActivo = estadoBidtory?.code === 'ACTIVO_BUSCANDO';
    const showEstadoBidtoryBanner =
      !!estadoBidtory &&
      (!!estadoBidtory.message || (estadoBidtory.sugerencias?.length ?? 0) > 0);

    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-headline tracking-tight">
            Bienvenido{userProfile.displayName ? `, ${userProfile.displayName.split(' ')[0]}` : ''}
          </h1>
          <p className="text-muted-foreground mt-1">
            {new Date().toLocaleDateString('es-CO', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </p>
        </div>

        {showEstadoBidtoryBanner && (
          <div
            className={cn(
              'flex flex-col gap-3 rounded-lg border px-4 py-3 text-sm sm:flex-row sm:items-start sm:justify-between',
              isDescubreMonitoreoActivo
                ? 'border-accent/35 bg-accent/10 text-foreground'
                : 'border-destructive/35 bg-destructive/10 text-foreground'
            )}
          >
            <div className="flex min-w-0 items-start gap-3">
              {isDescubreMonitoreoActivo ? (
                <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0 text-accent" aria-hidden />
              ) : (
                <AlertCircle className="h-4 w-4 mt-0.5 shrink-0 text-destructive" aria-hidden />
              )}
              <div className="min-w-0">
                {estadoBidtory.message && (
                  <p
                    className={cn(
                      'font-medium',
                      !isDescubreMonitoreoActivo && 'text-destructive'
                    )}
                  >
                    {estadoBidtory.message}
                  </p>
                )}
                {estadoBidtory.sugerencias?.map((s, i) => (
                  <p
                    key={i}
                    className={cn(
                      'mt-0.5',
                      isDescubreMonitoreoActivo
                        ? 'text-muted-foreground'
                        : 'text-destructive/90'
                    )}
                  >
                    {s}
                  </p>
                ))}
              </div>
            </div>
            <Button
              asChild
              size="sm"
              variant="outline"
              className={cn(
                'shrink-0 sm:self-center',
                isDescubreMonitoreoActivo
                  ? 'border-accent/50 text-accent hover:bg-accent/15'
                  : 'border-destructive/50 text-destructive hover:bg-destructive/10'
              )}
            >
              <Link href="/dashboard/descubre/perfil">
                <Settings className="mr-2 h-4 w-4" />
                Preferencias Descubre
              </Link>
            </Button>
          </div>
        )}

        <div
          className={cn(
            'grid gap-6',
            tieneAplica ? 'md:grid-cols-2' : 'md:grid-cols-1 max-w-lg'
          )}
        >
          {tieneDescubre && (
            <Link href="/dashboard/descubre">
              <Card className="group hover:shadow-lg hover:border-accent/50 transition-all duration-300 cursor-pointer h-full">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <Image
                      src="/logo-bidtory-descubre-pos.svg"
                      alt="Bidtory Descubre"
                      width={120}
                      height={32}
                      className="h-7 w-auto"
                    />
                    <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-accent transition-colors" />
                  </div>
                  <CardDescription className="pt-2">
                    Convocatorias del SECOP II puntuadas por IA según el perfil de su empresa.
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <div
                    className="grid grid-cols-3 gap-2 py-3 border-t border-border/50"
                    role="group"
                    aria-label="Indicadores Descubre"
                  >
                    <StatChip
                      value={descubreSummary?.total}
                      label="nuevas"
                      loading={descubreSummaryLoading}
                    />
                    <StatChip
                      value={descubreSummary?.highRanking}
                      label="alta puntuación"
                      loading={descubreSummaryLoading}
                      highlight
                    />
                    <StatChip
                      value={descubreData?.fuentes_suscritas?.length ?? 0}
                      label="fuentes"
                      loading={!descubreData}
                    />
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground pt-1">
                    <Search className="h-4 w-4" />
                    <span>Ver mis oportunidades</span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          )}

          {isAplicaUser && userProfile.customer_id && (
            <Link href={`/dashboard/customers/${userProfile.customer_id}`}>
              <Card className="group hover:shadow-lg hover:border-accent/50 transition-all duration-300 cursor-pointer h-full">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <Image
                      src="/logo-bidtory-aplica-pos.svg"
                      alt="Bidtory Aplica"
                      width={120}
                      height={32}
                      className="h-7 w-auto"
                    />
                    <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-accent transition-colors" />
                  </div>
                  <CardDescription className="pt-2">
                    Su pipeline de licitaciones: análisis de pliegos, bitácora y seguimiento de propuestas.
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <div
                    className="grid grid-cols-3 gap-2 py-3 border-t border-border/50"
                    role="group"
                    aria-label="Indicadores Aplica"
                  >
                    <StatChip
                      value={aplicaSummary?.total}
                      label="activas"
                      loading={aplicaSummaryLoading}
                    />
                    <StatChip
                      value={aplicaSummary?.urgent}
                      label="próximas a vencer"
                      loading={aplicaSummaryLoading}
                      highlight
                    />
                    <StatChip
                      value={aplicaSummary?.overdue}
                      label="vencidas"
                      loading={aplicaSummaryLoading}
                      danger
                    />
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground pt-1">
                    <Briefcase className="h-4 w-4" />
                    <span>Ver mis licitaciones activas</span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          )}

          {tieneDescubre && !tieneAplica && (
            <Card className="border-dashed border-2 border-muted h-full">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <Image
                    src="/logo-bidtory-aplica-pos.svg"
                    alt="Bidtory Aplica"
                    width={120}
                    height={32}
                    className="h-7 w-auto opacity-50"
                  />
                  <Badge className="border-0 bg-popular text-popular-foreground text-[10px] font-semibold px-2">
                    Plan Profesional
                  </Badge>
                </div>
                <CardDescription className="pt-2">
                  Lleve sus oportunidades a un pipeline Kanban. Analice pliegos con IA y gestione propuestas en equipo.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Link href="/suscripciones">
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-popular/50 text-popular hover:bg-popular/10"
                  >
                    Conocer Aplica <ArrowRight className="ml-2 h-3 w-3" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    );
  }


  if (userProfile?.role === 'admin') {
    const totalActivos = adminCustomers.length;
    const conServicio = adminCustomers.filter((c) => c.bidtory_access?.granted === true).length;
    const autonomas = adminCustomers.filter((c) => c.bidtory_access?.granted !== true).length;
    const vencidas = adminCustomers.filter((c) => c.subscription?.subscription_state === 'vencido').length;

    const clientesConServicio = adminCustomers.filter((c) => c.bidtory_access?.granted === true);
    const clientesVencidos = adminCustomers.filter(
      (c) => c.subscription?.subscription_state === 'vencido' && c.bidtory_access?.granted !== true
    );

    const subscriptionBadge = (state: string | null | undefined) => {
      const map: Record<string, { label: string; className: string }> = {
        al_dia: { label: 'Al dia', className: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' },
        por_vencer: { label: 'Por vencer', className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' },
        vencido: { label: 'Vencido', className: 'bg-destructive/10 text-destructive' },
        prueba_gratuita: { label: 'Prueba', className: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' },
        sin_fecha: { label: 'Sin fecha', className: 'bg-muted text-muted-foreground' },
        inactivo: { label: 'Inactivo', className: 'bg-muted text-muted-foreground' },
        desconocido: { label: 'Sin datos', className: 'bg-muted text-muted-foreground' },
      };
      const entry = map[state ?? ''] ?? map.desconocido;
      return (
        <span className={cn('inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium', entry.className)}>
          {entry.label}
        </span>
      );
    };

    return (
      <div className="space-y-8">
        <Dialog open={isCreateZoneDialogOpen} onOpenChange={setIsCreateZoneDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Crear Nueva Zona de Cliente</DialogTitle>
              <DialogDescription>
                Complete los detalles para crear una nueva zona privada para un cliente.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-6 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Nombre del Cliente</Label>
                <Input id="name" value={newCustomerData.name} onChange={(e) => setNewCustomerData({ ...newCustomerData, name: e.target.value })} placeholder="Nombre de la empresa" className="bg-muted/50 border-secondary focus:border-accent focus:ring-accent" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="description">Descripción</Label>
                <Textarea id="description" value={newCustomerData.description} onChange={(e) => setNewCustomerData({ ...newCustomerData, description: e.target.value })} placeholder="Breve descripción del cliente." className="bg-muted/50 border-secondary focus:border-accent focus:ring-accent" />
              </div>
            </div>
            <DialogFooter>
              <DialogClose asChild><Button variant="outline">Cancelar</Button></DialogClose>
              <Button onClick={handleCreateCustomer} disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isSubmitting ? 'Creando...' : 'Crear Cliente'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-3xl font-headline tracking-tight">Panel Principal</h1>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link href="/dashboard/settings/users">
                <Users className="mr-2 h-4 w-4" /> Usuarios
              </Link>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link href="/dashboard/settings/bidtory-access">
                <Settings className="mr-2 h-4 w-4" /> Control de Acceso
              </Link>
            </Button>
            <Button size="sm" onClick={() => setIsCreateZoneDialogOpen(true)}>
              <PlusCircle className="mr-2 h-4 w-4" /> Crear Zona
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[
            { label: 'Empresas activas', value: totalActivos, icon: Building2, className: '' },
            { label: 'Con servicio activo', value: conServicio, icon: UserCheck, className: conServicio > 0 ? 'text-accent' : '' },
            { label: 'Autónomas', value: autonomas, icon: Users, className: '' },
            { label: 'Suscripción vencida', value: vencidas, icon: TrendingDown, className: vencidas > 0 ? 'text-destructive' : '' },
          ].map(({ label, value, icon: Icon, className }) => (
            <Card key={label} className="p-4">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs text-muted-foreground">{label}</span>
                <Icon className={cn('h-4 w-4 text-muted-foreground', className)} />
              </div>
              <p className={cn('font-headline text-2xl font-bold', className)}>{value}</p>
            </Card>
          ))}
        </div>

        {clientesConServicio.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Con servicio activo</h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {clientesConServicio.map((c) => (
                <Card key={c.id} className="flex flex-col transition-shadow duration-300 hover:shadow-lg">
                  <CardHeader className="flex flex-row items-start gap-4 space-y-0 pb-3">
                    <img
                      src={customerLogoImgSrc(c.logo_signed_url, `https://placehold.co/80x80.png?text=${c.name.charAt(0)}`)}
                      alt={`${c.name} logo`}
                      width={48}
                      height={48}
                      className="rounded-lg border object-cover"
                      referrerPolicy="no-referrer"
                    />
                    <div className="min-w-0 flex-1">
                      <CardTitle className="truncate text-base font-semibold">{c.name}</CardTitle>
                      <div className="mt-1 flex flex-wrap gap-1">
                        {c.subscription?.nivel_suscripcion && (
                          <span className="text-[11px] capitalize text-muted-foreground">{c.subscription.nivel_suscripcion}</span>
                        )}
                      </div>
                    </div>
                    {subscriptionBadge(c.subscription?.subscription_state)}
                  </CardHeader>
                  {c.bidtory_access?.granted_at && (
                    <CardContent className="pb-3 pt-0">
                      <p className="text-[11px] text-muted-foreground">
                        Acceso desde {new Date(c.bidtory_access.granted_at).toLocaleDateString('es-CO', { year: 'numeric', month: 'short', day: 'numeric' })}
                      </p>
                    </CardContent>
                  )}
                  <CardContent className="mt-auto pt-0">
                    <Link href={`/dashboard/customers/${c.id}`} passHref>
                      <Button variant="outline" size="sm" className="w-full">
                        Ver Zona <ArrowRight className="ml-2 h-3 w-3" />
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {clientesVencidos.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-destructive">Suscripción vencida</h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {clientesVencidos.map((c) => (
                <Card key={c.id} className="flex flex-col border-destructive/30">
                  <CardHeader className="flex flex-row items-start gap-4 space-y-0 pb-3">
                    <img
                      src={customerLogoImgSrc(c.logo_signed_url, `https://placehold.co/80x80.png?text=${c.name.charAt(0)}`)}
                      alt={`${c.name} logo`}
                      width={48}
                      height={48}
                      className="rounded-lg border object-cover opacity-60"
                      referrerPolicy="no-referrer"
                    />
                    <div className="min-w-0 flex-1">
                      <CardTitle className="truncate text-base font-semibold text-muted-foreground">{c.name}</CardTitle>
                      {c.subscription?.nivel_suscripcion && (
                        <span className="text-[11px] capitalize text-muted-foreground">{c.subscription.nivel_suscripcion}</span>
                      )}
                    </div>
                    {subscriptionBadge(c.subscription?.subscription_state)}
                  </CardHeader>
                  {c.subscription?.fecha_proximo_pago && (
                    <CardContent className="pb-3 pt-0">
                      <p className="text-[11px] text-muted-foreground">
                        Venció el {new Date(c.subscription.fecha_proximo_pago).toLocaleDateString('es-CO', { year: 'numeric', month: 'short', day: 'numeric' })}
                      </p>
                    </CardContent>
                  )}
                </Card>
              ))}
            </div>
          </div>
        )}

        {adminCustomers.length === 0 && (
          <Card className="py-12 text-center">
            <CardHeader>
              <Users className="mx-auto h-12 w-12 text-muted-foreground" />
              <CardTitle className="mt-4 text-2xl">Sin empresas registradas</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>Cree la primera zona privada para un cliente.</CardDescription>
              <Button className="mt-6" onClick={() => setIsCreateZoneDialogOpen(true)}>
                <PlusCircle className="mr-2 h-4 w-4" /> Crear Zona de Cliente
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  // Fallback for when user is not admin and not a redirectable customer
  return null;
}