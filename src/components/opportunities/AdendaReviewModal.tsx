
"use client";

import { useState, useMemo } from 'react';
import type { AdendaAnalysis } from '@/types';
import { useAuth } from '@/contexts/auth-context';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Lightbulb, Calendar, FilePlus, FileText, Check, Loader2, ArrowRight } from 'lucide-react';
import { format, parseISO, isValid } from 'date-fns';
import { es } from 'date-fns/locale';
import apiClient from '@/lib/api-client';

interface AdendaReviewModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  adendaAnalysis: AdendaAnalysis;
  onRefreshData: () => void;
  onNavigateToTab: (tab: string) => void;
}

export function AdendaReviewModal({
  isOpen,
  onOpenChange,
  adendaAnalysis,
  onRefreshData,
  onNavigateToTab,
}: AdendaReviewModalProps) {
  const { getIdToken } = useAuth();
  const { toast } = useToast();
  
  const [isLoading, setIsLoading] = useState(false);
  const [appliedActions, setAppliedActions] = useState<Set<string>>(new Set());

  const {
    summary_of_changes,
    modified_dates,
    modified_technical_requirements,
    new_required_documents,
    modified_required_documents,
  } = adendaAnalysis.analysis_results;
  
  const handleAction = async (action_type: string, payload?: any) => {
    const actionId = `${action_type}-${JSON.stringify(payload)}`;
    setIsLoading(true);

    try {
      // --- CÓDIGO CORREGIDO ---
      // Usamos apiClient para ir a través del Gateway
      await apiClient.post('/apply_adenda_action', {
        adenda_analysis_id: adendaAnalysis.id,
        opportunity_id: adendaAnalysis.opportunity_id,
        action_type,
        payload,
      });

      setAppliedActions(prev => new Set(prev).add(actionId));
      toast({ title: "Acción aplicada correctamente" });
    } catch (error) {
      toast({ title: "Error", description: (error as Error).message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = async () => {
    setIsLoading(true);
  
    try {
        // --- CÓDIGO CORREGIDO ---
        await apiClient.post('/apply_adenda_action', {
          adenda_analysis_id: adendaAnalysis.id,
          opportunity_id: adendaAnalysis.opportunity_id,
          action_type: 'mark_as_reviewed',
        });
        onOpenChange(false);
        onRefreshData();
    } catch (error) {
         toast({ title: "Error", description: "No se pudo marcar la adenda como revisada. Los cambios aplicados se mantendrán.", variant: "destructive" });
    } finally {
        setIsLoading(false);
    }
  };
  
  const handleDiscuss = (change: any) => {
    // A simple implementation could be to copy to clipboard and navigate.
    const textToComment = `Discusión sobre el cambio de la adenda:\n\nReferencia: ${change.section_reference}\nCambio: ${change.summary_of_change}`;
    navigator.clipboard.writeText(textToComment);
    toast({
        title: "Texto copiado al portapapeles",
        description: "Péguelo en la bitácora para iniciar la discusión.",
    });
    onOpenChange(false);
    onNavigateToTab('log');
  };

  const actionButton = (actionType: string, payload: any, text: string) => {
    const actionId = `${actionType}-${JSON.stringify(payload)}`;
    const isApplied = appliedActions.has(actionId);
    
    return (
      <Button
        size="sm"
        variant={isApplied ? "ghost" : "secondary"}
        onClick={() => handleAction(actionType, payload)}
        disabled={isLoading || isApplied}
        className="w-[180px]"
      >
        {isLoading && !isApplied ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : isApplied ? <Check className="mr-2 h-4 w-4 text-green-500" /> : <ArrowRight className="mr-2 h-4 w-4" />}
        {isApplied ? "Acción Aplicada" : text}
      </Button>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Revisión de Cambios por Adenda</DialogTitle>
          <DialogDescription>
            La IA ha analizado una nueva adenda y ha detectado los siguientes cambios. Revise y aplique las acciones necesarias.
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[60vh] p-1">
            <div className="space-y-6 pr-4">
                <Alert>
                    <Lightbulb className="h-4 w-4" />
                    <AlertTitle>Resumen de Cambios Detectados por la IA</AlertTitle>
                    <AlertDescription className="whitespace-pre-wrap">{summary_of_changes}</AlertDescription>
                </Alert>
                
                {modified_dates.length > 0 && (
                    <div className="space-y-3">
                        <h3 className="font-semibold flex items-center"><Calendar className="mr-2 h-5 w-5 text-highlight" /> Fechas Modificadas</h3>
                        <div className="space-y-2">
                        {modified_dates.map((date, index) => (
                            <div key={index} className="flex justify-between items-center p-3 border rounded-md bg-card">
                                <div>
                                    <p className="text-sm font-medium">
                                        <span className="text-muted-foreground line-through mr-2">{date.original_label}</span>
                                        <ArrowRight className="inline h-4 w-4 mx-2" />
                                        <span>
                                          {(() => {
                                            try {
                                              const parsed = parseISO(date.new_date);
                                              // Si es una fecha válida, la formateamos. Si no, mostramos el texto original.
                                              return isValid(parsed) 
                                                ? format(parsed, "dd 'de' MMMM, yyyy", { locale: es }) 
                                                : date.new_date;
                                            } catch (e) {
                                              return date.new_date; 
                                            }
                                          })()}
                                        </span>
                                    </p>
                                    {date.reason && <p className="text-xs text-muted-foreground mt-1">Razón: {date.reason}</p>}
                                </div>
                                {actionButton('apply_date', date, 'Aplicar Cambio de Fecha')}
                            </div>
                        ))}
                        </div>
                    </div>
                )}
                
                {new_required_documents.length > 0 && (
                    <div className="space-y-3">
                        <h3 className="font-semibold flex items-center"><FilePlus className="mr-2 h-5 w-5 text-highlight" /> Nuevos Documentos Requeridos</h3>
                        <div className="space-y-2">
                        {new_required_documents.map((doc, index) => (
                            <div key={index} className="flex justify-between items-start p-3 border rounded-md bg-card">
                                <div>
                                    <p className="font-medium">{doc.document_name}</p>
                                    <p className="text-sm text-muted-foreground">{doc.requirement_details}</p>
                                    {doc.requires_signature && <Badge variant="outline" className="mt-1">Requiere Firma</Badge>}
                                </div>
                                {actionButton('add_document', doc, 'Añadir al Checklist')}
                            </div>
                        ))}
                        </div>
                    </div>
                )}
                
                {(modified_required_documents.length > 0 || modified_technical_requirements.length > 0) && (
                    <div className="space-y-3">
                        <h3 className="font-semibold flex items-center"><FileText className="mr-2 h-5 w-5 text-highlight" /> Otros Cambios y Requisitos Técnicos</h3>
                         <div className="space-y-2">
                            {modified_required_documents.map((doc, index) => (
                                <div key={index} className="p-3 border rounded-md bg-card">
                                    <p className="text-sm font-medium">Modificación en documento: <span className="font-bold">{doc.document_name}</span></p>
                                    <p className="text-sm text-muted-foreground mt-1">{doc.summary_of_change}</p>
                                    <Button variant="link" size="sm" className="p-0 h-auto mt-2" onClick={() => handleDiscuss(doc)}>💬 Discutir este cambio en la bitácora</Button>
                                </div>
                            ))}
                            {modified_technical_requirements.map((req, index) => (
                                <div key={index} className="p-3 border rounded-md bg-card">
                                    <p className="text-sm font-medium">Cambio técnico en: <span className="font-bold">{req.section_reference}</span></p>
                                    <p className="text-sm text-muted-foreground mt-1">{req.summary_of_change}</p>
                                    <Button variant="link" size="sm" className="p-0 h-auto mt-2" onClick={() => handleDiscuss(req)}>💬 Discutir este cambio en la bitácora</Button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </ScrollArea>
        <DialogFooter>
          <Button onClick={handleClose} disabled={isLoading}>
            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Marcar como Revisado y Cerrar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
