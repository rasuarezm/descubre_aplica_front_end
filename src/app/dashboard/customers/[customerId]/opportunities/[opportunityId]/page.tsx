
"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DocumentChecklist } from "@/components/opportunities/DocumentChecklist";
import { TenderDocumentsSection } from "@/components/opportunities/TenderDocumentsSection";
import { ProposalDocumentsSection } from "@/components/opportunities/ProposalDocumentsSection";
import { ActivityLogSection } from "@/components/opportunities/ActivityLogSection";
import { IaAnalysisTabContent } from "@/components/opportunities/IaAnalysisTabContent";
import Link from "next/link";
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, CalendarDays, Loader2, AlertCircle, Edit, PlusCircle, Trash2, CalendarIcon, DollarSign, Clock, CheckCircle, Pencil, AlertTriangle, MoreVertical, Archive, Trophy, XCircle, Trash } from "lucide-react";
import type { Opportunity, Customer, DocumentItem, OpportunityStatusInfo, RequiredDocument, UserProfile, ProposalDocument, ProposalDocumentStatusInfo, ImportantDate, OpportunityComment, IaRequiredDocument, AdendaAnalysis } from '@/types';
import { useAuth } from '@/contexts/auth-context';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Calendar } from '@/components/ui/calendar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format, isPast } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { CountdownTimer } from '@/components/opportunities/CountdownTimer';
import { getUrgencyInfo, UrgencyInfo } from '@/lib/date-utils';
import { Checkbox } from '@/components/ui/checkbox';
import { BidtoryRadarColorIcon } from '@/components/icons/BidtoryRadarColorIcon';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AdendaReviewModal } from '@/components/opportunities/AdendaReviewModal';
import apiClient from '@/lib/api-client';
import {
  IA_ANALYSIS_ERROR_STATUSES,
  IA_ANALYSIS_IN_PROGRESS_STATUSES,
} from '@/lib/ia-analysis-constants';

const FINAL_OPPORTUNITY_STATUSES = ['Ganada', 'Perdida', 'Descartada'];

