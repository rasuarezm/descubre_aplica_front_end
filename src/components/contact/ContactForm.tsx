
"use client";

import { useState, type FormEvent, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CheckCircle, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useGoogleReCaptcha } from 'react-google-recaptcha-v3';

export function ContactForm() {
  const [formData, setFormData] = useState({
    fullName: '',
    companyName: '',
    email: '',
    interest: '',
    message: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState('');
  
  const { executeRecaptcha } = useGoogleReCaptcha();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleSelectChange = (value: string) => {
    setFormData(prev => ({ ...prev, interest: value }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!formData.fullName || !formData.companyName || !formData.email || !formData.interest) {
      setError('Por favor, completa todos los campos requeridos.');
      return;
    }

    if (!executeRecaptcha) {
      setError('La verificación de reCAPTCHA no está lista. Por favor, espere un momento.');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const recaptchaToken = await executeRecaptcha('contactForm');
      if (!recaptchaToken) {
        throw new Error('No se pudo obtener el token de reCAPTCHA. Por favor, intente de nuevo.');
      }

      const CF_BASE_URL = process.env.NEXT_PUBLIC_CF_BASE_URL ||
        'https://us-central1-procurement-portal-app.cloudfunctions.net';

      const response = await fetch(`${CF_BASE_URL}/handle_contact_form`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          recaptchaToken,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Ocurrió un error en el servidor.' }));
        throw new Error(errorData.message || 'No se pudo enviar su mensaje.');
      }

      setIsSubmitted(true);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Ocurrió un error inesperado.';
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  if (isSubmitted) {
    return (
        <div className="flex w-full max-w-lg flex-col items-center justify-center rounded-lg border border-secondary bg-card/50 p-8 text-center mx-auto">
            <CheckCircle className="h-16 w-16 text-accent" />
            <h1 className="mt-6 font-headline text-3xl font-bold text-foreground">Hemos recibido su solicitud.</h1>
            <p className="mt-3 text-foreground/80">
                Gracias por contactar a Puro Contenido. Nuestro equipo ha recibido su mensaje y lo revisará cuidadosamente. Nos pondremos en contacto con usted en las próximas 24-48 horas hábiles para agendar una llamada inicial.
            </p>
            <p className="mt-4 text-sm text-foreground/60">Recibirá una copia de su solicitud en su correo electrónico.</p>
            <Button variant="outline" asChild className="mt-8">
                <Link href="/">Volver al Inicio</Link>
            </Button>
        </div>
    );
  }

  return (
    <div className="w-full">
        <h2 className="font-headline text-3xl font-bold text-foreground">Iniciemos la Conversación</h2>
        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div className="space-y-2">
                <Label htmlFor="fullName" className="text-foreground/80">Nombre Completo</Label>
                <Input 
                    type="text" 
                    name="fullName" 
                    id="fullName" 
                    required 
                    value={formData.fullName}
                    onChange={handleInputChange}
                    className="bg-muted/50 border-secondary focus:border-accent focus:ring-accent"
                />
                </div>
                <div className="space-y-2">
                <Label htmlFor="companyName" className="text-foreground/80">Nombre de su Empresa</Label>
                <Input 
                    type="text" 
                    name="companyName" 
                    id="companyName" 
                    required 
                    value={formData.companyName}
                    onChange={handleInputChange}
                    className="bg-muted/50 border-secondary focus:border-accent focus:ring-accent"
                />
                </div>
            </div>

            <div className="space-y-2">
                <Label htmlFor="email" className="text-foreground/80">Correo Electrónico Profesional</Label>
                <Input 
                type="email" 
                name="email" 
                id="email" 
                required 
                value={formData.email}
                onChange={handleInputChange}
                className="bg-muted/50 border-secondary focus:border-accent focus:ring-accent"
                />
            </div>

            <div className="space-y-2">
                <Label htmlFor="interest" className="text-foreground/80">Estoy interesado/a en...</Label>
                <Select name="interest" required onValueChange={handleSelectChange} value={formData.interest}>
                    <SelectTrigger className="w-full bg-muted/50 border-secondary focus:border-accent focus:ring-accent" id="interest">
                        <SelectValue placeholder="Seleccione una opción..." />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="estructurar-proyecto">Estructurar un nuevo proyecto</SelectItem>
                        <SelectItem value="suscripcion-bidtory">Suscribirse a Bidtory</SelectItem>
                        <SelectItem value="otra-consulta">Otro tipo de consulta</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <div className="space-y-2">
                <Label htmlFor="message" className="text-foreground/80">Cuéntenos un poco más sobre su proyecto (Opcional)</Label>
                <Textarea 
                name="message" 
                id="message" 
                rows={4}
                value={formData.message}
                onChange={handleInputChange}
                className="bg-muted/50 border-secondary focus:border-accent focus:ring-accent"
                />
            </div>
            
            {error && <p className="text-sm text-destructive">{error}</p>}

            <div>
                <Button type="submit" className="w-full bg-accent hover:bg-accent/90 text-accent-foreground" disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                {isSubmitting ? 'Enviando...' : 'Enviar Solicitud'}
                </Button>
            </div>
        </form>
    </div>
  );
}
