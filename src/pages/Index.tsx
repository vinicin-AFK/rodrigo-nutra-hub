import { useState } from 'react';
import { Plus } from 'lucide-react';
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
import { PlaquesShowcase } from '@/components/PlaquesShowcase';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { posts, users, prizes, currentUser as fallbackUser } from '@/data/mockData';
import { Post } from '@/types';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

type Tab = 'home' | 'community' | 'ranking' | 'prizes' | 'support' | 'ai-copy' | 'ai-creative';

const Index = () => {
  const { user, addPoints } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>('home');
  const [isCreatePostOpen, setIsCreatePostOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [allPosts, setAllPosts] = useState<Post[]>(posts);

  // Usar dados do usuário autenticado ou fallback
  const currentUser = user ? {
    ...fallbackUser,
    name: user.name,
    email: user.email,
    avatar: user.avatar || fallbackUser.avatar,
    level: user.level || fallbackUser.level,
  } : fallbackUser;

  const handleNewPost = (content: string, resultValue?: number) => {
    const newPost: Post = {
      id: Date.now().toString(),
      author: currentUser,
      content,
      likes: 0,
      comments: 0,
      isLiked: false,
      createdAt: new Date(),
      resultValue,
      type: resultValue ? 'result' : 'post',
    };
    setAllPosts([newPost, ...allPosts]);
    
    // Adicionar 2 pontos por postagem
    addPoints(2);
    
    toast({
      title: resultValue ? "🔥 Resultado publicado!" : "✅ Post publicado!",
      description: resultValue 
        ? `+${Math.floor(resultValue / 100)} pontos ganhos!` 
        : "Seu post foi compartilhado com a comunidade. +2 pontos!",
    });
  };

  const handleLike = (postId: string, isLiked: boolean) => {
    // Pontos já são adicionados no PostCard quando curte
    // Esta função pode ser usada para outras ações futuras
  };

  const handleRedeemPrize = (prize: typeof prizes[0]) => {
    toast({
      title: "🎁 Prêmio resgatado!",
      description: `${prize.name} - Em breve você receberá mais informações por e-mail.`,
    });
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'home':
        return (
          <div className="space-y-4">
            {/* Header estilo Instagram */}
            <div className="text-center py-4">
              <h2 className="text-2xl font-bold text-foreground mb-2">NutraHub</h2>
              <p className="text-muted-foreground text-sm">
                Faça postagens de seus resultados e ganhe pontos para resgatar prêmios
              </p>
            </div>

            {/* Botão de criar postagem */}
            <div className="flex justify-center mb-4">
              <Button 
                onClick={() => setIsCreatePostOpen(true)} 
                variant="fire" 
                className="w-full max-w-md"
              >
                <Plus className="w-4 h-4 mr-2" />
                Criar Postagem
              </Button>
            </div>

            {/* Feed de postagens estilo Instagram */}
            <div className="space-y-4">
              {allPosts.filter(post => post && post.author).map((post) => (
                <PostCard key={post.id} post={post} onLike={handleLike} />
              ))}
            </div>
          </div>
        );

      case 'community':
        return <CommunityChat />;

      case 'ranking':
        return (
          <div className="space-y-4">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-foreground mb-2">🏆 Ranking</h2>
              <p className="text-muted-foreground">Top vendedores da comunidade</p>
            </div>
            
            {users.map((user, index) => (
              <RankingCard key={user.id} user={user} position={index + 1} />
            ))}

            <PlaquesShowcase currentSales={currentUser.totalSales} />
          </div>
        );

      case 'prizes':
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-foreground mb-2">🎁 Prêmios</h2>
              <p className="text-muted-foreground mb-2">Troque seus pontos por recompensas incríveis</p>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/20">
                <span className="text-primary font-bold">{currentUser.points.toLocaleString()}</span>
                <span className="text-muted-foreground">pontos disponíveis</span>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              {prizes.map((prize) => (
                <PrizeCard
                  key={prize.id}
                  prize={prize}
                  userPoints={currentUser.points}
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
      {/* Header */}
      <header className="sticky top-0 z-40 glass-card border-b border-border/50 px-4 py-3">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <h1 className="text-xl font-bold">
            <span className="text-gradient-fire">Nutra</span>
            <span className="text-foreground">Elite</span>
          </h1>
          
          {/* Avatar no canto superior direito */}
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
      </header>

      {/* Main Content */}
      <main className={cn(
        "max-w-lg mx-auto pb-24",
        activeTab === 'community' ? "px-0" : "px-4 py-6"
      )} style={{ color: 'hsl(40, 20%, 95%)' }}>
        {renderContent()}
      </main>

      {/* Bottom Navigation */}
      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />

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
    </div>
  );
};

export default Index;
