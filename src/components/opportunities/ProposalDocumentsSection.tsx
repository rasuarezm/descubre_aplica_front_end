
"use client";

import { useMemo, useState, useCallback, ChangeEvent } from 'react';
import type { Opportunity, ProposalDocument, ProposalDocumentStatusInfo, UserProfile, DocumentItem } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/auth-context';
import { FileStack, PlusCircle, ChevronsUpDown, Download, Trash2, GitCommitVertical, Loader2, Edit, FileUp, Replace, Info } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Tooltip, TooltipProvider, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { WBSGenerator } from './WBSGenerator';
import { WBSViewer } from './WBSViewer';

interface ProposalDocumentsSectionProps {
  userProfile: UserProfile | null;
  opportunity: Opportunity;
  proposalDocuments: ProposalDocument[];
  proposalDocumentStatuses: ProposalDocumentStatusInfo | null;
  tenderDocuments: DocumentItem[];
  onRefreshData: () => void;
}

type ModalMode = 'new' | 'version' | 'edit';
interface ModalState {
  isOpen: boolean;
  mode: ModalMode;
  doc: Partial<ProposalDocument> | null;
  file?: File | null;
}

const getStatusClass = (status: string | undefined): string => {
    if (!status) return 'bg-secondary';
    const lowerStatus = status.toLowerCase();
    switch (lowerStatus) {
        case 'en revisión interna':
            return 'bg-highlight/80 text-black hover:bg-highlight/70 border-highlight';
        case 'aprobado':
        case 'aprobado por cliente':
        case 'enviada':
        case 'presentado':
            return 'bg-accent text-accent-foreground hover:bg-accent/90';
        case 'borrador':
        default:
            return 'bg-secondary text-secondary-foreground hover:bg-secondary/80';
    }
};


