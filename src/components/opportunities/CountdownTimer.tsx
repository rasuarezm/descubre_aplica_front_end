
"use client";

import { Card } from "@/components/ui/card";
import type { UrgencyInfo } from '@/lib/date-utils';
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";

interface CountdownTimerProps {
  urgency: UrgencyInfo;
  /** `plain`: solo contenido, para meter dentro de una stat card que ya define el borde. */
  variant?: "card" | "plain";
}

export function CountdownTimer({ urgency: initialUrgency, variant = "card" }: CountdownTimerProps) {
  const [urgency, setUrgency] = useState(initialUrgency);

  useEffect(() => {
    setUrgency(initialUrgency);
  }, [initialUrgency]);

  const inner = (
    <>
      {urgency.status === 'overdue' ? (
        <div className={cn("font-bold", urgency.cssClass)}>
          {urgency.label}
        </div>
      ) : (
        <>
          <div className={cn("text-xl font-bold tracking-tighter", urgency.cssClass)}>
            {urgency.timeValue}
          </div>
          <div className="text-xs text-muted-foreground -mt-1">
            {urgency.label}
          </div>
        </>
      )}
      <div className="text-xs text-muted-foreground/80 mt-1">
        Cierra: {urgency.deadlineFormatted}
      </div>
    </>
  );

  if (variant === "plain") {
    return <div className="min-w-0 py-1 text-center">{inner}</div>;
  }

  return (
    <Card
      className={cn(
        "min-w-[120px] border-l-4 p-2 text-center",
        urgency.status === "overdue" && "border-l-urgency",
        urgency.status === "urgent" && "border-l-highlight",
        urgency.status === "upcoming" && "border-l-highlight",
        urgency.status === "normal" && "border-l-transparent",
      )}
    >
      {inner}
    </Card>
  );
}
