import { Suspense } from 'react';
import CustomersRedirectClient from './CustomersRedirectClient';

// Forzamos que esta ruta sea dinámica para evitar errores de construcción
export const dynamic = "force-dynamic";

export default function CustomersRedirectPage() {
  return (
    <Suspense fallback={<div>Cargando...</div>}>
      <CustomersRedirectClient />
    </Suspense>
  );
}