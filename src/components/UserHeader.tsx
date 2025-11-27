import { Flame, Trophy, Crown, TrendingUp, LogOut, User, Settings } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { currentUser as fallbackUser } from '@/data/mockData';

export function UserHeader() {
  const { user, logout, userPoints, userPlan } = useAuth();
  const navigate = useNavigate();
  
  // Usar dados do usuário autenticado ou fallback
  const displayUser = user || fallbackUser;
  const userRank = (user as any)?.rank || fallbackUser.rank || 999;
  const userTotalSales = (user as any)?.totalSales || fallbackUser.totalSales || 0;
  const userLevel = userPlan?.name || user?.level || fallbackUser.level || 'Iniciante';

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
      // Mesmo com erro, tentar navegar para login
      navigate('/login');
    }
  };

  return (
    <div className="glass-card rounded-2xl p-4 animate-fade-in">
      <div className="flex items-center gap-4">
        {/* Avatar com Dropdown Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="relative cursor-pointer hover:opacity-80 transition-opacity">
              <img
                src={displayUser.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(displayUser.name)}&background=random`}
                alt={displayUser.name}
                className="w-16 h-16 rounded-full object-cover ring-2 ring-primary"
              />
              <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                <Crown className="w-3 h-3 text-primary-foreground" />
              </div>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56">
            <DropdownMenuLabel>
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">{displayUser.name}</p>
                <p className="text-xs leading-none text-muted-foreground">{displayUser.email}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <User className="mr-2 h-4 w-4" />
              <span>Meu Perfil</span>
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Settings className="mr-2 h-4 w-4" />
              <span>Configurações</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="text-red-600 focus:text-red-600">
              <LogOut className="mr-2 h-4 w-4" />
              <span>Sair</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Info */}
        <div className="flex-1">
          <h2 className="font-bold text-lg text-foreground">Olá, {displayUser.name}! 👋</h2>
          <div className="flex items-center gap-2 text-sm">
            <span className="text-gradient-gold font-semibold">{userLevel}</span>
            <span className="text-muted-foreground">•</span>
            <span className="text-muted-foreground">Rank #{userRank}</span>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mt-4">
        <div className="bg-secondary/50 rounded-xl p-3 text-center">
          <Flame className="w-5 h-5 text-primary mx-auto mb-1" />
          <p className="text-lg font-bold text-foreground">{userPoints.toLocaleString()}</p>
          <p className="text-xs text-muted-foreground">Pontos</p>
        </div>
        <div className="bg-secondary/50 rounded-xl p-3 text-center">
          <Trophy className="w-5 h-5 text-accent mx-auto mb-1" />
          <p className="text-lg font-bold text-foreground">#{userRank}</p>
          <p className="text-xs text-muted-foreground">Ranking</p>
        </div>
        <div className="bg-secondary/50 rounded-xl p-3 text-center">
          <TrendingUp className="w-5 h-5 text-green-500 mx-auto mb-1" />
          <p className="text-lg font-bold text-gradient-fire">R${(userTotalSales / 1000).toFixed(0)}k</p>
          <p className="text-xs text-muted-foreground">Vendas</p>
        </div>
      </div>
    </div>
  );
}
