"use client";

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Customer, Opportunity, CustomerDocument, OpportunityStatusInfo, CertificationExtractedData, RupContract } from "@/types";
import { Briefcase, PlusCircle, ArrowRight, ImagePlus, FileBadge, Landmark, FolderArchive, UploadCloud, CheckCircle, AlertCircle, Download, Trash2, CalendarIcon, Loader2, FileUp, FileCheck, Clock, Target, CalendarClock, AlertTriangle, ListFilter, DollarSign, LayoutDashboard, MoreVertical, Archive, ArchiveRestore, Trophy, XCircle, Trash, Send, Award, ChevronDown, ChevronUp, Building2, Calendar, Tag, Link2, RefreshCw, Sparkles } from "lucide-react";
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { format, isPast } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/auth-context';
import { getUrgencyInfo } from '@/lib/date-utils';
import { BidtoryRadarIcon } from '@/components/icons/BidtoryRadarIcon';
import { Separator } from '@/components/ui/separator';
import apiClient from '@/lib/api-client';
import { customerLogoImgSrc } from '@/lib/gcs-display';
import { FinancialProfileWidget } from '@/components/customers/FinancialProfileWidget';
import { RupContractsWidget } from '@/components/customers/RupContractsWidget';
import { CustomerZoneSkeleton } from '@/components/customers/CustomerZoneSkeleton';

const FINAL_OPPORTUNITY_STATUSES = ['Ganada', 'Perdida', 'Descartada'];

/** Borde izquierdo de tarjeta de oportunidad (una sola clase `border-l-*`). */
function opportunityCardLeftBorderClass(
  status: string,
  opts: {
    isArchivedView: boolean;
    isFinalStatus: boolean;
    isEnviada: boolean;
    urgencyStatus?: 'overdue' | 'urgent' | 'upcoming' | 'normal' | null;
  },
): string {
  const { isArchivedView, isFinalStatus, isEnviada, urgencyStatus } = opts;
  if (isArchivedView) return 'border-l-muted-foreground';
  if (status === 'Ganada') return 'border-l-accent';
  if (status === 'Perdida') return 'border-l-destructive';
  if (status === 'Descartada') return 'border-l-[#9b9b9b]';
  if (isEnviada) return 'border-l-primary';
  if (!isFinalStatus && !isEnviada) {
    if (urgencyStatus === 'overdue') return 'border-l-urgency';
    if (urgencyStatus === 'urgent' || urgencyStatus === 'upcoming') return 'border-l-highlight';
  }
  return 'border-l-primary';
}

// ─── Fila de documento (genérica para todas las categorías) ──────────────────

