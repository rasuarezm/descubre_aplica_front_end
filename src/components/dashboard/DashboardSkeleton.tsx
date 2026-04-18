'use client';

import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

/**
 * Placeholder mientras cargan auth, contexto Descubre y datos del panel principal.
 * Alineado con el layout de clientes (cabecera + dos tarjetas Descubre / Aplica).
 */
export function DashboardSkeleton() {
  return (
    <div
      className="min-h-[calc(100vh-theme(spacing.28))] space-y-8"
      aria-busy="true"
      aria-label="Cargando el panel"
    >
      <div className="space-y-2">
        <Skeleton className="h-9 w-[min(100%,18rem)] md:h-10" />
        <Skeleton className="h-4 w-52 max-w-full" />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {[0, 1].map((i) => (
          <Card key={i} className="overflow-hidden">
            <CardHeader className="space-y-3 pb-3">
              <div className="flex items-center justify-between">
                <Skeleton className="h-7 w-36" />
                <Skeleton className="h-4 w-4 shrink-0 rounded" />
              </div>
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-[92%]" />
            </CardHeader>
            <CardContent className="space-y-3 pt-0">
              <div className="grid grid-cols-3 gap-2 border-t border-border/50 py-3">
                <Skeleton className="mx-auto h-8 w-10" />
                <Skeleton className="mx-auto h-8 w-10" />
                <Skeleton className="mx-auto h-8 w-10" />
              </div>
              <Skeleton className="h-4 w-44" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
