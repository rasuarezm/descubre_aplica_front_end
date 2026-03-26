
"use client";

import { useState, useMemo, useCallback } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useToast } from '@/hooks/use-toast';
import type { DocumentItem, WbsCandidateDocument } from '@/types';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Bot, Lightbulb, AlertTriangle, Loader2 } from 'lucide-react';
import { Card, CardContent } from '../ui/card';
import apiClient from '@/lib/api-client';

interface WBSGeneratorProps {
  opportunityId: string;
  tenderDocuments: DocumentItem[];
  onWbsGenerated: () => void;
}

export function WBSGenerator({ opportunityId, tenderDocuments, onWbsGenerated }: WBSGeneratorProps) {
  const { getIdToken } = useAuth();
  const { toast } = useToast();

  const [isLoading, setIsLoading] = useState(false);
  const [candidateDocs, setCandidateDocs] = useState<WbsCandidateDocument[]>([]);
  const [selectedDocIds, setSelectedDocIds] = useState<number[]>([]);
  const [strategicContext, setStrategicContext] = useState('');
  
  const [isSelectModalOpen, setIsSelectModalOpen] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);

  const buttonVisibility = useMemo(() => {
    const hasDraft = tenderDocuments.some(d => d.tender_document_category === 'Borrador de Terminos de Referencia');
    const hasFinal = tenderDocuments.some(d => d.tender_document_category === 'Terminos de Referencia');

    if (hasDraft && hasFinal) {
      return { show: false, conflict: true, message: "Se ha detectado una versión borrador y una definitiva de los pliegos. Por favor, archive o elimine la versión borrador para poder generar la estructura de trabajo." };
    }
    if (hasFinal) {
      return { show: true, conflict: false, message: "" };
    }
    return { show: false, conflict: false, message: "" };
  }, [tenderDocuments]);

  const handleGenerateClick = async () => {
    setIsLoading(true);
    const idToken = await getIdToken();
    if (!idToken) {
      toast({ title: "Error de Autenticación", variant: "destructive" });
      setIsLoading(false);
      return;
    }


    try {
      // Usamos apiClient que ya está configurado con la URL base del Gateway
      const data = await apiClient.get<WbsCandidateDocument[]>(
        `/get_wbs_candidate_documents?opportunity_id=${opportunityId}`
      );
      
      setCandidateDocs(data);
      setIsSelectModalOpen(true);
    } catch (error) {
      toast({ title: "Error", description: (error as Error).message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectionConfirm = () => {
    if (selectedDocIds.length === 0) {
      toast({ title: "Selección Requerida", description: "Debe seleccionar al menos un documento.", variant: "destructive" });
      return;
    }
    setIsSelectModalOpen(false);
    setIsConfirmModalOpen(true);
  };

  const handleFinalConfirm = async () => {
    setIsConfirmModalOpen(false);
    setIsLoading(true);
    const idToken = await getIdToken();
    if (!idToken) {
        toast({ title: "Error de Autenticación", variant: "destructive" });
        setIsLoading(false);
        return;
    }
    
    const payload: {
        opportunity_id: string;
        document_ids: number[];
        strategic_context?: string;
    } = {
        opportunity_id: opportunityId,
        document_ids: selectedDocIds,
    };
    
    if (strategicContext.trim()) {
        payload.strategic_context = strategicContext.trim();
    }

    try {
        // Usamos apiClient.post en lugar de fetch directo
        await apiClient.post('/generate_wbs', payload);

        // (apiClient ya lanza error si falla, así que no necesitas verificar response.status !== 201 manualmente)

        toast({ title: "¡Éxito!", description: "El borrador del WBS ha sido generado." });
        onWbsGenerated();
    } catch (error) {
        toast({ title: "Error", description: (error as Error).message, variant: "destructive" });
    } finally {
        setIsLoading(false);
        setSelectedDocIds([]);
        setStrategicContext('');
    }
  };
  
  const handleCheckboxChange = (id: number, checked: boolean) => {
    setSelectedDocIds(prev => 
      checked ? [...prev, id] : prev.filter(docId => docId !== id)
    );
  };

  if (buttonVisibility.conflict) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Acción Requerida</AlertTitle>
        <AlertDescription>
          {buttonVisibility.message}
        </AlertDescription>
      </Alert>
    );
  }

  if (!buttonVisibility.show) {
    return null; // Don't render anything if conditions are not met and there's no conflict
  }

  return (
    <>
      <Card className="bg-muted/50 border-dashed">
        <CardContent className="pt-6 flex flex-col items-center text-center">
            <Lightbulb className="h-10 w-10 text-highlight mb-2"/>
            <h3 className="text-lg font-semibold">¿Necesita un punto de partida?</h3>
            <p className="text-sm text-muted-foreground mb-4 max-w-md">
                Analice los documentos de referencia con IA para generar un borrador de la Estructura de Desglose de Trabajo (WBS) y planificar su propuesta.
            </p>
            <Button onClick={handleGenerateClick} disabled={isLoading}>
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Bot className="mr-2 h-4 w-4" />}
                {isLoading ? 'Cargando...' : 'Generar Borrador de WBS con IA'}
            </Button>
        </CardContent>
      </Card>
      
      {/* Modal 1: Select Documents */}
      <Dialog open={isSelectModalOpen} onOpenChange={setIsSelectModalOpen}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Seleccionar Documentos para Análisis</DialogTitle>
            <DialogDescription>
              Elija los documentos que la IA debe analizar. Puede añadir un contexto para guiar la generación de la estructura.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto pr-2">
            <div>
                <h4 className="font-medium text-sm mb-2">1. Seleccione Documentos</h4>
                <div className="space-y-3 p-3 border rounded-md max-h-[25vh] overflow-y-auto">
                    {candidateDocs.map(doc => (
                    <div key={doc.id} className="flex items-center space-x-3">
                        <Checkbox 
                            id={`doc-${doc.id}`}
                            onCheckedChange={(checked) => handleCheckboxChange(doc.id, !!checked)}
                            checked={selectedDocIds.includes(doc.id)}
                        />
                        <Label htmlFor={`doc-${doc.id}`} className="cursor-pointer">
                        <span className="font-medium">{doc.filename}</span>
                        <span className="text-xs text-muted-foreground ml-2">({doc.category})</span>
                        </Label>
                    </div>
                    ))}
                </div>
            </div>
            <div>
                <Label htmlFor="strategic-context" className="font-medium text-sm">2. Contexto o Alcance Específico (Opcional)</Label>
                <Textarea
                    id="strategic-context"
                    value={strategicContext}
                    onChange={(e) => setStrategicContext(e.target.value)}
                    placeholder="Indique si se va a aplicar a un lote específico, con un alcance particular o cualquier otra directriz estratégica que la IA deba considerar. Ejemplo: 'Enfocarse únicamente en el Lote 2: Implementación en sedes de Antioquia'."
                    className="mt-2"
                />
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild><Button variant="outline">Cancelar</Button></DialogClose>
            <Button onClick={handleSelectionConfirm} disabled={selectedDocIds.length === 0}>
              Continuar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Modal 2: Confirmation */}
      <AlertDialog open={isConfirmModalOpen} onOpenChange={setIsConfirmModalOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¡Atención!</AlertDialogTitle>
            <AlertDialogDescription>
              La calidad de la estructura generada depende de la completitud de los documentos seleccionados. ¿Desea continuar?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setIsSelectModalOpen(true)}>Volver a Seleccionar</AlertDialogCancel>
            <AlertDialogAction onClick={handleFinalConfirm}>
              Sí, Generar WBS
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

    