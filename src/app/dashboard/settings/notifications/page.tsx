import { Suspense } from 'react';
import NotificationsClient from './NotificationsClient';

// Forzamos el renderizado dinámico en el servidor
export const dynamic = "force-dynamic";

export default function NotificationsPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center p-8">Cargando preferencias...</div>}>
      <NotificationsClient />
    </Suspense>
  );
}