
"use client";

import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppHeader } from "@/components/layout/AppHeader";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { useAuth } from "@/contexts/auth-context";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { AcceptTermsModal } from "@/components/auth/AcceptTermsModal";
import { DescubreProvider, useDescubre } from "@/contexts/descubre-context";
import { VerifyEmailBanner } from "@/components/auth/VerifyEmailBanner";
import { needsRegistrationCompletion } from "@/lib/registration";

/** Lleva a /registro a quien entró con una cuenta de Auth sin perfil. */
function RegistrationGate() {
  const { userProfile } = useAuth();
  const { perfilClienteFaltante } = useDescubre();
  const router = useRouter();
  const mustComplete = needsRegistrationCompletion(userProfile, perfilClienteFaltante);

  useEffect(() => {
    if (mustComplete) router.replace('/registro');
  }, [mustComplete, router]);

  return null;
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading, needsToAcceptTerms } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user === null) {
      router.replace('/login');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (!user || user.emailVerified) return;

    const interval = setInterval(async () => {
      try {
        await user.reload();
      } catch {
        // silencioso — puede fallar si hay problemas de red
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [user, user?.emailVerified]);

  if (loading || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Redirigiendo al inicio de sesión...</p>
      </div>
    );
  }

  return (
    <SidebarProvider defaultOpen>
      <DescubreProvider>
        <RegistrationGate />
        <AppSidebar />
        <SidebarInset>
          <AppHeader />
          {user && !user.emailVerified && <VerifyEmailBanner user={user} />}
          <main className="flex-1 overflow-auto p-6">
            {children}
          </main>
          {user && needsToAcceptTerms && (
            <AcceptTermsModal />
          )}
        </SidebarInset>
      </DescubreProvider>
    </SidebarProvider>
  );
}
