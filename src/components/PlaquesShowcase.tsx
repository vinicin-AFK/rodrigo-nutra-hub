import { rankingPlaques } from '@/data/mockData';

interface PlaquesShowcaseProps {
  currentSales: number;
}

export function PlaquesShowcase({ currentSales }: PlaquesShowcaseProps) {
  return (
    <div className="glass-card rounded-2xl p-6 animate-fade-in">
      <h3 className="text-lg font-bold text-foreground mb-4 text-center">🏆 Placas de Faturamento</h3>
      
      <div className="space-y-3">
        {rankingPlaques.map((plaque) => {
          const isAchieved = currentSales >= plaque.minSales;
          const progress = Math.min((currentSales / plaque.minSales) * 100, 100);
          
          return (
            <div
              key={plaque.id}
              className={`relative p-4 rounded-xl transition-all ${
                isAchieved
                  ? 'bg-gradient-to-r from-primary/20 to-accent/20 border border-primary/30'
                  : 'bg-secondary/50'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="text-3xl">{plaque.icon}</span>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h4 className={`font-semibold ${isAchieved ? 'text-foreground' : 'text-muted-foreground'}`}>
                      {plaque.name}
                    </h4>
                    <span className="text-sm text-muted-foreground">
                      R$ {(plaque.minSales / 1000).toFixed(0)}k
                    </span>
                  </div>
                  
                  {/* Progress Bar */}
                  <div className="mt-2 h-2 bg-background/50 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        isAchieved ? 'bg-gradient-to-r from-primary to-accent' : 'bg-muted-foreground/30'
                      }`}
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
                
                {isAchieved && (
                  <span className="text-green-500 text-sm font-medium">✓</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
