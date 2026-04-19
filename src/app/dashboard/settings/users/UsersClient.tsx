"use client";

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Loader2, AlertCircle, Users, ArrowLeft, Edit, PlusCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { UserManagementProfile, Customer, CustomerRole } from '@/types';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import Link from 'next/link';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogClose, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import apiClient from '@/lib/api-client';

const customerRoles: { value: CustomerRole, label: string }[] = [
    { value: 'lector', label: 'Lector' },
    { value: 'colaborador', label: 'Colaborador' },
    { value: 'administrador_cliente', label: 'Administrador Cliente' },
];

export default function UsersClient() {
    const { userProfile, loading: authLoading } = useAuth();
    const router = useRouter();
    const { toast } = useToast();

    const [users, setUsers] = useState<UserManagementProfile[]>([]);
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    
    const [editingUser, setEditingUser] = useState<UserManagementProfile | null>(null);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
    const [isCreatingUser, setIsCreatingUser] = useState(false);
    const [newUser, setNewUser] = useState({
        email: '',
        password: '',
        confirmPassword: '',
        displayName: '',
        customer_id: '',
    });

    const fetchData = useCallback(async () => {
        setLoading(true);
        setError(null);

        try {
        const [usersData, customersData] = await Promise.all([
            apiClient.get<UserManagementProfile[]>('/get_users'),
            apiClient.get<Customer[]>('/get_customers')
        ]);

        usersData.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        customersData.sort((a,b) => a.name.localeCompare(b.name));

        setUsers(usersData);
        setCustomers(customersData);

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
            toast({ title: "Acceso denegado", description: "No tiene permiso para ver esta página.", variant: "destructive" });
            router.replace('/dashboard');
        } else {
            fetchData();
        }
        }
    }, [authLoading, userProfile, router, toast, fetchData]);
    
    const handleEditClick = (user: UserManagementProfile) => {
        setEditingUser(JSON.parse(JSON.stringify(user)));
        setIsEditDialogOpen(true);
    };
    
    const handleUpdateUser = async () => {
        if (!editingUser) return;
        
        setIsSubmitting(true);
        
        const payload: {
            uid: string;
            role: 'admin' | 'customer';
            customer_id: string | null;
            customer_role?: CustomerRole | null;
        } = {
        uid: editingUser.uid,
        role: editingUser.role,
        customer_id: editingUser.role === 'admin' ? null : editingUser.customer_id,
        customer_role: editingUser.role === 'customer' ? (editingUser.customer_role || 'colaborador') : null,
        };

        try {
        await apiClient.patch('/admin_update_user_profile', payload);

        toast({ title: "Éxito", description: "El perfil del usuario ha sido actualizado." });
        setIsEditDialogOpen(false);
        setEditingUser(null);
        await fetchData();
        } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Ocurrió un error desconocido.";
        toast({ title: "Error al Actualizar", description: errorMessage, variant: "destructive" });
        } finally {
        setIsSubmitting(false);
        }
    };
    
    const handleCreateUser = async () => {
        const emailRegex = /^\S+@\S+\.\S+$/;
        if (!emailRegex.test(newUser.email)) {
            toast({ title: "Error", description: "Por favor, introduzca un correo electrónico válido.", variant: "destructive" });
            return;
        }
        if (newUser.password !== newUser.confirmPassword) {
        toast({ title: "Error", description: "Las contraseñas no coinciden.", variant: "destructive" });
        return;
        }
        if (newUser.password.length < 6) {
        toast({ title: "Error", description: "La contraseña debe tener al menos 6 caracteres.", variant: "destructive" });
        return;
        }
        if (!newUser.customer_id) {
            toast({ title: "Error", description: "Debe seleccionar un cliente.", variant: "destructive" });
            return;
        }

        setIsCreatingUser(true);

        const payload = {
        email: newUser.email,
        password: newUser.password,
        displayName: newUser.displayName,
        customer_id: newUser.customer_id,
        };

        try {
        await apiClient.post('/admin_create_user', payload);
        
        toast({ title: "Éxito", description: `Usuario ${newUser.email} creado correctamente.` });
        setIsCreateDialogOpen(false);
        setNewUser({ email: '', password: '', confirmPassword: '', displayName: '', customer_id: '' });
        await fetchData();

        } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Ocurrió un error desconocido.";
        if (error instanceof Error && (error as any).status === 409) {
            toast({ title: "Error al Crear Usuario", description: "Error: El correo electrónico proporcionado ya está en uso. Por favor, utilice otro.", variant: "destructive" });
        } else {
            toast({ title: "Error al Crear Usuario", description: errorMessage, variant: "destructive" });
        }
        } finally {
        setIsCreatingUser(false);
        }
    };

    const getRoleVariant = (role: string) => {
        switch(role) {
        case 'admin': return 'destructive';
        case 'customer': return 'secondary';
        default: return 'outline';
        }
    };
    
    const handleNewUserChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setNewUser({ ...newUser, [e.target.name]: e.target.value });
    };
    
    const capitalizeFirstLetter = (string: string) => {
        if (!string) return '';
        return string.charAt(0).toUpperCase() + string.slice(1);
    }

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
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
            <Link href="/dashboard/settings" className="inline-flex items-center text-sm text-accent hover:underline mb-2">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Volver a Configuración
            </Link>
            <h1 className="text-3xl font-headline tracking-tight">Gestión de Usuarios</h1>
            <p className="text-muted-foreground">Crea, visualiza y administra los usuarios del sistema.</p>
            </div>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
                <Button>
                <PlusCircle className="mr-2 h-4 w-4" /> Crear Usuario
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                <DialogTitle>Crear Nuevo Usuario</DialogTitle>
                <DialogDescription>
                    Complete los detalles para crear una nueva cuenta. Se le asignará el rol de "cliente" por defecto.
                </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                    <Label htmlFor="displayName">Nombre (Opcional)</Label>
                    <Input id="displayName" name="displayName" value={newUser.displayName} onChange={handleNewUserChange} placeholder="John Doe" />
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="customer-create-select">Cliente <span className="text-destructive">*</span></Label>
                    <Select
                        value={newUser.customer_id}
                        onValueChange={(value) => setNewUser({ ...newUser, customer_id: value })}
                    >
                        <SelectTrigger id="customer-create-select">
                            <SelectValue placeholder="Seleccionar cliente" />
                        </SelectTrigger>
                        <SelectContent>
                            {customers
                                .filter((c) => !c.is_archived)
                                .map((customer) => (
                                    <SelectItem key={customer.id} value={String(customer.id)}>
                                        {customer.name}
                                    </SelectItem>
                                ))}
                        </SelectContent>
                    </Select>
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" name="email" type="text" value={newUser.email} onChange={handleNewUserChange} placeholder="john.doe@example.com" required />
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="password">Contraseña</Label>
                    <Input id="password" name="password" type="password" value={newUser.password} onChange={handleNewUserChange} required />
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="confirmPassword">Confirmar Contraseña</Label>
                    <Input id="confirmPassword" name="confirmPassword" type="password" value={newUser.confirmPassword} onChange={handleNewUserChange} required />
                </div>
                </div>
                <DialogFooter>
                <DialogClose asChild>
                    <Button variant="outline" disabled={isCreatingUser}>Cancelar</Button>
                </DialogClose>
                <Button onClick={handleCreateUser} disabled={isCreatingUser || !newUser.email || !newUser.password || newUser.password !== newUser.confirmPassword || !newUser.customer_id}>
                    {isCreatingUser && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Crear
                </Button>
                </DialogFooter>
            </DialogContent>
            </Dialog>
        </div>
        
        <Card>
            <CardHeader>
            <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Todos los Usuarios
            </CardTitle>
            <CardDescription>
                Lista de todas las cuentas registradas en el portal.
            </CardDescription>
            </CardHeader>
            <CardContent>
            {loading ? (
                <div className="flex items-center justify-center py-10">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                <p className="ml-3">Cargando usuarios...</p>
                </div>
            ) : error ? (
                <div className="flex flex-col items-center justify-center py-10 text-center">
                <AlertCircle className="h-8 w-8 text-destructive" />
                <p className="mt-3 font-semibold">Error al cargar los usuarios</p>
                <p className="text-muted-foreground text-sm">{error}</p>
                <Button variant="outline" size="sm" onClick={fetchData} className="mt-4">
                    Reintentar
                </Button>
                </div>
            ) : (
                <div className="overflow-x-auto">
                <Table>
                    <TableHeader>
                    <TableRow>
                        <TableHead>Email</TableHead>
                        <TableHead>Rol Global</TableHead>
                        <TableHead>Cliente Asignado</TableHead>
                        <TableHead>Rol de Cliente</TableHead>
                        <TableHead>Fecha de Creación</TableHead>
                        <TableHead>Acciones</TableHead>
                    </TableRow>
                    </TableHeader>
                    <TableBody>
                    {users.length === 0 ? (
                        <TableRow>
                        <TableCell colSpan={6} className="text-center h-24">
                            No se encontraron usuarios.
                        </TableCell>
                        </TableRow>
                    ) : (
                        users.map((user) => (
                        <TableRow key={user.uid}>
                            <TableCell className="font-medium">{user.email}</TableCell>
                            <TableCell>
                            <Badge variant={getRoleVariant(user.role)} className="capitalize">
                                {user.role}
                            </Badge>
                            </TableCell>
                            <TableCell>
                            {user.customer_id ? (customers.find(c => String(c.id) === String(user.customer_id))?.name || user.customer_id) : 'N/A'}
                            </TableCell>
                            <TableCell>
                            {user.role === 'customer' ? (
                                capitalizeFirstLetter(user.customer_role?.replace('_', ' ') || 'Colaborador')
                            ) : 'N/A'}
                            </TableCell>
                            <TableCell>
                            {format(new Date(user.created_at), "dd MMM, yyyy 'a las' HH:mm", { locale: es })}
                            </TableCell>
                            <TableCell>
                            <Button variant="outline" size="sm" onClick={() => handleEditClick(user)}>
                                <Edit className="mr-2 h-3 w-3" />
                                Editar
                            </Button>
                            </TableCell>
                        </TableRow>
                        ))
                    )}
                    </TableBody>
                </Table>
                </div>
            )}
            </CardContent>
        </Card>
        
        {editingUser && (
            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Editar Usuario</DialogTitle>
                        <DialogDescription>
                            Modifica el rol y la asignación del cliente para el usuario {editingUser.email}.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label>Email</Label>
                            <Input value={editingUser.email} disabled />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="role-select">Rol Global</Label>
                            <Select 
                                value={editingUser.role} 
                                onValueChange={(value) => setEditingUser(prev => prev ? {...prev, role: value as 'admin' | 'customer', customer_id: value === 'admin' ? null : prev.customer_id} : null)}
                                name="role-select"
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Seleccionar un rol" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="admin">Admin</SelectItem>
                                    <SelectItem value="customer">Customer</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        {editingUser.role === 'customer' && (
                            <>
                                <div className="grid gap-2">
                                    <Label htmlFor="customer-select">Cliente Asignado</Label>
                                    <Select
                                        value={editingUser.customer_id || 'unassigned'}
                                        onValueChange={(value) => setEditingUser(prev => prev ? {...prev, customer_id: value === 'unassigned' ? null : value} : null)}
                                        disabled={editingUser.role === 'admin'}
                                        name="customer-select"
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Seleccionar un cliente" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="unassigned">No Asignado</SelectItem>
                                            {customers.map(customer => (
                                                <SelectItem key={customer.id} value={String(customer.id)}>
                                                    {customer.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="customer-role-select">Rol de Cliente</Label>
                                    <Select
                                        value={editingUser.customer_role || 'colaborador'}
                                        onValueChange={(value) => setEditingUser(prev => prev ? {...prev, customer_role: value as CustomerRole} : null)}
                                        name="customer-role-select"
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Seleccionar rol de cliente" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {customerRoles.map(role => (
                                                <SelectItem key={role.value} value={role.value}>
                                                    {role.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </>
                        )}
                    </div>
                    <DialogFooter>
                        <DialogClose asChild>
                            <Button variant="outline" disabled={isSubmitting}>Cancelar</Button>
                        </DialogClose>
                        <Button onClick={handleUpdateUser} disabled={isSubmitting}>
                            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Guardar Cambios
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        )}
        </div>
    );
}