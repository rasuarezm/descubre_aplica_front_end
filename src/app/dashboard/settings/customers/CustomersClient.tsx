"use client";

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/auth-context';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import type { Customer } from '@/types';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { MoreHorizontal, ArrowLeft, Building, Loader2, AlertCircle, Archive, ArchiveRestore } from 'lucide-react';
import apiClient from '@/lib/api-client';
import { customerLogoImgSrc } from '@/lib/gcs-display';

type ViewMode = 'active' | 'archived';

export default function CustomersClient() {
    // ... (Todo el código de tu componente original va aquí: hooks, handlers, JSX) ...
    const { userProfile, loading: authLoading } = useAuth();
    const router = useRouter();
    const { toast } = useToast();

    const [customers, setCustomers] = useState<Customer[]>([]);
    const [viewMode, setViewMode] = useState<ViewMode>('active');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [customerToArchive, setCustomerToArchive] = useState<Customer | null>(null);
    const [isArchiving, setIsArchiving] = useState(false);
    
    const [customerToRestore, setCustomerToRestore] = useState<Customer | null>(null);
    const [isRestoring, setIsRestoring] = useState(false);

    const fetchData = useCallback(async (mode: ViewMode) => {
        setLoading(true);
        setError(null);
        
        try {
            const params = new URLSearchParams();
            if (mode === 'archived') {
                params.append('show_archived', 'true');
            }
            
            const data: Customer[] = await apiClient.get<Customer[]>(`/get_customers?${params.toString()}`);
            
            setCustomers(data);

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
            if (userProfile?.role !== 'admin') {
                toast({ title: "Acceso Denegado", description: "No tienes permiso para ver esta página.", variant: "destructive" });
                router.replace('/dashboard');
            } else {
                fetchData(viewMode);
            }
        }
    }, [authLoading, userProfile, router, toast, fetchData, viewMode]);

    const handleArchiveStateChange = async (customer: Customer, archive: boolean) => {
        const isArchivingAction = archive;
        if (isArchivingAction) setIsArchiving(true); else setIsRestoring(true);

        try {
            await apiClient.patch('/archive_customer', { id: customer.id, is_archived: archive });
            
            toast({ title: `Cliente ${archive ? 'archivado' : 'restaurado'} correctamente` });
            await fetchData(viewMode);

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Ocurrió un error desconocido.';
            toast({ title: `Error al ${archive ? 'Archivar' : 'Restaurar'}`, description: errorMessage, variant: 'destructive' });
        } finally {
            if (isArchivingAction) {
                setIsArchiving(false);
                setCustomerToArchive(null);
            } else {
                setIsRestoring(false);
                setCustomerToRestore(null);
            }
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

    return (
        <div className="space-y-6">
            <div>
                <Link href="/dashboard/settings" className="inline-flex items-center text-sm text-accent hover:underline mb-2">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Volver a Configuración
                </Link>
                <h1 className="text-3xl font-headline tracking-tight">Gestión de Clientes</h1>
                <p className="text-muted-foreground">Archiva o restaura clientes para gestionar su visibilidad en el portal.</p>
            </div>

            <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as ViewMode)} className="w-full">
                <TabsList>
                    <TabsTrigger value="active">Clientes Activos</TabsTrigger>
                    <TabsTrigger value="archived">Clientes Archivados</TabsTrigger>
                </TabsList>
                <TabsContent value="active">
                    <CustomerTable
                        customers={customers}
                        isLoading={loading}
                        error={error}
                        onActionClick={setCustomerToArchive}
                        actionLabel="Archivar Cliente"
                        actionIcon={Archive}
                        isRestore={false}
                    />
                </TabsContent>
                <TabsContent value="archived">
                    <CustomerTable
                        customers={customers}
                        isLoading={loading}
                        error={error}
                        onActionClick={setCustomerToRestore}
                        actionLabel="Restaurar Cliente"
                        actionIcon={ArchiveRestore}
                        isRestore={true}
                    />
                </TabsContent>
            </Tabs>
            
             <AlertDialog open={!!customerToArchive} onOpenChange={(isOpen) => !isOpen && setCustomerToArchive(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>¿Está seguro?</AlertDialogTitle>
                        <AlertDialogDescription>
                            ¿Seguro que quieres archivar a "{customerToArchive?.name}"? Ya no será visible en las vistas principales, pero se podrá restaurar más tarde.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isArchiving}>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleArchiveStateChange(customerToArchive!, true)} disabled={isArchiving} className="bg-destructive hover:bg-destructive/90">
                            {isArchiving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {isArchiving ? 'Archivando...' : 'Archivar'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
            
            <AlertDialog open={!!customerToRestore} onOpenChange={(isOpen) => !isOpen && setCustomerToRestore(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Restaurar Cliente</AlertDialogTitle>
                        <AlertDialogDescription>
                            ¿Desea restaurar al cliente "{customerToRestore?.name}" a la lista de clientes activos?
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isRestoring}>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleArchiveStateChange(customerToRestore!, false)} disabled={isRestoring}>
                            {isRestoring && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {isRestoring ? 'Restaurando...' : 'Restaurar'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}

interface CustomerTableProps {
    customers: Customer[];
    isLoading: boolean;
    error: string | null;
    onActionClick: (customer: Customer) => void;
    actionLabel: string;
    actionIcon: React.ElementType;
    isRestore: boolean;
}

function CustomerTable({ customers, isLoading, error, onActionClick, actionLabel, actionIcon: ActionIcon, isRestore }: CustomerTableProps) {
    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-10">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                <p className="ml-3">Cargando clientes...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center py-10 text-center">
                <AlertCircle className="h-8 w-8 text-destructive" />
                <p className="mt-3 font-semibold">Error al cargar los clientes</p>
                <p className="text-muted-foreground text-sm">{error}</p>
            </div>
        );
    }
    
    return (
        <Card>
            <CardContent className="pt-6">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[100px]">Logo</TableHead>
                            <TableHead>Nombre</TableHead>
                            <TableHead>Descripción</TableHead>
                            <TableHead><span className="sr-only">Acciones</span></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {customers.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={4} className="h-24 text-center">
                                    No se encontraron clientes en esta vista.
                                </TableCell>
                            </TableRow>
                        ) : (
                            customers.map((customer) => (
                                <TableRow key={customer.id}>
                                    <TableCell>
                                        <img
                                            src={customerLogoImgSrc(
                                              customer.logo_signed_url,
                                              `https://placehold.co/80x80.png?text=${customer.name.charAt(0)}`
                                            )}
                                            alt={`${customer.name} logo`}
                                            width={40}
                                            height={40}
                                            className="rounded-md border object-cover"
                                            key={customer.logo_signed_url}
                                            referrerPolicy="no-referrer"
                                        />
                                    </TableCell>
                                    <TableCell className="font-medium">{customer.name}</TableCell>
                                    <TableCell>{customer.profileInfo}</TableCell>
                                    <TableCell>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button aria-haspopup="true" size="icon" variant="ghost">
                                                    <MoreHorizontal className="h-4 w-4" />
                                                    <span className="sr-only">Toggle menu</span>
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem onSelect={() => onActionClick(customer)}>
                                                    <ActionIcon className="mr-2 h-4 w-4" />
                                                    {actionLabel}
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}