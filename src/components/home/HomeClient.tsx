"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FeatureScroll } from "@/components/home/FeatureScroll";
import { ArrowRight, Menu, X, Zap, ChevronRight } from "lucide-react";

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
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <header className="sticky top-0 z-50 w-full border-b border-border bg-background">
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
            className="hidden items-center gap-6 md:flex"
            aria-label="Secciones de la página"
          >
            <Link
              href="#el-sistema"
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              Descubre
            </Link>
            <Link
              href="#como-funciona"
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              Cómo funciona
            </Link>
            <Link
              href="/suscripciones"
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              Planes
            </Link>
          </nav>
          <div className="flex shrink-0 items-center gap-1 sm:gap-2 md:gap-4">
            <Button variant="ghost" size="sm" className="px-2 sm:px-3" asChild>
              <Link href="/login">Iniciar sesión</Link>
            </Button>
            <Button
              size="sm"
              className="bg-accent px-2 text-accent-foreground hover:bg-accent/90 sm:px-3"
              asChild
            >
              <Link href="/registro">Empezar ahora</Link>
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="md:hidden"
              aria-expanded={mobileNavOpen}
              aria-controls="mobile-nav-menu"
              aria-label={
                mobileNavOpen ? "Cerrar menú" : "Abrir menú de navegación"
              }
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

        {mobileNavOpen ? (
          <>
            <button
              type="button"
              className="fixed inset-x-0 bottom-0 top-16 z-[60] bg-black/40 md:hidden"
              aria-label="Cerrar menú"
              onClick={() => setMobileNavOpen(false)}
            />
            <div
              id="mobile-nav-menu"
              className="fixed inset-x-0 top-16 z-[70] animate-in border-b border-border bg-background shadow-sm duration-200 slide-in-from-top-2 md:hidden"
              role="dialog"
              aria-modal="true"
              aria-label="Navegación"
            >
              <nav className="container mx-auto flex flex-col gap-1 px-4 py-4">
                <Link
                  href="#el-sistema"
                  className="rounded-md px-3 py-3 text-base font-medium text-foreground hover:bg-muted"
                  onClick={() => setMobileNavOpen(false)}
                >
                  Descubre
                </Link>
                <Link
                  href="#como-funciona"
                  className="rounded-md px-3 py-3 text-base font-medium text-foreground hover:bg-muted"
                  onClick={() => setMobileNavOpen(false)}
                >
                  Cómo funciona
                </Link>
                <Link
                  href="/suscripciones"
                  className="rounded-md px-3 py-3 text-base font-medium text-foreground hover:bg-muted"
                  onClick={() => setMobileNavOpen(false)}
                >
                  Planes
                </Link>
              </nav>
            </div>
          </>
        ) : null}
      </header>

      <main className="flex-1">
        {/* Hero */}
        <section className="w-full bg-background pt-20 pb-12 md:pt-28 md:pb-16">
          <div className="container mx-auto px-4 md:px-6">
            <div className="grid items-center gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] lg:gap-x-6 lg:gap-y-10">
              <div className="order-1 flex flex-col lg:order-none">
                <span className="mb-6 inline-flex items-center gap-1.5 rounded-full border border-accent/30 bg-accent/8 px-3 py-1 text-xs font-medium text-accent">
                  <Zap className="h-3 w-3" />
                  Contratación pública · Fondos de fomento · Colombia
                </span>
                <h1 className="font-headline text-5xl font-semibold leading-[1.1] tracking-tight text-foreground md:text-6xl lg:text-[4.25rem]">
                  Su radar inteligente para licitaciones estratégicas.
                </h1>
                <p className="mt-5 max-w-lg text-lg leading-relaxed text-muted-foreground">
                  Bidtory es la suite integral que combina un radar de
                  oportunidades con IA que busca por usted (Descubre) y un
                  espacio de trabajo colaborativo (Aplica).
                </p>
                <p className="mt-3 max-w-lg text-lg leading-relaxed text-muted-foreground">
                  Así su equipo puede gestionar cada proceso —desde la
                  validación de requisitos, la construcción de la oferta y la
                  formulación de preguntas hasta el cierre del mismo— con
                  precisión y control.
                </p>
                <div className="mt-8 flex flex-wrap gap-3">
                  <Button
                    size="lg"
                    className="gap-2 bg-accent text-accent-foreground hover:bg-accent/90"
                    asChild
                  >
                    <Link href="/registro">
                      Empezar ahora{" "}
                      <ArrowRight className="h-4 w-4" aria-hidden />
                    </Link>
                  </Button>
                  <Button
                    size="lg"
                    variant="ghost"
                    className="gap-1 text-foreground/70 hover:text-foreground"
                    asChild
                  >
                    <Link href="#como-funciona">
                      Ver cómo funciona{" "}
                      <ChevronRight className="h-4 w-4" aria-hidden />
                    </Link>
                  </Button>
                </div>
              </div>

              <div className="relative order-2 w-full min-w-0 lg:order-none">
                <div className="relative flex w-full justify-center lg:justify-start">
                  <div className="relative w-full max-w-full">
                    <Image
                      src="/2-Bidtory%20Descubre-Oportunidades.webp"
                      alt="Vista de oportunidades en Bidtory Descubre"
                      width={1400}
                      height={1050}
                      className="h-auto w-full rounded-xl border border-border shadow-md"
                      priority
                      sizes="(max-width: 1024px) 100vw, 48vw"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Barra de cobertura: solo fuentes / marco institucional (referencia diseño) */}
        <section
          className="border-y border-border bg-white py-10 md:py-12 dark:bg-background"
          aria-labelledby="home-trust-sources-heading"
        >
          <div className="container mx-auto px-4 md:px-6">
            <p
              id="home-trust-sources-heading"
              className="mb-8 text-center text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground md:text-xs"
            >
              Fuentes de datos oficiales e integraciones
            </p>
            <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-6 opacity-60 grayscale transition-[opacity,filter] duration-500 hover:opacity-100 hover:grayscale-0 md:gap-x-14 md:gap-y-8">
              {[
                "SECOP II",
                "Colombia Compra Eficiente",
                "Fondos de fomento",
                "Cooperación internacional",
              ].map((name) => (
                <span
                  key={name}
                  className="font-headline text-center text-base font-semibold tracking-tight text-foreground/85 md:text-lg"
                >
                  {name}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* El sistema */}
        <section
          id="el-sistema"
          className="w-full bg-muted/40 py-20 md:py-28"
        >
          <div className="container mx-auto px-4 md:px-6">
            <div className="mb-16 text-center">
              <p className="mb-3 text-sm font-medium text-accent">El sistema</p>
              <h2 className="font-headline text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
                El ecosistema de licitación inteligente
              </h2>
              <p className="mx-auto mt-3 max-w-xl text-center text-muted-foreground">
                Dos herramientas conectadas para acompañar a su equipo desde la
                detección de oportunidades hasta la preparación y el cierre de
                cada proceso, con trazabilidad.
              </p>
            </div>

            <div className="mx-auto mt-12 grid max-w-4xl items-center gap-4 md:grid-cols-[1fr_auto_1fr]">
              <div className="rounded-xl border border-border border-l-4 border-l-accent bg-card p-7 shadow-sm">
                <Image
                  src="/logo-bidtory-descubre-neg.svg"
                  alt="Bidtory Descubre"
                  width={140}
                  height={32}
                  className="mb-5 h-7 w-auto opacity-80"
                />
                <h3 className="mb-1 text-lg font-semibold text-foreground">
                  Bidtory Descubre
                </h3>
                <p className="mb-5 text-sm text-muted-foreground">
                  Inteligencia y monitoreo
                </p>
                <ul className="space-y-2.5">
                  {[
                    "Monitoreo de convocatorias (incluido SECOP II y fondos de fomento)",
                    "Priorización con IA según el perfil de su empresa",
                    "Alertas para no perder plazos ni cambios relevantes",
                    "Vista clara de oportunidades y su contexto",
                  ].map((text) => (
                    <li
                      key={text}
                      className="flex items-center gap-2.5 text-sm text-foreground/80"
                    >
                      <div className="h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                      {text}
                    </li>
                  ))}
                </ul>
                <Badge variant="secondary" className="mt-6 text-xs">
                  Disponible en todos los planes
                </Badge>
              </div>

              <div className="flex flex-col items-center gap-1 py-4">
                <ChevronRight
                  className="hidden h-6 w-6 text-muted-foreground/50 md:block"
                  aria-hidden
                />
                <span className="hidden text-[10px] font-medium tracking-wider text-muted-foreground/40 md:block">
                  1 clic
                </span>
              </div>

              <div className="rounded-xl border border-border border-l-4 border-l-foreground bg-card p-7 shadow-sm">
                <Image
                  src="/logo-bidtory-aplica-neg.svg"
                  alt="Bidtory Aplica"
                  width={140}
                  height={32}
                  className="mb-5 h-7 w-auto opacity-80"
                />
                <h3 className="mb-1 text-lg font-semibold text-foreground">
                  Bidtory Aplica
                </h3>
                <p className="mb-5 text-sm text-muted-foreground">
                  Gestión y pipeline
                </p>
                <ul className="space-y-2.5">
                  {[
                    "Pipeline de oportunidades con estados claros",
                    "Análisis asistido de pliegos y requisitos",
                    "Checklist y documentos de la propuesta",
                    "Bitácora para coordinar jurídica, técnica y gestión",
                  ].map((text) => (
                    <li
                      key={text}
                      className="flex items-center gap-2.5 text-sm text-foreground/80"
                    >
                      <div className="h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                      {text}
                    </li>
                  ))}
                </ul>
                <Badge variant="secondary" className="mt-6 text-xs">
                  Desde plan Profesional
                </Badge>
              </div>
            </div>
          </div>
        </section>

        {/* Cómo funciona */}
        <section
          id="como-funciona"
          className="w-full bg-background py-20 md:py-28"
        >
          <div className="container mx-auto mb-16 max-w-4xl px-4 text-center md:px-6">
            <p className="mb-3 text-sm font-medium text-accent">Cómo funciona</p>
            <h2 className="font-headline text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
              Su flujo de trabajo, de punta a punta
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
              Un recorrido continuo: desde que una convocatoria encaja con su
              perfil hasta que su equipo prepara la propuesta, documenta el
              trabajo y deja trazabilidad para revisión interna o auditorías.
            </p>
          </div>
          <FeatureScroll />
        </section>

        {/* Métricas */}
        <section className="border-y border-border/60 bg-muted/30 py-12">
          <div className="mx-auto grid max-w-3xl grid-cols-1 divide-y divide-border/60 md:grid-cols-3 md:divide-x md:divide-y-0">
            <div className="flex flex-col items-center py-6 text-center md:py-0 md:px-10">
              <span className="text-4xl font-semibold tracking-tight text-foreground">
                Diario
              </span>
              <span className="mt-1.5 max-w-[220px] text-sm leading-snug text-muted-foreground">
                Actualización frecuente de convocatorias según sus criterios y
                alertas.
              </span>
            </div>
            <div className="flex flex-col items-center py-6 text-center md:py-0 md:px-10">
              <span className="text-4xl font-semibold tracking-tight text-foreground">
                &lt; 10 min
              </span>
              <span className="mt-1.5 max-w-[220px] text-sm leading-snug text-muted-foreground">
                Para orientar su perfil y revisar oportunidades alineadas con
                su empresa.
              </span>
            </div>
            <div className="flex flex-col items-center py-6 text-center md:py-0 md:px-10">
              <span className="text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
                Varias fuentes
              </span>
              <span className="mt-1.5 max-w-[240px] text-sm leading-snug text-muted-foreground">
                Contratación pública, fondos de fomento y cooperación
                internacional en un solo flujo.
              </span>
            </div>
          </div>
        </section>

        {/* CTA final */}
        <section className="w-full bg-background py-20 md:py-28">
          <div className="mx-auto max-w-2xl px-4 text-center md:px-6">
            <div className="rounded-2xl border border-border bg-card p-10 shadow-sm md:p-14">
              <h2 className="font-headline text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
                ¿Listo para encontrar su próxima licitación?
              </h2>
              <p className="mx-auto mt-4 max-w-md text-base leading-relaxed text-muted-foreground">
                Empiece desde $149.000 COP/mes. Sin contratos. Cancele cuando
                quiera.
              </p>
              <div className="mt-8 flex flex-wrap justify-center gap-3">
                <Button
                  size="lg"
                  className="bg-accent text-accent-foreground hover:bg-accent/90"
                  asChild
                >
                  <Link href="/suscripciones">Ver planes y empezar</Link>
                </Button>
                <Button size="lg" variant="outline" asChild>
                  <a
                    href="https://wa.me/573208691817?text=Hola%2C%20quiero%20conocer%20m%C3%A1s%20sobre%20Bidtory"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Hablar con el equipo
                  </a>
                </Button>
              </div>
              <p className="mt-6 text-xs text-muted-foreground/60">
                Puro Contenido SAS · NIT 900.561.858-3 · bidtory.com
              </p>
            </div>
          </div>
        </section>
      </main>

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
                className="text-muted-foreground transition-colors hover:text-foreground"
              >
                Política de Privacidad
              </Link>
              <Link
                href="/terminos"
                className="text-muted-foreground transition-colors hover:text-foreground"
              >
                Términos de Uso
              </Link>
              <Link
                href="/cookies"
                className="text-muted-foreground transition-colors hover:text-foreground"
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
