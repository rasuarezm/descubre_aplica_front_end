"use client";

import { useState, useMemo, useEffect, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';
import type { DocumentItem, Observation, ObservationsResult } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Bot, Copy, Check, Loader2, Scale, AlertTriangle, RotateCcw, Info, FileCheck2, FileClock } from 'lucide-react';
import apiClient from '@/lib/api-client';
import { db } from '@/lib/firebase';
import { doc as firestoreDoc, onSnapshot } from 'firebase/firestore';

const CATEGORY_FINAL = 'Terminos de Referencia';
const CATEGORY_DRAFT = 'Borrador de Terminos de Referencia';

interface ObservationsGeneratorProps {
  opportunityId: string;
  tenderDocuments: DocumentItem[];
  observationsGenerationStatus?: string;
}

const TYPE_CONFIG: Record<string, { className: string }> = {
  'Jurídica':   { className: 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800' },
  'Técnica':    { className: 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800' },
  'Financiera': { className: 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800' },
};

function ObservationTypeBadge({ type }: { type: string }) {
  const config = TYPE_CONFIG[type] ?? {};
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${config.className ?? 'bg-muted text-muted-foreground'}`}>
      {type}
    </span>
  );
}

function DocRow({ doc, selectedDocIds, onChange }: {
  doc: DocumentItem;
  selectedDocIds: string[];
  onChange: (id: string, checked: boolean) => void;
}) {
  const docName = doc.fileName || (doc as DocumentItem & { filename?: string }).filename || doc.name;
  return (
    <div className="flex items-center space-x-3 p-2.5 rounded-md hover:bg-muted/60 transition-colors">
      <Checkbox
        id={`obs-doc-${doc.id}`}
        onCheckedChange={(checked) => onChange(doc.id, !!checked)}
        checked={selectedDocIds.includes(doc.id)}
      />
      <Label htmlFor={`obs-doc-${doc.id}`} className="cursor-pointer flex-1 leading-snug">
        <span className="font-medium text-sm">{docName}</span>
      </Label>
    </div>
  );
}

export function ObservationsGenerator({
  opportunityId,
  tenderDocuments,
  observationsGenerationStatus,
}: ObservationsGeneratorProps) {
  const { toast } = useToast();

  const [isGenerating, setIsGenerating] = useState(false);
  const [obsProgress, setObsProgress] = useState<{ progress: number; step: string } | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDocIds, setSelectedDocIds] = useState<string[]>([]);
  const [result, setResult] = useState<ObservationsResult | null>(null);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const unsubscribeRef = useRef<(() => void) | null>(null);

  // Al montar, carga la última observación guardada
  useEffect(() => {
    if (!opportunityId) return;
    apiClient.get<ObservationsResult>(`/get_observations?opportunity_id=${opportunityId}`)
      .then(data => { if (data) setResult(data); })
      .catch(() => {/* Sin observaciones previas — silencioso */});
  }, [opportunityId]);

  // Limpia el listener al desmontar
  useEffect(() => {
    return () => { unsubscribeRef.current?.(); };
  }, []);

  const startProgressListener = () => {
    unsubscribeRef.current?.();

    const unsub = onSnapshot(
      firestoreDoc(db, 'opportunities', opportunityId),
      async (snap) => {
        if (!snap.exists()) return;
        const data = snap.data();
        const status = data?.observations_generation_status as string | undefined;
        const progress = typeof data?.observations_generation_progress === 'number'
          ? data.observations_generation_progress
          : 0;
        const step = typeof data?.observations_generation_step === 'string'
          ? data.observations_generation_step
          : 'Procesando...';

        if (status === 'queued' || status === 'processing') {
          setObsProgress({ progress, step });
        } else if (status === 'completed') {
          unsub();
          unsubscribeRef.current = null;
          setObsProgress(null);
          setIsGenerating(false);

          // Fetch del resultado desde Firestore (get_observations)
          try {
            const obsData = await apiClient.get<ObservationsResult>(
              `/get_observations?opportunity_id=${opportunityId}`
            );
            if (obsData) {
              setResult(obsData);
              toast({
                title: "Observaciones generadas",
                description: `Se identificaron ${obsData.observations_count} hallazgo(s) en el pliego.`,
              });
            }
          } catch {
            toast({
              title: "Observaciones listas",
              description: "Las observaciones se generaron. Recargue la página si no aparecen.",
            });
          }
        } else if (status === 'failed') {
          unsub();
          unsubscribeRef.current = null;
          const errorMsg = data?.observations_generation_error || 'Error en la generación. Por favor, intente de nuevo.';
          setObsProgress(null);
          setIsGenerating(false);
          toast({ title: "Error al generar observaciones", description: errorMsg, variant: "destructive" });
        }
      },
      (error) => {
        console.warn('[ObservationsGenerator] onSnapshot error:', error);
      }
    );

    unsubscribeRef.current = unsub;
  };

  // Reanudar progreso si el usuario recargó mientras había generación en curso
  useEffect(() => {
    if (observationsGenerationStatus === 'queued' || observationsGenerationStatus === 'processing') {
      setIsGenerating(true);
      startProgressListener();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const { finalDocs, draftDocs, hasFinal, hasDraft } = useMemo(() => {
    const finalDocs = tenderDocuments.filter(d => d.tender_document_category === CATEGORY_FINAL);
    const draftDocs = tenderDocuments.filter(d => d.tender_document_category === CATEGORY_DRAFT);
    return { finalDocs, draftDocs, hasFinal: finalDocs.length > 0, hasDraft: draftDocs.length > 0 };
  }, [tenderDocuments]);

  const handleCheckboxChange = (id: string, checked: boolean) => {
    if (!id) return;
    setSelectedDocIds(prev =>
      checked ? [...prev.filter(x => x !== id), id] : prev.filter(docId => docId !== id)
    );
  };

  const handleOpenModal = () => {
    if (tenderDocuments.length === 0) {
      toast({ title: "Sin documentos disponibles", description: "No hay documentos del pliego cargados para analizar.", variant: "destructive" });
      return;
    }
    setSelectedDocIds([]);
    setIsModalOpen(true);
  };

  const handleConfirm = async () => {
    if (selectedDocIds.length === 0) {
      toast({ title: "Selección requerida", description: "Seleccione al menos un documento para continuar.", variant: "destructive" });
      return;
    }
    setIsModalOpen(false);
    setIsGenerating(true);

    try {
      // POST retorna 202 — el resultado llega por Firestore onSnapshot
      await apiClient.post('/generate_observations', {
        opportunity_id: opportunityId,
        document_ids: selectedDocIds,
      });

      startProgressListener();
    } catch (error) {
      setIsGenerating(false);
      toast({ title: "Error al generar observaciones", description: (error as Error).message, variant: "destructive" });
    }
  };

  const handleCopy = async (text: string, index: number) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch {
      toast({ title: "No se pudo copiar", variant: "destructive" });
    }
  };

  // --- Vista: Resultados ---
  if (result) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Scale className="h-5 w-5 text-highlight" />
              Observaciones al Pliego
            </CardTitle>
            <CardDescription>
              {result.observations_count} hallazgo(s) identificado(s) · Generado el{' '}
              {new Date(result.generated_at).toLocaleString('es-CO', {
                day: '2-digit', month: 'short', year: 'numeric',
                hour: '2-digit', minute: '2-digit',
              })}
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setResult(null)}
            className="shrink-0"
          >
            <RotateCcw className="mr-2 h-3 w-3" />
            Regenerar
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {result.observations.map((obs: Observation, index: number) => (
            <div key={index} className="border rounded-lg p-4 space-y-3 bg-card">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <ObservationTypeBadge type={obs.type} />
                <span className="text-xs text-muted-foreground font-mono truncate max-w-[60%] text-right">
                  {obs.reference}
                </span>
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-1">
                  Hallazgo
                </p>
                <p className="text-sm leading-relaxed">{obs.finding}</p>
              </div>
              <div className="bg-muted/50 rounded-md p-3 relative">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-1">
                  Borrador de Pregunta a la Entidad
                </p>
                <p className="text-sm leading-relaxed italic pr-8">{obs.question_draft}</p>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute top-2 right-2 h-7 w-7"
                  onClick={() => handleCopy(obs.question_draft, index)}
                  title="Copiar pregunta al portapapeles"
                >
                  {copiedIndex === index
                    ? <Check className="h-3.5 w-3.5 text-green-500" />
                    : <Copy className="h-3.5 w-3.5" />}
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  // --- Vista: Generando (progreso en tiempo real) ---
  if (isGenerating) {
    return (
      <Card className="bg-muted/50 border-dashed">
        <CardContent className="pt-6 flex flex-col items-center text-center gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-highlight" />
          <h3 className="text-lg font-semibold">Analizando el pliego…</h3>
          {obsProgress ? (
            <div className="w-full max-w-sm space-y-2">
              <Progress value={obsProgress.progress} className="h-2" />
              <p className="text-sm text-muted-foreground">{obsProgress.step}</p>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground max-w-md">
              Este proceso puede tardar varios minutos. Puede continuar en otras pestañas.
            </p>
          )}
        </CardContent>
      </Card>
    );
  }

  // --- Vista: Botón de generación ---
  return (
    <>
      <Card className="bg-muted/50 border-dashed">
        <CardContent className="pt-6 flex flex-col items-center text-center">
          <AlertTriangle className="h-10 w-10 text-amber-500 mb-3" />
          <h3 className="text-lg font-semibold">¿Desea plantear observaciones sobre este pliego?</h3>
          <p className="text-sm text-muted-foreground mb-4 max-w-md">
            Analice los documentos con IA para detectar contradicciones, requisitos que limiten
            la competencia, errores en cronogramas y ambigüedades técnicas. Obtenga borradores
            de preguntas formales listos para enviar a la entidad contratante.
          </p>

          {hasDraft && !hasFinal && (
            <div className="flex items-center gap-2 text-xs text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-md px-3 py-2 mb-4 max-w-md">
              <FileClock className="h-3.5 w-3.5 shrink-0" />
              <span>En este momento se analiza el <strong>borrador</strong>. Cuando disponga del pliego definitivo, podrá usar «Regenerar» para actualizar el análisis.</span>
            </div>
          )}
          {hasFinal && (
            <div className="flex items-center gap-2 text-xs text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md px-3 py-2 mb-4 max-w-md">
              <FileCheck2 className="h-3.5 w-3.5 shrink-0" />
              <span>Pliego definitivo disponible. Se recomienda analizar la versión definitiva.</span>
            </div>
          )}

          <Button onClick={handleOpenModal}>
            <Bot className="mr-2 h-4 w-4" />
            Generar Observaciones con IA
          </Button>
        </CardContent>
      </Card>

      {/* Modal: Selección de documentos */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Seleccionar Documentos para Analizar</DialogTitle>
            <DialogDescription>
              Elija los documentos del pliego sobre los que la IA debe identificar observaciones.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-1 py-4 max-h-[55vh] overflow-y-auto pr-2">
            {hasFinal && hasDraft && (
              <Alert className="mb-3 border-blue-200 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-800">
                <Info className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                <AlertDescription className="text-xs text-blue-700 dark:text-blue-300">
                  Existe un pliego definitivo y un borrador. Para observaciones formales a la entidad,
                  se recomienda usar el <strong>pliego definitivo</strong>.
                  El borrador puede resultar útil si el proceso aún se encuentra en período previo de consulta.
                </AlertDescription>
              </Alert>
            )}

            {tenderDocuments.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-6">
                No hay documentos cargados disponibles.
              </p>
            )}

            {finalDocs.length > 0 && (
              <div>
                <div className="flex items-center gap-2 px-1 py-1.5 mb-1">
                  <FileCheck2 className="h-3.5 w-3.5 text-green-600 shrink-0" />
                  <span className="text-xs font-semibold uppercase tracking-wider text-green-700 dark:text-green-400">
                    Pliego Definitivo
                  </span>
                </div>
                {finalDocs.map(doc => (
                  <DocRow key={doc.id} doc={doc} selectedDocIds={selectedDocIds} onChange={handleCheckboxChange} />
                ))}
              </div>
            )}

            {hasFinal && hasDraft && <Separator className="my-3" />}

            {draftDocs.length > 0 && (
              <div>
                <div className="flex items-center gap-2 px-1 py-1.5 mb-1">
                  <FileClock className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                  <span className="text-xs font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                    Borrador
                  </span>
                </div>
                {draftDocs.map(doc => (
                  <DocRow key={doc.id} doc={doc} selectedDocIds={selectedDocIds} onChange={handleCheckboxChange} />
                ))}
              </div>
            )}

            {(() => {
              const otherDocs = tenderDocuments.filter(
                d => d.tender_document_category !== CATEGORY_FINAL && d.tender_document_category !== CATEGORY_DRAFT
              );
              if (otherDocs.length === 0) return null;
              return (
                <div>
                  {(hasFinal || hasDraft) && <Separator className="my-3" />}
                  <div className="flex items-center gap-2 px-1 py-1.5 mb-1">
                    <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Otros Documentos
                    </span>
                  </div>
                  {otherDocs.map(doc => (
                    <DocRow key={doc.id} doc={doc} selectedDocIds={selectedDocIds} onChange={handleCheckboxChange} />
                  ))}
                </div>
              );
            })()}
          </div>

          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancelar</Button>
            </DialogClose>
            <Button onClick={handleConfirm} disabled={selectedDocIds.length === 0}>
              Analizar{selectedDocIds.length > 0 ? ` (${selectedDocIds.length})` : ''} Documento(s)
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