function ExperienceDocRow({
  doc, isExperience, isLinked, extractedData, suggestedContract,
  canCreateAndEdit, canDelete,
  getStatusIcon, onDelete, onFileChange, onReextract, fmtCOP, fmtDate,
}: {
  doc: CustomerDocument;
  isExperience: boolean;
  isLinked: boolean;
  extractedData: import('@/types').CertificationExtractedData | null;
  suggestedContract?: RupContract | null;
  canCreateAndEdit: boolean;
  canDelete: boolean;
  getStatusIcon: (s: CustomerDocument['status']) => React.ReactNode;
  onDelete: () => void;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onReextract: (docId: string) => Promise<void>;
  fmtCOP: (v: number | null | undefined) => string;
  fmtDate: (iso: string | null | undefined) => string;
}) {
  const [expanded, setExpanded] = useState(false);
  const [isReextracting, setIsReextracting] = useState(false);
  const hasExtracted = isExperience && !!extractedData;

  const handleReextract = async () => {
    setIsReextracting(true);
    try {
      await onReextract(doc.id);
    } finally {
      setIsReextracting(false);
    }
  };

  return (
    <li className="border rounded-md bg-card/80">
      <div className="flex items-center justify-between p-3 flex-wrap gap-4">
        <div className="flex items-start gap-4 flex-1 min-w-[250px]">
          {getStatusIcon(doc.status)}
          <div>
            <p className="font-medium">{doc.name}</p>
            <p className="text-sm text-muted-foreground">{doc.description}</p>
            {doc.status !== 'pending' && doc.signedUrl && (
              <div className="mt-1 flex items-center gap-2 flex-wrap">
                <Badge variant="secondary">{doc.fileName || 'Archivo Subido'}</Badge>
                {(doc.financial_extraction_status === 'queued' ||
                  doc.financial_extraction_status === 'processing') && (
                  <div className="mt-2 space-y-1 w-full min-w-[200px] max-w-sm min-h-[3.25rem] [contain:layout]">
                    <div className="flex items-start justify-between gap-2 text-xs text-muted-foreground">
                      <span className="flex items-start gap-1 min-w-0 flex-1">
                        <Loader2 className="h-3 w-3 animate-spin shrink-0 mt-0.5" />
                        <span className="line-clamp-2 leading-snug">
                          {doc.extraction_step ??
                            (doc.financial_extraction_status === 'queued' ? 'En cola…' : 'Procesando…')}
                        </span>
                      </span>
                      {(doc.extraction_progress ?? 0) > 0 && (
                        <span className="tabular-nums shrink-0">{doc.extraction_progress}%</span>
                      )}
                    </div>
                    <div className="h-1 rounded-full bg-secondary/30 overflow-hidden shrink-0">
                      <div
                        className="h-full rounded-full bg-blue-500 transition-[width] duration-200 ease-linear"
                        style={{ width: `${doc.extraction_progress ?? 0}%` }}
                      />
                    </div>
                  </div>
                )}
                {doc.financial_extraction_status === 'completed' && (
                  <Badge variant="outline" className="text-green-400 border-green-400/40 text-xs">
                    ✓ Indicadores extraídos
                  </Badge>
                )}
                {doc.financial_extraction_status === 'failed' && (
                  <Badge
                    variant="outline"
                    className="text-destructive border-destructive/40 text-xs"
                    title={doc.extraction_error ?? undefined}
                  >
                    ⚠ Error en extracción
                  </Badge>
                )}
                {isExperience && (
                  <>
                    {isLinked ? (
                      <Badge variant="outline" className="text-green-400 border-green-500/30 text-xs gap-1">
                        <Link2 className="h-2.5 w-2.5" /> Vinculada al RUP
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-amber-400 border-amber-500/30 text-xs gap-1">
                        Sin vincular al RUP
                      </Badge>
                    )}
                    {!isLinked && suggestedContract && (
                      <Badge variant="outline" className="text-blue-400 border-blue-500/30 text-xs gap-1">
                        <Sparkles className="h-2.5 w-2.5" />
                        Posible contrato: #{suggestedContract.rup_consecutive} · {suggestedContract.contracting_entity}
                      </Badge>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {hasExtracted && (
            <Button
              variant="ghost" size="sm"
              className="h-7 text-xs text-muted-foreground hover:text-foreground gap-1"
              onClick={() => setExpanded(v => !v)}
            >
              {expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
              {expanded ? 'Ocultar datos' : 'Ver datos IA'}
            </Button>
          )}
          {isExperience && doc.status !== 'pending' && canCreateAndEdit && (
            <Button
              variant="ghost" size="sm"
              className="h-7 text-xs text-muted-foreground hover:text-foreground gap-1"
              onClick={handleReextract}
              disabled={
                isReextracting ||
                doc.financial_extraction_status === 'processing' ||
                doc.financial_extraction_status === 'queued'
              }
              title="Re-extraer datos con IA (recalcula SMMLV sin borrar el documento)"
            >
              {isReextracting ||
              doc.financial_extraction_status === 'processing' ||
              doc.financial_extraction_status === 'queued'
                ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                : <RefreshCw className="h-3.5 w-3.5" />
              }
              {isReextracting ? 'Procesando…' : 'Re-extraer'}
            </Button>
          )}
          {doc.status === 'pending' ? (
            <>
              {canCreateAndEdit && (
                <Label htmlFor={`customer-file-upload-${doc.id}`} className="cursor-pointer">
                  <Button asChild variant="outline" size="sm">
                    <div><UploadCloud className="mr-2 h-4 w-4" /> Subir</div>
                  </Button>
                </Label>
              )}
              <Input id={`customer-file-upload-${doc.id}`} type="file" className="hidden" onChange={onFileChange} />
            </>
          ) : (
            <>
              <Button variant="outline" size="sm" asChild>
                <a href={doc.signedUrl!} download={doc.fileName || doc.name} target="_blank" rel="noopener noreferrer">
                  <Download className="mr-2 h-4 w-4" /> Descargar
                </a>
              </Button>
              {canDelete && (
                <Button variant="ghost" size="icon" onClick={onDelete} aria-label="Quitar archivo">
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Panel expandible con datos extraídos por IA */}
      {expanded && hasExtracted && (
        <div className="border-t border-secondary/20 mx-3 mb-3 pt-3 space-y-2 text-xs">
          {extractedData!.contract_object && (
            <p className="text-foreground/80 leading-snug">
              <span className="font-semibold text-muted-foreground uppercase tracking-wide text-[10px] block mb-0.5">Objeto</span>
              {extractedData!.contract_object}
            </p>
          )}
          <div className="grid grid-cols-2 gap-x-4 gap-y-1">
            {extractedData!.contracting_entity && (
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <Building2 className="h-3 w-3 shrink-0" />
                <span className="truncate">{extractedData!.contracting_entity}</span>
              </div>
            )}
            {(extractedData!.execution_start || extractedData!.execution_end) && (
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <Calendar className="h-3 w-3 shrink-0" />
                <span>{fmtDate(extractedData!.execution_start)} – {fmtDate(extractedData!.execution_end)}</span>
              </div>
            )}
            {extractedData!.contract_value_smmlv != null && (
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <DollarSign className="h-3 w-3 shrink-0" />
                <span>{extractedData!.contract_value_smmlv.toLocaleString('es-CO')} SMMLV</span>
              </div>
            )}
            {extractedData!.contract_value_cop != null && (
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <DollarSign className="h-3 w-3 shrink-0" />
                <span>{fmtCOP(extractedData!.contract_value_cop)}</span>
              </div>
            )}
          </div>
          {extractedData!.sector_keywords && extractedData!.sector_keywords.length > 0 && (
            <div className="flex items-center gap-1.5 flex-wrap">
              <Tag className="h-3 w-3 text-muted-foreground shrink-0" />
              {extractedData!.sector_keywords.map(k => (
                <Badge key={k} variant="secondary" className="text-[10px] px-1.5 py-0">{k}</Badge>
              ))}
            </div>
          )}
          {extractedData!.satisfactory_completion != null && (
            <div className={cn(
              'flex items-center gap-1 font-medium',
              extractedData!.satisfactory_completion ? 'text-green-400' : 'text-destructive'
            )}>
              {extractedData!.satisfactory_completion
                ? <><CheckCircle className="h-3 w-3" /> Cumplimiento satisfactorio</>
                : <><AlertCircle className="h-3 w-3" /> Incumplimiento reportado</>
              }
            </div>
          )}
        </div>
      )}
    </li>
  );
}

// Lista estática de categorías para el modal de análisis IA.
// Hardcodeada aquí para evitar un fetch innecesario a una Cloud Function
// que solo devuelve estos dos valores fijos, eliminando el cold start al abrir el modal.
const TENDER_CATEGORIES_FOR_ANALYSIS = [
  'Borrador de Terminos de Referencia',
  'Terminos de Referencia',
];

export default function CustomerDetailPage() {
  const params = useParams();
  const customerId = params.customerId as string;
  const { toast } = useToast();
  const { getIdToken, userProfile } = useAuth();
  const router = useRouter();

  const [customer, setCustomer] = useState<Customer | undefined>(undefined);
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [customerDocuments, setCustomerDocuments] = useState<CustomerDocument[]>([]);
  const [opportunityStatuses, setOpportunityStatuses] = useState<OpportunityStatusInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const [isLogoDialogOpen, setIsLogoDialogOpen] = useState(false);
  const [newLogoFile, setNewLogoFile] = useState<File | null>(null);
  const [isSubmittingLogo, setIsSubmittingLogo] = useState(false);
  
  const [isAddDocDialogOpen, setIsAddDocDialogOpen] = useState(false);
  const [newDocInfo, setNewDocInfo] = useState<{ name: string; category: CustomerDocument['category'] | null }>({ name: '', category: null });
  const [newDocFile, setNewDocFile] = useState<File | null>(null);
  const [isSubmittingDoc, setIsSubmittingDoc] = useState(false);
  
  const [docToDelete, setDocToDelete] = useState<CustomerDocument | null>(null);
  const [isDeletingDoc, setIsDeletingDoc] = useState(false);
  
  const [opportunityToArchive, setOpportunityToArchive] = useState<Opportunity | null>(null);
  const [isArchiving, setIsArchiving] = useState(false);
  
  // IDs de certificaciones que ya están vinculadas a algún contrato del RUP
  const [linkedCertDocIds, setLinkedCertDocIds] = useState<Set<string>>(new Set());
  const [rupSuggestions, setRupSuggestions] = useState<Map<string, RupContract>>(new Map());

  /** Sube al borrar un documento para remontar widgets de perfil/contratos y limpiar estado local. */
  const [docLibraryRevision, setDocLibraryRevision] = useState(0);

  // State for AI Analysis Modal
  const [isAnalysisModalOpen, setIsAnalysisModalOpen] = useState(false);
  const [isSubmittingAnalysis, setIsSubmittingAnalysis] = useState(false);
  const [analysisData, setAnalysisData] = useState({
    file: null as File | null,
    category: '',
    name: '',
  });


  // --- Start of Permissions Logic ---
  const canCreateAndEdit = useMemo(() => {
    if (userProfile?.role === 'admin') return true;
    if (userProfile?.role === 'customer') {
      return ['colaborador', 'administrador_cliente'].includes(userProfile.customer_role || '');
    }
    return false;
  }, [userProfile]);

  const canDelete = useMemo(() => {
     if (userProfile?.role === 'admin') return true;
     if (userProfile?.role === 'customer') {
        return ['colaborador', 'administrador_cliente'].includes(userProfile.customer_role || '');
     }
     return false;
  }, [userProfile]);
  
  const canAnalyzeTender = useMemo(() => {
    if (userProfile?.role === 'admin') return true;
    if (userProfile?.role === 'customer') {
        return userProfile.customer_role === 'administrador_cliente';
    }
    return false;
  }, [userProfile]);

  const canArchive = useMemo(() => {
    if (userProfile?.role === 'admin') return true;
    if (userProfile?.role === 'customer') {
      return userProfile.customer_role === 'administrador_cliente';
    }
    return false;
  }, [userProfile]);
  // --- End of Permissions Logic ---

  const fetchData = useCallback(async (showLoadingSpinner = true) => {
    if (showLoadingSpinner) setLoading(true);
    setError(null);
    
    try {
      const opportunitiesParams = new URLSearchParams({ customer_id: customerId });
      if (statusFilter === 'archived') {
          opportunitiesParams.append('show_archived', 'true');
      } else {
        opportunitiesParams.append('show_final_statuses', 'true');
      }

      const [
        allCustomers,
        customerOpportunities,
        rawGeneralDocuments,
        statusesData,
      ] = await Promise.all([
        apiClient.get<Customer[]>('/get_customers'),
        apiClient.get<Opportunity[]>(`/get_opportunities?${opportunitiesParams.toString()}`).catch(() => []),
        apiClient.get<any[]>(`/get_documents?customer_id=${customerId}`),
        apiClient.get<OpportunityStatusInfo>('/get_opportunity_statuses'),
      ]);

      const customerDetails = allCustomers.find(c => String(c.id) === customerId);
      if (!customerDetails) {
          throw new Error('Cliente no encontrado.');
      }
      
      const generalDocuments: CustomerDocument[] = rawGeneralDocuments.map(doc => {
        let status = doc.status;
        if (!status) {
          status = doc.signed_url || doc.file_url ? 'uploaded' : 'pending';
        }
        return {
          ...doc,
          name: doc.name || doc.document_type || 'Documento sin nombre',
          description: doc.description || '',
          status: status,
          fileUrl: doc.file_url,
          signedUrl: doc.signed_url,
          fileName: doc.filename,
        };
      });
      
      const processedOpportunities = customerOpportunities.map(opp => ({
        ...opp,
        title: opp.name,
        deadline: opp.deadline ? new Date(opp.deadline) : undefined,
        amount: opp.amount
      }));
      
      setCustomer(customerDetails);
      setOpportunities(processedOpportunities);
      setCustomerDocuments(generalDocuments);
      setOpportunityStatuses(statusesData);

    } catch (err) {
      console.error(err);
      const errorMessage = err instanceof Error ? err.message : "Ocurrió un error desconocido.";
      setError(errorMessage);
      toast({ title: "Error de Carga", description: errorMessage, variant: "destructive" });
    } finally {
      if (showLoadingSpinner) setLoading(false);
    }
  }, [customerId, toast, statusFilter]);

  useEffect(() => {
    if (!customerId || !userProfile) return;

    if (userProfile.role === 'customer' && String(userProfile.customer_id) !== String(customerId)) {
      toast({ title: "Acceso denegado", description: "No tiene permiso para ver esta zona de cliente.", variant: "destructive" });
      router.replace('/dashboard');
      return;
    }
    fetchData();
  }, [customerId, userProfile, router, fetchData, statusFilter]);
  
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchData(false); // Refetch data without showing the main loading spinner
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [fetchData]);

  // Bloquear acceso del administrador Bidtory a zonas sin acceso concedido
  useEffect(() => {
    if (!customer || !userProfile) return;
    if (userProfile.role === 'admin' && customer.bidtory_access?.granted !== true) {
      toast({
        title: "Acceso denegado",
        description: "Este cliente no ha concedido acceso a su zona.",
        variant: "destructive",
      });
      router.replace('/dashboard');
    }
  }, [customer, userProfile, router, toast]);

  // Polling automático mientras algún documento esté siendo procesado por la IA.
  // Cubre RUP, estados financieros y certificaciones de experiencia.
  const isAnyDocExtracting = customerDocuments.some(
    d => d.financial_extraction_status === 'queued' || d.financial_extraction_status === 'processing'
  );
  useEffect(() => {
    if (!isAnyDocExtracting) return;
    const interval = setInterval(() => {
      fetchData(false);
    }, 6000);
    return () => clearInterval(interval);
  }, [isAnyDocExtracting, fetchData, customerDocuments]);

  const handleLogoUpdate = async () => {
    if (!newLogoFile || !customer) {
        toast({ title: "Datos Faltantes", description: "Por favor, selecciona un archivo de imagen.", variant: "destructive" });
        return;
    }
    setIsSubmittingLogo(true);
    
    try {
        const urlPayload = {
            metadata: {
                filename: newLogoFile.name,
                content_type: newLogoFile.type,
                customer_id: customerId,
                document_type: 'logo',
                category: 'branding'
            }
        };

        const { upload_url, gcs_uri } = await apiClient.post<{ upload_url: string; gcs_uri: string }>('/generate_document_upload_url', urlPayload);

        const uploadResponse = await fetch(upload_url, {
            method: 'PUT',
            headers: { 'Content-Type': newLogoFile.type },
            body: newLogoFile,
        });

        if (!uploadResponse.ok) {
            throw new Error('La subida de la imagen falló.');
        }

        await apiClient.patch('/update_customer', {
            id: customerId,
            logo_url: gcs_uri,
        });
        
        toast({ title: "¡Éxito!", description: "El logo del cliente ha sido actualizado." });
        
        await fetchData(false);
        setIsLogoDialogOpen(false);
        setNewLogoFile(null);

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Ocurrió un error desconocido';
        toast({ title: 'Error al Actualizar Logo', description: errorMessage, variant: 'destructive' });
    } finally {
        setIsSubmittingLogo(false);
    }
  };


  const handleFileChange = (documentId: string, event: React.ChangeEvent<HTMLInputElement>) => {
    toast({ title: "Función no implementada", description: "La subida de documentos se implementará próximamente." });
  };
  
  const handleOpenDeleteConfirm = (doc: CustomerDocument) => {
    setDocToDelete(doc);
  };

  const handleReextractCertification = async (docId: string) => {
    try {
      await apiClient.post('/reextract_certification', {
        document_id: docId,
        customer_id: customerId,
      });
      toast({
        title: 'Re-extracción iniciada',
        description:
          'La certificación está en cola. Los datos se actualizarán cuando la IA la procese.',
      });
      void fetchData(false);
    } catch (err) {
      toast({
        title: 'Error al re-extraer',
        description: (err as Error).message,
        variant: 'destructive',
      });
    }
  };

  const handleDeleteGeneralDocument = async () => {
    if (!docToDelete) return;
    
    setIsDeletingDoc(true);
    try {
      await apiClient.delete('/delete_document', {
        document_id: docToDelete.id,
        kind: docToDelete.kind || 'CustomerGeneralDocuments',
        customer_id: customerId,
      });
      
      toast({
          title: "¡Éxito!",
          description: `El documento "${docToDelete.fileName || docToDelete.name}" ha sido eliminado.`,
      });
        
      await fetchData(false);
      setDocLibraryRevision((r) => r + 1);
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Ocurrió un error desconocido';
        toast({ title: 'Error al Eliminar', description: errorMessage, variant: 'destructive' });
    } finally {
        setIsDeletingDoc(false);
        setDocToDelete(null);
    }
  };
  
  const handleOpenAddDialog = (category: CustomerDocument['category']) => {
    setNewDocInfo({ name: '', category });
    setNewDocFile(null);
    setIsAddDocDialogOpen(true);
  };
  
const handleUploadGeneralDocument = async () => {
    if (!newDocInfo.name.trim() || !newDocFile || !newDocInfo.category) {
      toast({
        title: "Datos Incompletos",
        description: "Por favor, proporciona un nombre, categoría y archivo.",
        variant: "destructive",
      });
      return;
    }
    
    setIsSubmittingDoc(true);

    try {
      // PASO 1: Obtener URL Firmada
      const urlPayload = {
        metadata: {
          filename: newDocFile.name,
          content_type: newDocFile.type,
          customer_id: customerId,
          document_type: newDocInfo.name.trim(),
          category: newDocInfo.category,
        }
      };

      const { upload_url, gcs_uri } = await apiClient.post<{ upload_url: string; gcs_uri: string }>(
        '/generate_document_upload_url', 
        urlPayload
      );

      // PASO 2: Subir a GCS
      const uploadResponse = await fetch(upload_url, {
          method: 'PUT',
          headers: { 'Content-Type': newDocFile.type },
          body: newDocFile,
      });

      if (!uploadResponse.ok) throw new Error('No se pudo subir el archivo a la nube.');

      // PASO 3: Finalizar y Guardar en BD
      const finalizePayload = {
        customer_id: customerId,
        gcs_uri: gcs_uri,
        filename: newDocFile.name,
        content_type: newDocFile.type,
        document_type: newDocInfo.name.trim(),
        category: newDocInfo.category
      };

      const finalizeRes = await apiClient.post<{ financial_extraction_status?: string | null; id?: string }>(
        '/finalize_general_document_upload',
        finalizePayload
      );

      if (finalizeRes?.financial_extraction_status === 'processing') {
        toast({
          title: 'Documento guardado — extracción en curso',
          description:
            'La IA está leyendo el PDF (indicadores y contratos). En RUP grandes suele tardar varios minutos; la pantalla se actualizará sola.',
        });
      } else {
        toast({ title: '¡Éxito!', description: `El documento "${newDocInfo.name}" ha sido guardado.` });
      }
        
      setIsAddDocDialogOpen(false);
      setNewDocFile(null);
      setNewDocInfo({ name: '', category: null });
      
      await fetchData(false);

    } catch (error) {
        console.error(error);
        const errorMessage = error instanceof Error ? error.message : 'Ocurrió un error desconocido';
        toast({ title: 'Error al Subir', description: errorMessage, variant: 'destructive' });
    } finally {
        setIsSubmittingDoc(false);
    }
  };

  const handleOpenAnalysisModal = () => {
    setIsAnalysisModalOpen(true);
  };
  

  const handleInitiateAnalysis = async () => {
    const { file, category, name } = analysisData;
    if (!file || !category || !name) {
      toast({ title: "Datos Incompletos", description: "Por favor, complete todos los campos.", variant: "destructive"});
      return;
    }

    setIsSubmittingAnalysis(true);

    try {
      // PASO 1: Generar URL y Crear Oportunidad Preliminar
      const requestBody = {
        metadata: {
          filename: file.name,
          content_type: file.type,
          customer_id: customerId,
          tender_document_category: category,
          document_type: name,
        }
      };
      
      const { opportunity_id, upload_url, gcs_uri } = await apiClient.post<{ 
        opportunity_id: string; 
        upload_url: string; 
        gcs_uri: string;
      }>('/generate_ia_analysis_upload_url', requestBody);

      // PASO 2: Subir el archivo
      const uploadResponse = await fetch(upload_url, {
        method: 'PUT',
        headers: { 'Content-Type': file.type },
        body: file
      });
      
      if (!uploadResponse.ok) throw new Error('La subida del archivo a Cloud Storage falló.');

      // PASO 3: Finalizar y Activar IA
      const finalizeBody = {
        opportunity_id,
        gcs_uri,
        original_filename: file.name,
        content_type: file.type,
        customer_id: customerId,
        tender_document_category: category,
        document_type: name
      };

      await apiClient.post('/finalize_ia_analysis', finalizeBody);
      
      toast({ title: "Éxito", description: "Análisis iniciado correctamente. Redirigiendo..." });
      setIsAnalysisModalOpen(false);
      setAnalysisData({ file: null, category: '', name: '' });
      // El parámetro ?analyzing=true indica a la página destino que muestre la
      // pantalla de espera de forma inmediata, sin esperar a que el primer fetch
      // confirme el analysis_status (evita el flash de "página vacía").
      router.push(`/dashboard/customers/${customerId}/opportunities/${opportunity_id}?analyzing=true`);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Ocurrió un error desconocido.';
      toast({ title: 'Error al Iniciar Análisis', description: errorMessage, variant: 'destructive' });
    } finally {
      setIsSubmittingAnalysis(false);
    }
  };
  
  const handleArchiveStateChange = async (opportunity: Opportunity, archive: boolean) => {
    setIsArchiving(true);
    try {
        await apiClient.patch('/archive_opportunity', { id: opportunity.id, is_archived: archive });
        toast({ title: `Oportunidad ${archive ? 'archivada' : 'restaurada'} correctamente` });
        setOpportunities(prev => prev.filter(opp => opp.id !== opportunity.id));
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Ocurrió un error desconocido.';
        toast({ title: `Error al ${archive ? 'Archivar' : 'Desarchivar'}`, description: errorMessage, variant: 'destructive' });
    } finally {
        setIsArchiving(false);
        setOpportunityToArchive(null);
    }
  };
  
  const experienceDocuments = useMemo(
    () => customerDocuments.filter(d => d.category === 'experience'),
    [customerDocuments],
  );
  const rupDocuments = useMemo(
    () => customerDocuments.filter(d => d.category === 'rup'),
    [customerDocuments],
  );
  const financialStatementsDocuments = useMemo(
    () => customerDocuments.filter(d => d.category === 'financial_statements'),
    [customerDocuments],
  );
  const otherDocuments = useMemo(
    () => customerDocuments.filter(d => d.category === 'other'),
    [customerDocuments],
  );

  const documentCategories = {
    experience: {
        title: "Documentos de Experiencia",
        icon: FileBadge,
        documents: experienceDocuments,
    },
    rup: {
        title: "Registro Único de Proponentes (RUP)",
        icon: Award,
        documents: rupDocuments,
        showFinancialWidget: true,
        sourceType: 'rup' as const,
    },
    financial_statements: {
        title: "Estados Financieros",
        icon: Landmark,
        documents: financialStatementsDocuments,
        showFinancialWidget: true,
        sourceType: 'financial_statements' as const,
    },
    other: {
        title: "Otros Documentos",
        icon: FolderArchive,
        documents: otherDocuments,
    },
  };

  const getStatusIcon = (status: CustomerDocument['status']) => {
    switch (status) {
      case 'verified': return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'uploaded': return <FileCheck className="h-5 w-5 text-blue-500" />;
      case 'pending':
      default:
        return <AlertCircle className="h-5 w-5 text-yellow-500" />;
    }
  };

  const filteredOpportunities = useMemo(() => {
    if (!opportunities) return [];
    
    let filtered = opportunities;

    if (statusFilter === 'archived') {
        filtered = opportunities.filter(opp => opp.is_archived);
    } else {
        filtered = opportunities.filter(opp => !opp.is_archived);
        if (statusFilter !== 'all') {
            filtered = filtered.filter(opp => opp.status === statusFilter);
        }
    }
    
    return filtered.map(opp => ({
        ...opp,
        urgencyInfo: opp.deadline ? getUrgencyInfo(opp.deadline) : null,
    })).sort((a, b) => {
        const aIsFinal = FINAL_OPPORTUNITY_STATUSES.includes(a.status);
        const bIsFinal = FINAL_OPPORTUNITY_STATUSES.includes(b.status);

        if (aIsFinal !== bIsFinal) {
            return aIsFinal ? 1 : -1; // Final statuses go to the end
        }

        if (a.deadline && b.deadline) {
            return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
        }
        if (a.deadline) return -1; // Opportunities with deadlines first
        if (b.deadline) return 1;
        
        return a.title.localeCompare(b.title); // Fallback to title sort
    });
  }, [opportunities, statusFilter]);

  const summaryStats = useMemo(() => {
    const activeOpps = opportunities.filter(o => !o.is_archived);
    const urgentCount = filteredOpportunities.filter(opp => opp.urgencyInfo?.status === 'urgent').length;
    const upcomingCount = filteredOpportunities.filter(opp => opp.urgencyInfo?.status === 'upcoming').length;
    const overdueCount = filteredOpportunities.filter(opp => opp.urgencyInfo?.status === 'overdue').length;
    const nextToExpire = [...filteredOpportunities]
        .filter(opp => opp.deadline && !isPast(new Date(opp.deadline)))
        .sort((a, b) => new Date(a.deadline!).getTime() - new Date(b.deadline!).getTime())[0];
    const pipelineValue = activeOpps
        .filter(opp => opp.status === 'En Desarrollo' || opp.status === 'Enviada')
        .reduce((sum, opp) => sum + (opp.amount || 0), 0);
    return { urgentCount, upcomingCount, overdueCount, nextToExpire, pipelineValue };
  }, [filteredOpportunities, opportunities]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const fmtCOP = (value: number | null | undefined) => {
    if (value == null) return '—';
    return new Intl.NumberFormat('es-CO', {
      style: 'currency', currency: 'COP',
      notation: 'compact', maximumFractionDigits: 1,
    }).format(value);
  };

  const fmtDate = (iso: string | null | undefined) => {
    if (!iso) return '—';
    try { return format(new Date(iso), 'MMM yyyy', { locale: es }); }
    catch { return iso; }
  };
  
  if (loading) {
    return <CustomerZoneSkeleton />;
  }

  if (error) {
    return (
      <div className="space-y-6">
        <section className="space-y-4 border-t border-border pt-8" aria-labelledby="customer-zone-error-heading">
          <div className="space-y-2">
            <h2
              id="customer-zone-error-heading"
              className="flex items-center gap-2 text-lg font-semibold tracking-tight text-foreground md:text-xl"
            >
              <AlertCircle className="h-5 w-5 shrink-0 text-destructive" aria-hidden />
              No se pudo cargar la zona de cliente
            </h2>
            <p className="text-sm leading-relaxed text-muted-foreground">{error}</p>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Compruebe su conexión e inténtelo de nuevo más tarde.
            </p>
          </div>
          <Card className="border-destructive/30 bg-destructive/[0.04] shadow-sm">
            <CardContent className="flex flex-col gap-4 py-5 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-muted-foreground">
                Si el problema continúa, escríbanos a{' '}
                <a
                  href="mailto:hola@bidtory.com"
                  className="font-medium text-accent underline-offset-4 hover:underline"
                >
                  hola@bidtory.com
                </a>
                .
              </p>
              <Button
                type="button"
                variant="secondary"
                className="shrink-0"
                onClick={() => void fetchData()}
              >
                Reintentar
              </Button>
            </CardContent>
          </Card>
        </section>
      </div>
    );
  }

  if (!customer) {
    return <div className="text-center py-10">Cliente no encontrado.</div>;
  }
  
  const currentViewTitle = statusFilter === 'archived' ? 'Oportunidades Archivadas' : 'Oportunidades Activas';

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4 min-w-0">
          {/* <img> nativo: URLs firmadas GCS no deben pasar por el optimizador de next/image (403 / ORB en dev). */}
          <img
            src={customerLogoImgSrc(
              customer.logo_signed_url,
              `https://placehold.co/100x100.png?text=${customer.name.charAt(0)}`
            )}
            alt={`${customer.name} logo`}
            width={100}
            height={100}
            className="rounded-lg border shadow-md object-cover shrink-0"
            data-ai-hint="company logo"
            key={customer.logo_signed_url}
            referrerPolicy="no-referrer"
          />
          <div className="min-w-0">
            <h1 className="text-3xl font-headline tracking-tight">{customer.name}</h1>
            <p className="text-muted-foreground mt-1">{customer.profileInfo}</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" asChild className="border-primary/40 bg-background text-primary shadow-sm hover:!bg-primary/10 hover:!text-primary">
            <Link href={`/dashboard/customers/${customerId}/pipeline`}>
              <LayoutDashboard className="mr-2 h-4 w-4" /> Ver Pipeline
            </Link>
          </Button>
          {canCreateAndEdit && (
            <Dialog open={isLogoDialogOpen} onOpenChange={setIsLogoDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="ghost" className="text-primary hover:!bg-primary/10 hover:!text-primary">
                  <ImagePlus className="mr-2 h-4 w-4" /> Actualizar Logo
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                      <DialogTitle>Actualizar Logo del Cliente</DialogTitle>
                      <DialogDescription>
                          Selecciona un nuevo archivo de imagen para el logo. Se recomienda un formato cuadrado (ej. 200x200).
                      </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                      <div className="grid gap-2">
                          <Label htmlFor="logoFile">Archivo del Logo</Label>
                          <Input 
                            id="logoFile" 
                            type="file"
                            accept="image/png, image/jpeg, image/gif, image/svg+xml"
                            onChange={(e) => setNewLogoFile(e.target.files?.[0] || null)}
                            className="cursor-pointer file:text-foreground"
                            disabled={isSubmittingLogo}
                          />
                          {newLogoFile && (
                            <div className="text-sm text-muted-foreground flex items-center gap-2 mt-2">
                              <FileUp className="h-4 w-4" />
                              <span>{newLogoFile.name} ({(newLogoFile.size / 1024).toFixed(2)} KB)</span>
                            </div>
                          )}
                      </div>
                  </div>
                  <DialogFooter>
                      <DialogClose asChild>
                          <Button variant="outline" disabled={isSubmittingLogo}>Cancelar</Button>
                      </DialogClose>
                      <Button onClick={handleLogoUpdate} disabled={isSubmittingLogo || !newLogoFile}>
                          {isSubmittingLogo && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                          {isSubmittingLogo ? 'Actualizando...' : 'Guardar Logo'}
                      </Button>
                  </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
          
          {canAnalyzeTender && (
            <Dialog open={isAnalysisModalOpen} onOpenChange={setIsAnalysisModalOpen}>
                <DialogTrigger asChild>
                    <Button
                      onClick={handleOpenAnalysisModal}
                      className="bg-accent text-accent-foreground shadow-sm hover:bg-accent/90 focus-visible:ring-accent"
                    >
                        <BidtoryRadarIcon className="mr-2 h-4 w-4" /> Analizar Nuevo Pliego
                    </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Analizar Nuevo Pliego con IA</DialogTitle>
                        <DialogDescription>
                            Sube un documento (pliego, términos de referencia, etc.) para que la IA cree un borrador de la oportunidad.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-6 py-4 max-h-[70vh] overflow-y-auto pr-6">
                        <Card>
                            <CardContent className="pt-6 space-y-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="analysis-category">Categoría del Documento</Label>
                                    <Select 
                                        value={analysisData.category} 
                                        onValueChange={(value) => setAnalysisData(prev => ({ ...prev, category: value }))}
                                        disabled={isSubmittingAnalysis}
                                    >
                                        <SelectTrigger id="analysis-category" className="bg-muted/50 border-secondary focus:border-accent focus:ring-accent">
                                            <SelectValue placeholder="Selecciona una categoría..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {TENDER_CATEGORIES_FOR_ANALYSIS.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="analysis-name">Nombre/Descripción Específico</Label>
                                    <Input 
                                        id="analysis-name" 
                                        value={analysisData.name}
                                        onChange={(e) => setAnalysisData(prev => ({...prev, name: e.target.value}))}
                                        placeholder="Ej. Pliego Principal V1"
                                        className="bg-muted/50 border-secondary focus:border-accent focus:ring-accent"
                                        disabled={isSubmittingAnalysis}
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="analysis-file">Archivo del Pliego</Label>
                                    <Input 
                                        id="analysis-file" 
                                        type="file"
                                        className="cursor-pointer file:text-foreground"
                                        onChange={(e) => setAnalysisData(prev => ({ ...prev, file: e.target.files?.[0] || null }))}
                                        disabled={isSubmittingAnalysis}
                                    />
                                    {analysisData.file && (
                                        <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                                            <FileCheck className="h-3 w-3" /> {analysisData.file.name}
                                        </p>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                    <DialogFooter>
                        <DialogClose asChild>
                            <Button variant="outline" disabled={isSubmittingAnalysis}>Cancelar</Button>
                        </DialogClose>
                        <Button 
                            onClick={handleInitiateAnalysis} 
                            disabled={isSubmittingAnalysis || !analysisData.file || !analysisData.category || !analysisData.name}
                            className="bg-accent text-accent-foreground hover:bg-accent/90"
                        >
                            {isSubmittingAnalysis && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {isSubmittingAnalysis ? 'Analizando...' : 'Iniciar Análisis'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
          )}
        </div>
      </div>
      
      {/* Summary — mismos datos, contenedor unificado */}
      <section
        aria-label="Resumen de oportunidades"
        className="overflow-hidden rounded-xl border border-border bg-card shadow-sm"
      >
        <div className="grid grid-cols-1 divide-y divide-border md:grid-cols-2 md:divide-y lg:grid-cols-5 lg:divide-x lg:divide-y-0">
          <div className="border-l-4 border-l-border p-4 sm:p-5">
            <div className="flex flex-row items-center justify-between gap-2 pb-2">
              <h3 className="text-sm font-medium">Próximo Vencimiento</h3>
              <CalendarClock className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
            </div>
            <div className="pt-0.5">
              {summaryStats.nextToExpire ? (
                <div>
                  <div className="text-2xl font-bold text-primary">
                    {format(new Date(summaryStats.nextToExpire.deadline!), 'dd MMM yyyy, p', {
                      locale: es,
                    })}
                  </div>
                  <p className="text-xs text-muted-foreground truncate">{summaryStats.nextToExpire.title}</p>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground pt-2">No hay vencimientos próximos.</p>
              )}
            </div>
          </div>
          <div className="border-l-4 border-l-border p-4 sm:p-5">
            <div className="flex flex-row items-center justify-between gap-2 pb-2">
              <h3 className="text-sm font-medium">Oportunidades Activas</h3>
              <Target className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
            </div>
            <div className="text-2xl font-bold">{filteredOpportunities.length}</div>
            <p className="text-xs text-muted-foreground">Total de oportunidades en curso</p>
          </div>
          <div className="border-l-4 border-l-highlight p-4 sm:p-5">
            <div className="flex flex-row items-center justify-between gap-2 pb-2">
              <h3 className="text-sm font-medium">Próximas a Vencer</h3>
              <AlertTriangle className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
            </div>
            <div className="text-2xl font-bold">{summaryStats.upcomingCount}</div>
            <p className="text-xs text-muted-foreground">Vencen en 8-14 días</p>
          </div>
          <div className="border-l-4 border-l-urgency p-4 sm:p-5">
            <div className="flex flex-row items-center justify-between gap-2 pb-2">
              <h3 className="text-sm font-medium">Urgentes</h3>
              <Clock className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
            </div>
            <div className="text-2xl font-bold text-urgency">{summaryStats.urgentCount}</div>
            <p className="text-xs text-muted-foreground">Vencen en &lt; 8 días</p>
          </div>
          <div className="border-l-4 border-l-accent p-4 sm:p-5 md:col-span-2 lg:col-span-1">
            <div className="flex flex-row items-center justify-between gap-2 pb-2">
              <h3 className="text-sm font-medium">Valor en Juego</h3>
              <DollarSign className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
            </div>
            <div className="text-2xl font-bold text-accent">{formatCurrency(summaryStats.pipelineValue)}</div>
            <p className="text-xs text-muted-foreground">Suma de oportunidades activas</p>
          </div>
        </div>
      </section>

      {/* Opportunities Section */}
      <section
        aria-labelledby="customer-zone-opportunities-heading"
        className="space-y-4 border-t border-border pt-8"
      >
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <h2
            id="customer-zone-opportunities-heading"
            className="text-2xl font-semibold font-headline"
          >
            {currentViewTitle}
          </h2>
          <div className="flex items-center gap-2">
            <ListFilter className="h-4 w-4 text-muted-foreground" />
            <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full md:w-[180px]">
                    <SelectValue placeholder="Filtrar por estado..." />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">Todos los Activos</SelectItem>
                    {opportunityStatuses?.active_statuses.map(status => (
                        <SelectItem key={status} value={status}>{status}</SelectItem>
                    ))}
                    <Separator />
                    <SelectItem value="archived">Ver Archivadas</SelectItem>
                </SelectContent>
            </Select>
          </div>
        </div>

        {filteredOpportunities.length === 0 ? (
          <Card className="text-center py-12">
            <CardHeader>
              <Briefcase className="mx-auto h-12 w-12 text-muted-foreground" aria-hidden />
              <CardTitle className="mt-4 text-2xl">
                {statusFilter === 'all' ? 'Aún no hay oportunidades activas' : 'No hay oportunidades en esta vista'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                {statusFilter === 'archived'
                  ? 'No hay oportunidades archivadas para este cliente.'
                  : 'Pruebe a seleccionar otro estado o cree una nueva oportunidad.'}
              </CardDescription>
              
              {canAnalyzeTender && statusFilter !== 'archived' && (
                <Button
                  className="mt-6 bg-accent text-accent-foreground shadow-sm hover:bg-accent/90 focus-visible:ring-accent"
                  onClick={handleOpenAnalysisModal}
                >
                  <BidtoryRadarIcon className="mr-2 h-4 w-4" /> Analizar Nuevo Pliego
                </Button>
              )}
              
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredOpportunities.map((opportunity) => {
              const urgencyInfo = opportunity.urgencyInfo;
              const isArchivedView = statusFilter === 'archived';
              const isFinalStatus = FINAL_OPPORTUNITY_STATUSES.includes(opportunity.status);
              const isEnviada = opportunity.status === 'Enviada';

              const leftBorder = opportunityCardLeftBorderClass(opportunity.status, {
                isArchivedView,
                isFinalStatus,
                isEnviada,
                urgencyStatus: urgencyInfo?.status ?? null,
              });

              return (
                <Card 
                  key={opportunity.id} 
                  className={cn(
                    'flex flex-col border border-border border-l-4 shadow-sm transition-shadow duration-300 hover:shadow-lg',
                    isArchivedView && 'bg-muted/30',
                    leftBorder,
                  )}
                >
                  <CardHeader>
                    <div className="flex justify-between items-start gap-2">
                      <CardTitle className="text-xl font-semibold">{opportunity.title}</CardTitle>
                       {canArchive ? (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 -mt-2 -mr-2">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                           {isArchivedView ? (
                                <DropdownMenuItem onSelect={() => handleArchiveStateChange(opportunity, false)}>
                                    <ArchiveRestore className="mr-2 h-4 w-4" />
                                    Desarchivar
                                </DropdownMenuItem>
                            ) : (
                                <DropdownMenuItem onSelect={() => setOpportunityToArchive(opportunity)}>
                                    <Archive className="mr-2 h-4 w-4" />
                                    Archivar
                                </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      ) : (
                        <Badge 
                            variant={opportunity.status === 'Ganada' ? 'default' : 'secondary'}
                            className={cn(
                                'capitalize',
                                opportunity.status === 'Ganada' && 'bg-accent text-accent-foreground',
                                (opportunity.status === 'Perdida' || opportunity.status === 'Descartada') && 'bg-muted text-muted-foreground'
                            )}
                        >
                            {opportunity.status}
                        </Badge>
                      )}
                    </div>
                    <CardDescription className="line-clamp-2">{opportunity.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="flex-grow space-y-3">
                    {opportunity.amount && opportunity.amount > 0 && (
                      <div className="text-lg font-semibold text-accent">
                        <span>{formatCurrency(opportunity.amount)}</span>
                      </div>
                    )}
                    <div className="flex gap-2 flex-wrap">
                       {isFinalStatus ? (
                            <Badge 
                                variant='secondary'
                                className={cn(
                                    'capitalize',
                                    {
                                      'bg-accent text-accent-foreground hover:bg-accent/90': opportunity.status === 'Ganada',
                                      'bg-destructive text-destructive-foreground hover:bg-destructive/90': opportunity.status === 'Perdida',
                                      'bg-[#9b9b9b] text-white hover:bg-[#8a8a8a]': opportunity.status === 'Descartada'
                                    }
                                )}
                            >
                                {opportunity.status === 'Ganada' && <Trophy className="mr-1.5 h-3 w-3" />}
                                {opportunity.status === 'Perdida' && <XCircle className="mr-1.5 h-3 w-3" />}
                                {opportunity.status === 'Descartada' && <Trash className="mr-1.5 h-3 w-3" />}
                                {opportunity.status}
                            </Badge>
                        ) : isEnviada ? (
                           <Badge 
                                variant='secondary'
                                className='capitalize bg-secondary text-secondary-foreground hover:bg-secondary/90'
                            >
                                <Send className="mr-1.5 h-3 w-3" />
                                Enviada
                            </Badge>
                        ) : (
                            <>
                                <Badge
                                  variant="secondary"
                                  className="capitalize border border-primary/35 bg-primary/10 text-primary hover:bg-primary/15"
                                >
                                  {opportunity.status}
                                </Badge>
                                {urgencyInfo?.status === 'overdue' && (
                                  <Badge className="border-0 bg-urgency text-urgency-foreground hover:bg-urgency/90">
                                    <Clock className="mr-1.5 h-3 w-3" /> Vencida
                                  </Badge>
                                )}
                                {urgencyInfo?.status === 'urgent' && (
                                  <Badge className="border border-highlight/60 bg-highlight text-highlight-foreground hover:bg-highlight/90">
                                    <Clock className="mr-1.5 h-3 w-3" /> Urgente
                                  </Badge>
                                )}
                                {urgencyInfo?.status === 'upcoming' && (
                                  <Badge className="border border-highlight/60 bg-highlight text-highlight-foreground hover:bg-highlight/90">
                                    <Clock className="mr-1.5 h-3 w-3" /> Próxima a Vencer
                                  </Badge>
                                )}
                            </>
                        )}
                    </div>
                    {opportunity.deadline && !isFinalStatus && (
                       <p
                         className={cn(
                           'text-sm flex items-center gap-2',
                           isEnviada && 'text-muted-foreground',
                           !isEnviada && urgencyInfo?.status === 'overdue' && 'font-semibold text-urgency',
                           !isEnviada && urgencyInfo?.status === 'urgent' && 'font-semibold text-highlight',
                           !isEnviada && urgencyInfo?.status === 'upcoming' && 'font-medium text-highlight',
                           !isEnviada &&
                             (!urgencyInfo || urgencyInfo.status === 'normal') &&
                             'text-muted-foreground',
                         )}
                       >
                         <CalendarIcon className="h-4 w-4" />
                         <span>Fecha Límite: {format(new Date(opportunity.deadline), "dd MMM yyyy, p", { locale: es })}</span>
                       </p>
                    )}
                  </CardContent>
                  <CardFooter className="flex gap-2">
                    {isArchivedView ? (
                      <Button variant="outline" className="w-full" disabled>
                        Ver Detalles
                      </Button>
                    ) : (
                      <Link href={`/dashboard/customers/${customerId}/opportunities/${opportunity.id}`} passHref className="flex-1">
                        <Button variant="outline" className="w-full">
                          Ver Detalles <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                      </Link>
                    )}
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        )}
      </section>

      {/* Documents Library Section */}
      <section aria-labelledby="customer-zone-documents-heading" className="space-y-4 border-t border-border pt-8">
          <h2 id="customer-zone-documents-heading" className="text-2xl font-semibold font-headline">
            Biblioteca de Documentos
          </h2>
          <Accordion type="multiple" defaultValue={['experience', 'rup', 'financial_statements', 'other']} className="w-full">
              {Object.entries(documentCategories).map(([key, category]) => (
                  (category.documents.length > 0 || canCreateAndEdit) && (
                      <AccordionItem value={key} key={key}>
                          <AccordionTrigger className="text-lg font-semibold hover:no-underline">
                              <div className="flex items-center gap-3">
                                  <category.icon className="h-6 w-6 text-primary" />
                                  <span>{category.title}</span>
                                  <Badge variant="secondary">{category.documents.length}</Badge>
                              </div>
                          </AccordionTrigger>
                          <AccordionContent>
                            {canCreateAndEdit && (
                              <div className="flex justify-end mb-4">
                                  <Button size="sm" onClick={() => handleOpenAddDialog(key as CustomerDocument['category'])}>
                                      <PlusCircle className="mr-2 h-4 w-4" />
                                      Añadir Documento
                                  </Button>
                              </div>
                            )}

                            {/* Widget de indicadores financieros para RUP y EE.FF. */}
                            {'showFinancialWidget' in category && category.showFinancialWidget && (
                              <FinancialProfileWidget
                                key={`fin-${customerId}-${key}-${docLibraryRevision}`}
                                customerId={customerId}
                                categoryDocuments={category.documents}
                                sourceType={category.sourceType}
                              />
                            )}

                            {/* Lista de contratos del RUP con vinculación de certificaciones */}
                            {key === 'rup' && (
                              <RupContractsWidget
                                key={`rupc-${customerId}-${docLibraryRevision}`}
                                customerId={customerId}
                                rupDocs={category.documents}
                                experienceDocs={experienceDocuments}
                                onLinkedDocIdsChange={setLinkedCertDocIds}
                                onSuggestionsChange={setRupSuggestions}
                              />
                            )}

                              {category.documents.length > 0 ? (
                                <ul className="space-y-3 mt-4">
                                {category.documents.map(doc => {
                                  const isExperience = key === 'experience';
                                  const isLinked = linkedCertDocIds.has(String(doc.id));
                                  const extractedData: CertificationExtractedData | null = (() => {
                                    if (!isExperience || !doc.extracted_contract_data) return null;
                                    try {
                                      return typeof doc.extracted_contract_data === 'string'
                                        ? JSON.parse(doc.extracted_contract_data)
                                        : doc.extracted_contract_data;
                                    } catch { return null; }
                                  })();

                                  return (
                                    <ExperienceDocRow
                                      key={doc.id}
                                      doc={doc}
                                      isExperience={isExperience}
                                      isLinked={isLinked}
                                      extractedData={extractedData}
                                      suggestedContract={rupSuggestions.get(String(doc.id)) ?? null}
                                      canCreateAndEdit={canCreateAndEdit}
                                      canDelete={canDelete}
                                      getStatusIcon={getStatusIcon}
                                      onDelete={() => handleOpenDeleteConfirm(doc)}
                                      onFileChange={(e) => handleFileChange(doc.id, e)}
                                      onReextract={handleReextractCertification}
                                      fmtCOP={fmtCOP}
                                      fmtDate={fmtDate}
                                    />
                                  );
                                })}
                                </ul>
                              ) : (
                                <div className="text-center py-4 text-muted-foreground">
                                    No hay documentos en esta categoría.
                                </div>
                              )}
                          </AccordionContent>
                      </AccordionItem>
                  )
              ))}
          </Accordion>
      </section>
      
      <Dialog open={isAddDocDialogOpen} onOpenChange={setIsAddDocDialogOpen}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Añadir Nuevo Documento a {newDocInfo.category && newDocInfo.category in documentCategories ? documentCategories[newDocInfo.category as keyof typeof documentCategories].title : 'Biblioteca'}</DialogTitle>
                <DialogDescription>
                    Dale un nombre al documento y selecciona el archivo que deseas subir.
                </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                    <Label htmlFor="docName">Nombre del Documento (Tipo)</Label>
                    <Input 
                      id="docName" 
                      value={newDocInfo.name} 
                      onChange={(e) => setNewDocInfo({...newDocInfo, name: e.target.value})} 
                      placeholder="Ej: Certificado de Existencia" 
                      disabled={isSubmittingDoc}
                      className="bg-muted/50 border-secondary focus:border-accent focus:ring-accent"
                    />
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="docFile">Archivo</Label>
                    <Input 
                      id="docFile" 
                      type="file"
                      onChange={(e) => setNewDocFile(e.target.files?.[0] || null)}
                      className="cursor-pointer file:text-foreground"
                      disabled={isSubmittingDoc}
                    />
                    {newDocFile && (
                      <div className="text-sm text-muted-foreground flex items-center gap-2 mt-2">
                        <FileUp className="h-4 w-4" />
                        <span>{newDocFile.name} ({(newDocFile.size / 1024).toFixed(2)} KB)</span>
                      </div>
                    )}
                </div>
            </div>
            <DialogFooter>
                <DialogClose asChild>
                    <Button variant="outline" disabled={isSubmittingDoc}>Cancelar</Button>
                </DialogClose>
                <Button onClick={handleUploadGeneralDocument} disabled={isSubmittingDoc || !newDocInfo.name || !newDocFile}>
                    {isSubmittingDoc && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {isSubmittingDoc ? 'Subiendo...' : 'Subir Documento'}
                </Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <AlertDialog open={!!docToDelete} onOpenChange={(isOpen) => !isOpen && setDocToDelete(null)}>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>¿Está seguro?</AlertDialogTitle>
                <AlertDialogDescription>
                   ¿Está seguro de que quiere eliminar el documento "{docToDelete?.fileName || docToDelete?.name}"? 
                   Esta acción no se puede deshacer.
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel disabled={isDeletingDoc}>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={handleDeleteGeneralDocument} disabled={isDeletingDoc} className="bg-destructive hover:bg-destructive/90">
                    {isDeletingDoc && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {isDeletingDoc ? 'Eliminando...' : 'Confirmar Eliminación'}
                </AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!opportunityToArchive} onOpenChange={(isOpen) => !isOpen && setOpportunityToArchive(null)}>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>¿Está seguro?</AlertDialogTitle>
                <AlertDialogDescription>
                    ¿Está seguro de que desea archivar la oportunidad "{opportunityToArchive?.title}"? Podrá encontrarla más tarde en la vista de 'Oportunidades Archivadas'.
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel disabled={isArchiving}>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={() => handleArchiveStateChange(opportunityToArchive!, true)} disabled={isArchiving} className="bg-destructive hover:bg-destructive/90">
                    {isArchiving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {isArchiving ? 'Archivando...' : 'Archivar'}
                </AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </div>
  );
}

    