import { Flame, Trophy, Crown, TrendingUp } from 'lucide-react';
import { currentUser } from '@/data/mockData';

export function UserHeader() {
  return (
    <div className="glass-card rounded-2xl p-4 animate-fade-in">
      <div className="flex items-center gap-4">
        {/* Avatar */}
        <div className="relative">
          <img
            src={currentUser.avatar}
            alt={currentUser.name}
            className="w-16 h-16 rounded-full object-cover ring-2 ring-primary"
          />
          <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-primary flex items-center justify-center">
            <Crown className="w-3 h-3 text-primary-foreground" />
          </div>
        </div>

        {/* Info */}
        <div className="flex-1">
          <h2 className="font-bold text-lg text-foreground">Olá, {currentUser.name}! 👋</h2>
          <div className="flex items-center gap-2 text-sm">
            <span className="text-gradient-gold font-semibold">{currentUser.level}</span>
            <span className="text-muted-foreground">•</span>
            <span className="text-muted-foreground">Rank #{currentUser.rank}</span>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mt-4">
        <div className="bg-secondary/50 rounded-xl p-3 text-center">
          <Flame className="w-5 h-5 text-primary mx-auto mb-1" />
          <p className="text-lg font-bold text-foreground">{currentUser.points.toLocaleString()}</p>
          <p className="text-xs text-muted-foreground">Pontos</p>
        </div>
        <div className="bg-secondary/50 rounded-xl p-3 text-center">
          <Trophy className="w-5 h-5 text-accent mx-auto mb-1" />
          <p className="text-lg font-bold text-foreground">#{currentUser.rank}</p>
          <p className="text-xs text-muted-foreground">Ranking</p>
        </div>
        <div className="bg-secondary/50 rounded-xl p-3 text-center">
          <TrendingUp className="w-5 h-5 text-green-500 mx-auto mb-1" />
          <p className="text-lg font-bold text-gradient-fire">R${(currentUser.totalSales / 1000).toFixed(0)}k</p>
          <p className="text-xs text-muted-foreground">Vendas</p>
        </div>
      </div>
    </div>
  );
}
