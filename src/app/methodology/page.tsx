
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowRight, Scaling, Search, ShieldCheck, Target, Bot, BarChart, FileCheck2 } from 'lucide-react';
import Image from 'next/image';
import type { Metadata } from 'next';
export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: 'Nuestra Metodología - Puro Contenido',
  description: 'Descubre nuestros tres pilares: Estructuración, Inteligencia de Oportunidades y Gestión Centralizada para transformar ideas en proyectos de alto impacto.',
};

export default function MethodologyPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      {/* Header */}
       <header className="sticky top-0 z-50 w-full backdrop-blur-md bg-background/50 border-b border-white/10">
        <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-6">
          <Link href="/" className="flex items-center justify-center gap-3">
            <Image src="/LogoPuroContenido.svg" alt="Puro Contenido Logo" width={28} height={28} className="h-auto w-7" />
             <span className="font-headline font-bold text-xl tracking-wide ml-2">Puro Contenido</span>
         </Link>
          <nav className="hidden md:flex items-center gap-6">
            <Link href="/methodology" className="text-sm font-medium text-accent transition-colors">Nuestra Metodología</Link>
            <Link href="/#bidtory" className="text-sm font-medium hover:text-accent transition-colors">Suite Bidtory</Link>
            {/* <Link href="/#clients" className="text-sm font-medium hover:text-accent transition-colors">Clientes</Link> */}
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

      <main className="flex-1">
        {/* Hero Section */}
        <section
          className="relative container mx-auto flex flex-col items-center justify-center space-y-6 px-4 py-24 text-center md:py-32"
          style={{
            backgroundImage: `linear-gradient(rgba(42, 34, 32, 0.7), rgba(42, 34, 32, 0.7)), url('/NuestraMetodologiaPuroContenido.webp')`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        >
          <h1 className="text-4xl font-bold tracking-tighter sm:text-6xl md:text-7xl lg:text-8xl font-headline bg-clip-text text-transparent bg-gradient-to-b from-white to-neutral-400">
            De la Idea al Impacto: <br /> Nuestra Metodología para Proyectos de Alto Valor
          </h1>
          <p className="max-w-3xl text-foreground/80 md:text-xl">
            Hemos perfeccionado un sistema integral que une estrategia, tecnología y una ejecución impecable para asegurar la viabilidad y la financiación de sus proyectos más ambiciosos.
          </p>
          <div className="space-x-4">
            <Button size="lg" className="bg-accent hover:bg-accent/90 text-accent-foreground rounded-md" asChild>
              <Link href="/contact">Iniciar un Proyecto</Link>
            </Button>
            <Button size="lg" variant="outline" className="rounded-md border-white/20 hover:bg-white/10">
              Ver Casos de Éxito
            </Button>
          </div>
        </section>

        {/* Pillars Intro Section */}
        <section className="py-12 md:py-24 lg:py-32">
          <div className="container mx-auto px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl font-headline">Nuestros Tres Pilares Fundamentales</h2>
              <p className="max-w-[900px] text-foreground/80 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                Cada pilar representa una fase crítica en el ciclo de vida de una oportunidad. Juntos, forman una estrategia integral que maximiza las probabilidades de éxito.
              </p>
            </div>
            <div className="mx-auto grid max-w-5xl items-center gap-6 py-12 lg:grid-cols-3 lg:gap-12">
              <div className="group flex flex-col items-center text-center p-6 rounded-lg border border-secondary hover:border-accent transition-colors duration-300">
                <h3 className="text-xl font-headline font-bold text-highlight">Pilar 1: Estructuración y Formulación</h3>
              </div>
              <div className="group flex flex-col items-center text-center p-6 rounded-lg border border-secondary hover:border-accent transition-colors duration-300">
                <h3 className="text-xl font-headline font-bold text-highlight">Pilar 2: Inteligencia de Oportunidades</h3>
              </div>
              <div className="group flex flex-col items-center text-center p-6 rounded-lg border border-secondary hover:border-accent transition-colors duration-300">
                <h3 className="text-xl font-headline font-bold text-highlight">Pilar 3: Gestión Centralizada</h3>
              </div>
            </div>
          </div>
        </section>

        {/* Pillar 1 Section */}
        <section className="w-full py-12 md:py-24 bg-card/50">
          <div className="container mx-auto grid items-center gap-10 px-4 md:px-6 lg:grid-cols-2 lg:gap-16">
            <div className="space-y-4">
              <h3 className="text-3xl font-bold tracking-tighter sm:text-4xl font-headline">Pilar 1: Estructuración y Formulación</h3>
              <p className="text-foreground/70">
                Una gran idea solo se convierte en un proyecto exitoso cuando tiene una estructura técnica y financiera a prueba de todo. Nos sumergimos en su visión para transformarla en un plan de negocio robusto, con modelos financieros claros y una narrativa convincente.
              </p>
            </div>
            <div className="w-full">
              <Tabs defaultValue="modelo" orientation="vertical" className="flex flex-col md:flex-row gap-6 md:gap-8">
                <TabsList className="flex md:flex-col items-start justify-start h-auto bg-transparent p-0 border-b-2 md:border-b-0 md:border-l-2 border-secondary shrink-0">
                  <TabsTrigger value="modelo" className="w-full justify-start text-left data-[state=active]:border-b-2 md:border-b-0 md:data-[state=active]:border-l-2 data-[state=active]:border-accent data-[state=active]:bg-accent/10 data-[state=active]:text-accent -mb-0.5 md:-ml-0.5">Modelo de Negocio</TabsTrigger>
                  <TabsTrigger value="propuesta" className="w-full justify-start text-left data-[state=active]:border-b-2 md:border-b-0 md:data-[state=active]:border-l-2 data-[state=active]:border-accent data-[state=active]:bg-accent/10 data-[state=active]:text-accent -mb-0.5 md:-ml-0.5">Propuesta de Valor</TabsTrigger>
                  <TabsTrigger value="alianzas" className="w-full justify-start text-left data-[state=active]:border-b-2 md:border-b-0 md:data-[state=active]:border-l-2 data-[state=active]:border-accent data-[state=active]:bg-accent/10 data-[state=active]:text-accent -mb-0.5 md:-ml-0.5">Alianzas Estratégicas</TabsTrigger>
                </TabsList>
                <div className="flex-grow">
                  <TabsContent value="modelo" className="mt-0 text-foreground/70">
                    <p>Definimos el marco lógico, la teoría del cambio y las proyecciones financieras para asegurar la sostenibilidad a largo plazo.</p>
                  </TabsContent>
                  <TabsContent value="propuesta" className="mt-0 text-foreground/70">
                    <p>Elaboramos propuestas y postulaciones ganadoras, alineando su proyecto con los criterios exactos de inversores y convocatorias.</p>
                  </TabsContent>
                  <TabsContent value="alianzas" className="mt-0 text-foreground/70">
                    <p>Identificamos y conectamos su proyecto con los socios clave necesarios para fortalecer su propuesta técnica, comercial y financiera.</p>
                  </TabsContent>
                </div>
              </Tabs>
            </div>
          </div>
        </section>

        {/* Pillar 2 Section */}
        <section className="w-full py-12 md:py-24">
          <div className="container mx-auto grid items-center gap-10 px-4 md:px-6 lg:grid-cols-2 lg:gap-16">
            <div className="flex flex-col items-center justify-center">
               <div className="aspect-video bg-card border border-secondary rounded-xl flex items-center justify-center w-full">
                  <video className="w-full h-full rounded-xl object-cover" src="https://www.w3schools.com/html/mov_bbb.mp4" autoPlay loop muted playsInline>
                      Tu navegador no soporta el tag de video.
                  </video>
               </div>
            </div>
             <div className="space-y-4">
              <h3 className="text-3xl font-bold tracking-tighter sm:text-4xl font-headline">Pilar 2: Inteligencia de Oportunidades</h3>
              <div className="h-10">
                <Image src="/logo-bidtory-descubre-neg.svg" alt="Bidtory Descubre Logo" height={40} width={150} />
              </div>
              <p className="text-foreground/70">
                No basta con tener un buen proyecto; hay que encontrar la oportunidad perfecta. Utilizamos nuestra plataforma de IA, Bidtory, y alianzas estratégicas para buscar, filtrar y gestionar las convocatorias y fuentes de financiación que mejor se adaptan a la visión de cada cliente.
              </p>
            </div>
          </div>
        </section>

        {/* Pillar 3 Section */}
        <section className="w-full py-12 md:py-24 bg-card/50">
          <div className="container mx-auto grid items-center gap-10 px-4 md:px-6 lg:grid-cols-2 lg:gap-16">
            <div className="space-y-4">
              <h3 className="text-3xl font-bold tracking-tighter sm:text-4xl font-headline">Pilar 3: Gestión Centralizada</h3>
              <div className="h-10">
                <Image src="/logo-bidtory-aplica-neg.svg" alt="Bidtory Aplica Logo" height={40} width={150} />
              </div>
              <p className="text-foreground/70">
                La ejecución es clave. Por eso, proporcionamos a nuestros clientes acceso exclusivo a nuestra plataforma de gestión de oportunidades. Con ella, centralizamos el seguimiento del progreso, la gestión documental y la comunicación para asegurar una ejecución impecable desde que se formula el proyecto hasta que se presenta la propuesta.
              </p>
            </div>
            <div className="flex flex-col items-center justify-center">
               <Image 
                src="https://placehold.co/1280x720.png"
                width={1280}
                height={720}
                alt="Dashboard del Portal de Clientes"
                data-ai-hint="dashboard interface"
                className="rounded-lg object-cover aspect-video border border-secondary"
               />
            </div>
          </div>
        </section>

        {/* Final CTA Section */}
        <section className="w-full py-20 md:py-28 text-center bg-background">
          <div className="container mx-auto px-4 md:px-6">
            <div className="max-w-3xl mx-auto">
              <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl font-headline">¿Listo para convertir su visión en un proyecto ganador?</h2>
              <p className="mt-4 text-lg text-foreground/70">Conversemos. Nuestra metodología es el primer paso para hacerlo realidad.</p>
              <Button size="lg" className="mt-8 bg-accent hover:bg-accent/90 text-accent-foreground rounded-md" asChild>
                <Link href="/contact">Iniciar Conversación <ArrowRight className="ml-2 h-4 w-4" /></Link>
              </Button>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
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
              <Link href="/methodology" className="text-sm text-accent">Nuestra Metodología</Link>
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
                <Link href="/accesibilidad" className="text-sm hover:text-accent">Accesibilidad</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
