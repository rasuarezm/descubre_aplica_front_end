

"use client";

import { useState, useMemo } from 'react';
import type { Opportunity, IaRequiredDocument, RequiredDocument, DocumentItem } from "@/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Lightbulb, CheckCircle, AlertTriangle, Loader2, AlertCircleIcon, FileSignature, ListChecks, Plus, Info, PackageCheck, Briefcase, Landmark, Building } from "lucide-react";
import { Skeleton } from "../ui/skeleton";
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { normalizeDocName } from '@/lib/utils';
import { IA_ANALYSIS_IN_PROGRESS_STATUSES } from '@/lib/ia-analysis-constants';
import { ObservationsGenerator } from './ObservationsGenerator';
import { EligibilityDiagnostic } from './EligibilityDiagnostic';

interface IaAnalysisTabContentProps {
  ia_analysis: Opportunity['ia_analysis'];
  officialChecklist: RequiredDocument[];
  onAddDocumentsToChecklist: (docs: IaRequiredDocument[]) => Promise<void>;
  isSubmitting: boolean;
  opportunityId: string;
  customerId: string;
  tenderDocuments: DocumentItem[];
}

export function IaAnalysisTabContent({ ia_analysis, officialChecklist, onAddDocumentsToChecklist, isSubmitting, opportunityId, customerId, tenderDocuments }: IaAnalysisTabContentProps) {

  const [selectedDocs, setSelectedDocs] = useState<IaRequiredDocument[]>([]);
  
  const officialDocNamesNormalized = useMemo(() => 
    new Set(officialChecklist.map(doc => normalizeDocName(doc.name))),
    [officialChecklist]
  );

  const newSuggestedDocs = useMemo(() => 
    ia_analysis?.required_documents_checklist?.filter(
      suggestion => !officialDocNamesNormalized.has(normalizeDocName(suggestion.document_name))
    ) || [],
    [ia_analysis?.required_documents_checklist, officialDocNamesNormalized]
  );


  const handleCheckboxChange = (doc: IaRequiredDocument, checked: boolean) => {
    setSelectedDocs(prev => 
      checked ? [...prev, doc] : prev.filter(d => d.document_name !== doc.document_name)
    );
  };

  const handleAddDocuments = async () => {
    await onAddDocumentsToChecklist(selectedDocs);
    setSelectedDocs([]);
  };

  if (!ia_analysis) {
    return (
      <Card className="text-center py-12">
        <CardHeader>
          <Lightbulb className="mx-auto h-12 w-12 text-muted-foreground" />
          <CardTitle className="mt-4 text-2xl">
            Sin Análisis de IA
          </CardTitle>
        </CardHeader>
        <CardContent>
          <CardDescription>
            Esta oportunidad no fue creada usando el análisis con IA. La información de IA solo está disponible para nuevas oportunidades analizadas a través de un pliego.
          </CardDescription>
        </CardContent>
      </Card>
    );
  }

  if (
    (IA_ANALYSIS_IN_PROGRESS_STATUSES as readonly string[]).includes(
      ia_analysis.analysis_status
    )
  ) {
    return (
      <Card className="text-center py-12">
        <CardHeader>
          <Loader2 className="mx-auto h-12 w-12 animate-spin text-highlight" />
          <CardTitle className="mt-4 text-2xl">
            Análisis en Progreso
          </CardTitle>
        </CardHeader>
        <CardContent>
          <CardDescription>
            La IA está procesando el documento. Los resultados aparecerán aquí una vez que se complete.
          </CardDescription>
        </CardContent>
      </Card>
    );
  }

  if (ia_analysis.analysis_status === 'failed' || ia_analysis.analysis_status === 'error') {
    const failText =
      ia_analysis.analysis_error_message ||
      ia_analysis.error_message ||
      'Hubo un error al procesar el documento. Por favor, intente de nuevo o contacte a soporte si el problema persiste.';
    return (
      <Card className="text-center py-12 border-destructive">
        <CardHeader>
          <AlertCircleIcon className="mx-auto h-12 w-12 text-destructive" />
          <CardTitle className="mt-4 text-2xl text-destructive">
            El Análisis de IA ha Fallado
          </CardTitle>
        </CardHeader>
        <CardContent>
          <CardDescription>
            {failText}
          </CardDescription>
        </CardContent>
      </Card>
    );
  }
  
  const { qualifying_requirements } = ia_analysis;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Resumen Técnico Detallado</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground whitespace-pre-wrap">
            {ia_analysis.technical_summary || 'No disponible.'}
          </p>
        </CardContent>
      </Card>

      {qualifying_requirements && (
        <Card>
            <CardHeader>
            <CardTitle>Requisitos Habilitantes Clave</CardTitle>
            <CardDescription>
                Requisitos mínimos de experiencia y capacidad financiera identificados por la IA.
            </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
            {qualifying_requirements.required_experience?.length > 0 && (
                <div>
                <h4 className="font-semibold mb-3 flex items-center text-sm uppercase text-muted-foreground"><Briefcase className="h-4 w-4 mr-2 text-highlight"/> Experiencia Requerida</h4>
                <ul className="space-y-2 pl-6 border-l-2 border-dashed border-highlight/50">
                    {qualifying_requirements.required_experience.map((item, index) => (
                    <li key={index} className="text-sm text-foreground/90">{item}</li>
                    ))}
                </ul>
                </div>
            )}

            {qualifying_requirements.financial_indicators?.length > 0 && (
                <div>
                <h4 className="font-semibold mb-3 flex items-center text-sm uppercase text-muted-foreground"><Landmark className="h-4 w-4 mr-2 text-highlight"/> Indicadores Financieros</h4>
                <ul className="space-y-2 pl-6 border-l-2 border-dashed border-highlight/50">
                    {qualifying_requirements.financial_indicators.map((item, index) => (
                    <li key={index} className="text-sm text-foreground/90">{item}</li>
                    ))}
                </ul>
                </div>
            )}

            {qualifying_requirements.organizational_capacity?.length > 0 && (
                <div>
                <h4 className="font-semibold mb-3 flex items-center text-sm uppercase text-muted-foreground"><Building className="h-4 w-4 mr-2 text-highlight"/> Capacidad Organizacional</h4>
                <ul className="space-y-2 pl-6 border-l-2 border-dashed border-highlight/50">
                    {qualifying_requirements.organizational_capacity.map((item, index) => (
                    <li key={index} className="text-sm text-foreground/90">{item}</li>
                    ))}
                </ul>
                </div>
            )}
            </CardContent>
        </Card>
      )}

      {/* Diagnóstico de Elegibilidad: cruce de requisitos del pliego vs. perfil del cliente */}
      {qualifying_requirements && (
        <EligibilityDiagnostic
          opportunityId={opportunityId}
          customerId={customerId}
        />
      )}

      {ia_analysis.key_deliverables && ia_analysis.key_deliverables.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Entregables Clave Identificados</CardTitle>
            <CardDescription>
              Principales productos, servicios o resultados que la IA ha identificado como requeridos en la propuesta.
            </CardDescription>
          </CardHeader>
          <CardContent>
              <ul className="space-y-3">
                {ia_analysis.key_deliverables.map((item, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <PackageCheck className="h-5 w-5 text-accent mt-0.5 shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
          </CardContent>
        </Card>
      )}
      
      {ia_analysis.required_documents_checklist && ia_analysis.required_documents_checklist.length > 0 && (
         <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <ListChecks className="h-5 w-5" />
                    Checklist de Documentos Sugerido por IA
                </CardTitle>
                <CardDescription>
                    Seleccione los documentos sugeridos por la IA que desea añadir al checklist oficial de esta oportunidad.
                </CardDescription>
            </CardHeader>
            <CardContent>
                {newSuggestedDocs.length > 0 ? (
                    <div className="space-y-3">
                        {newSuggestedDocs.map((doc, index) => (
                            <div key={index} className="flex items-start gap-3 p-3 border rounded-md bg-card/50">
                                <Checkbox 
                                    id={`ia-doc-${index}`} 
                                    className="mt-1" 
                                    onCheckedChange={(checked) => handleCheckboxChange(doc, !!checked)}
                                    checked={selectedDocs.some(d => d.document_name === doc.document_name)}
                                />
                                <div className="grid gap-1.5 flex-1">
                                    <label htmlFor={`ia-doc-${index}`} className="font-medium cursor-pointer">
                                        {doc.document_name}
                                    </label>
                                    <p className="text-sm text-muted-foreground">{doc.requirement_details}</p>
                                    {doc.requires_signature && (
                                        <Badge variant="outline" className="w-fit">
                                            <FileSignature className="mr-2 h-3 w-3" />
                                            Requiere Firma
                                        </Badge>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center text-muted-foreground py-6 border-2 border-dashed rounded-lg">
                        <Info className="mx-auto h-8 w-8 mb-2" />
                        <p className="text-sm font-medium">Todas las sugerencias de la IA ya han sido añadidas.</p>
                        <p className="text-xs">Puede revisar el checklist oficial en la primera pestaña.</p>
                    </div>
                )}
            </CardContent>
            {newSuggestedDocs.length > 0 && (
                <CardFooter>
                     <Button
                        onClick={handleAddDocuments}
                        disabled={selectedDocs.length === 0 || isSubmitting}
                        className="bg-accent text-accent-foreground hover:bg-accent/90 shadow-sm"
                      >
                        {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
                        Añadir {selectedDocs.length} Documento(s) al Checklist Oficial
                    </Button>
                </CardFooter>
            )}
         </Card>
      )}

      {/* Generador de Observaciones al Pliego */}
      <ObservationsGenerator
        opportunityId={opportunityId}
        tenderDocuments={tenderDocuments}
      />
    </div>
  );
}
