
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowRight, LayoutTemplate, Radar, LayoutDashboard } from 'lucide-react';
import Image from 'next/image';
import type { Metadata } from 'next';
import { FeatureScroll } from '@/components/home/FeatureScroll';
export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: 'Puro Contenido - Estrategia y Tecnología para Oportunidades de Alto Valor',
  description: 'Combinamos nuestra profunda experiencia en la estructuración de proyectos con productos tecnológicos de vanguardia para darle una ventaja competitiva decisiva.',
};


export default function HomePage() {
  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full backdrop-blur-md bg-background/50 border-b border-white/10">
        <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-6">
          <Link href="/" className="flex items-center justify-center gap-3">
            <Image src="/LogoPuroContenido.svg" alt="Puro Contenido Logo" width={28} height={28} />
             <span className="font-headline font-bold text-xl tracking-wide ml-2">Puro Contenido</span>
         </Link>
          <nav className="hidden md:flex items-center gap-6">
            <Link href="/methodology" className="text-sm font-medium hover:text-accent transition-colors">Nuestra Metodología</Link>
            <Link href="#bidtory" className="text-sm font-medium hover:text-accent transition-colors">Suite Bidtory</Link>
            {/* <Link href="#clients" className="text-sm font-medium hover:text-accent transition-colors">Clientes</Link> */}
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

      {/* Main Content */}
      <main className="flex-1">
        {/* Hero Section */}
        <section
          className="relative container mx-auto flex flex-col items-center justify-center space-y-6 px-4 py-24 text-center md:py-32"
        >
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{
              backgroundImage: `linear-gradient(rgba(42, 34, 32, 0.8), rgba(42, 34, 32, 0.8)), url('/FormulacionProyectos.webp')`,
            }}
          ></div>
          <div className="relative z-10">
            <h1 className="text-4xl font-bold tracking-tighter sm:text-6xl md:text-7xl lg:text-8xl font-headline bg-clip-text text-transparent bg-gradient-to-b from-white to-neutral-400">
               Estrategia y Tecnología para aprovechar oportunidades de alto valor
            </h1>
            <p className="max-w-3xl mx-auto text-foreground/80 md:text-xl">
              Combinamos nuestra profunda experiencia en la estructuración de proyectos con productos tecnológicos de vanguardia para darle una ventaja competitiva decisiva.
            </p>
            <div className="mt-6 space-x-4">
              <Button size="lg" className="bg-accent hover:bg-accent/90 text-accent-foreground rounded-md" asChild>
                <Link href="/contact">Iniciar un Proyecto</Link>
              </Button>
              <Button size="lg" variant="outline" className="rounded-md border-white/20 hover:bg-white/10" asChild>
                <Link href="/methodology">Nuestra Metodología</Link>
              </Button>
            </div>
          </div>
        </section>

        {/*
        // Social Proof Section
        <section id="clients" className="w-full py-12 md:py-16 bg-background">
          <div className="container mx-auto px-4 md:px-6 text-center">
            <h2 className="text-2xl font-semibold tracking-tight text-foreground/80 mb-8">Empresas que Confían en Nuestra Estrategia</h2>
            <div className="flex flex-wrap items-center justify-center gap-x-12 gap-y-8">
              <Image src="https://placehold.co/140x60/png" width={140} height={60} alt="Logo Cliente 1" data-ai-hint="company logo" className="opacity-70 hover:opacity-100 transition-opacity" />
              <Image src="https://placehold.co/140x60/png" width={140} height={60} alt="Logo Cliente 2" data-ai-hint="company logo" className="opacity-70 hover:opacity-100 transition-opacity" />
              <Image src="https://placehold.co/140x60/png" width={140} height={60} alt="Logo Cliente 3" data-ai-hint="company logo" className="opacity-70 hover:opacity-100 transition-opacity" />
              <Image src="https://placehold.co/140x60/png" width={140} height={60} alt="Logo Cliente 4" data-ai-hint="company logo" className="opacity-70 hover:opacity-100 transition-opacity" />
              <Image src="https://placehold.co/140x60/png" width={140} height={60} alt="Logo Cliente 5" data-ai-hint="company logo" className="opacity-70 hover:opacity-100 transition-opacity" />
            </div>
          </div>
        </section>
        */}

        {/* Bidtory Suite Section */}
        <section id="bidtory" className="w-full py-12 md:py-24 lg:py-32 bg-card/50">
          <div className="container mx-auto px-4 md:px-6 text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl font-headline text-highlight">Nuestra Experiencia, Su Tecnología: La Suite Bidtory</h2>
            <p className="max-w-3xl mx-auto mt-4 text-foreground/80 md:text-lg">
                Hemos destilado una década de experiencia en una suite de inteligencia de contratación. Herramientas diseñadas en casa, para darle una ventaja que ninguna otra consultora puede ofrecer.
            </p>
          </div>
          <FeatureScroll />
        </section>

        {/* Integral Strategy Section */}
        <section id="services" className="w-full py-12 md:py-24 lg:py-32 bg-secondary">
          <div className="container mx-auto px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <Link href="/methodology">
                    <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl font-headline hover:text-accent transition-colors">Una Metodología Integral para Asegurar el Éxito</h2>
                </Link>
                <p className="max-w-[900px] text-foreground/80 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                  Nuestro proceso probado fusiona la estrategia de consultoría con el poder de nuestra tecnología.
                </p>
              </div>
            </div>
            <div className="mx-auto grid max-w-5xl items-start gap-8 py-12 sm:grid-cols-2 md:gap-12 lg:max-w-none lg:grid-cols-3">
              <div className="flex flex-col items-center text-center space-y-4 p-6">
                <LayoutTemplate className="h-10 w-10 mb-4 text-accent" />
                <h3 className="text-xl font-bold">Proyectos Sólidos y Financiables</h3>
                <p className="text-foreground/70">
                  Transformamos sus ideas en proyectos estructurados con modelos de negocio y financieros robustos, listos para convencer a inversores y fondos.
                </p>
              </div>
              <div className="flex flex-col items-center text-center space-y-4 p-6 border-l border-white/15">
                <Radar className="h-10 w-10 mb-4 text-accent" />
                <h3 className="text-xl font-bold">Descubrimiento y Gestión Inteligente</h3>
                <p className="text-foreground/70">
                  Utilizamos **Bidtory Descubre** para identificar las mejores oportunidades. Luego, gestionamos todo el proceso de aplicación de forma centralizada en **Bidtory Aplica**.
                </p>
              </div>
              <div className="flex flex-col items-center text-center space-y-4 p-6 border-l border-white/15">
                <LayoutDashboard className="h-10 w-10 mb-4 text-accent" />
                <h3 className="text-xl font-bold">Visibilidad Total y Enfoque en Resultados</h3>
                <p className="text-foreground/70">
                  A través de **Bidtory Aplica**, usted tiene control total sobre el progreso y la documentación, permitiéndonos enfocarnos en lo que importa: preparar propuestas ganadoras.
                </p>
              </div>
            </div>
          </div>
        </section>
        
        {/* Key Sectors Section */}
        <section className="w-full py-12 md:py-24 lg:py-32 bg-background">
          <div className="container mx-auto px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center mb-12">
              <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl font-headline">Experiencia Probada en Sectores de Alto Impacto</h2>
            </div>
            <div className="grid gap-8 md:grid-cols-3">
              <div className="flex flex-col gap-4">
                <Image src="/FormulacionProyectosAgricultura.webp" width={600} height={400} alt="Proyecto de agricultura y medio ambiente" className="rounded-lg object-cover aspect-[3/2]" />
                <div className="space-y-2">
                  <h3 className="text-2xl font-bold font-headline">Agro y Medio ambiente</h3>
                  <p className="text-foreground/70">Hemos Impulsado la innovación y el desarrollo de la agricultura así como proyectos orientados a la protección del medio ambiente.</p>
                </div>
              </div>
              <div className="flex flex-col gap-4">
                <Image src="/FormulacionProyectosTecnologia.webp" width={600} height={400} alt="Proyecto de tecnología de la información" className="rounded-lg object-cover aspect-[3/2]" />
                <div className="space-y-2">
                  <h3 className="text-2xl font-bold font-headline">Tecnologías de la Información</h3>
                  <p className="text-foreground/70">Hemos apoyado la formulación de proyectos en áreas clave como inteligencia artificial, inclusión financiera y transformación digital para empresas que lideran el futuro.</p>
                </div>
              </div>
              <div className="flex flex-col gap-4">
                <Image src="/FormulacionProyectosEducacion.webp" width={600} height={400} alt="Proyecto de educación y desarrollo social" className="rounded-lg object-cover aspect-[3/2]" />
                <div className="space-y-2">
                  <h3 className="text-2xl font-bold font-headline">Educación y Desarrollo Social</h3>
                  <p className="text-foreground/70">Somos especialistas en formulación de proyectos de formación e inclusión que fortalecen el capital humano y atienden a comunidades vulnerables.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Final CTA Section */}
        <section className="w-full py-20 md:py-28 text-center bg-background">
          <div className="container mx-auto px-4 md:px-6">
            <div className="max-w-3xl mx-auto">
              <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl font-headline">¿Tiene un proyecto de alto impacto en mente?</h2>
              <p className="mt-4 text-lg text-foreground/80">Conversemos. Nuestra experiencia puede ser la clave para hacerlo realidad.</p>
              <Button size="lg" className="mt-8 bg-accent hover:bg-accent/90 text-accent-foreground rounded-md" asChild>
                <Link href="/contact">Iniciar Conversación</Link>
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
              <Image src="/LogoPuroContenido.svg" alt="Puro Contenido Logo" width={24} height={24} />
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
                <Link href="/accesibilidad" className="text-sm hover:text-accent">Accesibilidad</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
