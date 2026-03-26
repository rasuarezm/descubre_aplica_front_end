"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, UserCircle, Building, Bell } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";

export default function SettingsClient() {
  const { userProfile } = useAuth();

  const canManageUsers = userProfile?.role === 'admin' || userProfile?.customer_role === 'administrador_cliente';
  const isAdmin = userProfile?.role === 'admin';

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-headline tracking-tight">Configuración</h1>
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className="hover:border-accent transition-colors">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserCircle className="h-6 w-6 text-accent" />
              Mi Perfil
            </CardTitle>
            <CardDescription>
              Actualiza tu nombre, foto de perfil y otros datos personales.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/dashboard/settings/profile" passHref>
              <Button variant="outline">
                Gestionar Perfil <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>
        
        <Card className="hover:border-accent transition-colors">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-6 w-6 text-accent" />
              Notificaciones
            </CardTitle>
            <CardDescription>
              Gestiona cómo y cuándo recibes notificaciones por correo electrónico sobre tus oportunidades.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/dashboard/settings/notifications" passHref>
              <Button variant="outline">
                Gestionar Notificaciones <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>

        {canManageUsers && (
          <Card className="hover:border-accent transition-colors">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-6 w-6 text-accent" />
                Gestión de Usuarios
              </CardTitle>
              <CardDescription>
                Invita nuevos usuarios, visualiza los existentes y administra sus roles y permisos de acceso.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/dashboard/settings/users" passHref>
                <Button variant="outline">
                  Gestionar Usuarios <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}
        
        {isAdmin && (
            <Card className="hover:border-accent transition-colors">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                <Building className="h-6 w-6 text-accent" />
                Gestión de Clientes
                </CardTitle>
                <CardDescription>
                Archiva clientes antiguos o restaura clientes archivados para gestionar su visibilidad en el portal.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Link href="/dashboard/settings/customers" passHref>
                <Button variant="outline">
                    Gestionar Clientes <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
                </Link>
            </CardContent>
            </Card>
        )}
      </div>
    </div>
  );
}