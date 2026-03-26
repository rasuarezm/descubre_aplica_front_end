import { Suspense } from 'react';
import SettingsClient from './SettingsClient';

// Forzamos el renderizado dinámico en el servidor
export const dynamic = "force-dynamic";

export default function SettingsPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center p-8">Cargando configuración...</div>}>
      <SettingsClient />
    </Suspense>
  );
}