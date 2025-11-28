import { useState, useEffect, useRef } from 'react';
import { Plus, MessageCircle, LogOut } from 'lucide-react';
import { BottomNav } from '@/components/BottomNav';
import { PostCard } from '@/components/PostCard';
import { RankingCard } from '@/components/RankingCard';
import { PrizeCard } from '@/components/PrizeCard';
import { SupportChat } from '@/components/SupportChat';
import { CommunityChat } from '@/components/CommunityChat';
import { AICopyGenerator } from '@/components/AICopyGenerator';
import { AICreativeGenerator } from '@/components/AICreativeGenerator';
import { UserHeader } from '@/components/UserHeader';
import { CreatePostModal } from '@/components/CreatePostModal';
import { ProfileModal } from '@/components/ProfileModal';
import { AIFabButton } from '@/components/AIFabButton';
import { AchievementNotification } from '@/components/AchievementNotification';
import { CommentsModal } from '@/components/CommentsModal';
import { PlaquesShowcase } from '@/components/PlaquesShowcase';
import { Comment } from '@/types';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { usePosts } from '@/hooks/usePosts';
import { useNavigate } from 'react-router-dom';
// Dados mock removidos - agora usando apenas dados reais do Supabase
// Mantendo apenas fallbackUser para casos de emergência
const fallbackUser = {
  id: 'fallback',
  name: 'Usuário',
  avatar: 'https://ui-avatars.com/api/?name=Usuario&background=random',
  points: 0,
  rank: 999,
  level: 'Bronze',
  totalSales: 0,
};
import { Post } from '@/types';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

type Tab = 'home' | 'community' | 'ranking' | 'prizes' | 'support' | 'ai-copy' | 'ai-creative';

