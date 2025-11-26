import { Gift, Lock } from 'lucide-react';
import { Prize } from '@/types';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface PrizeCardProps {
  prize: Prize;
  userPoints: number;
  onRedeem: (prize: Prize) => void;
}

export function PrizeCard({ prize, userPoints, onRedeem }: PrizeCardProps) {
  const canRedeem = userPoints >= prize.pointsCost;

  return (
    <div className={cn(
      "glass-card rounded-2xl p-4 animate-fade-in transition-all duration-300",
      canRedeem ? "hover:shadow-[0_0_30px_hsl(25_95%_55%_/_0.2)]" : "opacity-70"
    )}>
      {/* Icon */}
      <div className="text-5xl mb-3 text-center animate-float">{prize.image}</div>

      {/* Info */}
      <h3 className="font-semibold text-foreground text-center mb-1">{prize.name}</h3>
      <p className="text-sm text-muted-foreground text-center mb-3">{prize.description}</p>

      {/* Points */}
      <div className="flex items-center justify-center gap-2 mb-4">
        <Gift className="w-4 h-4 text-accent" />
        <span className={cn(
          "font-bold",
          canRedeem ? "text-gradient-gold" : "text-muted-foreground"
        )}>
          {prize.pointsCost.toLocaleString('pt-BR')} pontos
        </span>
      </div>

      {/* Button */}
      <Button
        onClick={() => onRedeem(prize)}
        disabled={!canRedeem}
        variant={canRedeem ? "fire" : "secondary"}
        className="w-full"
      >
        {canRedeem ? (
          <>
            <Gift className="w-4 h-4" />
            Resgatar
          </>
        ) : (
          <>
            <Lock className="w-4 h-4" />
            {(prize.pointsCost - userPoints).toLocaleString('pt-BR')} pts faltam
          </>
        )}
      </Button>
    </div>
  );
}
