import type { Metadata } from 'next';
import { Suspense } from 'react';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from '@/contexts/auth-context';
import localFont from 'next/font/local';
import { Analytics } from '@/components/Analytics';
import { CookieConsent } from '@/components/CookieConsent';

// Fuentes en el repositorio: next/font/google las descarga durante el build y falla sin red.
const dmSans = localFont({
  src: './fonts/dm-sans-latin-wght-normal.woff2',
  weight: '100 1000',
  style: 'normal',
  variable: '--font-dm-sans',
  display: 'swap',
});

const playfairDisplay = localFont({
  src: './fonts/playfair-display-latin-wght-normal.woff2',
  weight: '400 900',
  style: 'normal',
  variable: '--font-playfair-display',
  display: 'swap',
});


export const metadata: Metadata = {
  title: 'Bidtory - Estrategia y Tecnología para Licitaciones',
  description: 'Transformamos datos en oportunidades ganadoras con consultoría experta y tecnología Bidtory para licitaciones.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={`${dmSans.variable} ${playfairDisplay.variable}`}>
      <body className="font-body antialiased bg-background">
        <AuthProvider>
          {children}
          <Toaster />
          <Suspense fallback={null}>
            <Analytics />
          </Suspense>
          <CookieConsent />
        </AuthProvider>
      </body>
    </html>
  );
}
