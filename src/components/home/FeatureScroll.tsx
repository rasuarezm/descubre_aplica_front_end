
"use client";

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

type FeatureCta = {
  text: string;
  href: string;
  external: boolean;
} | null;

type FeatureItem = {
  step: number;
  logo: string;
  title: string;
  description: string;
  cta: FeatureCta;
  /** Una sola imagen por paso */
  image?: string;
  /** Varias vistas del mismo paso (p. ej. capturas apiladas del análisis IA) */
  images?: string[];
  /** Textos cortos para accesibilidad / pies de vista */
  imageCaptions?: string[];
};

const features: FeatureItem[] = [
  {
    step: 1,
    logo: '/logo-bidtory-descubre-pos.svg',
    title: 'Paso 1: Su radar de convocatorias',
    description:
      'Bidtory Descubre monitorea SECOP II, fondos de fomento y cooperación internacional cada día. Gemini analiza cada convocatoria y la puntúa según el perfil de su empresa. Usted solo ve lo que realmente le aplica.',
    cta: {
      text: 'Conocer Descubre',
      href: '/suscripciones',
      external: false,
    },
    image: '/2-Bidtory%20Descubre-Oportunidades.webp',
  },
  {
    step: 2,
    logo: '/logo-bidtory-aplica-pos.svg',
    title: 'Paso 2: Lleva al pipeline con un clic',
    description:
      'Cuando Descubre identifica una oportunidad relevante, usted la lleva a Bidtory Aplica en un clic. Su pipeline Kanban muestra el estado de sus licitaciones activas —por ejemplo prospecto, en desarrollo, enviada y cierre del proceso— con una vista clara para todo el equipo.',
    cta: null,
    image: '/2-Bidtory%20Aplica-PipelinePasos.webp',
  },
  {
    step: 3,
    logo: '/logo-bidtory-aplica-pos.svg',
    title: 'Paso 3: Análisis IA del pliego',
    description:
      'En la pestaña Análisis IA, Bidtory resume el pliego y los requisitos habilitantes, y en una segunda vista muestra el diagnóstico de elegibilidad frente al perfil de su empresa y el checklist de documentos sugerido. Use las vistas 1 y 2 debajo de la imagen para recorrer ambas pantallas con texto legible.',
    cta: null,
    images: [
      '/2-Bidtory%20Aplica-AnalisisAi-1.webp',
      '/2-Bidtory%20Aplica-AnalisisAi-2.webp',
    ],
    imageCaptions: [
      'Análisis IA: resumen técnico y requisitos habilitantes',
      'Análisis IA: elegibilidad y checklist de documentos sugerido',
    ],
  },
  {
    step: 4,
    logo: '/logo-bidtory-aplica-pos.svg',
    title: 'Paso 4: Checklist y documentos de la propuesta',
    description:
      'En la pestaña Checklist concentra lo que exige el proceso: biblioteca de documentos del pliego (pliego, anexos, adendas) y el checklist oficial con ítems como garantía de seriedad y carta de presentación. Los documentos que la IA sugirió al analizar el pliego (por ejemplo certificación ISO 27001 o carta de alianza técnica) quedan identificados para que no se pierdan entre el resto de requisitos.',
    cta: {
      text: 'Acceso clientes',
      href: '/login',
      external: false,
    },
    image: '/2-Bidtory%20Aplica-Checklist.webp',
  },
  {
    step: 5,
    logo: '/logo-bidtory-aplica-pos.svg',
    title: 'Paso 5: Bitácora y trazabilidad',
    description:
      'En la pestaña Bitácora, los perfiles de jurídica revisan y validan requisitos y riesgos; los de gestión y formulación documentan acuerdos y el estado de los documentos asociados a la propuesta. Todo queda registrado en un solo hilo por licitación, con trazabilidad clara para auditorías o revisiones internas, sin perder el contexto entre correos dispersos.',
    cta: {
      text: 'Acceso clientes',
      href: '/login',
      external: false,
    },
    image: '/2-Bidtory%20Aplica-Bitacora.webp',
  },
];

