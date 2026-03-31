"use client";

import { useEffect, useRef, useState } from "react";
import { doc, onSnapshot, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { CustomerDocument } from "@/types";

export interface ExtractionProgress {
  status: "queued" | "processing" | "completed" | "failed";
  progress: number; // 0–100
  step: string; // texto visible al usuario
  startedAt: Date | null; // para calcular tiempo transcurrido
  error: string | null;
}

/**
 * Firma estable: solo ids de documentos en cola/proceso (ignora extraction_progress al comparar).
 * Así el polling del padre no recrea el listener de Firestore en cada tick.
 */
function extractingDocIdsKey(docs: CustomerDocument[]): string {
  return docs
    .filter(
      (d) =>
        d.financial_extraction_status === "queued" ||
        d.financial_extraction_status === "processing",
    )
    .map((d) => d.id)
    .sort()
    .join(",");
}

/**
 * Escucha en tiempo real el progreso de extracción del primer documento
 * de la categoría que esté en estado 'queued' o 'processing'.
 * Como el estado viene de Firestore (no de React state), es consistente
 * aunque el usuario navegue a otra sección y vuelva.
 */
export function useExtractionProgress(
  customerId: string,
  categoryDocuments: CustomerDocument[],
): ExtractionProgress | null {
  const [progress, setProgress] = useState<ExtractionProgress | null>(null);
  const categoryDocumentsRef = useRef(categoryDocuments);
  categoryDocumentsRef.current = categoryDocuments;

  const idsKey = extractingDocIdsKey(categoryDocuments);

  useEffect(() => {
    if (!idsKey) {
      setProgress(null);
      return;
    }

    const activeDoc = categoryDocumentsRef.current.find(
      (d) =>
        (d.financial_extraction_status === "queued" ||
          d.financial_extraction_status === "processing") &&
        idsKey.split(",").includes(String(d.id)),
    );

    if (!activeDoc) {
      setProgress(null);
      return;
    }

    const docRef = doc(
      db,
      "customers",
      customerId,
      "general_documents",
      activeDoc.id,
    );

    const unsubscribe = onSnapshot(docRef, (snap) => {
      if (!snap.exists()) return;
      const data = snap.data();

      const rawStartedAt = data.extraction_started_at;
      const startedAt =
        rawStartedAt instanceof Timestamp
          ? rawStartedAt.toDate()
          : rawStartedAt instanceof Date
            ? rawStartedAt
            : null;

      setProgress({
        status: data.financial_extraction_status ?? "processing",
        progress:
          typeof data.extraction_progress === "number"
            ? data.extraction_progress
            : 0,
        step: data.extraction_step ?? "Procesando…",
        startedAt,
        error: data.extraction_error ?? null,
      });
    });

    return () => unsubscribe();
  }, [customerId, idsKey]);

  return progress;
}
