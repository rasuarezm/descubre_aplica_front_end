import Image from 'next/image';
import { cn } from '@/lib/utils';

const LOGO_WIDTH = 487;
const LOGO_HEIGHT = 214;

interface BidtoryLogoProps {
  alt: string;
  className?: string;
  /** `dark` fuerza la versión blanca sobre superficies siempre oscuras o de color. */
  surface?: 'auto' | 'dark';
}

/**
 * Logo oficial (`NuevoSitioPC/Identidad/Bidtory/logos-outlined/Bidtory`): positivo en tema claro
 * y blanco en oscuro. `bidtory-negative.svg` no se usa porque trae un fondo opaco propio.
 * El viewBox incluye margen de seguridad: no recortarlo; el tamaño se limita con la altura.
 */
export function BidtoryLogo({ alt, className, surface = 'auto' }: BidtoryLogoProps) {
  const sizing = cn('w-auto object-contain', className);

  if (surface === 'dark') {
    return <Image src="/brand/bidtory-white.svg" alt={alt} width={LOGO_WIDTH} height={LOGO_HEIGHT} className={sizing} />;
  }

  return (
    <>
      <Image
        src="/brand/bidtory-positive.svg"
        alt={alt}
        width={LOGO_WIDTH}
        height={LOGO_HEIGHT}
        className={cn(sizing, 'dark:hidden')}
      />
      <Image
        src="/brand/bidtory-white.svg"
        alt={alt}
        width={LOGO_WIDTH}
        height={LOGO_HEIGHT}
        className={cn(sizing, 'hidden dark:block')}
      />
    </>
  );
}

const MODULE_LABELS = { descubre: 'Descubre', aplica: 'Aplica' } as const;

interface BidtoryModuleLogoProps {
  module: keyof typeof MODULE_LABELS;
  className?: string;
  logoClassName?: string;
  surface?: BidtoryLogoProps['surface'];
}

/** El kit no trae versión de módulo: logo oficial sin modificar y el nombre del módulo como texto. */
export function BidtoryModuleLogo({ module, className, logoClassName = 'h-12', surface = 'auto' }: BidtoryModuleLogoProps) {
  return (
    <span className={cn('inline-flex items-center gap-3', className)}>
      <BidtoryLogo alt="Bidtory" className={logoClassName} surface={surface} />
      <span
        className={cn(
          'border-l pl-3 text-xs font-bold uppercase tracking-wider',
          surface === 'dark' ? 'border-white/40' : 'border-border text-muted-foreground'
        )}
      >
        {MODULE_LABELS[module]}
      </span>
    </span>
  );
}
