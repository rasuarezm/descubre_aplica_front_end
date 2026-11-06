"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { LoginForm } from '@/components/auth/LoginForm';
import Link from 'next/link';
import { BidtoryLogo } from '@/components/icons/BidtoryLogo';
import { BidtoryRadarMark } from '@/components/icons/BidtoryRadarMark';
import { Button } from '@/components/ui/button';

export default function LoginClient() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user) {
      router.replace('/dashboard');
    }
  }, [user, router]);

  if (loading || user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <p>Cargando...</p>
      </div>
    );
  }

  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-gradient-to-br from-background via-background to-secondary/5 text-foreground">
      <BidtoryRadarMark
        aria-hidden="true"
        className="pointer-events-none absolute -left-32 -top-32 h-[420px] w-[420px] text-[#00A89A] opacity-[0.04]"
      />
      <BidtoryRadarMark
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-24 -right-24 h-[320px] w-[320px] text-[#00A89A] opacity-[0.05]"
      />
      <header className="sticky top-0 z-50 w-full bg-card/95 backdrop-blur-sm border-b border-border">
        <div className="container mx-auto flex h-14 items-center justify-between px-4 md:px-6">
          <Link href="/" className="flex items-center">
            <BidtoryLogo alt="Bidtory" className="h-12" />
          </Link>
          <Button
            variant="ghost"
            size="sm"
            className="text-foreground hover:text-foreground hover:bg-muted"
            asChild
          >
            <Link href="/contact">Contactar</Link>
          </Button>
        </div>
      </header>

       <main className="flex-1 flex items-center justify-center p-4 bg-background/30">
        <LoginForm />
       </main>

      <footer className="w-full py-4 bg-card/95 backdrop-blur-sm border-t border-border">
        <div className="container mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 px-4 md:px-6">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} Puro Contenido SAS. Bidtory®
          </p>
          <div className="flex gap-6 text-xs">
            <Link
              href="/privacidad"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              Privacidad
            </Link>
            <Link
              href="/terminos"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              Términos
            </Link>
            <Link
              href="/cookies"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              Cookies
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}