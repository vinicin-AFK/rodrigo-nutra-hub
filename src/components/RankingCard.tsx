import { Trophy, Flame, TrendingUp } from 'lucide-react';
import { User } from '@/types';
import { cn } from '@/lib/utils';

interface RankingCardProps {
  user: User;
  position: number;
}

export function RankingCard({ user, position }: RankingCardProps) {
  const getMedal = () => {
    switch (position) {
      case 1:
        return { emoji: '🥇', bg: 'from-yellow-500/20 to-yellow-600/10', border: 'border-yellow-500/50' };
      case 2:
        return { emoji: '🥈', bg: 'from-gray-400/20 to-gray-500/10', border: 'border-gray-400/50' };
      case 3:
        return { emoji: '🥉', bg: 'from-orange-600/20 to-orange-700/10', border: 'border-orange-600/50' };
      default:
        return { emoji: `#${position}`, bg: 'from-secondary to-secondary/50', border: 'border-border' };
    }
  };

  const medal = getMedal();

  return (
    <div className={cn(
      "glass-card rounded-2xl p-4 border animate-fade-in",
      `bg-gradient-to-r ${medal.bg}`,
      medal.border
    )}>
      <div className="flex items-center gap-4">
        {/* Position */}
        <div className="w-12 h-12 rounded-xl bg-background/50 flex items-center justify-center text-2xl font-bold">
          {position <= 3 ? medal.emoji : position}
        </div>

        {/* Avatar */}
        <img
          src={user.avatar}
          alt={user.name}
          className="w-14 h-14 rounded-full object-cover ring-2 ring-primary/30"
        />

        {/* Info */}
        <div className="flex-1">
          <h3 className="font-semibold text-foreground">{user.name}</h3>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Flame className="w-4 h-4 text-primary" />
              {user.points.toLocaleString('pt-BR')} pts
            </span>
            <span>•</span>
            <span className="text-gradient-gold font-medium">{user.level}</span>
          </div>
        </div>

        {/* Sales */}
        <div className="text-right">
          <div className="flex items-center gap-1 text-primary">
            <TrendingUp className="w-4 h-4" />
          </div>
          <p className="text-lg font-bold text-gradient-fire">
            R$ {(user.totalSales / 1000).toFixed(0)}k
          </p>
        </div>
      </div>
    </div>
  );
}
