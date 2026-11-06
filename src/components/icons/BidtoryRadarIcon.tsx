
import { cn } from '@/lib/utils';
import type { SVGProps } from 'react';

/** Símbolo monocromo oficial de `bidtory-ink.svg`: hereda el color del botón. */
export function BidtoryRadarIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="1848 -516 536 536"
      fill="none"
      {...props}
      className={cn("h-4 w-4", props.className)}
    >
      <path d="M1929.71 -160.07A206 206 0 0 1 2285.29 -365.37" stroke="currentColor" strokeWidth="124" />
      <path d="M2302.29 -335.93A206 206 0 0 1 1946.71 -130.63" stroke="currentColor" strokeWidth="124" />
      <circle cx="2116" cy="-248" r="46" fill="currentColor" />
    </svg>
  );
}
