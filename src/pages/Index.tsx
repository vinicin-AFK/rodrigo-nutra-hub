import { useState } from 'react';
import { Plus } from 'lucide-react';
import { BottomNav } from '@/components/BottomNav';
import { PostCard } from '@/components/PostCard';
import { RankingCard } from '@/components/RankingCard';
import { PrizeCard } from '@/components/PrizeCard';
import { SupportChat } from '@/components/SupportChat';
import { AICopyGenerator } from '@/components/AICopyGenerator';
import { AICreativeGenerator } from '@/components/AICreativeGenerator';
import { UserHeader } from '@/components/UserHeader';
import { CreatePostModal } from '@/components/CreatePostModal';
import { PlaquesShowcase } from '@/components/PlaquesShowcase';
import { Button } from '@/components/ui/button';
import { posts, users, prizes, currentUser } from '@/data/mockData';
import { Post } from '@/types';
import { toast } from '@/hooks/use-toast';

type Tab = 'home' | 'community' | 'ranking' | 'prizes' | 'support' | 'ai-copy' | 'ai-creative';

const Index = () => {
  const [activeTab, setActiveTab] = useState<Tab>('home');
  const [isCreatePostOpen, setIsCreatePostOpen] = useState(false);
  const [allPosts, setAllPosts] = useState<Post[]>(posts);

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
    toast({
      title: resultValue ? "🔥 Resultado publicado!" : "✅ Post publicado!",
      description: resultValue ? `+${Math.floor(resultValue / 100)} pontos ganhos!` : "Seu post foi compartilhado com a comunidade.",
    });
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
          <div className="space-y-6">
            <UserHeader />
            
            {/* Quick Actions */}
            <div className="grid grid-cols-2 gap-3">
              <Button
                onClick={() => setActiveTab('ai-copy')}
                variant="outline"
                className="h-auto py-4 flex-col gap-2"
              >
                <span className="text-2xl">✨</span>
                <span className="text-sm">Gerar Copy</span>
              </Button>
              <Button
                onClick={() => setActiveTab('ai-creative')}
                variant="outline"
                className="h-auto py-4 flex-col gap-2"
              >
                <span className="text-2xl">🎬</span>
                <span className="text-sm">Criar Roteiro</span>
              </Button>
            </div>

            {/* Recent Activity */}
            <div>
              <h3 className="text-lg font-bold text-foreground mb-4">🔥 Atividade Recente</h3>
              <div className="space-y-4">
                {allPosts.slice(0, 3).map((post) => (
                  <PostCard key={post.id} post={post} />
                ))}
              </div>
            </div>

            <PlaquesShowcase currentSales={currentUser.totalSales} />
          </div>
        );

      case 'community':
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-foreground">Comunidade</h2>
              <Button onClick={() => setIsCreatePostOpen(true)} variant="fire" size="sm">
                <Plus className="w-4 h-4" />
                Publicar
              </Button>
            </div>
            
            {allPosts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        );

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
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 glass-card border-b border-border/50 px-4 py-3">
        <div className="max-w-lg mx-auto flex items-center justify-center">
          <h1 className="text-xl font-bold">
            <span className="text-gradient-fire">Nutra</span>
            <span className="text-foreground">Elite</span>
          </h1>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-lg mx-auto px-4 py-6 pb-24">
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
    </div>
  );
};

export default Index;
