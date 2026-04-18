'use client';

import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

/**
 * Placeholder mientras carga la zona de cliente (oportunidades + biblioteca).
 */
export function CustomerZoneSkeleton() {
  return (
    <div
      className="space-y-8"
      aria-busy="true"
      aria-label="Cargando la zona de cliente"
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-4">
          <Skeleton className="h-[100px] w-[100px] shrink-0 rounded-lg" />
          <div className="min-w-0 space-y-2">
            <Skeleton className="h-9 w-[min(100%,18rem)]" />
            <Skeleton className="h-4 w-full max-w-md" />
            <Skeleton className="h-4 w-full max-w-sm" />
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Skeleton className="h-9 w-36 rounded-md" />
          <Skeleton className="h-9 w-36 rounded-md" />
          <Skeleton className="h-9 w-44 rounded-md" />
        </div>
      </div>

      <section
        aria-hidden
        className="overflow-hidden rounded-xl border border-border bg-card shadow-sm"
      >
        <div className="grid grid-cols-1 gap-px bg-border md:grid-cols-2 lg:grid-cols-5">
          {[0, 1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-card p-4 sm:p-5">
              <div className="flex items-center justify-between gap-2 pb-2">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-4 w-4 rounded" />
              </div>
              <Skeleton className="mt-2 h-8 w-32" />
              <Skeleton className="mt-2 h-3 w-full max-w-[10rem]" />
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-4 border-t border-border pt-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <Skeleton className="h-8 w-56" />
          <Skeleton className="h-10 w-full rounded-md md:w-[180px]" />
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <Card key={i} className="overflow-hidden border-l-4 border-l-primary/30">
              <CardHeader className="space-y-2">
                <Skeleton className="h-6 w-full" />
                <Skeleton className="h-4 w-[90%]" />
              </CardHeader>
              <CardContent className="space-y-3">
                <Skeleton className="h-7 w-32" />
                <div className="flex gap-2">
                  <Skeleton className="h-5 w-20 rounded-full" />
                  <Skeleton className="h-5 w-24 rounded-full" />
                </div>
                <Skeleton className="h-4 w-full max-w-[14rem]" />
              </CardContent>
              <CardFooter>
                <Skeleton className="h-10 w-full rounded-md" />
              </CardFooter>
            </Card>
          ))}
        </div>
      </section>

      <section className="space-y-4 border-t border-border pt-8">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-12 w-full rounded-lg" />
        <Skeleton className="h-12 w-full rounded-lg" />
      </section>
    </div>
  );
}
