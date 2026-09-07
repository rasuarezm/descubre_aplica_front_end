"use client";

import type { ReactNode } from "react";
import { trackEvent } from "@/lib/analytics";

export const PURO_CONTENIDO_ENDORSEMENT_HREF =
  "https://purocontenido.com?utm_source=bidtory&utm_medium=referral&utm_campaign=endorsement";

function EndorsementLink({
  placement,
  children,
  className,
}: {
  placement: "header" | "footer";
  children: ReactNode;
  className?: string;
}) {
  return (
    <a
      href={PURO_CONTENIDO_ENDORSEMENT_HREF}
      target="_blank"
      rel="noopener noreferrer"
      className={className}
      onClick={() =>
        trackEvent("purocontenido_endorsement_click", { placement })
      }
    >
      {children}
    </a>
  );
}

export function PuroContenidoHeaderMark() {
  return (
    <EndorsementLink
      placement="header"
      className="hidden shrink-0 text-[11px] font-medium leading-tight tracking-wide text-muted-foreground/80 hover:text-muted-foreground sm:inline"
    >
      por Puro Contenido
    </EndorsementLink>
  );
}

export function PuroContenidoFooterClaim() {
  return (
    <p className="text-center text-sm text-muted-foreground md:text-left">
      Bidtory es una marca de{" "}
      <EndorsementLink
        placement="footer"
        className="font-medium text-foreground/80 underline-offset-2 hover:text-foreground hover:underline"
      >
        Puro Contenido S.A.S.
      </EndorsementLink>
      , firma cuyo equipo ha formulado proyectos aprobados por más de COP
      112.000 millones desde 2014.
    </p>
  );
}