export function FeatureScroll() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [subImageIndex, setSubImageIndex] = useState(0);
  const activeFeature = features[activeIndex];

  useEffect(() => {
    setSubImageIndex(0);
  }, [activeIndex]);

  return (
    <div className="container mx-auto px-4 md:px-6">

      {/* Tab navigation */}
      <div className="flex items-center justify-center gap-2 mb-10 flex-wrap">
        {features.map((f, i) => (
          <button
            key={f.step}
            onClick={() => setActiveIndex(i)}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 border',
              i === activeIndex
                ? 'bg-accent text-accent-foreground border-accent shadow-md shadow-accent/20'
                : 'border-white/15 text-foreground/60 hover:text-foreground hover:border-white/30 bg-transparent'
            )}
          >
            <span
              className={cn(
                'w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold shrink-0',
                i === activeIndex ? 'bg-accent-foreground/20' : 'bg-white/10'
              )}
            >
              {f.step}
            </span>
            <span className="hidden sm:inline">
              {f.title.split(':')[0].replace('Paso ', 'Paso ')}
            </span>
          </button>
        ))}
      </div>

      {/* Content panel */}
      <div className="relative grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">

        {/* Left — image(s) */}
        <div className="relative w-full rounded-xl border border-secondary overflow-hidden bg-muted/40 aspect-video lg:aspect-auto lg:min-h-[22rem] lg:h-[min(36rem,70vh)]">
          {features.map((f, i) => {
            if (i !== activeIndex) return null;
            const multi = f.images && f.images.length > 1;
            if (multi) {
              return (
                <div key={f.step} className="absolute inset-0">
                  {f.images!.map((src, idx) => (
                    <Image
                      key={src}
                      src={src}
                      fill
                      sizes="(max-width: 1023px) 100vw, min(720px, 50vw)"
                      alt={
                        f.imageCaptions?.[idx] ??
                        `${f.title} — vista ${idx + 1} de ${f.images!.length}`
                      }
                      className={cn(
                        'absolute inset-0 object-contain object-center transition-opacity duration-300',
                        idx === subImageIndex
                          ? 'z-10 opacity-100'
                          : 'z-0 opacity-0 pointer-events-none'
                      )}
                      priority={idx === 0}
                    />
                  ))}
                  <div
                    className="absolute bottom-3 left-0 right-0 z-20 flex flex-col items-center gap-2 px-2"
                    role="group"
                    aria-label="Vistas del análisis IA"
                  >
                    <p className="text-[11px] text-muted-foreground/90 sm:text-xs">
                      Vista {subImageIndex + 1} de {f.images!.length}
                    </p>
                    <div className="flex items-center gap-2">
                      {f.images!.map((_, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setSubImageIndex(idx)}
                          className={cn(
                            'rounded-full transition-all duration-200 h-2.5',
                            idx === subImageIndex
                              ? 'w-7 bg-accent'
                              : 'w-2.5 bg-white/20 hover:bg-white/40'
                          )}
                          aria-label={`Mostrar vista ${idx + 1} de ${f.images!.length}`}
                          aria-current={idx === subImageIndex ? 'true' : undefined}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              );
            }
            return (
              <Image
                key={f.step}
                src={f.image!}
                fill
                sizes="(max-width: 1023px) 100vw, min(720px, 50vw)"
                alt={f.title}
                className="object-contain object-center transition-opacity duration-500 opacity-100"
                priority={i === 0}
              />
            );
          })}
        </div>

        {/* Right — text */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeIndex}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.35, ease: 'easeInOut' }}
            className="flex flex-col items-start text-left space-y-4"
          >
            <Image
              src={activeFeature.logo}
              alt={`${activeFeature.title} logo`}
              width={192}
              height={48}
              className="h-auto w-44"
            />
            <h3 className="text-2xl md:text-3xl font-bold font-headline leading-snug">
              {activeFeature.title}
            </h3>
            <p className="text-foreground/75 md:text-lg leading-relaxed max-w-lg">
              {activeFeature.description}
            </p>

            {activeFeature.cta && (
              <Button
                size="lg"
                variant={activeFeature.cta.external ? 'default' : 'outline'}
                className={cn(
                  'mt-2',
                  activeFeature.cta.external && 'bg-accent hover:bg-accent/90 text-accent-foreground rounded-md'
                )}
                asChild
              >
                {activeFeature.cta.external ? (
                  <a href={activeFeature.cta.href} target="_blank" rel="noopener noreferrer">
                    {activeFeature.cta.text} <ArrowRight className="ml-2 h-4 w-4" />
                  </a>
                ) : (
                  <Link href={activeFeature.cta.href}>
                    {activeFeature.cta.text} <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                )}
              </Button>
            )}

            {/* Step dots */}
            <div className="flex items-center gap-2 pt-4">
              {features.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setActiveIndex(i)}
                  className={cn(
                    'rounded-full transition-all duration-200',
                    i === activeIndex
                      ? 'w-6 h-2 bg-accent'
                      : 'w-2 h-2 bg-white/25 hover:bg-white/50'
                  )}
                  aria-label={`Ir al paso ${i + 1}`}
                />
              ))}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