export function ProposalDocumentsSection({ userProfile, opportunity, proposalDocuments, proposalDocumentStatuses, tenderDocuments, onRefreshData }: ProposalDocumentsSectionProps) {
  const { getIdToken } = useAuth();
  const { toast } = useToast();
  
  const [modalState, setModalState] = useState<ModalState>({ isOpen: false, mode: 'new', doc: null, file: null });
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [docToDelete, setDocToDelete] = useState<ProposalDocument | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // --- Permissions Logic ---
  const canManage = useMemo(() => {
    if (userProfile?.role === 'admin') return true;
    if (userProfile?.role === 'customer') {
      return userProfile.customer_role === 'administrador_cliente';
    }
    return false;
  }, [userProfile]);

  const canCollaborate = useMemo(() => {
    if (userProfile?.role === 'admin') return true;
    if (userProfile?.role === 'customer') {
      return userProfile.customer_role === 'administrador_cliente' || userProfile.customer_role === 'colaborador';
    }
    return false;
  }, [userProfile]);
  // --- End Permissions Logic ---

  const documentThreads = useMemo(() => {
    const threads: { [key: string]: ProposalDocument[] } = {};
    
    proposalDocuments.forEach(doc => {
      const threadId = doc.parent_document_id || doc.id;
      if (!threads[threadId]) {
        threads[threadId] = [];
      }
      threads[threadId].push(doc);
    });

    return Object.values(threads).map(thread => {
      thread.sort((a, b) => new Date(b.uploaded_at).getTime() - new Date(a.uploaded_at).getTime());
      const latestVersion = thread.find(d => d.is_latest_version) || thread[0];
      const olderVersions = thread.filter(d => d.id !== latestVersion.id);
      return { latestVersion, olderVersions };
    });
  }, [proposalDocuments]);

  const openModal = (mode: ModalMode, doc: Partial<ProposalDocument> | null = null) => {
    let parentId: string | null = null;
    if (mode === 'version' && doc) {
        // Always use the original document's ID as the parent for all subsequent versions.
        parentId = doc.parent_document_id || doc.id || null;
    }
    
    setModalState({ 
      isOpen: true, 
      mode, 
      doc: mode === 'edit' ? {...doc} : {
        parent_document_id: parentId,
        status: proposalDocumentStatuses?.default_status || '',
      },
      file: null 
    });
  };

  const handleModalValueChange = (field: keyof ProposalDocument, value: any) => {
    setModalState(prev => prev.doc ? ({ ...prev, doc: { ...prev.doc, [field]: value } }) : prev);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setModalState(prev => ({ ...prev, file: e.target.files?.[0] || null }));
  };

  const handleUploadOrUpdate = async () => {
    const { mode, doc, file } = modalState;
    if (!doc) return;

    if (mode !== 'edit' && !file) {
      toast({ title: "Archivo Requerido", description: "Por favor, seleccione un archivo para subir.", variant: "destructive" });
      return;
    }
    
    setIsSubmitting(true);
    const idToken = await getIdToken();
    if (!idToken) {
      toast({ title: "Error de Autenticación", variant: "destructive" });
      setIsSubmitting(false);
      return;
    }
    
    try {
      if (mode === 'edit') {
        const payload = {
          id: doc.id,
          version_label: doc.version_label,
          description: doc.description,
        };
        const response = await fetch('https://us-central1-procurement-portal-app.cloudfunctions.net/update_proposal_document', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${idToken}` },
            body: JSON.stringify(payload),
        });
        if (!response.ok) throw new Error("No se pudo actualizar el documento.");
        toast({ title: "Éxito", description: "Documento actualizado." });
      } else {

        // 1. Obtener URL Firmada
        // Nota: Usamos el endpoint genérico pero con document_context='proposal'
        const urlPayload = {
            metadata: {
                filename: file!.name,
                content_type: file!.type,
                customer_id: opportunity.customer_id,
                opportunity_id: opportunity.id,
                document_context: 'proposal', // CRÍTICO: Define la ruta en el bucket
                proposal_doc_category: 'propuesta', // Valor por defecto o dinámico si aplica
                version_label: doc.version_label || 'v1',
                parent_document_id: doc.parent_document_id || ''
            }
        };

        const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL;
        if (!apiBase) throw new Error('Missing NEXT_PUBLIC_API_BASE_URL');

        const signResponse = await fetch(`${apiBase}/generate_document_upload_url`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${idToken}` 
            },
            body: JSON.stringify(urlPayload)
        });

        if (!signResponse.ok) throw new Error('Error al obtener permiso de subida.');
        const { upload_url, gcs_uri } = await signResponse.json();

        // 2. Subir a GCS
        const uploadResponse = await fetch(upload_url, {
            method: 'PUT',
            headers: { 'Content-Type': file!.type },
            body: file,
        });

        if (!uploadResponse.ok) throw new Error('Error al subir a Cloud Storage.');

        // 3. Finalizar y Versionar (Nuevo Endpoint)
        const finalizeResponse = await fetch(`${GATEWAY_URL}/finalize_proposal_document_upload`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${idToken}` 
            },
            body: JSON.stringify({
                opportunity_id: opportunity.id,
                customer_id: opportunity.customer_id,
                gcs_uri: gcs_uri,
                filename: file!.name,
                content_type: file!.type,
                category: 'propuesta', // O la categoría que manejes
                version_label: doc.version_label || 'v1',
                description: doc.description || '',
                status: doc.status,
                parent_document_id: doc.parent_document_id || null
            })
        });

        if (!finalizeResponse.ok) throw new Error('Error al finalizar la carga.');
        
        toast({ title: "Éxito", description: "Documento de propuesta guardado." });
      }
      setModalState({ isOpen: false, mode: 'new', doc: null, file: null });
      onRefreshData();

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Ocurrió un error desconocido.';
      toast({ title: 'Error', description: errorMessage, variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleStatusChange = async (docId: string, newStatus: string) => {
    const idToken = await getIdToken();
    if (!idToken) return toast({ title: "Error de Autenticación", variant: "destructive" });

    try {
      const response = await fetch('https://us-central1-procurement-portal-app.cloudfunctions.net/update_proposal_document', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${idToken}` },
        body: JSON.stringify({ id: docId, status: newStatus }),
      });
      if (!response.ok) throw new Error("No se pudo actualizar el estado.");
      toast({ title: "Estado Actualizado" });
      onRefreshData();
    } catch (error) {
      toast({ title: 'Error', description: (error as Error).message, variant: 'destructive' });
    }
  };

  const handleDelete = async () => {
    if (!docToDelete) return;
    setIsDeleting(true);
    const idToken = await getIdToken();
    if (!idToken) {
      setIsDeleting(false);
      return toast({ title: "Error de Autenticación", variant: "destructive" });
    }
    
    try {
        const payload = {
            document_id: docToDelete.id,
            kind: "ProposalDocuments"
        };
        console.log("Enviando payload para eliminar:", payload);
        
        const response = await fetch('https://us-central1-procurement-portal-app.cloudfunctions.net/delete_document', {
            method: 'DELETE',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${idToken}` 
            },
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || 'Error al eliminar el documento.');
        }
        
        toast({ title: "Éxito", description: "Documento eliminado." });
        setDocToDelete(null);
        onRefreshData();
    } catch (error) {
        toast({ title: 'Error', description: (error as Error).message, variant: 'destructive' });
    } finally {
        setIsDeleting(false);
    }
  };

  const getModalTitle = () => {
    switch (modalState.mode) {
      case 'new': return "Añadir Nuevo Documento de Propuesta";
      case 'version': return "Subir Nueva Versión";
      case 'edit': return "Editar Documento";
      default: return "";
    }
  };
  
  const canChangeToFinalStatus = (status: string) => {
      if (canManage) return true;
      const finalStatuses = ['aprobado', 'aprobado por cliente', 'presentado', 'enviada'];
      return !finalStatuses.includes(status.toLowerCase());
  };

  return (
    <>
      <div className="space-y-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FileStack className="h-6 w-6" />
                Documentos de la Propuesta
              </CardTitle>
              <CardDescription>Entregables, borradores y versiones finales elaborados internamente.</CardDescription>
            </div>
            {canCollaborate && (
              <Button size="sm" onClick={() => openModal('new')}>
                <PlusCircle className="mr-2 h-4 w-4" /> Añadir Documento
              </Button>
            )}
          </CardHeader>
          <CardContent>
            {documentThreads.length === 0 ? (
              <div className="text-center text-muted-foreground py-8 border-2 border-dashed rounded-lg">
                <p className="text-sm">No hay documentos de propuesta aún.</p>
                <p className="text-xs">Use el botón "Añadir Documento" para empezar.</p>
              </div>
            ) : (
              <Accordion type="multiple" className="w-full space-y-3">
                {documentThreads.map(({ latestVersion, olderVersions }) => (
                  <AccordionItem key={latestVersion.id} value={latestVersion.id} className="border rounded-lg bg-card/80 px-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between w-full text-left gap-4 py-3">
                          <AccordionTrigger className="flex-1 hover:no-underline p-0 flex justify-start items-center">
                              <div className='flex-1 text-left'>
                                  <p className="font-semibold">{latestVersion.filename}</p>
                                  <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1 flex-wrap">
                                  <span>Versión: <Badge variant="outline">{latestVersion.version_label}</Badge></span>
                                  </div>
                              </div>
                          </AccordionTrigger>

                          <div className="flex sm:items-center gap-2 flex-shrink-0 flex-col sm:flex-row items-start -mt-4 sm:mt-0">
                              {proposalDocumentStatuses ? (
                                  <Select 
                                      value={latestVersion.status} 
                                      onValueChange={(newStatus) => handleStatusChange(latestVersion.id, newStatus)}
                                      disabled={!canCollaborate}
                                  >
                                      <SelectTrigger className={cn("w-auto h-9 text-xs px-2 capitalize [&_svg]:h-3 [&_svg]:w-3 rounded-full border-transparent", getStatusClass(latestVersion.status))}>
                                          <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                          {proposalDocumentStatuses.all_statuses.map(s => 
                                            <SelectItem key={s} value={s} className="capitalize" disabled={!canChangeToFinalStatus(s)}>
                                              {s}
                                            </SelectItem>
                                          )}
                                      </SelectContent>
                                  </Select>
                              ) : (
                              <Badge variant="secondary" className={cn('capitalize h-9 px-3', getStatusClass(latestVersion.status))}>{latestVersion.status}</Badge>
                              )}

                              {canCollaborate && (
                                  <>
                                      <Button variant="outline" size="sm" onClick={() => openModal('version', latestVersion)}>
                                      <Replace className="mr-2 h-4 w-4"/> Nueva Versión
                                      </Button>
                                      <Button variant="outline" size="sm" onClick={() => openModal('edit', latestVersion)}>
                                      <Edit className="mr-2 h-4 w-4"/> Editar
                                      </Button>
                                      <Button variant="ghost" size="icon" onClick={() => setDocToDelete(latestVersion)}>
                                      <Trash2 className="h-4 w-4 text-destructive"/>
                                      </Button>
                                  </>
                              )}
                              <Button variant="outline" size="sm" asChild>
                                <a href={latestVersion.signed_url} download={latestVersion.filename} target="_blank" rel="noopener noreferrer">
                                  <Download className="mr-2 h-4 w-4"/> Descargar
                                </a>
                              </Button>
                          </div>
                    </div>
                    <AccordionContent>
                      <div className="border-t pt-3">
                        <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                          <GitCommitVertical className="h-4 w-4 text-muted-foreground" />
                          Historial de Versiones
                        </h4>
                        <ul className='space-y-2'>
                          {olderVersions.map(version => (
                            <li key={version.id} className="flex justify-between items-center p-2 rounded-md bg-muted/50 text-sm">
                              <div>
                                  <span className="font-medium">{version.filename}</span>
                                  <span className="text-muted-foreground mx-2">({version.version_label})</span>
                                  <span className="text-xs text-muted-foreground">
                                    Subido por {version.uploaded_by_display_name} el {format(new Date(version.uploaded_at), "dd MMM yyyy", { locale: es })}
                                  </span>
                              </div>
                              <Button variant="ghost" size="sm" asChild>
                                  <a href={version.signed_url} download={version.filename} target="_blank" rel="noopener noreferrer">
                                    <Download className="mr-2 h-4 w-4"/> Descargar
                                  </a>
                              </Button>
                            </li>
                          ))}
                          {olderVersions.length === 0 && <p className="text-xs text-muted-foreground italic pl-2">No hay versiones anteriores.</p>}
                        </ul>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            )}
          </CardContent>
        </Card>
        
        <div className="mt-8 space-y-6">
          {opportunity.work_breakdown_structure ? (
            <WBSViewer wbs={opportunity.work_breakdown_structure} opportunityName={opportunity.title} />
          ) : (
            <WBSGenerator
              opportunityId={opportunity.id}
              tenderDocuments={tenderDocuments}
              onWbsGenerated={onRefreshData}
            />
          )}
        </div>
      </div>

      {/* Modal para Subir/Editar */}
      <Dialog open={modalState.isOpen} onOpenChange={(isOpen) => setModalState({...modalState, isOpen})}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{getModalTitle()}</DialogTitle>
          </DialogHeader>
          <TooltipProvider>
            <div className="grid gap-4 py-4">
              {modalState.mode !== 'edit' && (
                <div className="grid gap-2">
                  <Label htmlFor="file">Archivo</Label>
                  <Input id="file" type="file" onChange={handleFileChange} disabled={isSubmitting} />
                  {modalState.file && <p className="text-xs text-muted-foreground flex items-center gap-2"><FileUp className="h-3 w-3" />{modalState.file.name}</p>}
                </div>
              )}
              <div className="grid gap-2">
                <div className="flex items-center gap-2">
                  <Label htmlFor="version_label">Etiqueta de Versión</Label>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="max-w-xs">
                        Asigne un nombre o identificador a esta versión del documento (ej: 'v1', 'Borrador con Ajustes', 'Versión Final'). Esto ayudará a llevar un historial de los cambios.
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <Input id="version_label" value={modalState.doc?.version_label || ''} onChange={(e) => handleModalValueChange('version_label', e.target.value)} disabled={isSubmitting} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="description">Descripción (Opcional)</Label>
                <Textarea id="description" value={modalState.doc?.description || ''} onChange={(e) => handleModalValueChange('description', e.target.value)} disabled={isSubmitting} />
              </div>
              {modalState.mode !== 'edit' && proposalDocumentStatuses && (
                <div className="grid gap-2">
                  <Label htmlFor="status">Estado</Label>
                  <Select value={modalState.doc?.status} onValueChange={(value) => handleModalValueChange('status', value)} disabled={isSubmitting}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {proposalDocumentStatuses.all_statuses.map(s => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          </TooltipProvider>
          <DialogFooter>
            <DialogClose asChild><Button variant="outline" disabled={isSubmitting}>Cancelar</Button></DialogClose>
            <Button onClick={handleUploadOrUpdate} disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {modalState.mode === 'edit' ? 'Guardar Cambios' : 'Subir'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* AlertDialog para Eliminar */}
      <AlertDialog open={!!docToDelete} onOpenChange={(isOpen) => !isOpen && setDocToDelete(null)}>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>¿Está seguro?</AlertDialogTitle>
                <AlertDialogDescription>
                   Se eliminará la versión "{docToDelete?.version_label}" del documento "{docToDelete?.filename}". Esta acción no se puede deshacer.
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete} disabled={isDeleting} className="bg-destructive hover:bg-destructive/90">
                    {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {isDeleting ? 'Eliminando...' : 'Confirmar Eliminación'}
                </AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

    