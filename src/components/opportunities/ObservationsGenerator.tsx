
"use client";

import { useState, useMemo, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import type { DocumentItem, Observation, ObservationsResult } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Bot, Copy, Check, Loader2, Scale, AlertTriangle, RotateCcw, Info, FileCheck2, FileClock } from 'lucide-react';
import apiClient from '@/lib/api-client';

const CATEGORY_FINAL  = 'Terminos de Referencia';
const CATEGORY_DRAFT  = 'Borrador de Terminos de Referencia';

interface ObservationsGeneratorProps {
  opportunityId: string;
  tenderDocuments: DocumentItem[];
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
  selectedDocIds: number[];
  onChange: (id: string, checked: boolean) => void;
}) {
  const docName = doc.fileName || (doc as any).filename || doc.name;
  return (
    <div className="flex items-center space-x-3 p-2.5 rounded-md hover:bg-muted/60 transition-colors">
      <Checkbox
        id={`obs-doc-${doc.id}`}
        onCheckedChange={(checked) => onChange(doc.id, !!checked)}
        checked={selectedDocIds.includes(parseInt(doc.id, 10))}
      />
      <Label htmlFor={`obs-doc-${doc.id}`} className="cursor-pointer flex-1 leading-snug">
        <span className="font-medium text-sm">{docName}</span>
      </Label>
    </div>
  );
}

export function ObservationsGenerator({ opportunityId, tenderDocuments }: ObservationsGeneratorProps) {
  const { toast } = useToast();

  const [isLoading, setIsLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDocIds, setSelectedDocIds] = useState<number[]>([]);
  const [result, setResult] = useState<ObservationsResult | null>(null);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  // Al montar el componente, intentar cargar la última observación guardada
  useEffect(() => {
    if (!opportunityId) return;
    apiClient.get<ObservationsResult>(`/get_observations?opportunity_id=${opportunityId}`)
      .then(data => {
        if (data) setResult(data);
      })
      .catch(() => {
        // Sin observaciones previas — silencioso, no es un error crítico
      });
  }, [opportunityId]);

  // --- Clasificación de documentos por tipo de pliego ---
  const { finalDocs, draftDocs, hasFinal, hasDraft } = useMemo(() => {
    const finalDocs = tenderDocuments.filter(d => d.tender_document_category === CATEGORY_FINAL);
    const draftDocs = tenderDocuments.filter(d => d.tender_document_category === CATEGORY_DRAFT);
    // Otros documentos activos que no son ni borrador ni definitivo (adendas, anexos, etc.)
    const otherDocs = tenderDocuments.filter(
      d => d.tender_document_category !== CATEGORY_FINAL && d.tender_document_category !== CATEGORY_DRAFT
    );
    return {
      finalDocs,
      draftDocs,
      otherDocs,
      hasFinal: finalDocs.length > 0,
      hasDraft: draftDocs.length > 0,
    };
  }, [tenderDocuments]);

  const handleCheckboxChange = (id: string, checked: boolean) => {
    const numId = parseInt(id, 10);
    if (isNaN(numId)) return;
    setSelectedDocIds(prev =>
      checked ? [...prev, numId] : prev.filter(docId => docId !== numId)
    );
  };

  const handleOpenModal = () => {
    if (tenderDocuments.length === 0) {
      toast({
        title: "Sin documentos disponibles",
        description: "No hay documentos del pliego cargados para analizar.",
        variant: "destructive",
      });
      return;
    }
    setSelectedDocIds([]);
    setIsModalOpen(true);
  };

  const handleConfirm = async () => {
    if (selectedDocIds.length === 0) {
      toast({
        title: "Selección requerida",
        description: "Seleccione al menos un documento para continuar.",
        variant: "destructive",
      });
      return;
    }
    setIsModalOpen(false);
    setIsLoading(true);

    try {
      const data = await apiClient.post<ObservationsResult>('/generate_observations', {
        opportunity_id: opportunityId,
        document_ids: selectedDocIds,
      });
      setResult(data);
      toast({
        title: "Observaciones generadas",
        description: `Se identificaron ${data.observations_count} hallazgo(s) en el pliego.`,
      });
    } catch (error) {
      toast({
        title: "Error al generar observaciones",
        description: (error as Error).message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
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

  // --- Vista: Botón de generación ---
  return (
    <>
      <Card className="bg-muted/50 border-dashed">
        <CardContent className="pt-6 flex flex-col items-center text-center">
          <AlertTriangle className="h-10 w-10 text-amber-500 mb-3" />
          <h3 className="text-lg font-semibold">¿Hay algo que objetar en este pliego?</h3>
          <p className="text-sm text-muted-foreground mb-4 max-w-md">
            Analice los documentos con IA para detectar contradicciones, requisitos que limiten
            la competencia, errores en cronogramas y ambigüedades técnicas. Obtenga borradores
            de preguntas formales listos para enviar a la entidad contratante.
          </p>

          {/* Aviso contextual según el estado del pliego */}
          {hasDraft && !hasFinal && (
            <div className="flex items-center gap-2 text-xs text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-md px-3 py-2 mb-4 max-w-md">
              <FileClock className="h-3.5 w-3.5 shrink-0" />
              <span>Estás analizando el <strong>borrador</strong>. Cuando llegue el pliego definitivo, podrás usar "Regenerar" para actualizar el análisis.</span>
            </div>
          )}
          {hasFinal && (
            <div className="flex items-center gap-2 text-xs text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md px-3 py-2 mb-4 max-w-md">
              <FileCheck2 className="h-3.5 w-3.5 shrink-0" />
              <span>Pliego definitivo disponible. Se recomienda analizar la versión definitiva.</span>
            </div>
          )}

          <Button onClick={handleOpenModal} disabled={isLoading}>
            {isLoading
              ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Analizando pliego...</>
              : <><Bot className="mr-2 h-4 w-4" />Generar Observaciones con IA</>
            }
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

            {/* Alerta cuando coexisten borrador y definitivo */}
            {hasFinal && hasDraft && (
              <Alert className="mb-3 border-blue-200 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-800">
                <Info className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                <AlertDescription className="text-xs text-blue-700 dark:text-blue-300">
                  Existe un pliego definitivo y un borrador. Para observaciones formales a la entidad,
                  se recomienda usar el <strong>pliego definitivo</strong>.
                  El borrador puede ser útil si aún está en período previo de consulta.
                </AlertDescription>
              </Alert>
            )}

            {tenderDocuments.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-6">
                No hay documentos cargados disponibles.
              </p>
            )}

            {/* Grupo: Pliego Definitivo */}
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

            {/* Separador entre grupos cuando coexisten */}
            {hasFinal && hasDraft && <Separator className="my-3" />}

            {/* Grupo: Borrador */}
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

            {/* Otros documentos activos (adendas, anexos, etc.) */}
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
