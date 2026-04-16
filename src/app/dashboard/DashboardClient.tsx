"use client";

import { useEffect, useState, useCallback } from 'react';
import Image from "next/image";
import Link from "next/link";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/auth-context";
import type { Customer } from "@/types";
import { Users, PlusCircle, ArrowRight, Loader2, AlertCircle, Search, Briefcase } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from '@/hooks/use-toast';
import apiClient from '@/lib/api-client';
import { customerLogoImgSrc } from '@/lib/gcs-display';
import { cn } from '@/lib/utils';
import { useDescubre } from '@/contexts/descubre-context';

export default function DashboardClient() {
  const { userProfile, getIdToken, loading: authLoading } = useAuth();
  const { tieneDescubre, tieneAplica, loading: descubreLoading } = useDescubre();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { toast } = useToast();
  const [isCreateZoneDialogOpen, setIsCreateZoneDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newCustomerData, setNewCustomerData] = useState({ name: '', description: '' });

  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const data: any[] = await apiClient.get('/get_customers');
      
      const mappedCustomers: Customer[] = data.map(c => ({
        id: String(c.id),
        name: c.name,
        profileInfo: c.description,
        logoUrl: c.logo_url,
        logo_signed_url: c.logo_signed_url
      }));
      
      mappedCustomers.sort((a, b) => a.name.localeCompare(b.name));

      setCustomers(mappedCustomers);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Ocurrió un error desconocido.";
      setError(errorMessage);
      toast({ title: "Error", description: errorMessage, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [toast]);
  
  useEffect(() => {
    if (!authLoading && !descubreLoading) {
      if (userProfile?.role === 'admin') {
        fetchCustomers();
      } else {
        setLoading(false);
      }
    }
  }, [userProfile, authLoading, descubreLoading, fetchCustomers]);

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
        fetchCustomers();
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Ocurrió un error desconocido';
        toast({ title: 'Error al Crear', description: errorMessage, variant: 'destructive' });
    } finally {
        setIsSubmitting(false);
    }
  };


  if (authLoading || descubreLoading || loading) {
     return (
        <div className="flex items-center justify-center min-h-[calc(100vh-theme(spacing.28))]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="ml-4">Cargando el panel...</p>
        </div>
      );
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
    if (!tieneDescubre && !tieneAplica) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[calc(100vh-theme(spacing.28))] text-center">
          <Users className="h-12 w-12 text-muted-foreground" />
          <h1 className="mt-4 text-2xl font-headline">¡Bienvenido!</h1>
          <p className="text-muted-foreground">
            Tu zona de cliente está siendo preparada. Por favor, contacta a un administrador.
          </p>
        </div>
      );
    }

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
                    Convocatorias del SECOP II puntuadas por IA según el perfil de tu empresa.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Search className="h-4 w-4" />
                    <span>Ver mis oportunidades</span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          )}

          {tieneAplica && userProfile.customer_id && (
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
                    Tu pipeline de licitaciones: análisis de pliegos, bitácora y seguimiento de propuestas.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
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
                  Lleva tus oportunidades a un pipeline Kanban. Analiza pliegos con IA y gestiona propuestas en equipo.
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
      return (
        <div className="space-y-8">
          <Dialog open={isCreateZoneDialogOpen} onOpenChange={setIsCreateZoneDialogOpen}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Crear Nueva Zona de Cliente</DialogTitle>
                <DialogDescription>
                  Complete los detalles a continuación para crear una nueva zona privada para un cliente.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-6 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Nombre del Cliente</Label>
                  <Input id="name" value={newCustomerData.name} onChange={(e) => setNewCustomerData({...newCustomerData, name: e.target.value})} placeholder="Nombre de la empresa del cliente" className="bg-muted/50 border-secondary focus:border-accent focus:ring-accent" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="description">Descripción</Label>
                  <Textarea id="description" value={newCustomerData.description} onChange={(e) => setNewCustomerData({...newCustomerData, description: e.target.value})} placeholder="Una breve descripción del cliente." className="bg-muted/50 border-secondary focus:border-accent focus:ring-accent" />
                </div>
              </div>
              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="outline">Cancelar</Button>
                </DialogClose>
                <Button onClick={handleCreateCustomer} disabled={isSubmitting}>
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {isSubmitting ? 'Creando...' : 'Crear Cliente'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-headline tracking-tight">Zonas de Clientes</h1>
            <Button onClick={() => setIsCreateZoneDialogOpen(true)}>
              <PlusCircle className="mr-2 h-4 w-4" /> Crear Nueva Zona
            </Button>
          </div>

          {customers.length === 0 ? (
            <Card className="text-center py-12">
              <CardHeader>
                <Users className="mx-auto h-12 w-12 text-muted-foreground" />
                <CardTitle className="mt-4 text-2xl">No se encontraron Zonas de Clientes</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>Empieza creando una nueva zona privada para tu primer cliente.</CardDescription>
                <Button className="mt-6" onClick={() => setIsCreateZoneDialogOpen(true)}>
                  <PlusCircle className="mr-2 h-4 w-4" /> Crear Zona de Cliente
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {customers.map((customer: Customer) => {
                return (
                  <Card key={customer.id} className="flex flex-col hover:shadow-lg transition-shadow duration-300">
                    <CardHeader className="flex flex-row items-start gap-4 space-y-0 pb-4">
                      <img
                        src={customerLogoImgSrc(
                          customer.logo_signed_url,
                          `https://placehold.co/80x80.png?text=${customer.name.charAt(0)}`
                        )}
                        alt={`${customer.name} logo`}
                        width={60}
                        height={60}
                        className="rounded-lg border object-cover"
                        data-ai-hint="company logo"
                        key={customer.logo_signed_url}
                        referrerPolicy="no-referrer"
                      />
                      <div className="flex-1">
                        <CardTitle className="text-xl font-semibold">{customer.name}</CardTitle>
                        <CardDescription className="text-sm line-clamp-2">{customer.profileInfo}</CardDescription>
                      </div>
                    </CardHeader>
                    <CardContent className="flex-grow">
                    </CardContent>
                    <CardContent className="pt-0">
                      <Link href={`/dashboard/customers/${customer.id}`} passHref>
                        <Button variant="outline" className="w-full">
                          Ver Zona <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                      </Link>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      );
  }

  // Fallback for when user is not admin and not a redirectable customer
  return null;
}