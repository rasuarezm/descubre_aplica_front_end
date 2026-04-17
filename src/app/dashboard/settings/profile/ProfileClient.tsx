"use client";

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/auth-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ArrowLeft, Loader2, UserCircle, ImageUp } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { updateProfile } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { FirebaseError } from 'firebase/app';
import apiClient from '@/lib/api-client';
import { avatarUrlForImg } from '@/lib/user-profile';

export default function ProfileClient() {
    const { user, userProfile, refreshUserProfile, loading: authLoading } = useAuth();
    const { toast } = useToast();
    const [displayName, setDisplayName] = useState('');
    const [isSubmittingName, setIsSubmittingName] = useState(false);
    const [isSubmittingPhoto, setIsSubmittingPhoto] = useState(false);
    /** Vista previa local hasta que el backend devuelva photo_signed_url (evita depender solo de caché / Auth). */
    const [avatarPreviewUrl, setAvatarPreviewUrl] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (userProfile) {
            setDisplayName(userProfile.displayName || ''); 
        }
    }, [userProfile]);

    useEffect(() => {
        return () => {
            if (avatarPreviewUrl) {
                URL.revokeObjectURL(avatarPreviewUrl);
            }
        };
    }, [avatarPreviewUrl]);
    
    const handleNameUpdate = async () => {
        if (!user) {
            toast({ title: "Error", description: "Debe iniciar sesión para actualizar su perfil.", variant: "destructive" });
            return;
        }
        if (displayName.trim() === (userProfile?.displayName || '')) {
            return; // No changes
        }
        
        setIsSubmittingName(true);
        try {
            await updateProfile(user, { displayName: displayName.trim() });
            await refreshUserProfile(true); // Force sync with backend
            toast({ title: "Éxito", description: "Su nombre ha sido actualizado." });
        } catch (error) {
            const errorMessage = error instanceof FirebaseError ? error.message : error instanceof Error ? error.message : "Ocurrió un error desconocido.";
            toast({ title: "Error al actualizar", description: errorMessage, variant: "destructive" });
        } finally {
            setIsSubmittingName(false);
        }
    };

    const handlePhotoChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file || !user) return;

        if (avatarPreviewUrl) {
            URL.revokeObjectURL(avatarPreviewUrl);
        }
        const preview = URL.createObjectURL(file);
        setAvatarPreviewUrl(preview);

        setIsSubmittingPhoto(true);

        try {
            const { upload_url, gs_uri } = await apiClient.post<{upload_url: string, gs_uri: string}>('/generate_avatar_upload_url', {
                content_type: file.type,
            });

            const uploadResponse = await fetch(upload_url, {
                method: 'PUT',
                headers: { 'Content-Type': file.type },
                body: file,
            });

            if (!uploadResponse.ok) {
                throw new Error("La subida de la imagen falló.");
            }

            await updateProfile(user, { photoURL: gs_uri });
            const profile = await refreshUserProfile(true, { photo_gs_uri: gs_uri });

            if (profile?.photo_signed_url) {
                URL.revokeObjectURL(preview);
                setAvatarPreviewUrl(null);
            }

            toast({ title: "Éxito", description: "Su foto de perfil ha sido actualizada." });
        } catch (error) {
            URL.revokeObjectURL(preview);
            setAvatarPreviewUrl(null);
            const errorMessage = error instanceof Error ? error.message : "Ocurrió un error desconocido.";
            toast({ title: "Error al cambiar la foto", description: errorMessage, variant: "destructive" });
        } finally {
            setIsSubmittingPhoto(false);
        }
    };
    
    if (authLoading) {
        return <div className="flex items-center justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>;
    }

    return (
        <div className="space-y-6">
            <div>
                <Link href="/dashboard/settings" className="inline-flex items-center text-sm text-accent hover:underline mb-2">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Volver a Configuración
                </Link>
                <h1 className="text-3xl font-headline tracking-tight">Mi Perfil</h1>
                <p className="text-muted-foreground">Gestione su información personal y de cuenta.</p>
            </div>
            
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <UserCircle className="h-5 w-5" />
                        Información del Perfil
                    </CardTitle>
                    <CardDescription>Esta información será visible para otros miembros del equipo en la bitácora de comentarios.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="flex flex-col sm:flex-row items-center gap-6">
                        <div className="relative">
                            <Avatar className="h-24 w-24">
                                <AvatarImage
                                    src={
                                        avatarPreviewUrl ||
                                        avatarUrlForImg(userProfile?.photo_signed_url, user?.photoURL)
                                    }
                                    alt={userProfile?.displayName || ''}
                                    referrerPolicy="no-referrer"
                                    key={`${avatarPreviewUrl || ''}-${userProfile?.photo_signed_url || ''}`}
                                />
                                <AvatarFallback className="text-3xl">
                                    {userProfile?.displayName?.charAt(0) || user?.email?.charAt(0) || 'U'}
                                </AvatarFallback>
                            </Avatar>
                             {isSubmittingPhoto && (
                                <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center">
                                    <Loader2 className="h-8 w-8 animate-spin text-white" />
                                </div>
                            )}
                        </div>
                        <div className="flex-1 text-center sm:text-left">
                            <h3 className="text-xl font-semibold">{userProfile?.displayName || 'Usuario'}</h3>
                            <p className="text-muted-foreground">{userProfile?.email}</p>
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handlePhotoChange}
                                className="hidden"
                                accept="image/png, image/jpeg, image/gif"
                                disabled={isSubmittingPhoto}
                            />
                            <Button
                                variant="outline"
                                size="sm"
                                className="mt-2"
                                onClick={() => fileInputRef.current?.click()}
                                disabled={isSubmittingPhoto}
                            >
                                <ImageUp className="mr-2 h-4 w-4" />
                                Cambiar Foto
                            </Button>
                        </div>
                    </div>
                    <div className="grid gap-2 max-w-md">
                        <Label htmlFor="displayName">Nombre a Mostrar</Label>
                        <Input
                            id="displayName"
                            value={displayName}
                            onChange={(e) => setDisplayName(e.target.value)}
                            disabled={isSubmittingName}
                        />
                         <Button
                            onClick={handleNameUpdate}
                            disabled={isSubmittingName || displayName.trim() === (userProfile?.displayName || '')}
                            className="w-full sm:w-auto"
                        >
                            {isSubmittingName && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Guardar Nombre
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}