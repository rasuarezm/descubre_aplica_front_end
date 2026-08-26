"use client";

import Image from "next/image";
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
        <Image
          src="/logo-bidtory-radar-pos.svg"
          alt=""
          aria-hidden="true"
          width={18}
          height={18}
          className="h-[18px] w-[18px]"
        />
        <span className="text-xs font-bold uppercase tracking-wider">{cfg.label}</span>
      </div>
      <div className={cn("mt-3 h-[3px] w-full rounded-full bg-gradient-to-r to-transparent", cfg.fromClass)} />
    </div>
  );
}
