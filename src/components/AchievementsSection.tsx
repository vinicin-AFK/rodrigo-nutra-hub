import { useAuth } from '@/contexts/AuthContext';
import { Trophy, Lock } from 'lucide-react';
import { cn } from '@/lib/utils';

export function AchievementsSection() {
  const { achievements } = useAuth();

  const unlockedAchievements = achievements.filter(a => a.unlockedAt);
  const lockedAchievements = achievements.filter(a => !a.unlockedAt);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Trophy className="w-5 h-5 text-primary" />
        <h3 className="font-semibold text-foreground">Conquistas</h3>
        <span className="text-sm text-muted-foreground">
          ({unlockedAchievements.length}/{achievements.length})
        </span>
      </div>

      <div className="grid grid-cols-4 gap-3">
        {/* Conquistas desbloqueadas */}
        {unlockedAchievements.map((achievement) => (
          <div
            key={achievement.id}
            className="relative group cursor-pointer animate-fade-in"
            title={achievement.name}
          >
            <div className="aspect-square rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 border-2 border-primary/50 flex flex-col items-center justify-center p-2 hover:scale-105 transition-transform">
              <span className="text-3xl mb-1">{achievement.icon}</span>
              <span className="text-[8px] font-semibold text-center text-foreground leading-tight">
                {achievement.name}
              </span>
            </div>
            {/* Tooltip */}
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-10">
              <div className="bg-popover border border-border rounded-lg p-2 shadow-lg text-xs max-w-[150px]">
                <p className="font-semibold text-foreground">{achievement.name}</p>
                <p className="text-muted-foreground">{achievement.description}</p>
                {achievement.unlockedAt && (
                  <p className="text-[10px] text-muted-foreground mt-1">
                    Desbloqueada em {new Date(achievement.unlockedAt).toLocaleDateString('pt-BR')}
                  </p>
                )}
              </div>
            </div>
          </div>
        ))}

        {/* Conquistas bloqueadas */}
        {lockedAchievements.map((achievement) => (
          <div
            key={achievement.id}
            className="relative group cursor-pointer"
            title={achievement.name}
          >
            <div className="aspect-square rounded-xl bg-secondary/30 border-2 border-border/30 flex flex-col items-center justify-center p-2 opacity-50">
              <div className="relative">
                <span className="text-3xl mb-1 blur-[2px]">{achievement.icon}</span>
                <Lock className="absolute inset-0 m-auto w-4 h-4 text-muted-foreground" />
              </div>
              <span className="text-[8px] font-semibold text-center text-muted-foreground leading-tight">
                {achievement.name}
              </span>
            </div>
            {/* Tooltip */}
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-10">
              <div className="bg-popover border border-border rounded-lg p-2 shadow-lg text-xs max-w-[150px]">
                <p className="font-semibold text-foreground">{achievement.name}</p>
                <p className="text-muted-foreground">{achievement.description}</p>
                {achievement.target && (
                  <p className="text-[10px] text-muted-foreground mt-1">
                    Progresso: {achievement.progress || 0}/{achievement.target}
                  </p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

