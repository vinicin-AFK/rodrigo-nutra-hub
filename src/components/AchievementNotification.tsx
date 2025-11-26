import { useEffect, useState } from 'react';
import { Achievement } from '@/types/achievements';
import { Trophy } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

export function AchievementNotification() {
  const { toast } = useToast();
  const [recentAchievement, setRecentAchievement] = useState<Achievement | null>(null);

  useEffect(() => {
    const handleAchievementUnlocked = (event: CustomEvent<Achievement>) => {
      const achievement = event.detail;
      setRecentAchievement(achievement);
      
      toast({
        title: `🏆 Conquista Desbloqueada!`,
        description: `${achievement.icon} ${achievement.name} - ${achievement.description}`,
        duration: 5000,
      });

      // Limpar após 6 segundos
      setTimeout(() => {
        setRecentAchievement(null);
      }, 6000);
    };

    window.addEventListener('achievement-unlocked', handleAchievementUnlocked as EventListener);

    return () => {
      window.removeEventListener('achievement-unlocked', handleAchievementUnlocked as EventListener);
    };
  }, [toast]);

  if (!recentAchievement) return null;

  return (
    <div className={cn(
      "fixed top-20 left-1/2 -translate-x-1/2 z-50",
      "animate-fade-in"
    )}>
      <div className="glass-card rounded-2xl p-4 border-2 border-primary/50 shadow-lg max-w-sm">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center text-2xl">
            {recentAchievement.icon}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <Trophy className="w-4 h-4 text-primary" />
              <p className="font-bold text-sm text-foreground">Conquista Desbloqueada!</p>
            </div>
            <p className="text-xs font-semibold text-primary">{recentAchievement.name}</p>
            <p className="text-xs text-muted-foreground">{recentAchievement.description}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

