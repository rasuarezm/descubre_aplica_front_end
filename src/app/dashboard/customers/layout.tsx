"use client";

import { useAuth } from "@/contexts/auth-context";
import { ModuleBadge } from "@/components/layout/ModuleBadge";

export default function CustomersLayout({ children }: { children: React.ReactNode }) {
  const { userProfile } = useAuth();

  return (
    <div>
      {userProfile?.role === "customer" && <ModuleBadge module="aplica" />}
      {children}
    </div>
  );
}