const Index = () => {
  const { user, addPoints, userPoints, updateStats, stats, logout } = useAuth();
  const { posts: allPosts, isLoading: postsLoading, createPost, likePost, addComment, deletePost, deleteComment } = usePosts();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<Tab>('home');
  const [isCreatePostOpen, setIsCreatePostOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [selectedPostForComments, setSelectedPostForComments] = useState<Post | null>(null);
  const selectedPostIdRef = useRef<string | null>(null);
  const mainContentRef = useRef<HTMLDivElement>(null);
  const previousTabRef = useRef<Tab>('home');

  // Atualizar post selecionado automaticamente quando allPosts mudar
  // Mas evitar atualizar durante a adição de comentário para não duplicar
  useEffect(() => {
    if (selectedPostIdRef.current) {
      const updatedPost = allPosts.find(p => p.id === selectedPostIdRef.current);
      if (updatedPost) {
        // Só atualizar se realmente mudou (evitar loops e duplicações)
        setSelectedPostForComments(prev => {
          if (!prev || prev.id !== updatedPost.id) {
            return {
              ...updatedPost,
              commentsList: updatedPost.commentsList ? [...updatedPost.commentsList] : [],
            };
          }
          // Se o número de comentários mudou, atualizar (mas verificar se não é duplicação)
          const prevCommentsCount = prev.commentsList?.length || 0;
          const newCommentsCount = updatedPost.commentsList?.length || 0;
          
          if (newCommentsCount > prevCommentsCount) {
            // Verificar se os IDs dos comentários são diferentes para evitar duplicação
            const prevCommentIds = new Set(prev.commentsList?.map(c => c.id) || []);
            const newCommentIds = new Set(updatedPost.commentsList?.map(c => c.id) || []);
            
            // Só atualizar se houver comentários novos (não apenas duplicados)
            if (newCommentIds.size > prevCommentIds.size || 
                Array.from(newCommentIds).some(id => !prevCommentIds.has(id))) {
              return {
                ...updatedPost,
                commentsList: updatedPost.commentsList ? [...updatedPost.commentsList] : [],
              };
            }
          }
          return prev; // Não mudou ou é duplicação, manter como está
        });
      }
    }
  }, [allPosts]);

  // Scroll ao topo quando mudar de aba (exceto community)
  useEffect(() => {
    if (activeTab !== previousTabRef.current) {
      previousTabRef.current = activeTab;
      
      // Se não for community, fazer scroll ao topo
      if (activeTab !== 'community') {
        // Usar requestAnimationFrame para garantir que o DOM está pronto
        requestAnimationFrame(() => {
          setTimeout(() => {
            // Scroll da janela (funciona melhor no mobile)
            window.scrollTo({ top: 0, behavior: 'smooth' });
            // Também tentar scroll no container principal se existir
            if (mainContentRef.current) {
              try {
                mainContentRef.current.scrollTo({ top: 0, behavior: 'smooth' });
              } catch (e) {
                // Se scrollTo não funcionar, tentar scrollTop direto
                mainContentRef.current.scrollTop = 0;
              }
            }
            // Scroll do documento também (para garantir)
            document.documentElement.scrollTo({ top: 0, behavior: 'smooth' });
            document.body.scrollTo({ top: 0, behavior: 'smooth' });
          }, 150);
        });
      }
      // Se for community, o CommunityChat já faz scroll para última mensagem
    }
  }, [activeTab]);

  // Usar dados do usuário autenticado ou fallback
  const currentUser = user ? {
    ...fallbackUser,
    name: user.name,
    email: user.email,
    avatar: user.avatar || fallbackUser.avatar,
    level: user.level || fallbackUser.level,
  } : fallbackUser;


  const handleNewPost = async (content: string, resultValue?: number, image?: string) => {
    try {
      // Mostrar notificação imediata
      console.log('🔔 Chamando toast de criação...');
      const toastResult = toast({
        title: "📝 Criando publicação...",
        description: "Aguarde enquanto sua publicação é processada.",
        duration: 2000,
      });
      console.log('🔔 Toast chamado:', toastResult);
      
      // Criar postagem - SEMPRE funciona, mesmo sem usuário autenticado
      await createPost(content, resultValue, image);
      
      // Tentar adicionar pontos (não crítico se falhar)
      try {
        if (user) {
          await addPoints(2);
          await updateStats({ postsCount: allPosts.length + 1 });
        }
      } catch (pointsError) {
        console.warn('Erro ao adicionar pontos (não crítico):', pointsError);
      }
      
      // Notificação de sucesso (será substituída pela do usePosts se houver erro)
      setTimeout(() => {
        toast({
          title: resultValue ? "🔥 Resultado publicado!" : "✅ Post publicado!",
          description: resultValue 
            ? `+${Math.floor(resultValue / 100)} pontos ganhos!` 
            : "Seu post foi compartilhado com a comunidade. +2 pontos!",
          duration: 3000,
        });
      }, 500);
    } catch (error: any) {
      console.error('❌ Erro ao publicar:', error);
      toast({
        title: "Erro ao publicar",
        description: error?.message || "Não foi possível publicar. Tente novamente.",
        variant: 'destructive',
      });
    }
  };

  const handleLike = async (postId: string, isLiked: boolean) => {
    try {
      await likePost(postId);
      
      // Pontos já são adicionados no PostCard quando curte
      // Atualizar stats de curtidas recebidas
      if (isLiked) {
        const post = allPosts.find(p => p.id === postId);
        if (post && post.author.id === currentUser.id) {
          await updateStats({ likesReceived: (post.likes || 0) + 1 });
        }
      }
    } catch (error) {
      console.error('Erro ao curtir postagem:', error);
    }
  };

  const handleOpenComments = (postId: string) => {
    const post = allPosts.find(p => p.id === postId);
    if (post) {
      selectedPostIdRef.current = postId;
      setSelectedPostForComments(post);
    }
  };

  const handleAddComment = async (postId: string, content: string) => {
    try {
      console.log('💬 handleAddComment chamado:', { postId, content: content.substring(0, 50) });
      
      // Adicionar comentário (retorna o comentário criado e já atualiza o estado allPosts)
      const newComment = await addComment(postId, content);
      console.log('✅ Comentário adicionado com sucesso:', newComment?.id);
      
      // ATUALIZAR IMEDIATAMENTE usando o comentário retornado (sem esperar)
      setSelectedPostForComments(prevPost => {
        if (!prevPost || prevPost.id !== postId) {
          // Se não temos o post selecionado, buscar do estado atualizado
          const post = allPosts.find(p => p.id === postId);
          if (post) {
            return {
              ...post,
              commentsList: post.commentsList ? [...post.commentsList] : [],
            };
          }
          return prevPost;
        }
        
        // Verificar se o comentário já existe (evitar duplicação)
        const commentExists = prevPost.commentsList?.some(c => c.id === newComment.id);
        if (commentExists) {
          console.log('⚠️ Comentário já existe, não duplicando');
          return prevPost;
        }
        
        // Atualizar o post selecionado com o novo comentário IMEDIATAMENTE
        return {
          ...prevPost,
          comments: (prevPost.comments || 0) + 1,
          commentsList: [...(prevPost.commentsList || []), newComment],
        };
      });
      
      console.log('✅ Post selecionado atualizado imediatamente');
    } catch (error) {
      console.error('❌ Erro ao adicionar comentário:', error);
      toast({
        title: "Erro ao comentar",
        description: error instanceof Error ? error.message : "Não foi possível adicionar o comentário. Tente novamente.",
        variant: 'destructive',
      });
      throw error; // Re-throw para o modal tratar
    }
  };

  // Prêmios estáticos (configuração do sistema)
  const prizes = [
    { id: '1', name: 'Mentoria Individual', description: '1 hora de mentoria com Rodrigo Nutra', pointsCost: 5000, image: '🎯', category: 'experience' as const },
    { id: '2', name: 'Kit Premium', description: 'Kit completo de suplementos', pointsCost: 3000, image: '📦', category: 'physical' as const },
    { id: '3', name: 'Curso Avançado', description: 'Acesso ao curso de copy avançada', pointsCost: 2000, image: '📚', category: 'digital' as const },
    { id: '4', name: 'AirPods Pro', description: 'Apple AirPods Pro 2ª geração', pointsCost: 8000, image: '🎧', category: 'physical' as const },
    { id: '5', name: 'Viagem VIP', description: 'Viagem para evento exclusivo', pointsCost: 15000, image: '✈️', category: 'experience' as const },
  ];

  const handleRedeemPrize = async (prize: typeof prizes[0]) => {
    if (userPoints < prize.pointsCost) {
      toast({
        title: "Pontos insuficientes",
        description: `Você precisa de ${prize.pointsCost} pontos para resgatar este prêmio.`,
        variant: 'destructive',
      });
      return;
    }
    
    // Deduzir pontos (adicionar pontos negativos)
    await addPoints(-prize.pointsCost);
    
    // Atualizar stats (vai verificar conquistas automaticamente)
    const currentPrizes = stats?.prizesRedeemed || 0;
    await updateStats({ prizesRedeemed: currentPrizes + 1 });
    
    toast({
      title: "🎁 Prêmio resgatado!",
      description: `${prize.name} - Em breve você receberá mais informações por e-mail.`,
    });
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'home':
        return (
          <div className="w-full max-w-2xl mx-auto">
            {/* Header estilo Instagram - fixo no topo */}
            <div className="sticky top-0 z-30 bg-background/95 backdrop-blur-sm border-b border-border/50 px-4 py-3 mb-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-foreground">NutraHub</h2>
                  <p className="text-xs text-muted-foreground">
                    Comunidade • {allPosts.length} publicações
                  </p>
                </div>
                <Button 
                  onClick={() => setIsCreatePostOpen(true)} 
                  variant="fire" 
                  size="sm"
                  className="gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Criar
                </Button>
              </div>
            </div>

            {/* Feed de postagens estilo Instagram - scroll infinito */}
            <div className="space-y-0 pb-4">
              {(() => {
                // FEED GLOBAL: Filtrar apenas posts deletados/ocultos (todos os outros são válidos para todos)
                const validPosts = allPosts.filter(post => {
                  if (!post || !post.author) {
                    console.warn('Post inválido encontrado:', post);
                    return false;
                  }
                  // FEED GLOBAL: Apenas remover posts deletados/ocultos - todos veem o mesmo feed
                  if (post.status === 'deleted' || post.status === 'hidden') {
                    return false;
                  }
                  return true; // Todos os outros posts são válidos para TODOS os usuários
                });

                if (postsLoading) {
                  return (
                    <div className="flex items-center justify-center py-12">
                      <div className="text-muted-foreground">Carregando publicações...</div>
                    </div>
                  );
                }

                if (validPosts.length === 0) {
                  return (
                    <div className="text-center py-12 px-4">
                      <p className="text-muted-foreground mb-4">Nenhuma publicação ainda</p>
                      <Button 
                        onClick={() => setIsCreatePostOpen(true)} 
                        variant="fire"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Criar primeira publicação
                      </Button>
                    </div>
                  );
                }

                return validPosts.map((post) => (
                  <PostCard 
                    key={post.id} 
                    post={post} 
                    onLike={handleLike}
                    onComment={handleOpenComments}
                    onDelete={deletePost}
                  />
                ));
              })()}
            </div>
          </div>
        );

      case 'community':
        return <CommunityChat />;

      case 'ranking':
        // Ranking agora vem apenas de dados reais (será implementado com Supabase)
        // Por enquanto, mostrar apenas o usuário atual
        const rankingUsers = user ? [{
          ...currentUser,
          points: userPoints,
          id: user.id,
        }] : [];
        
        return (
          <div className="space-y-4">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-foreground mb-2">🏆 Ranking</h2>
              <p className="text-muted-foreground">Top membros por pontos</p>
            </div>
            
            {rankingUsers.length > 0 ? (
              <>
                {rankingUsers.map((userItem, index) => (
                  <RankingCard key={userItem.id} user={userItem} position={index + 1} />
                ))}
                <PlaquesShowcase currentSales={currentUser.totalSales} />
              </>
            ) : (
              <div className="text-center py-12">
                <p className="text-muted-foreground">Nenhum usuário no ranking ainda</p>
              </div>
            )}
          </div>
        );

      case 'prizes':
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-foreground mb-2">🎁 Prêmios</h2>
              <p className="text-muted-foreground mb-2">Troque seus pontos por recompensas incríveis</p>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/20">
                <span className="text-primary font-bold">{userPoints.toLocaleString()}</span>
                <span className="text-muted-foreground">pontos disponíveis</span>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              {prizes.map((prize) => (
                <PrizeCard
                  key={prize.id}
                  prize={prize}
                  userPoints={userPoints}
                  onRedeem={handleRedeemPrize}
                />
              ))}
            </div>
          </div>
        );

      case 'support':
        return (
          <div>
            <div className="text-center mb-4">
              <h2 className="text-2xl font-bold text-foreground mb-2">💬 Suporte</h2>
              <p className="text-muted-foreground">Tire suas dúvidas com nossa equipe</p>
            </div>
            <SupportChat />
          </div>
        );

      case 'ai-copy':
        return <AICopyGenerator />;

      case 'ai-creative':
        return <AICreativeGenerator />;

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background" style={{ minHeight: '100vh', backgroundColor: 'hsl(220, 20%, 8%)' }}>
      {/* Achievement Notification */}
      <AchievementNotification />

      {/* Header */}
      <header className="sticky top-0 z-40 glass-card border-b border-border/50 px-4 py-3">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <h1 className="text-xl font-bold">
            <span className="text-gradient-fire">Nutra</span>
            <span className="text-foreground">Elite</span>
          </h1>
          
          {/* Botões no canto superior direito */}
          <div className="flex items-center gap-3">
            {/* Botão de Suporte */}
            <button
              onClick={() => setActiveTab('support')}
              className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center",
                "bg-secondary hover:bg-secondary/80 transition-colors",
                "text-foreground hover:text-primary",
                activeTab === 'support' && "bg-primary text-white"
              )}
              title="Suporte"
            >
              <MessageCircle className="w-5 h-5" />
            </button>
            
            {/* Botão de Logout */}
            <button
              onClick={async () => {
                if (confirm('Tem certeza que deseja sair?')) {
                  try {
                    await logout();
                    // Usar window.location para garantir navegação
                    window.location.href = '/login';
                  } catch (error) {
                    console.error('Erro ao fazer logout:', error);
                    // Mesmo com erro, tentar navegar
                    window.location.href = '/login';
                  }
                }
              }}
              className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center",
                "bg-secondary hover:bg-red-500/20 transition-colors",
                "text-foreground hover:text-red-500"
              )}
              title="Sair"
            >
              <LogOut className="w-5 h-5" />
            </button>
            
            {/* Avatar */}
            <button
              onClick={() => setIsProfileOpen(true)}
              className="flex-shrink-0"
            >
              <img
                src={currentUser.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(currentUser.name)}&background=random`}
                alt={currentUser.name}
                className="w-10 h-10 rounded-full object-cover ring-2 ring-primary hover:ring-primary/70 transition-all"
              />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main 
        ref={mainContentRef}
        className={cn(
          "max-w-lg mx-auto",
          activeTab === 'community' ? "px-0" : "px-4 py-6"
        )} 
        style={{ 
          color: 'hsl(40, 20%, 95%)',
          minHeight: activeTab === 'community' ? 'calc(100vh - 64px - 64px)' : 'calc(100vh - 180px)',
          paddingBottom: activeTab === 'community' ? '0' : 'calc(env(safe-area-inset-bottom, 0px) + 96px)'
        }}>
        {renderContent()}
      </main>

      {/* Bottom Navigation */}
      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />

      {/* AI Floating Action Button - apenas na aba Início */}
      {activeTab === 'home' && (
        <AIFabButton onSelectAI={(type) => setActiveTab(type)} />
      )}

      {/* Create Post Modal */}
      <CreatePostModal
        isOpen={isCreatePostOpen}
        onClose={() => setIsCreatePostOpen(false)}
        onPost={handleNewPost}
      />

      {/* Profile Modal */}
      <ProfileModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
      />

      {/* Comments Modal */}
      {selectedPostForComments && (
        <CommentsModal
          isOpen={!!selectedPostForComments}
          onClose={() => {
            selectedPostIdRef.current = null;
            setSelectedPostForComments(null);
          }}
          post={selectedPostForComments}
          onAddComment={handleAddComment}
          onDeleteComment={deleteComment}
        />
      )}
    </div>
  );
};

export default Index;
