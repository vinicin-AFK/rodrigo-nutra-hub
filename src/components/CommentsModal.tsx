import { useState, useEffect, useRef } from 'react';
import { X, Send } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Post, Comment } from '@/types';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { currentUser as fallbackUser } from '@/data/mockData';

interface CommentsModalProps {
  isOpen: boolean;
  onClose: () => void;
  post: Post;
  onAddComment: (postId: string, content: string) => void;
}

export function CommentsModal({ isOpen, onClose, post, onAddComment }: CommentsModalProps) {
  const { user } = useAuth();
  const [comment, setComment] = useState('');
  const commentsEndRef = useRef<HTMLDivElement>(null);

  const currentUser = user ? {
    ...fallbackUser,
    name: user.name,
    email: user.email,
    avatar: user.avatar || fallbackUser.avatar,
    level: user.level || fallbackUser.level,
  } : fallbackUser;

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [isOpen, post.commentsList]);

  const scrollToBottom = () => {
    setTimeout(() => {
      commentsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim()) return;
    
    onAddComment(post.id, comment.trim());
    setComment('');
    scrollToBottom();
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
      <div className="relative w-full max-w-lg h-[80vh] glass-card rounded-t-3xl sm:rounded-3xl flex flex-col animate-slide-up">
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
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {post.commentsList && post.commentsList.length > 0 ? (
            post.commentsList.map((comment) => (
              <div key={comment.id} className="flex gap-3 animate-fade-in">
                <img
                  src={comment.author.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(comment.author.name)}&background=random`}
                  alt={comment.author.name}
                  className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                />
                <div className="flex-1">
                  <div className="bg-secondary rounded-2xl px-3 py-2">
                    <p className="font-semibold text-sm text-foreground mb-1">
                      {comment.author.name}
                    </p>
                    <p className="text-sm text-foreground/90">{comment.content}</p>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatTime(comment.createdAt)}
                  </p>
                </div>
              </div>
            ))
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

