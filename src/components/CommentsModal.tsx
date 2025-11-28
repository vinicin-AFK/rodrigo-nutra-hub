import { useState, useEffect, useRef } from 'react';
import { X, Send, Shield, Trash2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Post, Comment } from '@/types';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
// Fallback user removido - usando apenas dados reais do AuthContext

interface CommentsModalProps {
  isOpen: boolean;
  onClose: () => void;
  post: Post;
  onAddComment: (postId: string, content: string) => void;
  onDeleteComment?: (postId: string, commentId: string) => void;
}

export function CommentsModal({ isOpen, onClose, post, onAddComment, onDeleteComment }: CommentsModalProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [comment, setComment] = useState('');
  const commentsEndRef = useRef<HTMLDivElement>(null);
  const isSupport = user?.role === 'support' || user?.role === 'admin';

  const currentUser = user ? {
    id: user.id,
    name: user.name || 'Usuário',
    email: user.email,
    avatar: user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || 'Usuario')}&background=random`,
    level: user.level || 'Bronze',
  } : {
    id: 'anonymous',
    name: 'Usuário',
    email: '',
    avatar: 'https://ui-avatars.com/api/?name=Usuario&background=random',
    level: 'Bronze',
  };

  const scrollToBottom = () => {
    setTimeout(() => {
      commentsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [isOpen, post.commentsList?.length]);

  // Atualizar quando o post mudar (para pegar novos comentários)
  useEffect(() => {
    if (isOpen && post.commentsList) {
      scrollToBottom();
    }
  }, [isOpen, post.commentsList]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim()) {
      console.warn('⚠️ Tentativa de enviar comentário vazio');
      return;
    }
    
    console.log('📝 handleSubmit chamado:', { postId: post.id, comment: comment.trim().substring(0, 50) });
    
    try {
      await onAddComment(post.id, comment.trim());
      console.log('✅ onAddComment concluído');
      setComment('');
      scrollToBottom();
    } catch (error) {
      console.error('❌ Erro ao enviar comentário:', error);
      toast({
        title: "Erro ao comentar",
        description: "Não foi possível enviar o comentário. Tente novamente.",
        variant: 'destructive',
      });
    }
  };

  const formatTime = (date: Date) => {
    const diff = Date.now() - date.getTime();
    const hours = Math.floor(diff / 3600000);
    if (hours < 1) return 'Agora';
    if (hours < 24) return `${hours}h`;
    return `${Math.floor(hours / 24)}d`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-background/80 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative w-full max-w-lg glass-card rounded-t-3xl sm:rounded-3xl flex flex-col animate-slide-up" style={{ 
        height: '80vh',
        maxHeight: '90vh',
        touchAction: 'pan-y'
      }}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h3 className="text-lg font-bold text-foreground">Comentários</h3>
          <button 
            onClick={onClose} 
            className="p-2 hover:bg-secondary rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        {/* Comments List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4" style={{ 
          WebkitOverflowScrolling: 'touch',
          overscrollBehavior: 'contain'
        }}>
          {post.commentsList && post.commentsList.length > 0 ? (
            post.commentsList.map((comment) => {
              const isSupportComment = comment.author?.role === 'support' || comment.author?.role === 'admin';
              return (
                <div key={comment.id} className="flex gap-3 animate-fade-in">
                  <img
                    src={comment.author.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(comment.author.name)}&background=random`}
                    alt={comment.author.name}
                    className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                  />
                  <div className="flex-1">
                    <div className={cn(
                      "rounded-2xl px-3 py-2",
                      isSupportComment
                        ? "bg-gradient-to-r from-[#ff6b35]/20 to-[#ff8c5a]/20 dark:from-[#ff6b35]/30 dark:to-[#ff8c5a]/30 border-2 border-[#ff6b35]/50"
                        : "bg-secondary"
                    )}>
                      <div className="flex items-center gap-2 mb-1">
                        <p className={cn(
                          "font-semibold text-sm",
                          isSupportComment ? "text-[#ff6b35] dark:text-[#ff8c5a] font-bold" : "text-foreground"
                        )}>
                          {comment.author.name}
                        </p>
                        {isSupportComment && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[#ff6b35]/30 text-[#ff6b35] border border-[#ff6b35]/50 font-bold flex items-center gap-1">
                            <Shield className="w-3 h-3" />
                            SUPORTE
                          </span>
                        )}
                        {/* Botão de deletar - apenas para suporte */}
                        {isSupport && onDeleteComment && (
                          <button
                            onClick={() => {
                              if (confirm('Tem certeza que deseja deletar este comentário?')) {
                                onDeleteComment(post.id, comment.id);
                                toast({
                                  title: "Comentário deletado",
                                  description: "O comentário foi removido.",
                                });
                              }
                            }}
                            className="ml-auto p-1 hover:bg-red-500/20 rounded transition-colors"
                            title="Deletar comentário"
                          >
                            <Trash2 className="w-3 h-3 text-red-500" />
                          </button>
                        )}
                      </div>
                      <p className="text-sm text-foreground/90">{comment.content}</p>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatTime(comment.createdAt)}
                    </p>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Nenhum comentário ainda. Seja o primeiro!</p>
            </div>
          )}
          <div ref={commentsEndRef} />
        </div>

        {/* Input */}
        <form onSubmit={handleSubmit} className="p-4 border-t border-border">
          <div className="flex items-center gap-2">
            <img
              src={currentUser.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(currentUser.name)}&background=random`}
              alt={currentUser.name}
              className="w-8 h-8 rounded-full object-cover flex-shrink-0"
            />
            <input
              type="text"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Adicione um comentário..."
              className="flex-1 bg-secondary rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 text-foreground placeholder:text-muted-foreground"
            />
            <Button
              type="submit"
              size="icon"
              variant="fire"
              disabled={!comment.trim()}
              className="rounded-full"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

