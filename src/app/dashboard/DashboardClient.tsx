"use client";

import { useEffect, useState, useCallback } from 'react';
import Link from "next/link";
import Image from "next/image";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/auth-context";
import type { Customer } from "@/types";
import { Users, PlusCircle, ArrowRight, Loader2, AlertCircle } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import apiClient from '@/lib/api-client';

const isValidUrl = (url: string | undefined | null): boolean => {
  if (!url) return false;
  try {
    new URL(url);
    return true;
  } catch (_) {
    return false;
  }
};

export default function DashboardClient() {
  // ... (Todo el código de tu componente original va aquí: hooks, handlers, JSX) ...
  const { userProfile, getIdToken, loading: authLoading } = useAuth();
  const router = useRouter();
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
    if (!authLoading) {
      if (userProfile?.role === 'admin') {
        fetchCustomers();
      } else if (userProfile?.role === 'customer' && userProfile.customer_id) {
        router.replace(`/dashboard/customers/${userProfile.customer_id}`);
      } else {
        setLoading(false);
      }
    }
  }, [userProfile, authLoading, router, fetchCustomers]);

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


  if (authLoading || loading) {
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
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-theme(spacing.28))] text-center">
        <Users className="h-12 w-12 text-muted-foreground" />
        <h1 className="mt-4 text-2xl font-headline">¡Bienvenido!</h1>
        <p className="text-muted-foreground">Tu zona de cliente está siendo preparada. Por favor, contacta a un administrador.</p>
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
                      <Image 
                        src={isValidUrl(customer.logo_signed_url) ? customer.logo_signed_url! : `https://placehold.co/80x80.png?text=${customer.name.charAt(0)}`}
                        alt={`${customer.name} logo`}
                        width={60}
                        height={60}
                        className="rounded-lg border object-cover"
                        data-ai-hint="company logo"
                        key={customer.logo_signed_url}
                        unoptimized
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