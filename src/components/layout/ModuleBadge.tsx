"use client";

import { BidtoryRadarMark } from "@/components/icons/BidtoryRadarMark";
import { cn } from "@/lib/utils";

const MODULE_CONFIG = {
  descubre: { label: "Descubre", textClass: "text-accent", fromClass: "from-accent" },
  aplica: { label: "Aplica", textClass: "text-secondary", fromClass: "from-secondary" },
} as const;

export function ModuleBadge({ module }: { module: keyof typeof MODULE_CONFIG }) {
  const cfg = MODULE_CONFIG[module];
  return (
    <div className="mb-5">
      <div className={cn("flex items-center gap-2", cfg.textClass)}>
        <BidtoryRadarMark className="h-[18px] w-[18px]" aria-hidden="true" />
        <span className="text-xs font-bold uppercase tracking-wider">{cfg.label}</span>
      </div>
      <div className={cn("mt-3 h-[3px] w-full rounded-full bg-gradient-to-r to-transparent", cfg.fromClass)} />
    </div>
  );
}
