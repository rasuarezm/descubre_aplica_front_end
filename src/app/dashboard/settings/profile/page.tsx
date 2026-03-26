import { Suspense } from 'react';
import ProfileClient from './ProfileClient';

// Forzamos el renderizado dinámico en el servidor
export const dynamic = "force-dynamic";

export default function ProfilePage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center p-8">Cargando perfil...</div>}>
      <ProfileClient />
    </Suspense>
  );
}