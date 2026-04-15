"use client";

import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { ContactForm } from '@/components/contact/ContactForm';
import { Mail, Lock } from 'lucide-react';
import { GoogleReCaptchaProvider } from 'react-google-recaptcha-v3';

export default function ContactClient() {
  const recaptchaSiteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;
  
  return (
    <GoogleReCaptchaProvider reCaptchaKey={recaptchaSiteKey || 'do-not-use-this-key'}>
      {/* ... (Todo tu JSX original va aquí: header, main, footer) ... */}
      <div className="flex flex-col min-h-screen bg-background text-foreground">
          <header className="sticky top-0 z-50 w-full backdrop-blur-md bg-background/50 border-b border-white/10">
              <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-6">
              <Link href="/" className="flex items-center justify-center">
                  <Image src="/logo-bidtory-color.svg" alt="Bidtory Logo" width={130} height={36} className="h-8 w-auto" />
              </Link>
              <nav className="hidden md:flex items-center gap-6">
                  <Link href="/methodology" className="text-sm font-medium hover:text-accent transition-colors">Nuestra Metodología</Link>
                  <Link href="/#bidtory" className="text-sm font-medium hover:text-accent transition-colors">Bidtory</Link>
                  <Link href="/#clients" className="text-sm font-medium hover:text-accent transition-colors">Clientes</Link>
              </nav>
              <div className="flex items-center gap-4">
                  <Button variant="outline" asChild>
                      <Link href="/login">Acceso Clientes</Link>
                  </Button>
                  <Button className="bg-accent hover:bg-accent/90 text-accent-foreground" asChild>
                      <Link href="/contact">Contactar</Link>
                  </Button>
              </div>
              </div>
          </header>
          
          <main className="flex-1 flex flex-col items-center justify-center p-4 sm:p-8">
              <div className="w-full max-w-6xl">
                  {/* Hero Section */}
                  <div className="text-center">
                  <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl font-headline text-foreground">
                      Conversemos y hagámoslo realidad.
                  </h1>
                  <p className="mx-auto mt-4 max-w-2xl text-lg text-foreground/80">
                      El primer paso para un proyecto de alto impacto es una buena conversación. Estamos aquí para escuchar su visión y explorar cómo nuestra metodología puede llevarla al siguiente nivel.
                  </p>
                  </div>

                  {/* Contact Area */}
                  <div className="mt-16 grid grid-cols-1 gap-16 lg:grid-cols-2">
                    <ContactForm />
                    {/* Columna Derecha: Información */}
                    <div className="w-full lg:pl-8">
                        <div className="rounded-lg border border-secondary bg-card/50 p-8">
                            <h3 className="flex items-center gap-3 font-headline text-2xl font-bold text-foreground">
                                <Mail className="h-6 w-6 text-highlight"/>
                                Otras Formas de Contacto
                            </h3>
                            <p className="mt-4 text-foreground/80">
                                Si prefiere un contacto más directo o necesita enviar documentación adjunta, puede escribirnos a la siguiente dirección de correo electrónico.
                            </p>
                            <a href="mailto:clientes@purocontenido.com" className="mt-2 inline-block font-semibold text-highlight hover:underline">
                                clientes@purocontenido.com
                            </a>

                            <div className="my-8 h-px w-full bg-secondary"></div>

                            <h4 className="flex items-center gap-3 font-headline text-xl font-bold text-foreground">
                                <Lock className="h-5 w-5 text-highlight"/>
                                Su Estrategia es Confidencial
                            </h4>
                            <p className="mt-3 text-sm text-foreground/80">
                                Toda la información compartida a través de este formulario y nuestros canales de comunicación es tratada con la más estricta confidencialidad.
                            </p>
                        </div>
                    </div>
                  </div>
              </div>
          </main>
          
          <footer className="w-full border-t border-white/10 py-6">
            <div className="container mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 px-4 md:px-6">
              <div className="flex flex-col items-center md:items-start">
                <div className="flex items-center gap-3">
                  <Image src="/logo-bidtory-color.svg" alt="Bidtory Logo" width={120} height={34} className="h-8 w-auto" />
                  <p className="text-sm text-foreground/70 tracking-wide">&copy; {new Date().getFullYear()} Puro Contenido.</p>
                </div>
                <p className="text-xs text-foreground/50 mt-2 text-center md:text-left">Todos los derechos reservados.</p>
              </div>
              <div className="text-center md:text-left">
                <h4 className="font-semibold text-sm mb-2">Navegación</h4>
                <div className="flex flex-col gap-1">
                  <Link href="/methodology" className="text-sm hover:text-accent">Nuestra Metodología</Link>
                  <Link href="/#bidtory" className="text-sm hover:text-accent">Suite Bidtory</Link>
                  <Link href="/contact" className="text-sm text-accent">Contacto</Link>
                </div>
              </div>
              <div className="text-center md:text-left">
                <h4 className="font-semibold text-sm mb-2">Legales</h4>
                <div className="flex flex-col gap-1">
                    <Link href="/terminos" className="text-sm hover:text-accent">Términos de Servicio</Link>
                    <Link href="/privacidad" className="text-sm hover:text-accent">Política de Privacidad</Link>
                    <Link href="/cookies" className="text-sm hover:text-accent">Política de Cookies</Link>
                    <Link href="/accesibilidad" className="text-sm hover:text-accent">Accesibilidad</Link>
                </div>
              </div>
            </div>
          </footer>
      </div>
    </GoogleReCaptchaProvider>
  );
}