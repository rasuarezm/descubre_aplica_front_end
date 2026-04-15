import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from '@/contexts/auth-context';
import { DM_Sans, Playfair_Display } from 'next/font/google';
import { Analytics } from '@/components/Analytics';
import { CookieConsent } from '@/components/CookieConsent';

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-dm-sans',
  display: 'swap',
});

const playfairDisplay = Playfair_Display({
  subsets: ['latin'],
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
          <Analytics />
          <CookieConsent />
        </AuthProvider>
      </body>
    </html>
  );
}
