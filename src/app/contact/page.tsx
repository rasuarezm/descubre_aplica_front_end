import { Suspense } from 'react';
import ContactClient from './ContactClient';

// Esta línea AHORA SÍ funcionará porque estamos en un Server Component
export const dynamic = "force-dynamic";

export default function ContactPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Cargando...</div>}>
      <ContactClient />
    </Suspense>
  );
}