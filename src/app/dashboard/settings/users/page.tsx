import { Suspense } from 'react';
import UsersClient from './UsersClient';

// Forzamos el renderizado dinámico en el servidor
export const dynamic = "force-dynamic";

export default function UserManagementPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center p-8">Cargando usuarios...</div>}>
      <UsersClient />
    </Suspense>
  );
}