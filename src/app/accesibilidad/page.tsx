
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import type { Metadata } from 'next';
export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: 'Política de Accesibilidad - Puro Contenido',
  description: 'Nuestro compromiso con la accesibilidad web para todos los usuarios.',
  robots: {
    index: false,
    follow: false,
  }
};

export default function AccessibilityPolicyPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-50 w-full backdrop-blur-md bg-background/50 border-b border-white/10">
        <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-6">
          <Link href="/" className="flex items-center justify-center gap-3">
            <Image src="/LogoPuroContenido.svg" alt="Puro Contenido Logo" width={28} height={28} className="h-auto w-7" />
            <span className="font-headline font-bold text-xl tracking-wide ml-2">Puro Contenido</span>
          </Link>
          <nav className="hidden md:flex items-center gap-6">
            <Link href="/methodology" className="text-sm font-medium hover:text-accent transition-colors">Nuestra Metodología</Link>
            <Link href="/#bidtory" className="text-sm font-medium hover:text-accent transition-colors">Suite Bidtory</Link>
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
      
      <main className="flex-1 py-12 md:py-20">
        <div className="container mx-auto px-4 md:px-6">
          <article className="prose dark:prose-invert max-w-4xl mx-auto">
            <h1>Declaración de Accesibilidad de Puro Contenido SAS</h1>
            <p>En Puro Contenido SAS, nos comprometemos a garantizar que nuestro sitio web y nuestra plataforma Bidtory Aplica sean accesibles para el mayor número de usuarios posible, independientemente de sus capacidades o la tecnología que utilicen. Nos esforzamos por cumplir con las Pautas de Accesibilidad al Contenido Web (WCAG) 2.1 nivel AA, un estándar internacional para la accesibilidad web.</p>
            <p>Trabajamos continuamente para mejorar la accesibilidad de nuestro sitio web y nuestra aplicación. Reconocemos que la accesibilidad es un proceso continuo y que pueden surgir desafíos.</p>
            <p>Si experimenta alguna dificultad para acceder o utilizar alguna parte de nuestro sitio web o Bidtory Aplica, o si tiene sugerencias sobre cómo podemos mejorar la accesibilidad, por favor contáctenos a través de:</p>
            <p><strong>Correo electrónico:</strong> soporte@purocontenido.com</p>
            <p>Valoramos sus comentarios y nos esforzamos por abordar cualquier problema de accesibilidad de manera oportuna.</p>
          </article>
        </div>
      </main>

      <footer className="w-full border-t border-white/10 py-6">
        <div className="container mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 px-4 md:px-6">
          <div className="flex flex-col items-center md:items-start">
            <div className="flex items-center gap-3">
              <Image src="/LogoPuroContenido.svg" alt="Puro Contenido Logo" width={24} height={24} className="h-auto w-6" />
              <p className="text-sm text-foreground/70 tracking-wide">&copy; {new Date().getFullYear()} Puro Contenido.</p>
            </div>
             <p className="text-xs text-foreground/50 mt-2 text-center md:text-left">Todos los derechos reservados.</p>
          </div>
          <div className="text-center md:text-left">
            <h4 className="font-semibold text-sm mb-2">Navegación</h4>
            <div className="flex flex-col gap-1">
              <Link href="/methodology" className="text-sm hover:text-accent">Nuestra Metodología</Link>
              <Link href="/#bidtory" className="text-sm hover:text-accent">Suite Bidtory</Link>
              <Link href="/contact" className="text-sm hover:text-accent">Contacto</Link>
            </div>
          </div>
           <div className="text-center md:text-left">
            <h4 className="font-semibold text-sm mb-2">Legales</h4>
            <div className="flex flex-col gap-1">
                <Link href="/terminos" className="text-sm hover:text-accent">Términos de Servicio</Link>
                <Link href="/privacidad" className="text-sm hover:text-accent">Política de Privacidad</Link>
                <Link href="/cookies" className="text-sm hover:text-accent">Política de Cookies</Link>
                <Link href="/accesibilidad" className="text-sm text-accent">Accesibilidad</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
