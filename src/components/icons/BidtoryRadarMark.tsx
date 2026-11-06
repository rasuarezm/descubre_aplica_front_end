import { cn } from "@/lib/utils";
import type { SVGProps } from "react";

/**
 * Símbolo oficial de `bidtory-favicon.svg`, sin la placa de fondo.
 * El arco superior hereda `currentColor` (accent / secondary); el inferior y el punto son navy,
 * o blancos en tema oscuro.
 */
export function BidtoryRadarMark({ className, ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="5 5 22 22"
      fill="none"
      {...props}
      className={cn("h-4 w-4", className)}
    >
      <path d="M8.64 20.25A8.5 8.5 0 0 1 23.36 11.75" stroke="currentColor" strokeWidth="5" />
      <path
        d="M23.36 11.75A8.5 8.5 0 0 1 8.64 20.25"
        strokeWidth="5"
        className="stroke-[#2C4F6B] dark:stroke-white"
      />
      <circle cx="16" cy="16" r="1.89" className="fill-[#2C4F6B] dark:fill-white" />
    </svg>
  );
}
