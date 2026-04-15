"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Bot,
  Mail,
  ShieldCheck,
  ArrowRight,
  Menu,
  X,
  Rss,
  Lock,
} from "lucide-react";

export function HomeClient() {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  useEffect(() => {
    if (mobileNavOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileNavOpen]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileNavOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      {/* Header - estilo procurement */}
      <header className="sticky top-0 z-50 w-full bg-white border-b border-border shadow-sm">
        <div className="container mx-auto flex h-16 items-center justify-between gap-2 px-4 md:px-6">
          <Link href="/" className="flex min-w-0 shrink items-center gap-2">
            <Image
              src="/logo-bidtory-838w.svg"
              alt="Bidtory - Licitaciones con IA"
              width={140}
              height={40}
              className="h-8 w-auto"
            />
          </Link>
          <nav
            className="hidden md:flex items-center gap-6"
            aria-label="Secciones de la página"
          >
            <Link
              href="#caracteristicas"
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Características
            </Link>
            <Link
              href="#como-funciona"
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Cómo funciona
            </Link>
          </nav>
          <div className="flex shrink-0 items-center gap-1 sm:gap-2 md:gap-4">
            <Button variant="ghost" size="sm" className="px-2 sm:px-3" asChild>
              <Link href="/login">Iniciar Sesión</Link>
            </Button>
            <Button
              size="sm"
              className="bg-accent hover:bg-accent/90 text-accent-foreground px-2 sm:px-3"
              asChild
            >
              <Link href="/suscripciones">Suscribirse</Link>
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="md:hidden"
              aria-expanded={mobileNavOpen}
              aria-controls="mobile-nav-menu"
              aria-label={mobileNavOpen ? "Cerrar menú" : "Abrir menú de navegación"}
              onClick={() => setMobileNavOpen((o) => !o)}
            >
              {mobileNavOpen ? (
                <X className="h-5 w-5" aria-hidden />
              ) : (
                <Menu className="h-5 w-5" aria-hidden />
              )}
            </Button>
          </div>
        </div>

        {/* Panel móvil: anclas a secciones */}
        {mobileNavOpen ? (
          <>
            <button
              type="button"
              className="fixed inset-x-0 top-16 bottom-0 z-[60] bg-black/40 md:hidden"
              aria-label="Cerrar menú"
              onClick={() => setMobileNavOpen(false)}
            />
            <div
              id="mobile-nav-menu"
              className="fixed inset-x-0 top-16 z-[70] border-b border-border bg-white shadow-lg md:hidden animate-in slide-in-from-top-2 duration-200"
              role="dialog"
              aria-modal="true"
              aria-label="Navegación"
            >
              <nav className="container mx-auto flex flex-col gap-1 px-4 py-4">
                <Link
                  href="#caracteristicas"
                  className="rounded-md px-3 py-3 text-base font-medium text-foreground hover:bg-muted"
                  onClick={() => setMobileNavOpen(false)}
                >
                  Características
                </Link>
                <Link
                  href="#como-funciona"
                  className="rounded-md px-3 py-3 text-base font-medium text-foreground hover:bg-muted"
                  onClick={() => setMobileNavOpen(false)}
                >
                  Cómo funciona
                </Link>
              </nav>
            </div>
          </>
        ) : null}
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative w-full py-16 md:py-24 lg:py-32">
          <div className="container mx-auto px-4 md:px-6">
            <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-16">
              <div className="flex-1 text-center lg:text-left space-y-6">
                <h1 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl lg:text-6xl font-headline">
                  Su radar de licitaciones con IA
                </h1>
                <p className="text-lg text-muted-foreground max-w-2xl mx-auto lg:mx-0">
                  No se pierda ninguna oportunidad. Bidtory analiza múltiples
                  fuentes, filtra las convocatorias y licitaciones más relevantes
                  para su negocio, y las entrega directamente en su correo.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                  <Button
                    size="lg"
                    className="bg-accent hover:bg-accent/90 text-accent-foreground"
                    asChild
                  >
                    <Link href="/suscripciones">Suscribirse Ahora</Link>
                  </Button>
                  <Button size="lg" variant="outline" className="border-accent text-accent hover:bg-accent/10" asChild>
                    <Link href="#caracteristicas">Descubrir Características</Link>
                  </Button>
                </div>
              </div>
              <div className="flex-1 flex justify-center w-full">
                <div className="relative w-full max-w-xl">
                  {/* Halo suave detrás del mockup: separación visual del fondo */}
                  <div
                    className="pointer-events-none absolute -inset-1 -z-10 rounded-[1.25rem] bg-gradient-to-br from-accent/25 via-muted/40 to-foreground/20 opacity-90 blur-xl"
                    aria-hidden
                  />
                  <div className="relative overflow-hidden rounded-lg border border-border bg-white shadow-2xl shadow-accent/10 ring-1 ring-black/[0.06]">
                    <Image
                      src="/1-Bidtory Descubre.webp"
                      alt="Reciba oportunidades filtradas por IA en su correo"
                      width={600}
                      height={800}
                      className="w-full h-auto object-contain"
                      sizes="(max-width: 768px) 100vw, 600px"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Franja de confianza (claims verificables) */}
        <section
          className="border-y border-border/80 bg-muted/40"
          aria-label="Señales de confianza"
        >
          <div className="container mx-auto px-4 py-5 md:px-6 md:py-6">
            <ul className="flex flex-col gap-4 text-sm text-muted-foreground md:flex-row md:flex-wrap md:items-center md:justify-center md:gap-x-10 md:gap-y-3">
              <li className="flex items-start gap-3 md:items-center">
                <Rss
                  className="mt-0.5 h-4 w-4 shrink-0 text-accent md:mt-0"
                  aria-hidden
                />
                <span>Monitoreo de Fuentes Oficiales, como SECOP</span>
              </li>
              <li className="flex items-start gap-3 md:items-center">
                <Lock
                  className="mt-0.5 h-4 w-4 shrink-0 text-accent md:mt-0"
                  aria-hidden
                />
                <span>Navegación con conexión segura (HTTPS)</span>
              </li>
              <li className="flex items-start gap-3 md:items-center">
                <Mail
                  className="mt-0.5 h-4 w-4 shrink-0 text-accent md:mt-0"
                  aria-hidden
                />
                <span>Alertas filtradas según el perfil de su empresa</span>
              </li>
            </ul>
          </div>
        </section>

        {/* Características - ¿Por qué Bidtory? */}
        <section
          id="caracteristicas"
          className="w-full py-16 md:py-24 bg-muted/30"
        >
          <div className="container mx-auto px-4 md:px-6">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold font-headline mb-4">
                ¿Por qué Bidtory?
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Así es como nuestra plataforma inteligente le ayuda a asegurar las
                mejores oportunidades para nuevos contratos:
              </p>
            </div>
            <div className="grid gap-6 md:grid-cols-3">
              <Card className="border border-border bg-white shadow-md hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <Bot className="h-10 w-10 text-accent mb-4" />
                  <h3 className="text-lg font-semibold mb-2">
                    Análisis inteligente: Solo oportunidades relevantes
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Nuestra IA procesa miles de datos para identificar y filtrar
                    las convocatorias y licitaciones, asegurando que usted
                    reciba únicamente las más estratégicas para su empresa.
                  </p>
                </CardContent>
              </Card>
              <Card className="border border-border bg-white shadow-md hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <Mail className="h-10 w-10 text-accent mb-4" />
                  <h3 className="text-lg font-semibold mb-2">
                    Notificaciones oportunas: Directo a su Email
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Reciba alertas diarias directamente en su buzón con las
                    oportunidades ya filtradas por nuestra IA. Acceda a la
                    información clave potenciando su estrategia de descubrimiento
                    de nuevos negocios.
                  </p>
                </CardContent>
              </Card>
              <Card className="border border-border bg-white shadow-md hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <ShieldCheck className="h-10 w-10 text-accent mb-4" />
                  <h3 className="text-lg font-semibold mb-2">
                    No vuelva a perder una oportunidad
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Nuestro monitoreo constante y filtros precisos permiten que las
                    licitaciones y convocatorias adecuadas para su perfil lleguen
                    a usted, minimizando el riesgo de perderse oportunidades que
                    puedan aumentar sus ventas.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Cómo funciona */}
        <section id="como-funciona" className="w-full py-16 md:py-24">
          <div className="container mx-auto px-4 md:px-6">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold font-headline mb-4">
                ¿Cómo funciona?
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Empezar con Bidtory es rápido y sencillo. Siga estos pasos:
              </p>
            </div>
            <div className="max-w-2xl mx-auto space-y-6">
              {[
                {
                  step: 1,
                  title: "Elija su plan y cree su cuenta",
                  desc: "Seleccione el plan de suscripción que mejor se adapte a sus necesidades y complete su registro inicial",
                },
                {
                  step: 2,
                  title: "Configure sus filtros precisos",
                  desc: "Defina los criterios clave: tipos de oportunidades, regiones, palabras clave y más, para que nuestra IA sepa exactamente qué buscar.",
                },
                {
                  step: 3,
                  title: "Reciba alertas relevantes en su Email",
                  desc: "Nuestra IA monitorea, filtra y le envía diariamente las oportunidades que coinciden con sus filtros, listas para analizar.",
                },
                {
                  step: 4,
                  title: "Actúe sobre las oportunidades",
                  desc: "Utilice la información oportuna y relevante para preparar sus propuestas y aumentar sus posibilidades de ganar.",
                },
              ].map((item) => (
                <div
                  key={item.step}
                  className="flex items-start gap-4 p-4 rounded-lg bg-white border border-border shadow-md"
                >
                  <Badge
                    variant="secondary"
                    className="shrink-0 h-8 w-8 rounded-full p-0 flex items-center justify-center bg-foreground text-primary-foreground"
                  >
                    {item.step}
                  </Badge>
                  <div>
                    <h4 className="font-semibold mb-1">{item.title}</h4>
                    <p className="text-sm text-muted-foreground">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section — fondo accent-cta (verde más oscuro) para contraste AA con texto blanco */}
        <section className="w-full py-16 md:py-24 bg-accent-cta text-accent-cta-foreground">
          <div className="container mx-auto px-4 md:px-6 text-center">
            <h2 className="text-3xl font-bold font-headline mb-4 text-accent-cta-foreground">
              ¿Listo para Transformar su Búsqueda de Licitaciones?
            </h2>
            <p className="text-lg mb-8 max-w-2xl mx-auto text-accent-cta-foreground leading-relaxed">
              Únase a Bidtory hoy mismo y empiece a recibir oportunidades
              inteligentes directamente en su correo.
            </p>
            <Button
              size="lg"
              variant="secondary"
              className="bg-white text-accent hover:bg-white/90 focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-accent-cta"
              asChild
            >
              <Link href="/suscripciones" className="gap-2">
                Suscribirse Ahora
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </section>
      </main>

      {/* Footer: móvil apilado (logo → copyright → legales); md+ en fila */}
      <footer className="w-full border-t border-border py-8 bg-[#E5E7EB]">
        <div className="container mx-auto px-4 md:px-6">
          <div className="flex flex-col items-center gap-6 md:flex-row md:items-center md:justify-between md:gap-8">
            <div className="flex w-full max-w-xl flex-col items-center gap-4 md:max-w-none md:flex-row md:items-center md:gap-4 md:text-left">
              <Image
                src="/logo-bidtory-838w.svg"
                alt="Bidtory"
                width={120}
                height={34}
                className="h-8 w-auto shrink-0 opacity-80"
              />
              <p className="text-center text-sm text-muted-foreground md:text-left">
                © {new Date().getFullYear()} Puro Contenido SAS. Todos los
                derechos reservados. Bidtory™ es una marca comercial de Puro
                Contenido SAS.
              </p>
            </div>
            <nav
              className="flex flex-col items-center gap-3 text-sm sm:flex-row sm:flex-wrap sm:justify-center md:justify-end md:gap-x-6 md:gap-y-2"
              aria-label="Enlaces legales"
            >
              <Link
                href="/privacidad"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                Política de Privacidad
              </Link>
              <Link
                href="/terminos"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                Términos de Uso
              </Link>
              <Link
                href="/cookies"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                Política de Cookies
              </Link>
            </nav>
          </div>
        </div>
      </footer>
    </div>
  );
}
