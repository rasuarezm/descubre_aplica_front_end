"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { LoginForm } from '@/components/auth/LoginForm';
import Link from 'next/link';
import Image from 'next/image';
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
    <div 
      className="flex flex-col min-h-screen bg-background text-foreground"
      style={{
        backgroundImage: `url('/bg-login-applica.webp')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center center',
        backgroundRepeat: 'no-repeat',
        backgroundAttachment: 'fixed'
      }}
    >
      <header className="sticky top-0 z-50 w-full bg-card/95 backdrop-blur-sm border-b border-border">
        <div className="container mx-auto flex h-14 items-center justify-between px-4 md:px-6">
          <Link href="/" className="flex items-center">
            <Image
              src="/logo-bidtory-color.svg"
              alt="Bidtory"
              width={130}
              height={36}
              className="h-8 w-auto"
            />
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

       <main className="flex-1 flex items-center justify-center p-4 bg-background/40">
        <LoginForm />
       </main>

      <footer className="w-full py-4 bg-card/95 backdrop-blur-sm border-t border-border">
        <div className="container mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 px-4 md:px-6">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} Puro Contenido SAS. Bidtory™
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