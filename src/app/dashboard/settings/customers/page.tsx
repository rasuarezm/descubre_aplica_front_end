import { Suspense } from 'react';
import CustomersClient from './CustomersClient';

// Forzamos el renderizado dinámico en el servidor
export const dynamic = "force-dynamic";

export default function CustomerManagementPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center p-8">Cargando clientes...</div>}>
      <CustomersClient />
    </Suspense>
  );
}