"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FeatureScroll } from "@/components/home/FeatureScroll";
import {
  ArrowRight,
  Menu,
  X,
  Zap,
  FileText,
  Users,
  Bell,
  Search,
  ChevronRight,
  MessageCircle,
  ExternalLink,
  Star,
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
            <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
              <div className="order-1 flex flex-col lg:order-none">
                <span className="mb-6 inline-flex items-center gap-1.5 rounded-full border border-accent/30 bg-accent/8 px-3 py-1 text-xs font-medium text-accent">
                  <Zap className="h-3 w-3" />
                  Contratación pública · Fondos de fomento · Colombia
                </span>
                <h1 className="font-headline text-5xl font-semibold leading-[1.1] tracking-tight text-foreground md:text-6xl lg:text-[4.25rem]">
                  Encuentra las licitaciones que tu empresa puede ganar.
                </h1>
                <p className="mt-5 max-w-lg text-lg leading-relaxed text-muted-foreground">
                  Bidtory monitorea SECOP II y fondos de fomento con IA, puntúa
                  cada convocatoria según tu perfil y la lleva directo a tu
                  equipo de trabajo.
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

              <div className="relative order-2 w-full lg:order-none">
                <div className="relative flex w-full justify-center lg:justify-end">
                  <div className="relative w-full max-w-md">
                    <div
                      className="pointer-events-none absolute bottom-0 left-4 right-0 z-0 origin-bottom-right scale-[0.97] translate-x-3 translate-y-3 overflow-hidden rounded-xl border border-border border-l-4 border-l-accent bg-white opacity-60 shadow-sm"
                      aria-hidden
                    >
                      <div className="p-4">
                        <div className="mb-2 flex items-start justify-between gap-2">
                          <p className="line-clamp-2 text-sm font-semibold leading-snug text-foreground">
                            Consultoría para implementación de sistema de
                            información territorial — IGAC 2025
                          </p>
                        </div>
                        <div className="mt-3 flex flex-wrap gap-2">
                          <span className="inline-flex items-center rounded-md border border-border px-2 py-0.5 text-xs text-muted-foreground">
                            IGAC
                          </span>
                          <span className="inline-flex items-center rounded-md border border-border px-2 py-0.5 text-xs text-muted-foreground">
                            $1.200.000.000
                          </span>
                          <span className="inline-flex items-center rounded-md border border-border px-2 py-0.5 text-xs text-muted-foreground">
                            Ranking: 8/10
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="relative z-10 rounded-xl border border-border border-l-4 border-l-accent bg-white shadow-md">
                      <div className="border-b border-border/50 px-5 pb-3 pt-5">
                        <p className="mb-1.5 text-xs text-muted-foreground">
                          Procesado: 14 abr 2025
                        </p>
                        <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-foreground">
                          Suministro e implementación de plataforma de gestión
                          documental para entidades del sector público nacional
                        </h3>
                      </div>

                      <div className="space-y-3 px-5 py-4">
                        <p className="text-xs italic leading-relaxed text-muted-foreground">
                          &ldquo;Alta compatibilidad con el perfil. Requiere
                          experiencia en software para sector público — cumple
                          todos los criterios.&rdquo;
                        </p>

                        <div className="space-y-1.5 text-xs text-foreground/70">
                          <p>
                            <span className="font-medium text-foreground/85">
                              Modalidad:
                            </span>{" "}
                            Licitación Pública
                          </p>
                          <p>
                            <span className="font-medium text-foreground/85">
                              Fecha límite:
                            </span>{" "}
                            28 may 2025
                          </p>
                          <p>
                            <span className="font-medium text-foreground/85">
                              Ubicación:
                            </span>{" "}
                            Bogotá D.C.
                          </p>
                        </div>

                        <div className="flex flex-wrap gap-1.5 pt-0.5">
                          <span className="inline-flex items-center rounded-md bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                            Ministerio de TIC
                          </span>
                          <span className="inline-flex items-center rounded-md border border-border px-2 py-0.5 text-xs text-muted-foreground">
                            $850.000.000
                          </span>
                          <span className="inline-flex items-center gap-1 rounded-md border border-accent/30 bg-accent/8 px-2 py-0.5 text-xs font-semibold text-accent">
                            <Star className="h-3 w-3 fill-accent" />
                            9 / 10
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-col gap-2 px-5 pb-5">
                        <button
                          type="button"
                          className="flex w-full items-center justify-center gap-2 rounded-lg border border-accent/40 px-3 py-2 text-xs font-medium text-accent transition-colors hover:bg-accent/10"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                          Ver detalle en SECOP II
                        </button>
                        <button
                          type="button"
                          className="flex w-full items-center justify-center gap-2 rounded-lg bg-accent px-3 py-2 text-xs font-medium text-accent-foreground transition-colors hover:bg-accent/90"
                        >
                          <MessageCircle className="h-3.5 w-3.5" />
                          ¿Te interesa aplicar? Habla con un experto
                        </button>
                      </div>
                    </div>

                    <div className="pointer-events-none absolute -bottom-6 left-0 right-0 flex items-center justify-center gap-1.5">
                      <span className="h-1.5 w-4 rounded-full bg-accent/70" />
                      <span className="h-1.5 w-1.5 rounded-full bg-border" />
                      <span className="h-1.5 w-1.5 rounded-full bg-border" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Trust bar */}
        <section
          className="border-y border-border/60 bg-muted/30 py-4"
          aria-label="Señales de confianza"
        >
          <div className="container mx-auto flex flex-wrap items-center justify-center gap-x-8 gap-y-3 px-4 md:px-6">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Search className="h-3.5 w-3.5 shrink-0 text-accent" aria-hidden />
              SECOP II oficial
            </div>
            <span
              className="hidden h-4 w-px bg-border md:block"
              aria-hidden
            />
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Zap className="h-3.5 w-3.5 shrink-0 text-accent" aria-hidden />
              Gemini AI (Google)
            </div>
            <span
              className="hidden h-4 w-px bg-border md:block"
              aria-hidden
            />
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Bell className="h-3.5 w-3.5 shrink-0 text-accent" aria-hidden />
              Alertas diarias
            </div>
            <span
              className="hidden h-4 w-px bg-border md:block"
              aria-hidden
            />
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Users className="h-3.5 w-3.5 shrink-0 text-accent" aria-hidden />
              Equipos de hasta 5 personas
            </div>
            <span
              className="hidden h-4 w-px bg-border md:block"
              aria-hidden
            />
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <FileText
                className="h-3.5 w-3.5 shrink-0 text-accent"
                aria-hidden
              />
              Análisis de pliegos con IA
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
                Dos módulos. Un solo flujo.
              </h2>
              <p className="mx-auto mt-3 max-w-xl text-center text-muted-foreground">
                Descubre una oportunidad y llévala al pipeline con un clic.
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
                  Descubrimiento inteligente — tu radar de convocatorias con IA
                </p>
                <ul className="space-y-2.5">
                  {[
                    "Scoring Gemini por perfil de empresa",
                    "Alertas diarias por email",
                    "SECOP II + fondos de fomento",
                    "Dashboard de oportunidades",
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
                  Gestión y formulación — tu pipeline de licitaciones
                </p>
                <ul className="space-y-2.5">
                  {[
                    "Pipeline Kanban de oportunidades",
                    "Análisis de pliegos con IA",
                    "Checklist de documentos",
                    "Colaboración de equipo",
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
              Del hallazgo a la propuesta ganadora
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
              Un flujo continuo desde que detectamos la oportunidad hasta que tu
              equipo presenta la propuesta.
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
              <span className="mt-1.5 text-sm text-muted-foreground">
                Monitoreo de convocatorias activas
              </span>
            </div>
            <div className="flex flex-col items-center py-6 text-center md:py-0 md:px-10">
              <span className="text-4xl font-semibold tracking-tight text-foreground">
                &lt; 10 min
              </span>
              <span className="mt-1.5 text-sm text-muted-foreground">
                Para ver tus primeras oportunidades
              </span>
            </div>
            <div className="flex flex-col items-center py-6 text-center md:py-0 md:px-10">
              <span className="text-4xl font-semibold tracking-tight text-foreground">
                3 capas
              </span>
              <span className="mt-1.5 text-sm text-muted-foreground">
                Contratación pública · Fomento · Cooperación
              </span>
            </div>
          </div>
        </section>

        {/* CTA final */}
        <section className="w-full bg-background py-20 md:py-28">
          <div className="mx-auto max-w-2xl px-4 text-center md:px-6">
            <div className="rounded-2xl border border-border bg-card p-10 shadow-sm md:p-14">
              <h2 className="font-headline text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
                ¿Listo para encontrar tu próxima licitación?
              </h2>
              <p className="mx-auto mt-4 max-w-md text-base leading-relaxed text-muted-foreground">
                Empieza desde $149.000 COP/mes. Sin contratos. Cancela cuando
                quieras.
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
