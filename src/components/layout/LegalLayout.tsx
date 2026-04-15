import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";

export function LegalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <header className="sticky top-0 z-50 w-full bg-white border-b border-border shadow-sm">
        <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-6">
          <Link href="/" className="flex items-center gap-2">
            <Image
              src="/logo-bidtory-838w.svg"
              alt="Bidtory - Licitaciones con IA"
              width={140}
              height={40}
              className="h-8 w-auto"
            />
          </Link>
          <nav className="hidden md:flex items-center gap-6">
            <Link
              href="/suscripciones"
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Planes
            </Link>
            <Link
              href="/#como-funciona"
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Cómo funciona
            </Link>
          </nav>
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/login">Iniciar Sesión</Link>
            </Button>
            <Button size="sm" className="bg-accent hover:bg-accent/90 text-accent-foreground" asChild>
              <Link href="/suscripciones">Suscribirse</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1">{children}</main>

      <footer className="w-full border-t border-border py-8 bg-[#E5E7EB] mt-auto">
        <div className="container mx-auto px-4 md:px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <Image
                src="/logo-bidtory-838w.svg"
                alt="Bidtory"
                width={120}
                height={34}
                className="h-8 w-auto opacity-80"
              />
              <p className="text-sm text-muted-foreground">
                © {new Date().getFullYear()} Puro Contenido SAS. Todos los
                derechos reservados. Bidtory™ es una marca comercial de Puro
                Contenido SAS.
              </p>
            </div>
            <div className="flex gap-6 text-sm">
              <Link
                href="/privacidad"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                Política de Privacidad
              </Link>
              <Link
                href="/terminos"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                Términos de Uso
              </Link>
              <Link
                href="/cookies"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                Política de Cookies
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
