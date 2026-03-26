// src/app/not-found.tsx

import Link from 'next/link';

// --- ESTA ES LA LÍNEA QUE ARREGLA EL ERROR DE DESPLIEGUE ---
export const dynamic = "force-dynamic";
// -----------------------------------------------------------

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 px-4 text-center">
      <h2 className="text-4xl font-bold text-gray-900 mb-4">404</h2>
      <p className="text-xl text-gray-600 mb-8">No pudimos encontrar la página que buscas.</p>
      <Link 
        href="/dashboard"
        className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
      >
        Volver al Inicio
      </Link>
    </div>
  );
}