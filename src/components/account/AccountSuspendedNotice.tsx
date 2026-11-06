"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useAccount } from "@/contexts/account-context";

// PENDIENTE DE APROBACIÓN del propietario: texto provisional, revisarlo antes de publicar.
const NOTICE_TITLE = "Su cuenta está suspendida";
const NOTICE_BODY =
  "Puede consultar sus datos, pero no crear oportunidades ni usar las funciones con IA. Para reactivarla, escríbanos.";
const NOTICE_ACTION = "Contactar";

/** Explica por qué hay acciones deshabilitadas en el portal. */
export function AccountSuspendedNotice() {
  const { suspended } = useAccount();
  if (!suspended) return null;

  return (
    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/40 px-6 py-3">
      <p className="text-sm text-amber-800 dark:text-amber-300">
        <strong>{NOTICE_TITLE}</strong> — {NOTICE_BODY}
      </p>
      <Button variant="outline" size="sm" asChild>
        <Link href="/contact">{NOTICE_ACTION}</Link>
      </Button>
    </div>
  );
}
