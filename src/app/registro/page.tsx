import type { Metadata } from "next";
import { Suspense } from "react";
import { LegalLayout } from "@/components/layout/LegalLayout";
import { RegistroClient } from "./RegistroClient";

export const metadata: Metadata = {
  title: "Crear Cuenta - Bidtory",
  description:
    "Regístrese en Bidtory para acceder a oportunidades de contratación pública con IA.",
  robots: "noindex, nofollow",
};

function RegistroFallback() {
  return (
    <LegalLayout>
      <div className="flex min-h-[40vh] items-center justify-center">
        <p className="text-muted-foreground">Cargando formulario...</p>
      </div>
    </LegalLayout>
  );
}

export default function RegistroPage() {
  return (
    <Suspense fallback={<RegistroFallback />}>
      <RegistroClient />
    </Suspense>
  );
}
