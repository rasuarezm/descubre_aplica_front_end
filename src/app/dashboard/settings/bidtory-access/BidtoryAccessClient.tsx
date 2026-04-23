"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/auth-context";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import type { Customer } from "@/types";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  ShieldCheck,
  ShieldOff,
  Loader2,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import apiClient from "@/lib/api-client";

export default function BidtoryAccessClient() {
  const { userProfile, loading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showGrantDialog, setShowGrantDialog] = useState(false);
  const [showRevokeDialog, setShowRevokeDialog] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRequestingService, setIsRequestingService] = useState(false);
  const [serviceRequestStatus, setServiceRequestStatus] = useState<
    "idle" | "created" | "already_pending"
  >("idle");
  const [showGrantCreateDialog, setShowGrantCreateDialog] = useState(false);
  const [showRevokeCreateDialog, setShowRevokeCreateDialog] = useState(false);

  const fetchData = useCallback(async () => {
    const cid = userProfile?.customer_id;
    if (!cid) return;
    setLoading(true);
    setError(null);
    try {
      const data = await apiClient.get<Customer[]>("/get_customers");
      const mine = data.find((c) => c.id === cid) ?? null;
      setCustomer(mine);
      if (!mine) {
        setError("No se encontró la información de su cuenta.");
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Ocurrió un error desconocido.";
      setError(errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [userProfile?.customer_id, toast]);

  useEffect(() => {
    if (authLoading) return;
    if (!userProfile) {
      router.replace("/dashboard");
      return;
    }
    if (
      userProfile.role !== "customer" ||
      userProfile.customer_role !== "administrador_cliente"
    ) {
      toast({
        title: "Acceso denegado",
        description: "No tiene permiso para ver esta página.",
        variant: "destructive",
      });
      router.replace("/dashboard");
      return;
    }
    if (!userProfile.customer_id) {
      toast({
        title: "Acceso denegado",
        description: "No tiene permiso para ver esta página.",
        variant: "destructive",
      });
      router.replace("/dashboard");
      return;
    }
    void fetchData();
  }, [authLoading, userProfile, router, toast, fetchData]);

  const handleGrant = async () => {
    const cid = userProfile?.customer_id;
    if (!cid) return;
    setIsSubmitting(true);
    try {
      await apiClient.post("/grant_bidtory_access", {
        customer_id: cid,
        level: "account",
      });
      toast({ title: "Acceso concedido correctamente" });
      await fetchData();
      setShowGrantDialog(false);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Ocurrió un error desconocido.";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRevoke = async () => {
    const cid = userProfile?.customer_id;
    if (!cid) return;
    setIsSubmitting(true);
    try {
      await apiClient.post("/revoke_bidtory_access", {
        customer_id: cid,
        level: "account",
      });
      toast({ title: "Acceso revocado correctamente" });
      await fetchData();
      setShowRevokeDialog(false);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Ocurrió un error desconocido.";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const granted = customer?.bidtory_access?.granted === true;
  const serviceEnabled = customer?.bidtory_service_enabled === true;
  const canCreateOpportunities =
    customer?.bidtory_access?.can_create_opportunities === true;

  const handleGrantCreateOpportunities = async () => {
    const cid = userProfile?.customer_id;
    if (!cid) return;
    setIsSubmitting(true);
    try {
      await apiClient.post("/grant_bidtory_access", {
        customer_id: cid,
        level: "create_opportunities",
      });
      toast({ title: "Permiso de creación concedido correctamente" });
      await fetchData();
      setShowGrantCreateDialog(false);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Ocurrió un error desconocido.";
      toast({ title: "Error", description: errorMessage, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRevokeCreateOpportunities = async () => {
    const cid = userProfile?.customer_id;
    if (!cid) return;
    setIsSubmitting(true);
    try {
      await apiClient.post("/revoke_bidtory_access", {
        customer_id: cid,
        level: "create_opportunities",
      });
      toast({ title: "Permiso de creación revocado correctamente" });
      await fetchData();
      setShowRevokeCreateDialog(false);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Ocurrió un error desconocido.";
      toast({ title: "Error", description: errorMessage, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRequestService = async () => {
    setIsRequestingService(true);
    try {
      const result = await apiClient.post<{ status: string }>(
        "/request_bidtory_service",
        {},
      );
      if (result.status === "already_pending") {
        setServiceRequestStatus("already_pending");
      } else {
        setServiceRequestStatus("created");
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Ocurrió un error desconocido.";
      toast({ title: "Error", description: msg, variant: "destructive" });
    } finally {
      setIsRequestingService(false);
    }
  };

  if (authLoading || (!userProfile && !error && loading)) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-theme(spacing.28))]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-4">Verificando permisos...</p>
      </div>
    );
  }

  const allowed =
    userProfile?.role === "customer" &&
    userProfile?.customer_role === "administrador_cliente" &&
    !!userProfile?.customer_id;

  if (!allowed) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-theme(spacing.28))]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-4">Verificando permisos...</p>
      </div>
    );
  }

  if (loading && !customer && !error) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-theme(spacing.28))]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-4">Cargando...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/dashboard/settings"
          className="inline-flex items-center text-sm text-accent hover:underline mb-2"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver a Configuración
        </Link>
        <h1 className="text-3xl font-headline tracking-tight">Acceso Bidtory</h1>
      </div>

      {error && (
        <Card className="border-destructive/50">
          <CardContent className="flex items-center gap-3 pt-6">
            <AlertCircle className="h-5 w-5 text-destructive shrink-0" />
            <p className="text-sm text-destructive">{error}</p>
          </CardContent>
        </Card>
      )}

      {!serviceEnabled ? (
        <Card>
          <CardHeader>
            <CardTitle>Servicio Bidtory</CardTitle>
            <CardDescription>
              Gestione el acceso del equipo Bidtory a su zona.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Badge variant="secondary" className="gap-1.5 px-3 py-1">
              <ShieldOff className="h-3.5 w-3.5" />
              Servicio no activado
            </Badge>
            <p className="text-sm text-muted-foreground">
              ¿Quiere que el equipo de Bidtory le ayude a preparar y dar seguimiento a sus
              licitaciones y propuestas? Solicite información sobre el servicio;
              le contactaremos para concretar el alcance.
            </p>
            {serviceRequestStatus === "idle" && (
              <Button
                variant="default"
                disabled={isRequestingService || !!error || !customer}
                onClick={() => void handleRequestService()}
              >
                {isRequestingService ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  "Solicitar información"
                )}
              </Button>
            )}
            {serviceRequestStatus === "created" && (
              <div className="flex items-center gap-2 text-sm text-emerald-600">
                <CheckCircle2 className="h-4 w-4" />
                Solicitud enviada. Le contactaremos a la brevedad.
              </div>
            )}
            {serviceRequestStatus === "already_pending" && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <CheckCircle2 className="h-4 w-4" />
                Ya existe una solicitud en proceso. Le contactaremos pronto.
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Estado del acceso</CardTitle>
            <CardDescription>
              {granted
                ? "Permiso de acceso a nivel cuenta para el equipo de Bidtory."
                : "El servicio para su cuenta ya está activo; el acceso del equipo queda a su decisión."}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {granted ? (
              <Badge
                variant="secondary"
                className="border-transparent bg-emerald-600 text-white hover:bg-emerald-600 gap-1.5 px-3 py-1"
              >
                <CheckCircle2 className="h-3.5 w-3.5" />
                Acceso concedido
              </Badge>
            ) : (
              <Badge variant="secondary" className="gap-1.5 px-3 py-1">
                <ShieldOff className="h-3.5 w-3.5" />
                Acceso aún no concedido
              </Badge>
            )}

            <p className="text-sm text-muted-foreground">
              {granted
                ? "El equipo de Bidtory tiene acceso a su zona. Pueden ver sus oportunidades y documentos para brindarle soporte."
                : "Tras su solicitud, Bidtory habilitó el servicio para su empresa. Cuando desee que nuestro equipo le apoye de forma directa en su zona, conceda el acceso a nivel cuenta; hasta entonces, solo usted y sus usuarios ven la información. Podrá revocar el permiso en cualquier momento."}
            </p>

            {granted ? (
              <Button
                variant="destructive"
                onClick={() => setShowRevokeDialog(true)}
                disabled={!!error || !customer}
              >
                <ShieldOff className="mr-2 h-4 w-4" />
                Revocar Acceso
              </Button>
            ) : (
              <Button
                variant="default"
                onClick={() => setShowGrantDialog(true)}
                disabled={!!error || !customer}
              >
                <ShieldCheck className="mr-2 h-4 w-4" />
                Conceder Acceso
              </Button>
            )}

            <p className="text-xs text-muted-foreground">
              Aplican condiciones de negociación acordadas entre las partes.
            </p>
          </CardContent>
        </Card>
      )}

      {serviceEnabled && (
        <Card>
          <CardHeader>
            <CardTitle>Creación de oportunidades</CardTitle>
            <CardDescription>
              Autorice al equipo de Bidtory a agregar oportunidades directamente en su zona.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {canCreateOpportunities ? (
              <Badge
                variant="secondary"
                className="border-transparent bg-emerald-600 text-white hover:bg-emerald-600 gap-1.5 px-3 py-1"
              >
                <CheckCircle2 className="h-3.5 w-3.5" />
                Permiso de creación activo
              </Badge>
            ) : (
              <Badge variant="secondary" className="gap-1.5 px-3 py-1">
                <ShieldOff className="h-3.5 w-3.5" />
                Permiso de creación no concedido
              </Badge>
            )}
            <p className="text-sm text-muted-foreground">
              {canCreateOpportunities
                ? "Bidtory puede agregar licitaciones a su pipeline. Podrá revocar este permiso en cualquier momento; las oportunidades ya creadas permanecerán."
                : "Si lo desea, puede autorizar a Bidtory a agregar licitaciones directamente a su zona. Cada oportunidad creada quedará visible para su equipo de inmediato."}
            </p>
            {canCreateOpportunities ? (
              <Button
                variant="destructive"
                onClick={() => setShowRevokeCreateDialog(true)}
                disabled={!!error || !customer}
              >
                <ShieldOff className="mr-2 h-4 w-4" />
                Revocar Permiso de Creación
              </Button>
            ) : (
              <Button
                variant="default"
                onClick={() => setShowGrantCreateDialog(true)}
                disabled={!!error || !customer}
              >
                <ShieldCheck className="mr-2 h-4 w-4" />
                Autorizar Creación de Oportunidades
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      <AlertDialog open={showGrantDialog} onOpenChange={setShowGrantDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Conceder acceso a Bidtory?</AlertDialogTitle>
            <AlertDialogDescription>
              El equipo de Bidtory podrá ver sus oportunidades, documentos y
              análisis. Esto les permite brindarle soporte personalizado. Usted
              puede revocar este acceso en cualquier momento.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting}>Cancelar</AlertDialogCancel>
            <Button
              type="button"
              disabled={isSubmitting}
              onClick={() => void handleGrant()}
            >
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Conceder Acceso"
              )}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showGrantCreateDialog} onOpenChange={setShowGrantCreateDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Autorizar a Bidtory a crear oportunidades?</AlertDialogTitle>
            <AlertDialogDescription>
              El equipo de Bidtory podrá agregar licitaciones directamente a su zona.
              Usted podrá revocar este permiso en cualquier momento; las oportunidades
              ya creadas no se eliminarán.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting}>Cancelar</AlertDialogCancel>
            <Button
              type="button"
              disabled={isSubmitting}
              onClick={() => void handleGrantCreateOpportunities()}
            >
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Autorizar"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showRevokeCreateDialog} onOpenChange={setShowRevokeCreateDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Revocar permiso de creación?</AlertDialogTitle>
            <AlertDialogDescription>
              Bidtory dejará de poder agregar oportunidades a su zona. Las oportunidades
              ya creadas permanecerán en su pipeline.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting}>Cancelar</AlertDialogCancel>
            <Button
              type="button"
              variant="destructive"
              disabled={isSubmitting}
              onClick={() => void handleRevokeCreateOpportunities()}
              className="bg-destructive hover:bg-destructive/90"
            >
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Revocar Permiso"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showRevokeDialog} onOpenChange={setShowRevokeDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Revocar acceso a Bidtory?</AlertDialogTitle>
            <AlertDialogDescription>
              El equipo de Bidtory perderá acceso a su zona de forma inmediata.
              Si necesita soporte en el futuro, deberá volver a conceder el
              acceso.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting}>Cancelar</AlertDialogCancel>
            <Button
              type="button"
              variant="destructive"
              disabled={isSubmitting}
              onClick={() => void handleRevoke()}
              className="bg-destructive hover:bg-destructive/90"
            >
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Revocar Acceso"
              )}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
