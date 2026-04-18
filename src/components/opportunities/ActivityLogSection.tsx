
"use client";

import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  MessageSquareText,
  Loader2,
  Edit,
  Trash2,
  Bot,
  MoreVertical,
  Reply,
} from 'lucide-react';
import type { OpportunityComment, UserProfile } from '@/types';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { useAuth } from '@/contexts/auth-context';
import { RichTextEditor } from '../ui/RichTextEditor';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import apiClient from '@/lib/api-client';
import DOMPurify from 'dompurify';
import { avatarUrlForImg } from '@/lib/user-profile';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

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
  const { userProfile, user } = useAuth();

  const isSystemComment = useMemo(() => comment.author_user_id === 'system_ia', [comment.author_user_id]);

  const authorDisplayName = isSystemComment ? 'Asistente IA' : (comment.author?.displayName || comment.author_display_name || 'Usuario');
  const authorPhotoUrl = avatarUrlForImg(
    comment.author?.photo_signed_url ?? undefined,
    comment.author_photo_url || undefined
  );

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

  const hasCommentActions = useMemo(() => {
    if (isSystemComment || comment.is_deleted) return false;
    const showReplyAction = !isSystemComment && canCollaborate;
    return showReplyAction || canEditComment || canDeleteComment;
  }, [
    isSystemComment,
    comment.is_deleted,
    canCollaborate,
    canEditComment,
    canDeleteComment,
  ]);

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
        await apiClient.delete('/delete_opportunity_comment', { 
            comment_id: comment.id 
        });

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
                <AvatarImage src={authorPhotoUrl} alt={authorDisplayName} className="object-cover" referrerPolicy="no-referrer" />
                <AvatarFallback>{authorDisplayName?.charAt(0) || 'U'}</AvatarFallback>
              </Avatar>
            )}

            <div className="flex-1 min-w-0">
              <div
                className={cn(
                  "text-sm w-full",
                  comment.is_deleted
                    ? "bg-transparent py-1"
                    : "rounded-xl border p-3.5 shadow-sm",
                  !comment.is_deleted &&
                    isCurrentUserComment &&
                    "border-accent/35 bg-accent/12 text-foreground",
                  !comment.is_deleted &&
                    !isCurrentUserComment &&
                    isSystemComment &&
                    "border-primary/20 bg-primary/[0.06] text-foreground",
                  !comment.is_deleted &&
                    !isCurrentUserComment &&
                    !isSystemComment &&
                    "border-border bg-card text-card-foreground",
                )}
              >
                {!comment.is_deleted && (
                  <div
                    className={cn(
                      "flex justify-between items-start gap-2 mb-1.5",
                      isCurrentUserComment && "flex-row-reverse",
                    )}
                  >
                    <span className="font-semibold text-sm leading-tight">{authorDisplayName}</span>
                    <div className="flex items-center gap-0.5 shrink-0">
                      <span className="text-xs text-muted-foreground whitespace-nowrap">
                        {formatDistanceToNow(new Date(comment.created_at), {
                          addSuffix: true,
                          locale: es,
                        })}
                      </span>
                      {!isEditing && hasCommentActions && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className={cn(
                                "h-7 w-7 text-muted-foreground hover:text-foreground",
                                isCurrentUserComment && "text-foreground/80 hover:text-foreground",
                              )}
                              aria-label="Acciones del comentario"
                            >
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-52">
                            {!isSystemComment && canCollaborate && (
                              <DropdownMenuItem
                                onClick={() => setShowReply((v) => !v)}
                              >
                                <Reply className="mr-2 h-4 w-4" />
                                {showReply ? "Cancelar respuesta" : "Responder"}
                              </DropdownMenuItem>
                            )}
                            {canEditComment && (
                              <DropdownMenuItem
                                onClick={() => {
                                  setIsEditing(true);
                                  setEditedText(comment.comment_text);
                                }}
                              >
                                <Edit className="mr-2 h-4 w-4" />
                                Editar
                              </DropdownMenuItem>
                            )}
                            {canDeleteComment && (
                              <DropdownMenuItem
                                className="text-destructive focus:text-destructive"
                                onClick={() => setShowDeleteConfirm(true)}
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Eliminar
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </div>
                  </div>
                )}
                {comment.is_deleted ? (
                  <p
                    className="italic text-muted-foreground text-sm"
                    dangerouslySetInnerHTML={{
                      __html: DOMPurify.sanitize(comment.comment_text),
                    }}
                  />
                ) : isEditing ? (
                  <div className="bg-card text-card-foreground rounded-lg border border-border/80 p-2 -m-0.5">
                    <RichTextEditor value={editedText} onChange={setEditedText} />
                  </div>
                ) : (
                  <div
                    className="prose prose-sm dark:prose-invert max-w-none leading-relaxed [&_a]:text-highlight [&_a:hover]:underline [&_p]:my-1.5 [&_p:first-child]:mt-0"
                    dangerouslySetInnerHTML={{
                      __html: DOMPurify.sanitize(comment.comment_text),
                    }}
                  />
                )}
              </div>

              {!comment.is_deleted && isEditing && (
                <div className="text-xs text-muted-foreground mt-2 flex gap-2 justify-end">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setIsEditing(false)}
                    disabled={isUpdating}
                  >
                    Cancelar
                  </Button>
                  <Button size="sm" onClick={handleUpdateSubmit} disabled={isUpdating}>
                    {isUpdating && <Loader2 className="mr-2 h-3 w-3 animate-spin" />}
                    Guardar
                  </Button>
                </div>
              )}
              
              {showReply && (
                <div className="mt-3 flex gap-4">
                  <Avatar className="h-8 w-8">
                      <AvatarImage src={avatarUrlForImg(userProfile?.photo_signed_url, user?.photoURL)} alt={userProfile?.displayName || ''} referrerPolicy="no-referrer" />
                      <AvatarFallback>{userProfile?.displayName?.charAt(0) || 'U'}</AvatarFallback>
                  </Avatar>
                  <div className='flex-1'>
                      <RichTextEditor
                        value={replyText}
                        onChange={setReplyText}
                        placeholder={`Respuesta a ${authorDisplayName}…`}
                      />
                      <div className="mt-2 flex justify-end">
                      <Button size="sm" onClick={handleReplySubmit} disabled={isSubmittingReply}>
                          {isSubmittingReply && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                          Publicar Respuesta
                      </Button>
                      </div>
                  </div>
                </div>
              )}

              {comment.replies && comment.replies.length > 0 && (
                <div className="mt-5 space-y-5 border-l-2 border-accent/25 pl-4 ml-0.5">
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
  const { user } = useAuth();
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
        <CardTitle className="flex items-center gap-2 text-lg font-semibold tracking-tight">
          <MessageSquareText className="h-5 w-5 shrink-0 opacity-85" />
          Bitácora y Comentarios
        </CardTitle>
        <CardDescription className="max-w-xl leading-relaxed">
          Hilo de comunicación centralizado para esta oportunidad.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-8">
        {canCollaborate && (
          <div className="flex gap-4 rounded-xl border border-border/60 bg-muted/30 p-4">
            <Avatar className="h-9 w-9 shrink-0">
              <AvatarImage
                src={avatarUrlForImg(userProfile?.photo_signed_url, user?.photoURL)}
                alt={userProfile?.displayName || ""}
                referrerPolicy="no-referrer"
              />
              <AvatarFallback>{userProfile?.displayName?.charAt(0) || "U"}</AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1 space-y-2">
              <RichTextEditor
                value={newComment}
                onChange={setNewComment}
                placeholder="Escriba su comentario…"
              />
              <div className="flex justify-end">
                <Button onClick={handleCommentSubmit} disabled={isSubmitting}>
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Publicar Comentario
                </Button>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-8">
          {comments.length > 0 ? (
            comments.map((comment) => (
              <CommentThread
                key={comment.id}
                comment={comment}
                onReply={onPostComment}
                onRefreshData={onRefreshData}
                currentUserId={currentUserId}
              />
            ))
          ) : (
            <div className="rounded-xl border border-dashed border-border/60 bg-muted/20 px-4 py-10 text-center text-muted-foreground">
              <p className="text-sm">Aún no hay comentarios.</p>
              <p className="mt-1 text-xs">Puede iniciar la conversación con el primer comentario.</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
    