export default function OpportunityDetailPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const customerId = params.customerId as string;
  const opportunityId = params.opportunityId as string;
  const { toast } = useToast();

  // Si el usuario llegó desde el flujo de creación con análisis, mostramos la
  // pantalla de espera de forma inmediata (antes del primer fetch) para evitar
  // el flash de "página vacía" durante la race condition entre la navegación y
  // el GCS trigger que actualiza el analysis_status a 'pending'.
  const [isOptimisticallyAnalyzing, setIsOptimisticallyAnalyzing] = useState(
    () => searchParams.get('analyzing') === 'true'
  );
  const { user, userProfile, getIdToken } = useAuth();

  const [opportunity, setOpportunity] = useState<Opportunity | null>(null);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [allDocs, setAllDocs] = useState<DocumentItem[]>([]);
  const [opportunityStatuses, setOpportunityStatuses] = useState<OpportunityStatusInfo | null>(null);
  const [proposalDocuments, setProposalDocuments] = useState<ProposalDocument[]>([]);
  const [proposalDocumentStatuses, setProposalDocumentStatuses] = useState<ProposalDocumentStatusInfo | null>(null);
  const [comments, setComments] = useState<OpportunityComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [urgencyInfo, setUrgencyInfo] = useState<UrgencyInfo | null>(null);
  const [tenderDocumentCategories, setTenderDocumentCategories] = useState<string[]>([]);
  const [adendaAnalyses, setAdendaAnalyses] = useState<AdendaAnalysis[]>([]);
  const [activeTab, setActiveTab] = useState("checklist");
  
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingOpportunity, setEditingOpportunity] = useState<Partial<Opportunity> & { deadlineTime?: string } | null>(null);
  
  const [isDatesModalOpen, setIsDatesModalOpen] = useState(false);
  const [editingDates, setEditingDates] = useState<{ date?: Date, time: string, label: string }[]>([]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [isAdendaModalOpen, setIsAdendaModalOpen] = useState(false);
  const [isAnalyzingAdenda, setIsAnalyzingAdenda] = useState(false);
  
  const [showArchiveConfirm, setShowArchiveConfirm] = useState(false);
  const [isArchiving, setIsArchiving] = useState(false);

  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const uploadedDocs = useMemo(() => allDocs.filter(doc => !doc.is_tender_document && doc.document_status !== 'template' && doc.is_active), [allDocs]);
  const tenderDocuments = useMemo(() => allDocs.filter(doc => doc.is_tender_document && doc.is_active), [allDocs]);
  
  const newAdendaAnalyses = useMemo(() => adendaAnalyses.filter(a => a.status === 'new'), [adendaAnalyses]);

  // --- Permissions Logic ---
  const canManageOpportunity = useMemo(() => {
    if (userProfile?.role === 'admin') return true;
    if (userProfile?.role === 'customer') {
      return userProfile.customer_role === 'administrador_cliente';
    }
    return false;
  }, [userProfile]);

  const canCollaborate = useMemo(() => {
    if (userProfile?.role === 'admin') return true;
    if (userProfile?.role === 'customer') {
      return ['administrador_cliente', 'colaborador'].includes(userProfile.customer_role || '');
    }
    return false;
  }, [userProfile]);
  // --- End Permissions Logic ---
  
  const importantDatesInfo = useMemo(() => {
    if (!opportunity?.important_dates) return { sortedDates: [], nextDateId: null };

    const sortedDates = [...opportunity.important_dates]
        .map((d, index) => ({ ...d, originalIndex: index, dateObj: new Date(d.date) }))
        .sort((a, b) => a.dateObj.getTime() - b.dateObj.getTime());
    
    const now = new Date();
    const nextUpcomingDate = sortedDates.find(d => d.dateObj >= now);

    return {
        sortedDates,
        nextDateId: nextUpcomingDate ? nextUpcomingDate.originalIndex : null
    };
}, [opportunity]);

const sortedRequiredDocs = useMemo(() => {
    if (!opportunity?.required_documents) return [];
    return [...opportunity.required_documents].sort((a, b) => {
        const aVal = a.requires_signature ? 1 : 0;
        const bVal = b.requires_signature ? 1 : 0;
        return bVal - aVal;
    });
}, [opportunity?.required_documents]);


  const fetchData = useCallback(async (showLoadingSpinner = true) => {
    if (showLoadingSpinner) setLoading(true);
    setError(null);

    try {
        const [
            oppData,
            allCustomers,
            docsData,
            statusesData,
            propDocsData,
            propDocsStatusesData,
            commentsData,
            tenderCatsData,
            adendaAnalysesData,
        ] = await Promise.all([
            apiClient.get<Opportunity[]>(`/get_opportunities?opportunity_id=${opportunityId}`),
            apiClient.get<Customer[]>('/get_customers'),
            apiClient.get<DocumentItem[]>(`/get_documents?customer_id=${customerId}&opportunity_id=${opportunityId}`).catch(() => []),
            apiClient.get<OpportunityStatusInfo>('/get_opportunity_statuses'),
            apiClient.get<ProposalDocument[]>(`/get_proposal_documents?opportunity_id=${opportunityId}`).catch(() => []),
            apiClient.get<ProposalDocumentStatusInfo>('/get_proposal_document_statuses').catch(() => null),
            apiClient.get<OpportunityComment[]>(`/get_opportunity_comments?opportunity_id=${opportunityId}`).catch(() => []),
            apiClient.get<string[]>('/get_tender_document_categories').catch(() => []),
            apiClient.get<AdendaAnalysis[]>(`/get_adenda_analyses?opportunity_id=${opportunityId}`).catch(() => []),
        ]);

        if (!Array.isArray(oppData) || oppData.length === 0) {
            throw new Error('Oportunidad no encontrada o formato de respuesta incorrecto.');
        }
        const currentOpportunity = oppData[0];

        if (!currentOpportunity) throw new Error('Oportunidad no encontrada o formato de respuesta incorrecto.');
        
        const deadline = currentOpportunity.deadline ? new Date(currentOpportunity.deadline) : undefined;
        const opportunityWithDate = {
            ...currentOpportunity,
            title: currentOpportunity.name,
            deadline: deadline,
            important_dates: currentOpportunity.important_dates?.map((d: any) => ({ ...d, date: new Date(d.date) })) || []
        };
        setOpportunity(opportunityWithDate);
        if (deadline) {
          setUrgencyInfo(getUrgencyInfo(deadline));
        }

        const currentCustomer = allCustomers.find(c => String(c.id) === customerId);
        if (!currentCustomer) throw new Error('Cliente no encontrado.');
        setCustomer(currentCustomer);
        
        setAllDocs(docsData);
        setOpportunityStatuses(statusesData);
        setProposalDocuments(propDocsData.map((d: any) => ({...d, description: d.description || ''})));
        setProposalDocumentStatuses(propDocsStatusesData);
        setComments(commentsData);
        setTenderDocumentCategories(tenderCatsData);
        setAdendaAnalyses(adendaAnalysesData);
        
        // Una vez que la API responde con datos reales, el estado optimista ya no es
        // necesario: la condición del análisis en curso se evalúa con datos reales.
        setIsOptimisticallyAnalyzing(false);

        const analysisStatus = currentOpportunity.ia_analysis?.analysis_status;
        const shouldPoll = IA_ANALYSIS_IN_PROGRESS_STATUSES.includes(analysisStatus ?? '');

        if (shouldPoll) {
            if (!pollingIntervalRef.current) {
                pollingIntervalRef.current = setInterval(() => {
                    fetchData(false);
                }, 15000);
            }
        } else {
            if (pollingIntervalRef.current) {
                clearInterval(pollingIntervalRef.current);
                pollingIntervalRef.current = null;
            }
        }

    } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Ocurrió un error desconocido.";
        setError(errorMessage);
        toast({ title: "Error de Carga", description: errorMessage, variant: "destructive" });
    } finally {
        if (showLoadingSpinner) setLoading(false);
    }
  }, [opportunityId, customerId, toast]);

  useEffect(() => {
    if (customerId && opportunityId) {
      fetchData();
    }
    return () => {
        if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current);
        }
    };
  }, [customerId, opportunityId, fetchData]);
  
    useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchData(false);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [fetchData]);
  
  useEffect(() => {
    if (!isAnalyzingAdenda) return;

    const poll = async () => {
        try {
            const newAnalyses = await apiClient.get<AdendaAnalysis[]>(`/get_adenda_analyses?opportunity_id=${opportunityId}`);
            if (newAnalyses.length > adendaAnalyses.length && newAnalyses.some(a => a.status === 'new')) {
                toast({
                    title: "Análisis de Adenda Completado",
                    description: "Se han detectado cambios. Por favor, revise.",
                });
                setIsAnalyzingAdenda(false);
                fetchData(false);
            }
        } catch (err) {
            console.error("Polling for adenda failed:", err);
            setIsAnalyzingAdenda(false);
        }
    };

    const intervalId = setInterval(poll, 15000);

    return () => clearInterval(intervalId);

  }, [isAnalyzingAdenda, opportunityId, adendaAnalyses, fetchData, toast]);

  
  const handleUploadDocument = useCallback(async (documentName: string, file: File, documentStatus?: 'template' | 'signed'): Promise<void> => {
    try {
        // 1. Obtener URL Firmada
        const urlPayload = {
            metadata: {
                filename: file.name,
                content_type: file.type,
                customer_id: customerId,
                opportunity_id: opportunityId,
                document_type: documentName,
                document_status: documentStatus || 'uploaded'
            }
        };

        const { upload_url, gcs_uri } = await apiClient.post<{ upload_url: string; gcs_uri: string }>(
            '/generate_document_upload_url', 
            urlPayload
        );

        // 2. Subir a GCS
        const uploadResponse = await fetch(upload_url, {
            method: 'PUT',
            headers: { 'Content-Type': file.type },
            body: file,
        });

        if (!uploadResponse.ok) throw new Error('Error al subir a Cloud Storage');

        // 3. Finalizar y Guardar Metadatos
        await apiClient.post('/finalize_opportunity_document_upload', {
            opportunity_id: opportunityId,
            customer_id: customerId,
            gcs_uri: gcs_uri,
            filename: file.name,
            content_type: file.type,
            document_type: documentName,
            document_status: documentStatus || 'uploaded'
        });

        await fetchData(false);
        toast({ title: "Éxito", description: `El documento "${file.name}" fue subido.` });

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Ocurrió un error desconocido.";
        toast({ title: "Error de Subida", description: errorMessage, variant: "destructive" });
        throw error;
    }
  }, [customerId, opportunityId, fetchData, toast]);


  const handleUploadTenderDocument = useCallback(async (name: string, category: string, file: File): Promise<boolean> => {
    let isAdenda = false;
    try {
      // 1. Obtener URL Firmada
      const urlPayload = {
        metadata: {
            filename: file.name,
            content_type: file.type,
            customer_id: customerId,
            opportunity_id: opportunityId,
            document_type: name,
            tender_document_category: category,
            is_tender_document: true
        }
      };

      const { upload_url, gcs_uri } = await apiClient.post<{ upload_url: string; gcs_uri: string }>(
          '/generate_document_upload_url', 
          urlPayload
      );

      // 2. Subir a GCS
      const uploadResponse = await fetch(upload_url, {
          method: 'PUT',
          headers: { 'Content-Type': file.type },
          body: file,
      });

      if (!uploadResponse.ok) throw new Error('Error al subir a Cloud Storage');

      // 3. Finalizar
      await apiClient.post('/finalize_opportunity_document_upload', {
          opportunity_id: opportunityId,
          customer_id: customerId,
          gcs_uri: gcs_uri,
          filename: file.name,
          content_type: file.type,
          tender_document_category: category,
          is_tender_document: true,
          document_type: name
      });
      
      // --- LÓGICA DE NEGOCIO (Mantenida intacta) ---
      
      isAdenda = category.toLowerCase().includes('adenda');
      if (isAdenda) {
        toast({
          title: "¡Adenda Recibida!",
          description: "La IA ha comenzado a analizarla. Se le notificará aquí mismo cuando los cambios estén listos para su revisión.",
        });
        setIsAnalyzingAdenda(true);
      } else {
         toast({ title: 'Éxito', description: 'El documento de referencia ha sido subido.' });
      }
      
      const isUpgrading = category === 'Terminos de Referencia' && tenderDocuments.some(d => d.tender_document_category === 'Borrador de Terminos de Referencia');

      if (isUpgrading) {
          // Actualización optimista: mostramos la pantalla de espera inmediatamente.
          // NO llamamos fetchData aquí — el GCS trigger aún no ha disparado, así que
          // la API devolvería 'completed' (del análisis anterior), sobreescribiría el
          // estado optimista y mataría el polling antes de que empiece.
          // En su lugar, iniciamos el polling directamente para que detecte el cambio
          // cuando el trigger actualice el analysis_status a 'pending'.
          setOpportunity(prev => prev ? {
              ...prev,
              ia_analysis: { ...prev.ia_analysis, analysis_status: 'pending' }
          } as Opportunity : null);
          toast({
            title: "Re-análisis iniciado",
            description: "La IA está procesando el pliego definitivo. La página se actualizará automáticamente al terminar.",
          });
          if (!pollingIntervalRef.current) {
              pollingIntervalRef.current = setInterval(() => {
                  fetchData(false);
              }, 15000);
          }
      } else {
        await fetchData(false);
      }
      
      return isAdenda;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Ocurrió un error desconocido.';
      toast({ title: 'Error al Subir', description: errorMessage, variant: 'destructive' });
      throw error;
    }
    
  }, [customerId, opportunityId, fetchData, toast, tenderDocuments, pollingIntervalRef]);


  const handleDeleteDocument = useCallback(async (documentId: string, kind: 'OpportunityDocuments' | 'ProposalDocuments'): Promise<void> => {
    try {
      await apiClient.delete('/delete_document', { document_id: documentId, kind });
      toast({ title: "¡Éxito!", description: "El documento ha sido eliminado." });
      await fetchData(false);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Ocurrió un error desconocido';
      toast({ title: 'Error al Eliminar', description: errorMessage, variant: 'destructive' });
      throw error;
    }
  }, [fetchData, toast]);
  
  const handleStatusChange = async (newStatus: string) => {
    if (!canManageOpportunity) return;

    const originalStatus = opportunity?.status;
    setOpportunity(prev => prev ? {...prev, status: newStatus} : null);

    try {
      await apiClient.patch('/update_opportunity', { id: opportunityId, status: newStatus });
      await fetchData(false);
      toast({ title: "Éxito", description: `Estado actualizado a "${newStatus}".` });
    } catch (error) {
      setOpportunity(prev => prev ? {...prev, status: originalStatus || ''} : null);
      toast({ title: "Error", description: (error as Error).message, variant: "destructive" });
    }
  };

  const openEditModal = () => {
      const deadline = opportunity?.deadline ? new Date(opportunity.deadline) : undefined;
      setEditingOpportunity({
          ...opportunity,
          required_documents: opportunity?.required_documents?.map(doc => ({...doc})) || [],
          deadline,
          deadlineTime: deadline ? format(deadline, 'HH:mm') : '23:59',
      });
      setIsEditModalOpen(true);
  };
  
  const openDatesModal = () => {
    setEditingDates(
        opportunity?.important_dates?.map(d => ({
            date: new Date(d.date),
            time: format(new Date(d.date), 'HH:mm'),
            label: d.label
        })) || []
    );
    setIsDatesModalOpen(true);
  };

  const handleEditFormChange = (field: keyof Opportunity, value: any) => {
    setEditingOpportunity(prev => prev ? {...prev, [field]: value} : null);
  };
  
  const handleDateChange = (date: Date | undefined) => {
      setEditingOpportunity(prev => {
          if (!prev) return null;
          const newDeadline = date ? new Date(date) : undefined;
          if (newDeadline && prev.deadlineTime) {
              const [hours, minutes] = prev.deadlineTime.split(':').map(Number);
              newDeadline.setHours(hours, minutes, 0, 0);
          }
          return { ...prev, deadline: newDeadline };
      });
  };

  const handleTimeChange = (time: string) => {
      setEditingOpportunity(prev => {
          if (!prev) return null;
          const baseDate = prev.deadline ? new Date(prev.deadline) : new Date();
          const [hours, minutes] = time.split(':').map(Number);
          baseDate.setHours(hours, minutes, 0, 0);
          return { ...prev, deadlineTime: time, deadline: baseDate };
      });
  };

  const handleReqDocChange = (index: number, field: 'name' | 'description' | 'requires_signature', value: string | boolean) => {
    if (!editingOpportunity || !editingOpportunity.required_documents) return;
    const updatedDocs = [...editingOpportunity.required_documents];
    updatedDocs[index] = { ...updatedDocs[index], [field]: value };
    handleEditFormChange('required_documents', updatedDocs);
  };

  const addReqDocField = () => {
    if (!editingOpportunity) return;
    const newDocs = [...(editingOpportunity.required_documents || []), { name: '', description: '', requires_signature: false }];
    handleEditFormChange('required_documents', newDocs);
  };

  const removeReqDocField = (index: number) => {
    if (!editingOpportunity || !editingOpportunity.required_documents) return;
    const newDocs = editingOpportunity.required_documents.filter((_, i) => i !== index);
    handleEditFormChange('required_documents', newDocs);
  };
  
  const handleImportantDateChange = (index: number, field: 'date' | 'time' | 'label', value: Date | string | undefined) => {
    const updated = [...editingDates];
    const item = { ...updated[index] };
    if (field === 'date' && value instanceof Date) item.date = value;
    if (field === 'time' && typeof value === 'string') item.time = value;
    if (field === 'label' && typeof value === 'string') item.label = value;
    updated[index] = item;
    setEditingDates(updated);
  };
  
  const addImportantDateField = () => {
    setEditingDates([...editingDates, { time: '09:00', label: '' }]);
  };

  const removeImportantDateField = (index: number) => {
    const updated = editingDates.filter((_, i) => i !== index);
    setEditingDates(updated);
  };


  const handleUpdateOpportunity = async () => {
    if (!editingOpportunity) return;
    setIsSubmitting(true);
    
    const amountValue = editingOpportunity.amount ? parseFloat(String(editingOpportunity.amount)) : null;

    const payload: { [key: string]: any } = {
      id: opportunityId,
      name: editingOpportunity.title,
      description: editingOpportunity.description,
      deadline: editingOpportunity.deadline ? editingOpportunity.deadline.toISOString() : null,
      amount: amountValue,
      required_documents: editingOpportunity.required_documents?.filter(d => d.name.trim()),
    };

    try {
      await apiClient.patch('/update_opportunity', payload);
      await fetchData(false);
      toast({ title: "Éxito", description: "La oportunidad ha sido actualizada." });
      setIsEditModalOpen(false);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Ocurrió un error desconocido.';
      toast({ title: 'Error al Actualizar', description: errorMessage, variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleUpdateDates = async () => {
    setIsSubmitting(true);

    const formattedImportantDates = editingDates
        .filter(d => d.date && d.label.trim())
        .map(d => {
            const date = new Date(d.date!);
            const [hours, minutes] = d.time.split(':').map(Number);
            date.setHours(hours, minutes, 0, 0);
            return {
                date: date.toISOString(),
                label: d.label.trim()
            };
        });

    const payload = {
        id: opportunityId,
        important_dates: formattedImportantDates
    };
    
    try {
      await apiClient.patch('/update_opportunity', payload);
      await fetchData(false);
      toast({ title: "Éxito", description: "Las fechas importantes han sido actualizadas." });
      setIsDatesModalOpen(false);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Ocurrió un error desconocido.';
      toast({ title: 'Error al Actualizar', description: errorMessage, variant: 'destructive' });
    } finally {
        setIsSubmitting(false);
    }
  };

  const handlePostComment = useCallback(async (commentText: string, parentCommentId: string | null): Promise<void> => {
    try {
        const payload = {
            opportunity_id: opportunityId,
            comment_text: commentText,
            parent_comment_id: parentCommentId,
        };
        await apiClient.post('/create_opportunity_comment', payload);
        toast({ title: "Éxito", description: "Comentario publicado." });
        await fetchData(false);
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Ocurrió un error desconocido.";
        toast({ title: "Error al Comentar", description: errorMessage, variant: "destructive" });
        throw error;
    }
  }, [opportunityId, fetchData, toast]);
  
  const handleAddDocumentsToChecklist = useCallback(async (docsToAdd: IaRequiredDocument[]) => {
    if (!opportunity) return;
    setIsSubmitting(true);
    
    const newChecklistItems: Partial<RequiredDocument>[] = docsToAdd.map(doc => {
        const item: Partial<RequiredDocument> = { name: doc.document_name, description: doc.requirement_details };
        if (doc.requires_signature) { item.requires_signature = true; }
        return item;
    });

    const currentDocs = opportunity.required_documents || [];
    const currentDocNames = new Set(currentDocs.map(d => d.name));
    const uniqueNewItems = newChecklistItems.filter(item => !currentDocNames.has(item.name!));
    
    if (uniqueNewItems.length < newChecklistItems.length) {
      toast({ title: "Documentos Duplicados Omitidos", description: "Algunos de los documentos seleccionados ya estaban en el checklist." });
    }

    if (uniqueNewItems.length === 0) {
      setIsSubmitting(false);
      return;
    }
    
    const updatedChecklist = [ ...currentDocs, ...uniqueNewItems ];

    try {
      await apiClient.patch('/update_opportunity', { id: opportunityId, required_documents: updatedChecklist });
      await fetchData(false);
      toast({ title: "Éxito", description: `${uniqueNewItems.length} documento(s) añadidos al checklist oficial.` });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Ocurrió un error desconocido.';
      toast({ title: 'Error al Actualizar', description: errorMessage, variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }

  }, [opportunity, opportunityId, toast, fetchData]);
  
  const handleArchiveOpportunity = async () => {
    setIsArchiving(true);
    try {
      await apiClient.patch('/archive_opportunity', { id: opportunityId, is_archived: true });
      toast({ title: "Oportunidad archivada correctamente" });
      router.push(`/dashboard/customers/${customerId}`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Ocurrió un error desconocido.';
      toast({ title: 'Error al Archivar', description: errorMessage, variant: 'destructive' });
    } finally {
      setIsArchiving(false);
      setShowArchiveConfirm(false);
    }
  };

  const calculateProgress = () => {
    const requiredDocs = opportunity?.required_documents || [];
    if (requiredDocs.length === 0) return 0;
    
    const uploadedCount = requiredDocs.filter(reqDoc => 
      uploadedDocs.some(upDoc => upDoc.expected_type_label === reqDoc.name && upDoc.document_status !== 'template')
    ).length;

    return (uploadedCount / requiredDocs.length) * 100;
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  if (loading && !opportunity) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-theme(spacing.28))]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-4">Cargando datos de la oportunidad...</p>
      </div>
    );
  }

  if (error || !opportunity || !customer) {
     return (
        <div className="flex flex-col items-center justify-center min-h-[calc(100vh-theme(spacing.28))] text-center">
           <AlertCircle className="h-10 w-10 text-destructive" />
           <p className="mt-4 text-lg font-semibold">{error || "Oportunidad o Cliente no encontrado."}</p>
          <p className="text-muted-foreground">No se pudieron cargar los datos. Intente de nuevo más tarde o vuelva a la página del cliente.</p>
           <Link href={`/dashboard/customers/${customerId}`} passHref>
              <Button variant="outline" className="mt-6">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Volver a la Zona del Cliente
              </Button>
            </Link>
        </div>
      );
  }

  const analysisStatus = opportunity.ia_analysis?.analysis_status;
  if (isOptimisticallyAnalyzing || IA_ANALYSIS_IN_PROGRESS_STATUSES.includes(analysisStatus ?? '')) {
    return (
        <div className="flex flex-col items-center justify-center min-h-[calc(100vh-theme(spacing.28))] text-center">
            <div className="relative mb-4">
                <BidtoryRadarColorIcon className="h-24 w-24" />
                <Loader2 className="h-8 w-8 animate-spin text-highlight absolute -bottom-2 -right-2" />
            </div>
            <h1 className="text-2xl font-headline tracking-tight mb-2">Analizando pliego con IA...</h1>
            <p className="text-muted-foreground max-w-md">
                Esto puede tardar unos minutos. La página se actualizará automáticamente cuando el análisis esté completo y el borrador de la oportunidad esté listo para su revisión.
            </p>
        </div>
    );
  }
  
  const progress = calculateProgress();
  const modalTitle = opportunity.status === 'Prospecto' ? "Revisar y Publicar Oportunidad" : "Editar Detalles de la Oportunidad";
  const isFinalStatus = FINAL_OPPORTUNITY_STATUSES.includes(opportunity.status);

  const iaErrorMessage =
    opportunity.ia_analysis?.analysis_error_message ||
    opportunity.ia_analysis?.error_message;
  const iaStatus = opportunity.ia_analysis?.analysis_status;
  const showIaAnalysisError =
    iaStatus != null &&
    (IA_ANALYSIS_ERROR_STATUSES as readonly string[]).includes(iaStatus);

  return (
    <div className="space-y-8">
      {showIaAnalysisError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>No se pudo completar el análisis de IA</AlertTitle>
          <AlertDescription className="text-left whitespace-pre-wrap">
            {iaErrorMessage ||
              'El análisis del pliego no pudo completarse. Puedes volver a subir un PDF con texto seleccionable o contactar a soporte.'}
          </AlertDescription>
        </Alert>
      )}

      {newAdendaAnalyses.length > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>¡Adenda Detectada!</AlertTitle>
          <AlertDescription className="flex items-center justify-between">
            Se han identificado cambios en esta oportunidad.
            <Button variant="link" className="text-destructive-foreground hover:underline p-0 h-auto" onClick={() => setIsAdendaModalOpen(true)}>
              Revisar Cambios
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {isAnalyzingAdenda && (
        <Alert>
          <Loader2 className="h-4 w-4 animate-spin" />
          <AlertTitle>Analizando Adenda con IA...</AlertTitle>
          <AlertDescription>
            El análisis puede tardar unos minutos. La página se actualizará automáticamente cuando esté listo.
          </AlertDescription>
        </Alert>
      )}

      <div>
        <Link href={`/dashboard/customers/${customerId}`} className="inline-flex items-center text-sm text-accent hover:underline mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver a {customer.name}
        </Link>
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-headline tracking-tight">{opportunity.title}</h1>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-2 text-sm text-muted-foreground">
              {opportunityStatuses && canManageOpportunity ? (
                <Select value={opportunity.status} onValueChange={handleStatusChange}>
                  <SelectTrigger className="w-auto min-w-[150px] capitalize text-sm h-9">
                    <SelectValue placeholder="Seleccionar estado..." />
                  </SelectTrigger>
                  <SelectContent>
                    {opportunityStatuses.all_statuses.map(s => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              ) : (
                <Badge 
                    variant='secondary'
                    className={cn(
                        'capitalize',
                        {
                          'bg-accent text-accent-foreground': opportunity.status === 'Ganada',
                          'bg-destructive text-destructive-foreground': opportunity.status === 'Perdida',
                          'bg-muted-foreground/80 text-background': opportunity.status === 'Descartada',
                        }
                    )}
                >
                  {opportunity.status === 'Ganada' && <Trophy className="mr-1.5 h-3 w-3" />}
                  {opportunity.status === 'Perdida' && <XCircle className="mr-1.5 h-3 w-3" />}
                  {opportunity.status === 'Descartada' && <Trash className="mr-1.5 h-3 w-3" />}
                  {opportunity.status}
                </Badge>
              )}
              
              {!isFinalStatus && urgencyInfo && <CountdownTimer urgency={urgencyInfo} />}

               {!isFinalStatus && urgencyInfo?.status === 'overdue' && (
                  <Badge variant="destructive">
                    <Clock className="mr-1.5 h-3 w-3" /> Vencida
                  </Badge>
                )}
                {!isFinalStatus && urgencyInfo?.status === 'urgent' && (
                  <Badge variant="destructive">
                    <Clock className="mr-1.5 h-3 w-3" /> Urgente
                  </Badge>
                )}
                {!isFinalStatus && urgencyInfo?.status === 'upcoming' && (
                  <Badge variant="secondary" className="bg-highlight text-black">
                    <Clock className="mr-1.5 h-3 w-3" /> Próxima a Vencer
                  </Badge>
                )}

              {opportunity.amount && opportunity.amount > 0 && (
                <span className="font-semibold text-highlight">
                  {formatCurrency(opportunity.amount)}
                </span>
              )}

               {canManageOpportunity && (
                <div className="flex items-center gap-2">
                   <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm">
                          Acciones
                          <MoreVertical className="ml-2 h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onSelect={openEditModal}>
                           <Edit className="mr-2 h-4 w-4" />
                           <span>{opportunity.status === 'Prospecto' ? 'Revisar y Publicar' : 'Editar Oportunidad'}</span>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onSelect={() => setShowArchiveConfirm(true)} className="text-destructive focus:text-destructive">
                          <Archive className="mr-2 h-4 w-4" />
                          <span>Archivar Oportunidad</span>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                </div>
              )}
            </div>
          </div>
        </div>
        <Card className="mt-4 bg-card">
          <CardContent className="pt-6">
            <p className="text-muted-foreground">{opportunity.description}</p>
          </CardContent>
        </Card>
      </div>
      
      <Card>
          <CardHeader>
            <CardTitle>Progreso General</CardTitle>
            <CardDescription>Porcentaje de documentos requeridos que ya han sido subidos.</CardDescription>
          </CardHeader>
          <CardContent>
            <Progress value={progress} className="w-full [&>div]:bg-accent" aria-label={`${Math.round(progress)}% completo`} />
            <p className="text-sm text-muted-foreground mt-2">{Math.round(progress)}% de documentos subidos.</p>
          </CardContent>
      </Card>
          
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="checklist">Checklist</TabsTrigger>
                <TabsTrigger value="proposal">Propuesta</TabsTrigger>
                <TabsTrigger value="ia-analysis" disabled={!opportunity.ia_analysis}>Análisis IA</TabsTrigger>
                <TabsTrigger value="log">Bitácora</TabsTrigger>
              </TabsList>
              <TabsContent value="checklist" className="mt-6 space-y-8">
                <TenderDocumentsSection
                  userProfile={userProfile}
                  documents={tenderDocuments}
                  categories={tenderDocumentCategories}
                  onUploadDocument={handleUploadTenderDocument}
                  onDeleteDocument={(docId) => handleDeleteDocument(docId, 'OpportunityDocuments')}
                />
                <DocumentChecklist 
                    userProfile={userProfile}
                    requiredDocuments={sortedRequiredDocs}
                    uploadedDocuments={allDocs.filter(d => !d.is_tender_document)}
                    onUploadDocument={handleUploadDocument}
                    onDeleteDocument={(docId) => handleDeleteDocument(docId, 'OpportunityDocuments')}
                />
              </TabsContent>
              <TabsContent value="proposal" className="mt-6">
                <ProposalDocumentsSection 
                  userProfile={userProfile}
                  opportunity={opportunity}
                  proposalDocuments={proposalDocuments}
                  proposalDocumentStatuses={proposalDocumentStatuses}
                  tenderDocuments={tenderDocuments}
                  onRefreshData={() => fetchData(false)}
                />
              </TabsContent>
               <TabsContent value="ia-analysis" className="mt-6">
                <IaAnalysisTabContent 
                  ia_analysis={opportunity.ia_analysis}
                  onAddDocumentsToChecklist={handleAddDocumentsToChecklist}
                  isSubmitting={isSubmitting}
                  officialChecklist={opportunity.required_documents || []}
                  opportunityId={opportunityId}
                  customerId={customerId}
                  tenderDocuments={tenderDocuments}
                />
              </TabsContent>
              <TabsContent value="log" className="mt-6">
                <ActivityLogSection 
                  userProfile={userProfile}
                  comments={comments}
                  onPostComment={handlePostComment}
                  onRefreshData={() => fetchData(false)}
                  currentUserId={user?.uid}
                />
              </TabsContent>
            </Tabs>
        </div>
        
        <div className="lg:col-span-1 space-y-8">
           <Card>
             <CardHeader className="flex flex-row items-center justify-between pb-4">
               <CardTitle>Cronograma Clave</CardTitle>
               {canManageOpportunity && (
                <Button variant="outline" size="sm" onClick={openDatesModal}>
                  {importantDatesInfo.sortedDates.length > 0 ? <Pencil className="mr-2 h-4 w-4"/> : <PlusCircle className="mr-2 h-4 w-4"/>}
                  {importantDatesInfo.sortedDates.length > 0 ? 'Editar Fechas' : 'Añadir Fecha'}
                </Button>
               )}
             </CardHeader>
             <CardContent>
                {opportunity.execution_period && (
                    <div className="mb-4 pb-4 border-b">
                        <p className="text-sm text-muted-foreground">Plazo de Ejecución del Contrato</p>
                        <p className="text-lg font-bold text-foreground">
                        {opportunity.execution_period}
                        </p>
                    </div>
                )}
                {importantDatesInfo.sortedDates.length > 0 ? (
                  <>
                    <h4 className="font-semibold text-sm mb-3">Hitos y Vencimientos</h4>
                    <ul className="space-y-4">
                      {importantDatesInfo.sortedDates.map((item, index) => {
                        const hasPassed = isPast(item.dateObj);
                        const isNext = item.originalIndex === importantDatesInfo.nextDateId;
                        return (
                          <li key={index} className="flex items-start gap-3">
                            <div className="flex-shrink-0 pt-1">
                              {hasPassed ? (
                                <CheckCircle className="h-4 w-4 text-accent" />
                              ) : (
                                <CalendarIcon className={cn("h-4 w-4", isNext ? "text-highlight" : "text-muted-foreground")} />
                              )}
                            </div>
                            <div className={cn(hasPassed && "opacity-60")}>
                              <p className={cn("font-semibold text-sm", isNext && !hasPassed && "text-highlight")}>
                                {item.label}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {format(item.dateObj, "eeee, dd 'de' MMMM, yyyy 'a las' p", { locale: es })}
                              </p>
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  </>
                ) : (
                  <div className="text-center text-muted-foreground py-6">
                    <p className="text-sm">No hay hitos o vencimientos añadidos.</p>
                  </div>
                )}
             </CardContent>
           </Card>
        </div>
      </div>
      
      {/* Modal para Editar Oportunidad */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="sm:max-w-2xl">
            <DialogHeader>
                <DialogTitle>{modalTitle}</DialogTitle>
            </DialogHeader>
            {editingOpportunity && (
              <div className="grid gap-6 py-4 max-h-[70vh] overflow-y-auto pr-6">
                <Card>
                    <CardHeader><CardTitle>Información General</CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid gap-2">
                          <Label htmlFor="opp-title">Título</Label>
                          <Input id="opp-title" value={editingOpportunity.title || ''} onChange={(e) => handleEditFormChange('title', e.target.value)} />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="opp-desc">Descripción</Label>
                          <Textarea id="opp-desc" value={editingOpportunity.description || ''} onChange={(e) => handleEditFormChange('description', e.target.value)} />
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="grid gap-2">
                              <Label htmlFor="opp-amount">Monto (Opcional)</Label>
                              <Input id="opp-amount" type="number" value={editingOpportunity.amount || ''} onChange={(e) => handleEditFormChange('amount', e.target.value)} placeholder="Ej: 150000000" />
                            </div>
                            <div className="grid gap-2">
                              <Label>Fecha y Hora Límite</Label>
                                <div className="flex gap-2">
                                  <Popover>
                                    <PopoverTrigger asChild>
                                      <Button variant={"outline"} className={cn("w-[65%] justify-start text-left font-normal", !editingOpportunity.deadline && "text-muted-foreground")}>
                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                        {editingOpportunity.deadline && editingOpportunity.deadline instanceof Date && !isNaN(editingOpportunity.deadline.getTime())
                                            ? format(editingOpportunity.deadline, "PPP", { locale: es }) 
                                            : <span>Elige una fecha</span>}
                                      </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0">
                                      <Calendar 
                                        mode="single" 
                                        selected={editingOpportunity.deadline} 
                                        onSelect={(date) => handleDateChange(date)} 
                                        initialFocus 
                                      />
                                    </PopoverContent>
                                  </Popover>
                                  <Input
                                      type="time"
                                      className="w-[35%]"
                                      value={editingOpportunity.deadlineTime || ''}
                                      onChange={(e) => handleTimeChange(e.target.value)}
                                  />
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader><CardTitle>Documentos Requeridos</CardTitle></CardHeader>
                    <CardContent>
                      <div className="space-y-4 mt-2">
                        {editingOpportunity.required_documents?.map((doc, index) => (
                          <div key={index} className="flex flex-col gap-2 p-3 border rounded-md">
                            <div className="flex items-end gap-2">
                              <div className="grid gap-1.5 flex-1">
                                <Label htmlFor={`doc-name-${index}`} className="text-xs">Nombre</Label>
                                <Input id={`doc-name-${index}`} value={doc.name} onChange={(e) => handleReqDocChange(index, 'name', e.target.value)} />
                              </div>
                              <div className="grid gap-1.5 flex-1">
                                <Label htmlFor={`doc-desc-${index}`} className="text-xs">Descripción</Label>
                                <Input id={`doc-desc-${index}`} value={doc.description} onChange={(e) => handleReqDocChange(index, 'description', e.target.value)} />
                              </div>
                              <Button variant="ghost" size="icon" onClick={() => removeReqDocField(index)}>
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                            <div className="flex items-center space-x-2 mt-2">
                              <Checkbox
                                id={`req-sig-${index}`}
                                checked={doc.requires_signature}
                                onCheckedChange={(checked) => handleReqDocChange(index, 'requires_signature', !!checked)}
                              />
                              <label
                                htmlFor={`req-sig-${index}`}
                                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                              >
                                Requiere Firma
                              </label>
                            </div>
                          </div>
                        ))}
                        <Button variant="outline" size="sm" onClick={addReqDocField}>
                          <PlusCircle className="mr-2 h-4 w-4" /> Añadir Documento
                        </Button>
                      </div>
                    </CardContent>
                </Card>
              </div>
            )}
            <DialogFooter>
                <DialogClose asChild>
                    <Button variant="outline" disabled={isSubmitting}>Cancelar</Button>
                </DialogClose>
                <Button onClick={handleUpdateOpportunity} disabled={isSubmitting}>
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Guardar Cambios
                </Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Modal para Fechas Importantes */}
      <Dialog open={isDatesModalOpen} onOpenChange={setIsDatesModalOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Gestionar Fechas Importantes</DialogTitle>
          </DialogHeader>
            <div className="grid gap-6 py-4 max-h-[70vh] overflow-y-auto pr-6">
              <Card>
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    {editingDates.map((item, index) => (
                      <div key={index} className="flex items-end gap-2 p-3 border rounded-md">
                        <div className="grid gap-1.5 flex-1">
                          <Label htmlFor={`edit-imp-date-label-${index}`} className="text-xs">Descripción</Label>
                          <Input id={`edit-imp-date-label-${index}`} value={item.label} onChange={(e) => handleImportantDateChange(index, 'label', e.target.value)} />
                        </div>
                        <div className="grid gap-1.5">
                          <Label htmlFor={`edit-imp-date-date-${index}`} className="text-xs">Fecha y Hora</Label>
                          <div className="flex gap-2">
                            <Popover>
                              <PopoverTrigger asChild>
                                <Button variant={"outline"} className={cn("w-[150px] justify-start text-left font-normal", !item.date && "text-muted-foreground")}>
                                  <CalendarIcon className="mr-2 h-4 w-4" />
                                  {item.date ? format(item.date, "PPP", { locale: es }) : <span>Elegir fecha</span>}
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={item.date} onSelect={(date) => handleImportantDateChange(index, 'date', date)} initialFocus /></PopoverContent>
                            </Popover>
                            <Input type="time" className="w-[100px]" value={item.time} onChange={(e) => handleImportantDateChange(index, 'time', e.target.value)} />
                          </div>
                        </div>
                        <Button variant="ghost" size="icon" onClick={() => removeImportantDateField(index)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    ))}
                    <Button variant="outline" size="sm" onClick={addImportantDateField}>
                      <PlusCircle className="mr-2 h-4 w-4" /> Añadir Fecha
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          <DialogFooter>
            <DialogClose asChild>
                <Button variant="outline" disabled={isSubmitting}>Cancelar</Button>
            </DialogClose>
            <Button onClick={handleUpdateDates} disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Guardar Fechas
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Modal para Revisión de Adenda */}
      {newAdendaAnalyses.length > 0 && (
        <AdendaReviewModal
            isOpen={isAdendaModalOpen}
            onOpenChange={setIsAdendaModalOpen}
            adendaAnalysis={newAdendaAnalyses[0]}
            onRefreshData={() => fetchData(false)}
            onNavigateToTab={setActiveTab}
        />
      )}

       {/* AlertDialog para Archivar */}
      <AlertDialog open={showArchiveConfirm} onOpenChange={setShowArchiveConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Está seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Está seguro de que desea archivar esta oportunidad? Podrá encontrarla más tarde en la vista de 'Oportunidades Archivadas'.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isArchiving}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleArchiveOpportunity} disabled={isArchiving} className="bg-destructive hover:bg-destructive/90">
              {isArchiving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isArchiving ? 'Archivando...' : 'Archivar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

    