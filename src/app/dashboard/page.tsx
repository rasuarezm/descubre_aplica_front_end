import { Suspense } from 'react';
import DashboardClient from './DashboardClient';
import { DashboardSkeleton } from '@/components/dashboard/DashboardSkeleton';

// Forzamos el renderizado dinámico en el servidor
export const dynamic = "force-dynamic";

export default function DashboardPage() {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <DashboardClient />
    </Suspense>
  );
}