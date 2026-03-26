
"use client";

import { Card } from "@/components/ui/card";
import type { UrgencyInfo } from '@/lib/date-utils';
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";

interface CountdownTimerProps {
  urgency: UrgencyInfo;
}

export function CountdownTimer({ urgency: initialUrgency }: CountdownTimerProps) {
  const [urgency, setUrgency] = useState(initialUrgency);

  useEffect(() => {
    setUrgency(initialUrgency);
  }, [initialUrgency]);

  // No need for a useEffect interval here as the parent component will re-render
  // and pass a new urgency prop if the data is refreshed.
  // This component is now primarily for displaying the formatted data.

  return (
    <Card className={cn(
      "p-2 text-center border-l-4 min-w-[120px]",
      urgency.status === 'overdue' && "border-destructive",
      urgency.status === 'urgent' && "border-destructive",
      urgency.status === 'upcoming' && "border-highlight",
      urgency.status === 'normal' && "border-transparent"
    )}>
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
    </Card>
  );
}
