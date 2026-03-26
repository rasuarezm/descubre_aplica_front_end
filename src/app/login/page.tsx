import { Suspense } from 'react';
import LoginClient from './LoginClient';

// Al ser un Server Component, esta instrucción AHORA SÍ funciona garantizada
export const dynamic = "force-dynamic";

export default function LoginPage() {
  return (
    // El Suspense protege la carga del componente cliente
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Cargando entorno...</div>}>
      <LoginClient />
    </Suspense>
  );
}