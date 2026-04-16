

"use client";

import type { DocumentItem, RequiredDocument, UserProfile } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, UploadCloud, CheckCircle, AlertCircle, Trash2, Download, Loader2, PenSquare, FileDown, FileSignature, CircleAlert } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useState, ChangeEvent, useMemo } from "react";
import { Input } from "../ui/input";
import { Label } from "@/components/ui/label";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface DocumentChecklistProps {
  userProfile: UserProfile | null;
  requiredDocuments: RequiredDocument[];
  uploadedDocuments: DocumentItem[];
  onUploadDocument: (documentName: string, file: File, documentStatus?: 'template' | 'signed') => Promise<void>;
  onDeleteDocument: (documentId: string) => Promise<void>;
}

export function DocumentChecklist({ userProfile, requiredDocuments, uploadedDocuments, onUploadDocument, onDeleteDocument }: DocumentChecklistProps) {
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [docToDelete, setDocToDelete] = useState<DocumentItem | null>(null);

  const canCollaborate = useMemo(() => {
    if (userProfile?.role === 'admin') return true;
    if (userProfile?.role === 'customer') {
      return userProfile.customer_role === 'administrador_cliente' || userProfile.customer_role === 'colaborador';
    }
    return false;
  }, [userProfile]);

  const handleFileChange = async (documentName: string, event: ChangeEvent<HTMLInputElement>, documentStatus?: 'template' | 'signed') => {
    const file = event.target.files?.[0];
    if (file) {
      setUploadingId(documentName);
      try {
        await onUploadDocument(documentName, file, documentStatus);
      } catch (error) {
        // Error toast is handled in the parent component
      } finally {
        setUploadingId(null);
      }
    }
  };

  const confirmDelete = async () => {
    if (!docToDelete) return;
    setDeletingId(docToDelete.id);
    try {
      await onDeleteDocument(docToDelete.id);
    } catch (error) {
      // Error toast is handled in parent
    } finally {
      setDeletingId(null);
      setDocToDelete(null);
    }
  };
  
  const renderNormalRequirement = (req: RequiredDocument) => {
    const doc = uploadedDocuments.find(d => d.expected_type_label === req.name);
    const docId = doc?.id || req.name;
    const isCompleted = !!doc;

    return (
      <li key={docId} className="p-4 border rounded-lg shadow-sm bg-card flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-start gap-3 flex-1">
          {isCompleted ? <CheckCircle className="h-5 w-5 text-accent mt-1" /> : <AlertCircle className="h-5 w-5 text-highlight mt-1" />}
          <div>
            <h4 className="font-semibold">{req.name}</h4>
            <p className="text-sm text-muted-foreground">{req.description}</p>
            {isCompleted && doc.fileName && (
              <div className="mt-1">
                <Badge variant="secondary">{doc.fileName}</Badge>
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 mt-2 sm:mt-0 sm:ml-4 flex-shrink-0">
          {!isCompleted ? (
            <>
              {canCollaborate && (
                <>
                  <Label htmlFor={`file-upload-${docId}`} className="cursor-pointer">
                    <Button asChild size="sm" disabled={uploadingId === req.name}>
                      <div>
                        {uploadingId === req.name ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UploadCloud className="mr-2 h-4 w-4" />}
                        Subir
                      </div>
                    </Button>
                  </Label>
                  <Input id={`file-upload-${docId}`} type="file" className="hidden" onChange={(e) => handleFileChange(req.name, e)} disabled={!!uploadingId} />
                </>
              )}
            </>
          ) : (
            <>
              <Button variant="outline" size="sm" asChild disabled={!doc.signed_url}>
                <a href={doc.signed_url!} download={doc.fileName || req.name} target="_blank" rel="noopener noreferrer">
                  <Download className="mr-2 h-4 w-4" /> Descargar
                </a>
              </Button>
              {canCollaborate && (
                <Button variant="ghost" size="icon" onClick={() => setDocToDelete(doc)} aria-label="Quitar archivo" disabled={deletingId === doc.id}>
                  {deletingId === doc.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4 text-destructive" />}
                </Button>
              )}
            </>
          )}
        </div>
      </li>
    );
  };

  const renderSignatureRequirement = (req: RequiredDocument) => {
    // This component receives ALL uploaded docs and filters internally for signature flow
    const relevantDocs = uploadedDocuments.filter(d => d.expected_type_label === req.name);
    const templateDoc = relevantDocs.find(d => d.document_status === 'template');
    const signedDoc = relevantDocs.find(d => d.document_status === 'signed');

    const docId = `sig-${req.name.replace(/\s+/g, '-')}`;
    const canManageOpportunity = userProfile?.role === 'admin' || userProfile?.customer_role === 'administrador_cliente';

    // ESTADO C: Completado (Ya se subió el documento firmado)
    if (signedDoc) {
      return (
        <li key={docId} className="p-4 border border-accent rounded-lg shadow-sm bg-accent/10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-start gap-3 flex-1">
            <CheckCircle className="h-5 w-5 text-accent mt-1" />
            <div>
              <h4 className="font-semibold">{req.name}</h4>
              <p className="text-sm text-muted-foreground">Documento firmado y completado.</p>
               <div className="mt-1">
                <Badge variant="default" className="bg-accent text-accent-foreground">{signedDoc.fileName || 'Archivo Firmado'}</Badge>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 mt-2 sm:mt-0 sm:ml-4 flex-shrink-0">
             <Button variant="outline" size="sm" asChild disabled={!signedDoc.signed_url}>
                <a href={signedDoc.signed_url!} download={signedDoc.fileName || req.name} target="_blank" rel="noopener noreferrer">
                  <Download className="mr-2 h-4 w-4" /> Descargar Firmado
                </a>
              </Button>
            {canManageOpportunity && (
              <Button variant="destructive" size="sm" onClick={() => setDocToDelete(signedDoc)} aria-label="Solicitar Nueva Firma" disabled={deletingId === signedDoc.id}>
                {deletingId === signedDoc.id ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
                Solicitar Nueva Firma
              </Button>
            )}
          </div>
        </li>
      );
    }
    
    // ESTADO B: Pendiente de Firma (El admin subió el formato)
    if (templateDoc) {
      return (
         <li key={docId} className="p-4 border border-highlight rounded-lg shadow-sm bg-card flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-start gap-3 flex-1">
            <FileSignature className="h-5 w-5 text-highlight mt-1" />
            <div>
              <h4 className="font-semibold">{req.name}</h4>
              <p className="text-sm text-muted-foreground">{req.description}</p>
              <div className="mt-1">
                <Badge variant="secondary" className="bg-highlight/20 text-highlight border-highlight/50">Requiere Firma</Badge>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 mt-2 sm:mt-0 sm:ml-4 flex-shrink-0">
             <Button variant="outline" size="sm" asChild disabled={!templateDoc.signed_url}>
                <a href={templateDoc.signed_url!} download={templateDoc.fileName || req.name} target="_blank" rel="noopener noreferrer">
                  <FileDown className="mr-2 h-4 w-4" /> Descargar para Firmar
                </a>
              </Button>
            {canCollaborate && (
              <>
                 <Label htmlFor={`file-upload-${docId}`} className="cursor-pointer">
                  <Button asChild size="sm" disabled={uploadingId === req.name}>
                    <div>
                      {uploadingId === req.name ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UploadCloud className="mr-2 h-4 w-4" />}
                      Subir Firmado
                    </div>
                  </Button>
                </Label>
                <Input id={`file-upload-${docId}`} type="file" className="hidden" onChange={(e) => handleFileChange(req.name, e, 'signed')} disabled={!!uploadingId} />
              </>
            )}
             {canManageOpportunity && (
                <Button variant="ghost" size="icon" onClick={() => setDocToDelete(templateDoc)} aria-label="Reemplazar Formato" disabled={deletingId === templateDoc.id}>
                    {deletingId === templateDoc.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4 text-destructive" />}
                </Button>
             )}
          </div>
        </li>
      );
    }

    // ESTADO A: Pendiente de Formato (No hay nada)
    return (
       <li key={docId} className="p-4 border rounded-lg shadow-sm bg-muted/30 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-start gap-3 flex-1">
          <CircleAlert className="h-5 w-5 text-highlight mt-1" />
          <div>
            <h4 className="font-semibold">{req.name}</h4>
            <p className="text-sm text-muted-foreground">{req.description}</p>
            <div className="mt-1">
              <Badge variant="outline">Pendiente de Formato</Badge>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 mt-2 sm:mt-0 sm:ml-4 flex-shrink-0">
          {canManageOpportunity && (
             <>
              <Label htmlFor={`file-upload-${docId}`} className="cursor-pointer">
                <Button asChild size="sm" disabled={uploadingId === req.name}>
                  <div>
                    {uploadingId === req.name ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <PenSquare className="mr-2 h-4 w-4" />}
                    Subir Formato
                  </div>
                </Button>
              </Label>
              <Input id={`file-upload-${docId}`} type="file" className="hidden" onChange={(e) => handleFileChange(req.name, e, 'template')} disabled={!!uploadingId} />
            </>
          )}
          {!canManageOpportunity && (
            <p className="text-xs text-muted-foreground italic">Esperando formato del administrador.</p>
          )}
        </div>
      </li>
    );
  };
  
  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-6 w-6" />
            Documentos Requeridos
          </CardTitle>
        </CardHeader>
        <CardContent>
          {requiredDocuments.length === 0 ? (
            <p className="text-muted-foreground">Aún no se requieren documentos para esta oportunidad.</p>
          ) : (
            <ul className="space-y-4">
              {requiredDocuments.map(req => 
                req.requires_signature 
                  ? renderSignatureRequirement(req) 
                  : renderNormalRequirement(req)
              )}
            </ul>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={!!docToDelete} onOpenChange={(isOpen) => !isOpen && setDocToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Está seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Está seguro de que quiere eliminar el documento "{docToDelete?.fileName || docToDelete?.name}"? Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={!!deletingId}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} disabled={!!deletingId} className="bg-destructive hover:bg-destructive/90">
              {deletingId && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {deletingId ? 'Eliminando...' : 'Confirmar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
