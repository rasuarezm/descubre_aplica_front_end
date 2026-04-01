
"use client";

import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppHeader } from "@/components/layout/AppHeader";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { useAuth } from "@/contexts/auth-context";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { AcceptTermsModal } from "@/components/auth/AcceptTermsModal";
import { DescubreProvider } from "@/contexts/descubre-context";

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
        <AppSidebar />
        <SidebarInset>
          <AppHeader />
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
