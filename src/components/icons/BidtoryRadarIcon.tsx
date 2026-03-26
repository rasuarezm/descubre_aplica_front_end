
import { cn } from '@/lib/utils';
import type { SVGProps } from 'react';

export function BidtoryRadarIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
      className={cn("h-4 w-4", props.className)}
    >
      <path d="M12 4V2" />
      <path d="M12 22v-2" />
      <path d="M20 12h2" />
      <path d="M2 12h2" />
      <path d="M19.07 4.93l1.41-1.41" />
      <path d="M3.51 19.07l1.41-1.41" />
      <path d="M19.07 19.07l1.41 1.41" />
      <path d="M3.51 4.93l1.41 1.41" />
      <path d="M12 18a6 6 0 1 0 0-12 6 6 0 0 0 0 12z" />
      <path d="M12 14a2 2 0 1 0 0-4 2 2 0 0 0 0 4z" />
    </svg>
  );
}
