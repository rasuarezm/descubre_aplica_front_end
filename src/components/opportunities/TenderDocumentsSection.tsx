

"use client";

import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FileArchive, PlusCircle, Trash2, Download, Loader2, FileUp } from 'lucide-react';
import type { DocumentItem, UserProfile } from '@/types';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { useToast } from '@/hooks/use-toast';

interface TenderDocumentsSectionProps {
  userProfile: UserProfile | null;
  documents: DocumentItem[];
  categories: string[];
  onUploadDocument: (name: string, category: string, file: File) => Promise<boolean>;
  onDeleteDocument: (documentId: string) => Promise<void>;
}

export function TenderDocumentsSection({ userProfile, documents, categories, onUploadDocument, onDeleteDocument }: TenderDocumentsSectionProps) {
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [newDocName, setNewDocName] = useState('');
  const [newDocCategory, setNewDocCategory] = useState('');
  const [newDocFile, setNewDocFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [docToDelete, setDocToDelete] = useState<DocumentItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showUpgradeConfirm, setShowUpgradeConfirm] = useState(false);
  const { toast } = useToast();

  const canManage = useMemo(() => {
    if (userProfile?.role === 'admin') return true;
    if (userProfile?.role === 'customer') {
      return userProfile.customer_role === 'administrador_cliente';
    }
    return false;
  }, [userProfile]);

  const handleUploadClick = () => {
    if (!newDocName.trim() || !newDocCategory || !newDocFile) {
      toast({
        title: "Datos Incompletos",
        description: "Por favor, proporcione un nombre, categoría y seleccione un archivo.",
        variant: "destructive",
      });
      return;
    }

    const hasDraft = documents.some(doc => doc.tender_document_category === 'Borrador de Terminos de Referencia');
    const isUploadingFinal = newDocCategory === 'Terminos de Referencia';

    if (isUploadingFinal && hasDraft) {
      setShowUpgradeConfirm(true);
    } else {
      handleUpload();
    }
  };

  const handleUpload = async () => {
    if (!newDocName.trim() || !newDocCategory || !newDocFile) return;

    setIsSubmitting(true);
    setShowUpgradeConfirm(false); // Close confirmation modal if it was open
    
    try {
      // The onUploadDocument now returns a boolean indicating if it was an adenda
      const isAdenda = await onUploadDocument(newDocName, newDocCategory, newDocFile);
      
      // The parent component now handles the toast logic based on the return value.
      // We just need to close the modal and reset the form.
      setIsUploadModalOpen(false);
      setNewDocName('');
      setNewDocCategory('');
      setNewDocFile(null);
    } catch (error) {
      // Error toast is also handled in the parent component
      console.error("Upload failed in TenderDocumentsSection:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!docToDelete) return;
    setIsDeleting(true);
    try {
      await onDeleteDocument(docToDelete.id);
      setDocToDelete(null);
    } catch (error) {
      console.error('Failed to delete tender document', error);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <FileArchive className="h-6 w-6" />
              Pliegos y Documentos de Referencia
            </CardTitle>
            <CardDescription>Documentos de la licitación subidos por el administrador.</CardDescription>
          </div>
          {canManage && (
            <Dialog open={isUploadModalOpen} onOpenChange={setIsUploadModalOpen}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <PlusCircle className="mr-2 h-4 w-4" /> Añadir Documento
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Añadir Pliego o Documento de Referencia</DialogTitle>
                  <DialogDescription>
                    Suba un nuevo documento que sirva como referencia para esta oportunidad.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="docCategory">Categoría</Label>
                    <Select value={newDocCategory} onValueChange={setNewDocCategory} disabled={isSubmitting}>
                        <SelectTrigger id="docCategory">
                            <SelectValue placeholder="Seleccione una categoría..." />
                        </SelectTrigger>
                        <SelectContent>
                            {categories.map(cat => (
                                <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="docName">Nombre del Documento (ej. Pliego V2, Anexo Técnico - Software)</Label>
                    <Input
                      id="docName"
                      value={newDocName}
                      onChange={(e) => setNewDocName(e.target.value)}
                      placeholder="Nombre específico del documento"
                      disabled={isSubmitting}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="docFile">Archivo</Label>
                    <Input
                      id="docFile"
                      type="file"
                      onChange={(e) => setNewDocFile(e.target.files?.[0] || null)}
                      disabled={isSubmitting}
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
                    <Button variant="outline" disabled={isSubmitting}>Cancelar</Button>
                  </DialogClose>
                  <Button onClick={handleUploadClick} disabled={isSubmitting || !newDocName || !newDocCategory || !newDocFile}>
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {isSubmitting ? 'Subiendo...' : 'Subir Documento'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </CardHeader>
        <CardContent>
          {documents.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No se han subido pliegos o documentos de referencia.
            </p>
          ) : (
            <ul className="space-y-3">
              {documents.map((doc) => (
                <li key={doc.id} className="flex items-center justify-between p-3 border rounded-md bg-card/80 flex-wrap gap-4">
                  <div className="flex-1 min-w-0 pr-4">

                    <p className="font-medium text-sm truncate" title={doc.expected_type_label || doc.document_type || doc.filename}>
                      {doc.expected_type_label || doc.document_type || doc.filename || doc.name || 'Documento sin nombre'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Button variant="outline" size="sm" asChild disabled={!doc.signed_url}>
                      <a href={doc.signed_url} download={doc.fileName} target="_blank" rel="noopener noreferrer">
                        <Download className="mr-2 h-4 w-4" /> Descargar
                      </a>
                    </Button>
                    {canManage && (
                      <Button variant="ghost" size="icon" onClick={() => setDocToDelete(doc)} aria-label="Eliminar documento">
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={!!docToDelete} onOpenChange={(isOpen) => !isOpen && setDocToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Está seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Se eliminará el documento "{docToDelete?.fileName || docToDelete?.document_type}". Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={isDeleting} className="bg-destructive hover:bg-destructive/90">
              {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isDeleting ? 'Eliminando...' : 'Confirmar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      <AlertDialog open={showUpgradeConfirm} onOpenChange={setShowUpgradeConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Actualización de Pliego</AlertDialogTitle>
            <AlertDialogDescription>
              Está a punto de subir un pliego definitivo. Al confirmar, el borrador anterior será archivado y se iniciará un nuevo análisis de IA con este documento. Los resultados del análisis anterior (resumen, entregables, checklist sugerido, cronograma clave, etc) se sobrescribirán. ¿Desea continuar?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleUpload} disabled={isSubmitting} className="bg-accent hover:bg-accent/90">
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isSubmitting ? 'Subiendo...' : 'Confirmar y Subir'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
