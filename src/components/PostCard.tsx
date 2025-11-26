import { useState } from 'react';
import { Flame, MessageCircle, Award, Heart } from 'lucide-react';
import { Post } from '@/types';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';

interface PostCardProps {
  post: Post;
  onLike?: (postId: string, isLiked: boolean) => void;
}

export function PostCard({ post, onLike }: PostCardProps) {
  const { addPoints } = useAuth();
  const [isLiked, setIsLiked] = useState(post.isLiked);
  const [likes, setLikes] = useState(post.likes);
  const [isAnimating, setIsAnimating] = useState(false);
  const [particles, setParticles] = useState<number[]>([]);

  // Verificação de segurança
  if (!post || !post.author) {
    return null;
  }

  const handleLike = () => {
    const wasLiked = isLiked;
    
    if (!wasLiked) {
      setIsAnimating(true);
      setParticles([1, 2, 3, 4, 5]);
      setTimeout(() => {
        setIsAnimating(false);
        setParticles([]);
      }, 800);
      
      // Adicionar 1 ponto por curtida
      addPoints(1);
    }
    
    setIsLiked(!isLiked);
    setLikes(prev => wasLiked ? prev - 1 : prev + 1);
    
    // Notificar componente pai
    if (onLike) {
      onLike(post.id, !wasLiked);
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

  return (
    <article className="glass-card rounded-2xl overflow-hidden animate-fade-in mb-4">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-4 pb-3">
        <img
          src={author.avatar || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face'}
          alt={author.name || 'Usuário'}
          className="w-10 h-10 rounded-full object-cover ring-2 ring-primary/30"
        />
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-foreground text-sm">{author.name || 'Usuário'}</h3>
            {post.type === 'result' && (
              <span className="gold-badge text-[10px] px-2 py-0.5 rounded-full flex items-center gap-1">
                <Award className="w-3 h-3" />
                Resultado
              </span>
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
            className="flex items-center gap-2 group relative"
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

          <button className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
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
        {post.comments > 0 && (
          <button className="text-muted-foreground text-sm hover:text-foreground transition-colors">
            Ver todos os {post.comments} comentários
          </button>
        )}
      </div>
    </article>
  );
}
