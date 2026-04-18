'use client';

import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

/**
 * Placeholder mientras cargan datos de la oportunidad (cabecera, resumen, pestañas).
 */
export function OpportunityDetailSkeleton() {
  return (
    <div
      className="space-y-8"
      aria-busy="true"
      aria-label="Cargando la oportunidad"
    >
      <div>
        <Skeleton className="mb-4 h-4 w-40" />
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <Skeleton className="h-9 w-[min(100%,28rem)]" />
          <Skeleton className="h-9 w-[7.5rem] shrink-0 rounded-md" />
        </div>

        <Card className="mt-4 bg-card">
          <CardContent className="space-y-2 pt-6">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-[85%]" />
          </CardContent>
        </Card>

        <section
          aria-hidden
          className="mt-4 overflow-hidden rounded-xl border border-border bg-card shadow-sm"
        >
          <div className="grid grid-cols-1 divide-y divide-border lg:grid-cols-3 lg:divide-x lg:divide-y-0">
            {[0, 1, 2].map((i) => (
              <div key={i} className="border-l-4 border-l-border p-4 sm:p-5">
                <div className="flex flex-row items-center justify-between gap-2 pb-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-4 rounded" />
                </div>
                <Skeleton className="mt-2 h-8 w-36" />
                <Skeleton className="mt-2 h-3 w-full max-w-[10rem]" />
              </div>
            ))}
          </div>
        </section>

        <div className="mt-4 overflow-hidden rounded-xl border border-border bg-card shadow-sm">
          <div className="bg-muted/15 px-4 py-4 sm:px-5 sm:py-5">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div className="space-y-1">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-3 w-56 max-w-full" />
              </div>
              <Skeleton className="h-4 w-36 shrink-0 sm:ml-auto" />
            </div>
            <Skeleton className="mt-3 h-2 w-full rounded-full" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <div
            className="flex flex-col gap-1 rounded-lg border border-border bg-muted/30 p-1.5 sm:flex-row sm:gap-0 sm:rounded-none sm:border-0 sm:border-b sm:border-border sm:bg-transparent sm:p-0"
            aria-hidden
          >
            {[0, 1, 2, 3].map((i) => (
              <Skeleton
                key={i}
                className="h-11 w-full rounded-md sm:flex-1 sm:rounded-none"
              />
            ))}
          </div>
          <div className="space-y-4">
            <Skeleton className="h-36 w-full rounded-lg" />
            <Skeleton className="h-44 w-full rounded-lg" />
          </div>
        </div>
        <div className="lg:col-span-1">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-4">
              <Skeleton className="h-6 w-40" />
              <Skeleton className="h-9 w-28 rounded-md" />
            </CardHeader>
            <CardContent className="space-y-4">
              <Skeleton className="h-20 w-full rounded-md" />
              <Skeleton className="h-16 w-full rounded-md" />
              <Skeleton className="h-16 w-full rounded-md" />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
