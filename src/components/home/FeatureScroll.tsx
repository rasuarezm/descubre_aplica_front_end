
"use client";

import { useState } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

const features = [
  {
    step: 1,
    logo: '/logo-bidtory-descubre-neg.svg',
    title: 'Paso 1: Descubrimiento Inteligente',
    description: 'Con Bidtory Descubre, utilizamos IA para monitorear el mercado y encontrar las oportunidades perfectas. La inteligencia de mercado, a su alcance.',
    cta: {
      text: 'Conocer Bidtory Descubre',
      href: 'https://bidtory.co',
      external: true,
    },
    image: '/1-Bidtory Descubre.webp',
  },
  {
    step: 2,
    logo: '/logo-bidtory-aplica-neg.svg',
    title: 'Paso 2: Gestión Centralizada',
    description: 'Una vez identificada la oportunidad, la gestionamos en Bidtory Aplica, nuestro portal exclusivo. Tenga una visión completa del estado de todos sus proyectos en un solo lugar.',
    cta: null,
    image: '/5-Bidtory Aplica-Dashboard.webp',
  },
  {
    step: 3,
    logo: '/logo-bidtory-aplica-neg.svg',
    title: 'Paso 3: Ejecución y Cumplimiento',
    description: 'Hacemos seguimiento a cada documento requerido con nuestro checklist inteligente. Controle el progreso y asegure el cumplimiento de cada requisito, a tiempo.',
    cta: null,
    image: '/3-Bidtory Aplica-Checklist.webp',
  },
  {
    step: 4,
    logo: '/logo-bidtory-aplica-neg.svg',
    title: 'Paso 4: Colaboración y Cierre',
    description: 'Centralizamos toda la comunicación y los documentos de la propuesta en un espacio colaborativo y seguro. Desde la primera versión hasta la entrega final.',
    cta: {
      text: 'Acceso Clientes',
      href: '/login',
      external: false,
    },
    image: '/4-Bidtory Aplica-Bitacora.webp',
  },
  {
    step: 5,
    logo: '/logo-bidtory-aplica-neg.svg',
    title: 'Paso 5: Visión Estratégica del Pipeline',
    description: 'Visualice y gestione el flujo completo de todas sus oportunidades en un tablero Kanban intuitivo. Mida su rendimiento, identifique cuellos de botella y tome decisiones basadas en datos.',
    cta: {
      text: 'Acceso Clientes',
      href: '/login',
      external: false,
    },
    image: '/2-Bidtory Aplica-Pipeline.webp',
  },
];

export function FeatureScroll() {
  const [activeIndex, setActiveIndex] = useState(0);
  const activeFeature = features[activeIndex];

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

        {/* Left — image */}
        <div className="relative w-full rounded-xl border border-secondary overflow-hidden bg-card aspect-video lg:aspect-auto lg:h-[30rem]">
          {/* Preload all images — hidden except the active one */}
          {features.map((f, i) => (
            <Image
              key={f.step}
              src={f.image}
              fill
              sizes="(max-width: 1023px) 100vw, min(720px, 50vw)"
              alt={f.title}
              className={cn('object-cover transition-opacity duration-500', i === activeIndex ? 'opacity-100' : 'opacity-0')}
              priority={i === 0}
            />
          ))}
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
