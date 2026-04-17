"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/auth-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { ArrowLeft, Loader2, Bell, AlertTriangle, Clock, CalendarCheck2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { NotificationPreferences } from '@/types';
import { Skeleton } from '@/components/ui/skeleton';
import apiClient from '@/lib/api-client';

type PreferenceKey = keyof NotificationPreferences;

export default function NotificationsClient() {
    const { userProfile, refreshUserProfile, loading: authLoading } = useAuth();
    const { toast } = useToast();
    const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);
    const [isUpdating, setIsUpdating] = useState<PreferenceKey | null>(null);

    useEffect(() => {
        if (userProfile?.notification_preferences) {
            setPreferences(userProfile.notification_preferences);
        } else if (!authLoading) {
            setPreferences({
                deadline_urgent: { email: true },
                deadline_proximate: { email: true },
                deadline_last_day: { email: true },
            });
        }
    }, [userProfile, authLoading]);

    const handlePreferenceChange = async (key: PreferenceKey, enabled: boolean) => {
        setIsUpdating(key);
        try {
            const payload = { [key]: { email: enabled } };
            await apiClient.patch('/update_notification_preferences', payload);
            await refreshUserProfile();
            toast({ title: "Preferencia actualizada" });
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "Ocurrió un error desconocido.";
            toast({ title: "Error al guardar", description: errorMessage, variant: "destructive" });
        } finally {
            setIsUpdating(null);
        }
    };
    
    const notificationSettings = [
        {
            key: 'deadline_urgent' as PreferenceKey,
            icon: AlertTriangle,
            title: 'Alertas de Vencimiento Urgente',
            description: 'Recibir un correo cuando una oportunidad vence en menos de 8 días.',
        },
        {
            key: 'deadline_proximate' as PreferenceKey,
            icon: Clock,
            title: 'Alertas de Vencimiento Próximo',
            description: 'Recibir un correo cuando una oportunidad vence en 8 a 14 días.',
        },
        {
            key: 'deadline_last_day' as PreferenceKey,
            icon: CalendarCheck2,
            title: 'Alertas de Último Día',
            description: 'Recibir un correo 24 horas antes del vencimiento de una oportunidad.',
        },
    ];

    return (
        <div className="space-y-6">
            <div>
                <Link href="/dashboard/settings" className="inline-flex items-center text-sm text-accent hover:underline mb-2">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Volver a Configuración
                </Link>
                <h1 className="text-3xl font-headline tracking-tight">Notificaciones por Correo</h1>
                <p className="text-muted-foreground">Elija qué notificaciones desea recibir en su bandeja de entrada.</p>
            </div>
            
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Bell className="h-5 w-5" />
                        Preferencias de Notificación
                    </CardTitle>
                    <CardDescription>
                        Estas configuraciones se aplican solo a su cuenta y no afectarán a otros usuarios.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    {authLoading || !preferences ? (
                        <>
                            <Skeleton className="h-20 w-full" />
                            <Skeleton className="h-20 w-full" />
                            <Skeleton className="h-20 w-full" />
                        </>
                    ) : (
                        notificationSettings.map(({ key, icon: Icon, title, description }) => (
                            <div key={key} className="flex items-center justify-between rounded-lg border p-4">
                                <div className="flex items-start gap-4">
                                    <Icon className="h-6 w-6 text-highlight mt-1" />
                                    <div className="space-y-0.5">
                                        <Label htmlFor={key} className="text-base font-medium">{title}</Label>
                                        <p className="text-sm text-muted-foreground">{description}</p>
                                    </div>
                                </div>
                                {isUpdating === key ? (
                                    <Loader2 className="h-5 w-5 animate-spin" />
                                ) : (
                                    <Switch
                                        id={key}
                                        checked={preferences[key]?.email ?? true}
                                        onCheckedChange={(checked) => handlePreferenceChange(key, checked)}
                                    />
                                )}
                            </div>
                        ))
                    )}
                </CardContent>
            </Card>
        </div>
    );
}