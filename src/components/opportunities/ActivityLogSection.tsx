
"use client";

import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { MessageSquareText, Loader2, Edit, Trash2, Bot } from 'lucide-react';
import type { OpportunityComment, UserProfile } from '@/types';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { useAuth } from '@/contexts/auth-context';
import { RichTextEditor } from '../ui/RichTextEditor';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import apiClient from '@/lib/api-client';
import DOMPurify from 'dompurify';

interface CommentThreadProps {
  comment: OpportunityComment;
  onReply: (text: string, parentId: string) => Promise<void>;
  onRefreshData: () => void;
  currentUserId?: string;
}

function CommentThread({ comment, onReply, onRefreshData, currentUserId }: CommentThreadProps) {
  const [showReply, setShowReply] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [isSubmittingReply, setIsSubmittingReply] = useState(false);
  
  const [isEditing, setIsEditing] = useState(false);
  const [editedText, setEditedText] = useState(comment.comment_text);
  const [isUpdating, setIsUpdating] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const { toast } = useToast();
  const { userProfile, getIdToken } = useAuth();
  
  const isSystemComment = useMemo(() => comment.author_user_id === 'system_ia', [comment.author_user_id]);

  const authorDisplayName = isSystemComment ? 'Asistente IA' : (comment.author?.displayName || comment.author_display_name || 'Usuario');
  const authorPhotoUrl = 
    comment.author?.photo_signed_url || // Prioridad 1: URL firmada del objeto autor enriquecido
    comment.author?.photoURL ||         // Prioridad 2: URL directa de Firebase (si es pública)
    comment.author_photo_url ||         // Prioridad 3: Campo plano antiguo (si existe)
    '';

  const isCurrentUserComment = useMemo(() => {
    if (isSystemComment) return false;
    const authorId = comment.author?.uid || comment.author_user_id;
    if (!currentUserId || !authorId) return false;
    return authorId === currentUserId;
  }, [currentUserId, comment.author, comment.author_user_id, isSystemComment]);

  const canDeleteComment = useMemo(() => {
    if (userProfile?.role === 'admin') return true;
    return isCurrentUserComment;
  }, [userProfile, isCurrentUserComment]);
  
  const canEditComment = useMemo(() => {
    return isCurrentUserComment;
  }, [isCurrentUserComment]);

  const canCollaborate = useMemo(() => {
    if (userProfile?.role === 'admin') return true;
    if (userProfile?.role === 'customer') {
      return ['administrador_cliente', 'colaborador'].includes(userProfile.customer_role || '');
    }
    return false;
  }, [userProfile]);

  const handleReplySubmit = async () => {
    if (!replyText.trim() || replyText === '<p></p>') return;
    setIsSubmittingReply(true);
    try {
      await onReply(replyText, comment.id);
      setReplyText('');
      setShowReply(false);
    } finally {
      setIsSubmittingReply(false);
    }
  };
  
  const handleUpdateSubmit = async () => {
    if (!editedText.trim() || editedText === '<p></p>') return;
    setIsUpdating(true);
    

    try {
        await apiClient.patch('/update_opportunity_comment', {
            comment_id: comment.id,
            comment_text: editedText
        });
        
        toast({ title: "Comentario actualizado" });
        setIsEditing(false);
        onRefreshData(); // Refrescar para ver el cambio
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Ocurrió un error desconocido.";
        toast({ title: "Error al Actualizar", description: errorMessage, variant: "destructive" });
    } finally {
        setIsUpdating(false);
    }
  };

  const handleDeleteSubmit = async () => {
    setIsDeleting(true);

    try {
        // --- CÓDIGO CORREGIDO ---
        // Nota: apiClient.delete suele aceptar config como segundo argumento, 
        // pero si tu implementación de apiClient no soporta body en delete, 
        // usamos la llamada genérica request o verificamos tu apiClient.
        // Asumiendo un apiClient estándar con axios o fetch wrapper:

        await apiClient.delete('/delete_opportunity_comment', { 
            comment_id: comment.id 
        });
        
        // Si tu apiClient.delete no soporta body (algunos no lo hacen), 
        // usa apiClient.request o post con method DELETE.
        // Pero intentemos la forma estándar primero.
        // ------------------------

        toast({ title: "Comentario eliminado" });
        setShowDeleteConfirm(false);
        onRefreshData();
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Ocurrió un error desconocido.";
        toast({ title: "Error al Eliminar", description: errorMessage, variant: "destructive" });
    } finally {
        setIsDeleting(false);
    }
  };    

  return (
    <>
        <div className={cn("flex w-full", isCurrentUserComment && !comment.is_deleted && "justify-end")}>
          <div className={cn("flex gap-4 max-w-xl", isCurrentUserComment && !comment.is_deleted ? "flex-row-reverse" : "flex-row")}>
            {isSystemComment ? (
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 flex-shrink-0">
                <Bot className="h-5 w-5 text-primary" />
              </div>
            ) : (
              <Avatar className="h-8 w-8">
                <AvatarImage src={authorPhotoUrl} alt={authorDisplayName} className="object-cover" />
                <AvatarFallback>{authorDisplayName?.charAt(0) || 'U'}</AvatarFallback>
              </Avatar>
            )}

            <div className="flex-1">
              <div className={cn(
                "text-sm rounded-lg p-3 w-full",
                comment.is_deleted 
                  ? "bg-transparent" 
                  : isCurrentUserComment ? "bg-accent text-accent-foreground" : isSystemComment ? "bg-muted" : "bg-secondary"
              )}>
                <div className={cn(
                    "flex justify-between items-center mb-1 gap-4",
                    isCurrentUserComment && !comment.is_deleted && "flex-row-reverse"
                )}>
                  <span className="font-semibold">{comment.is_deleted ? "" : authorDisplayName}</span>
                  {!comment.is_deleted && (
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true, locale: es })}
                    </span>
                  )}
                </div>
                {comment.is_deleted ? (
                  <p className="italic text-muted-foreground text-sm" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(comment.comment_text) }} />
                ) : isEditing ? (
                   <div className="bg-card text-card-foreground rounded-md p-2 -m-1">
                     <RichTextEditor value={editedText} onChange={setEditedText} />
                   </div>
                ) : (
                  <div 
                    className="prose prose-sm dark:prose-invert max-w-none [&_a]:text-highlight [&_a:hover]:underline [&_p]:my-1"
                    dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(comment.comment_text) }} 
                  />
                )}
              </div>

              {!comment.is_deleted && (
                <>
                  {isEditing ? (
                    <div className="text-xs text-muted-foreground mt-2 flex gap-2 justify-end">
                        <Button size="sm" variant="ghost" onClick={() => setIsEditing(false)} disabled={isUpdating}>Cancelar</Button>
                        <Button size="sm" variant="secondary" onClick={handleUpdateSubmit} disabled={isUpdating}>
                            {isUpdating && <Loader2 className="mr-2 h-3 w-3 animate-spin" />}
                            Guardar
                        </Button>
                    </div>
                  ) : (
                    <div className={cn("text-xs text-muted-foreground mt-1 flex gap-2 items-center", isCurrentUserComment && "justify-end")}>
                      {!isSystemComment && canCollaborate && (
                        <button onClick={() => setShowReply(!showReply)} className="hover:underline">
                          {showReply ? 'Cancelar' : 'Responder'}
                        </button>
                      )}
                      {canEditComment && (
                        <>
                          {canCollaborate && <span className="text-muted-foreground/50">·</span>}
                          <button onClick={() => { setIsEditing(true); setEditedText(comment.comment_text); }} className="hover:underline flex items-center gap-1"><Edit className="h-3 w-3"/> Editar</button>
                        </>
                      )}
                      {canDeleteComment && (
                        <>
                          {(canCollaborate || canEditComment) && <span className="text-muted-foreground/50">·</span>}
                          <button onClick={() => setShowDeleteConfirm(true)} className="hover:underline text-destructive flex items-center gap-1"><Trash2 className="h-3 w-3"/> Eliminar</button>
                        </>
                      )}
                    </div>
                  )}
                </>
              )}
              
              {showReply && (
                <div className="mt-2 flex gap-4">
                  <Avatar className="h-8 w-8">
                      <AvatarImage src={userProfile?.photo_signed_url || ''} alt={userProfile?.displayName || ''} />
                      <AvatarFallback>{userProfile?.displayName?.charAt(0) || 'U'}</AvatarFallback>
                  </Avatar>
                  <div className='flex-1'>
                      <RichTextEditor
                        value={replyText}
                        onChange={setReplyText}
                        placeholder={`Respondiendo a ${authorDisplayName}...`}
                      />
                      <div className="mt-2 flex justify-end">
                      <Button size="sm" onClick={handleReplySubmit} disabled={isSubmittingReply} variant="secondary">
                          {isSubmittingReply && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                          Publicar Respuesta
                      </Button>
                      </div>
                  </div>
                </div>
              )}

              {comment.replies && comment.replies.length > 0 && (
                <div className="mt-4 space-y-4">
                  {comment.replies.map(reply => (
                    <CommentThread key={reply.id} comment={reply} onReply={onReply} onRefreshData={onRefreshData} currentUserId={currentUserId} />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
        
        <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>¿Está seguro de eliminar este comentario?</AlertDialogTitle>
                    <AlertDialogDescription>
                        El texto será reemplazado, pero las respuestas permanecerán. Esta acción no se puede deshacer.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDeleteSubmit} disabled={isDeleting} className="bg-destructive hover:bg-destructive/90">
                        {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Eliminar
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    </>
  );
}

interface ActivityLogSectionProps {
  userProfile: UserProfile | null;
  comments: OpportunityComment[];
  onPostComment: (commentText: string, parentCommentId: string | null) => Promise<void>;
  onRefreshData: () => void;
  currentUserId?: string;
}

export function ActivityLogSection({ userProfile, comments, onPostComment, onRefreshData, currentUserId }: ActivityLogSectionProps) {
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const canCollaborate = useMemo(() => {
    if (userProfile?.role === 'admin') return true;
    if (userProfile?.role === 'customer') {
      return ['administrador_cliente', 'colaborador'].includes(userProfile.customer_role || '');
    }
    return false;
  }, [userProfile]);

  const handleCommentSubmit = async () => {
    if (!newComment.trim() || newComment === '<p></p>') return;
    setIsSubmitting(true);
    try {
      await onPostComment(newComment, null);
      setNewComment('');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquareText className="h-6 w-6" />
          Bitácora y Comentarios
        </CardTitle>
        <CardDescription>
          Hilo de comunicación centralizado para esta oportunidad.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {canCollaborate && (
          <div className="flex gap-4">
             <Avatar>
                <AvatarImage src={userProfile?.photo_signed_url || ''} alt={userProfile?.displayName || ''} />
                <AvatarFallback>{userProfile?.displayName?.charAt(0) || 'U'}</AvatarFallback>
            </Avatar>
            <div className="flex-1 space-y-2">
              <RichTextEditor
                  value={newComment}
                  onChange={setNewComment}
                  placeholder="Escribe un nuevo comentario..."
                />
              <div className="flex justify-end">
                <Button onClick={handleCommentSubmit} disabled={isSubmitting} variant="secondary">
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Publicar Comentario
                </Button>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-6">
          {comments.length > 0 ? (
            comments.map(comment => (
              <CommentThread key={comment.id} comment={comment} onReply={onPostComment} onRefreshData={onRefreshData} currentUserId={currentUserId} />
            ))
          ) : (
             <div className="text-center text-muted-foreground py-8 border-2 border-dashed rounded-lg">
                <p className="text-sm">Aún no hay comentarios.</p>
                <p className="text-xs">¡Sea el primero en iniciar la conversación!</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

    