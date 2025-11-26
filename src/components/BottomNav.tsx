import { Home, Users, Trophy, Gift, MessageCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

type Tab = 'home' | 'community' | 'ranking' | 'prizes' | 'support' | 'ai-copy' | 'ai-creative';

interface BottomNavProps {
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
}

const navItems: { id: Tab; icon: React.ElementType; label: string }[] = [
  { id: 'home', icon: Home, label: 'Início' },
  { id: 'community', icon: Users, label: 'Comunidade' },
  { id: 'ranking', icon: Trophy, label: 'Ranking' },
  { id: 'prizes', icon: Gift, label: 'Prêmios' },
  { id: 'support', icon: MessageCircle, label: 'Suporte' },
];

export function BottomNav({ activeTab, onTabChange }: BottomNavProps) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 glass-card border-t border-border/50 px-2 py-2 safe-area-bottom">
      <div className="flex items-center justify-around max-w-lg mx-auto overflow-x-auto scrollbar-hide">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={cn(
                "nav-item min-w-[60px] flex-shrink-0",
                isActive && "active"
              )}
            >
              <Icon className={cn(
                "w-5 h-5 transition-all duration-300",
                isActive && "animate-scale-in"
              )} />
              <span className="text-[10px] font-medium whitespace-nowrap">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
