
"use client";

import { useState } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import Link from 'next/link';
import apiClient from '@/lib/api-client';

export function AcceptTermsModal() {
  const { refreshUserProfile } = useAuth();
  const { toast } = useToast();

  const [isChecked, setIsChecked] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAccept = async () => {
    if (!isChecked) return;
    setIsSubmitting(true);

    try {
      await apiClient.post('/accept_terms');

      toast({
        title: "¡Gracias por aceptar!",
        description: "Ya puede acceder a la plataforma.",
      });
      
      // Force a full profile refresh from the backend
      await refreshUserProfile(true);
      
      // The modal will disappear automatically because the `needsToAcceptTerms` state will change.

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Ocurrió un error desconocido.";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/80 flex items-center justify-center p-4">
      <div className="bg-card rounded-lg shadow-2xl w-full max-w-lg p-6 md:p-8 space-y-6 animate-in fade-in-0 zoom-in-95">
        <div>
            <h1 className="text-2xl font-headline font-bold">Bienvenido a la Plataforma</h1>
            <p className="text-muted-foreground mt-2">
                Antes de continuar, por favor, lea y acepte nuestros Términos de Servicio y nuestra Política de Privacidad.
            </p>
        </div>

        <div className="flex items-center space-x-3">
            <Checkbox 
                id="terms" 
                checked={isChecked}
                onCheckedChange={(checked) => setIsChecked(!!checked)}
            />
            <Label htmlFor="terms" className="text-sm font-normal text-muted-foreground leading-snug">
                He leído y acepto los{' '}
                <Link href="/terminos" target="_blank" className="text-accent hover:underline">
                    Términos de Servicio
                </Link>{' '}
                y la{' '}
                <Link href="/privacidad" target="_blank" className="text-accent hover:underline">
                    Política de Privacidad
                </Link>
                .
            </Label>
        </div>

        <Button 
            onClick={handleAccept}
            disabled={!isChecked || isSubmitting}
            className="w-full"
        >
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Continuar
        </Button>
      </div>
    </div>
  );
}
