import { Suspense } from 'react';
import DashboardClient from './DashboardClient';

// Forzamos el renderizado dinámico en el servidor
export const dynamic = "force-dynamic";

export default function DashboardPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center p-8">Cargando panel...</div>}>
      <DashboardClient />
    </Suspense>
  );
}