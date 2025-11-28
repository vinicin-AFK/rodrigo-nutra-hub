import { useState } from 'react';
import { Flame, MessageCircle, Award, Heart, Trash2, Shield } from 'lucide-react';
import { Post } from '@/types';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface PostCardProps {
  post: Post;
  onLike?: (postId: string, isLiked: boolean) => void;
  onComment?: (postId: string) => void;
  onDelete?: (postId: string) => void;
}

export function PostCard({ post, onLike, onComment, onDelete }: PostCardProps) {
  const { addPoints, user, achievements } = useAuth();
  const { toast } = useToast();
  const [isLiked, setIsLiked] = useState(post.isLiked);
  const [likes, setLikes] = useState(post.likes);
  const [isAnimating, setIsAnimating] = useState(false);
  const [particles, setParticles] = useState<number[]>([]);
  const isSupport = user?.role === 'support' || user?.role === 'admin';
  const isSupportPost = post.author?.role === 'support' || post.author?.role === 'admin';

  // Verificação de segurança
  if (!post || !post.author) {
    return null;
  }

  const handleLike = async () => {
    const wasLiked = isLiked;
    
    if (!wasLiked) {
      setIsAnimating(true);
      setParticles([1, 2, 3, 4, 5]);
      setTimeout(() => {
        setIsAnimating(false);
        setParticles([]);
      }, 800);
      
      // Adicionar 1 ponto por curtida
      await addPoints(1);
    }
    
    setIsLiked(!isLiked);
    setLikes(prev => wasLiked ? prev - 1 : prev + 1);
    
    // Notificar componente pai
    if (onLike) {
      await onLike(post.id, !wasLiked);
    }
  };

  const formatTime = (date: Date) => {
    const diff = Date.now() - date.getTime();
    const hours = Math.floor(diff / 3600000);
    if (hours < 1) return 'Agora';
    if (hours < 24) return `${hours}h`;
    return `${Math.floor(hours / 24)}d`;
  };

  // Valores padrão para evitar erros
  const author = post.author || {
    id: 'unknown',
    name: 'Usuário',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face',
    level: 'Bronze',
    points: 0,
    rank: 0,
    totalSales: 0,
  };

  // Verificar se o autor é o usuário logado
  const isCurrentUser = user && author.id === user.id;
  
  // Pegar conquistas desbloqueadas do usuário (apenas as mais importantes para mostrar)
  const userAchievements = isCurrentUser 
    ? achievements
        .filter(a => a.unlockedAt)
        .sort((a, b) => {
          // Priorizar conquistas de rank e marcos importantes
          const priorityOrder: Record<string, number> = {
            'rank_diamond': 1,
            'rank_platinum': 2,
            'rank_gold': 3,
            'rank_silver': 4,
            'rank_bronze': 5,
            '1000_points': 6,
            '500_points': 7,
            '100_points': 8,
            '500_likes': 9,
            '100_likes': 10,
            '50_likes': 11,
            '100_posts': 12,
            '50_posts': 13,
          };
          return (priorityOrder[a.id] || 99) - (priorityOrder[b.id] || 99);
        })
        .slice(0, 3) // Mostrar apenas as 3 mais importantes
    : [];

  return (
    <article className={cn(
      "bg-card border border-border rounded-none sm:rounded-lg overflow-hidden animate-fade-in mb-0 sm:mb-4",
      isSupportPost 
        ? "ring-2 ring-[#ff6b35]/50 border-2 border-[#ff6b35]/30" 
        : ""
    )}>
      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-4 pb-3">
        <img
          src={author.avatar || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face'}
          alt={author.name || 'Usuário'}
          className="w-10 h-10 rounded-full object-cover ring-2 ring-primary/30"
        />
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className={cn(
              "font-semibold text-sm",
              isSupportPost ? "text-[#ff6b35] dark:text-[#ff8c5a] font-bold" : "text-foreground"
            )}>
              {author.name || 'Usuário'}
            </h3>
            
            {/* Badge de Suporte */}
            {isSupportPost && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#ff6b35]/30 text-[#ff6b35] border border-[#ff6b35]/50 font-bold flex items-center gap-1">
                <Shield className="w-3 h-3" />
                SUPORTE
              </span>
            )}
            
            {/* Conquistas do usuário */}
            {isCurrentUser && userAchievements.length > 0 && (
              <div className="flex items-center gap-1">
                {userAchievements.map((achievement) => (
                  <span
                    key={achievement.id}
                    className="text-base leading-none"
                    title={`${achievement.name} - ${achievement.description}`}
                  >
                    {achievement.icon}
                  </span>
                ))}
              </div>
            )}
            
            {post.type === 'result' && (
              <span className="gold-badge text-[10px] px-2 py-0.5 rounded-full flex items-center gap-1">
                <Award className="w-3 h-3" />
                Resultado
              </span>
            )}
            
            {/* Botão de deletar - apenas para suporte */}
            {isSupport && (
              <button
                onClick={() => {
                  if (confirm('Tem certeza que deseja deletar esta publicação?')) {
                    if (onDelete) {
                      onDelete(post.id);
                      toast({
                        title: "Publicação deletada",
                        description: "A publicação foi removida do feed.",
                      });
                    }
                  }
                }}
                className="ml-auto p-1.5 hover:bg-red-500/20 rounded-full transition-colors"
                title="Deletar publicação"
              >
                <Trash2 className="w-4 h-4 text-red-500" />
              </button>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            {author.level || 'Bronze'} • {formatTime(post.createdAt)}
          </p>
        </div>
      </div>

      {/* Image - estilo Instagram (quadrado) */}
      {post.image && (
        <div className="w-full aspect-square bg-secondary/30">
          <img
            src={post.image}
            alt="Post"
            className="w-full h-full object-cover"
          />
        </div>
      )}

      {/* Actions - Estilo Instagram */}
      <div className="px-4 pt-3 pb-2">
        <div className="flex items-center gap-4 mb-2">
          <button
            onClick={handleLike}
            className="flex items-center gap-2 group relative touch-manipulation"
            style={{ touchAction: 'manipulation' }}
          >
            {/* Particles */}
            {particles.map((p) => (
              <span
                key={p}
                className="fire-particle absolute text-primary"
                style={{
                  left: `${Math.random() * 20 - 10}px`,
                  animationDelay: `${p * 0.1}s`,
                }}
              >
                🔥
              </span>
            ))}
            
            {isLiked ? (
              <Heart className="w-6 h-6 text-red-500 fill-red-500 transition-all duration-300" />
            ) : (
              <Heart className="w-6 h-6 text-muted-foreground hover:text-red-500 transition-all duration-300" />
            )}
          </button>

          <button
            onClick={() => onComment && onComment(post.id)}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground active:text-foreground transition-colors touch-manipulation"
            style={{ touchAction: 'manipulation' }}
          >
            <MessageCircle className="w-6 h-6" />
          </button>
        </div>

        {/* Likes count */}
        <div className="mb-2">
          <span className="text-sm font-semibold text-foreground">{likes.toLocaleString()} curtidas</span>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 pb-3">
        <p className="text-foreground/90 mb-2 leading-relaxed text-sm">
          <span className="font-semibold">{author.name || 'Usuário'}</span> {post.content || ''}
        </p>

        {/* Result Badge */}
        {post.resultValue && (
          <div className="mb-2 p-3 rounded-xl bg-gradient-to-r from-primary/20 to-accent/20 border border-primary/30">
            <p className="text-xs text-muted-foreground mb-1">Resultado alcançado</p>
            <p className="text-xl font-bold text-gradient-fire">
              R$ {post.resultValue.toLocaleString('pt-BR')}
            </p>
          </div>
        )}

        {/* Comments count */}
        {(post.comments > 0 || (post.commentsList && post.commentsList.length > 0)) && (
          <button 
            onClick={() => onComment && onComment(post.id)}
            className="text-muted-foreground text-sm hover:text-foreground active:text-foreground transition-colors touch-manipulation"
            style={{ touchAction: 'manipulation' }}
          >
            Ver todos os {post.commentsList?.length || post.comments} comentários
          </button>
        )}
      </div>
    </article>
  );
}
