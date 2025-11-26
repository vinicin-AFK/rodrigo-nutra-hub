import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Achievement, ACHIEVEMENTS } from '@/types/achievements';

interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  level?: string;
  points?: number;
  plan?: string;
}

interface Plan {
  id: string;
  name: string;
  minPoints: number;
  icon: string;
  color: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  userPoints: number;
  userPlan: Plan | null;
  nextPlan: Plan | null;
  achievements: Achievement[];
  stats: {
    postsCount: number;
    likesReceived: number;
    prizesRedeemed: number;
  };
  login: (email: string, password: string) => Promise<boolean>;
  register: (name: string, email: string, password: string) => Promise<boolean>;
  logout: () => void;
  addPoints: (points: number) => void;
  updateProfile: (data: { name?: string; avatar?: string }) => Promise<void>;
  unlockAchievement: (achievementId: string) => Achievement | null;
  updateStats: (stats: { postsCount?: number; likesReceived?: number; prizesRedeemed?: number }) => void;
}

const PLANS: Plan[] = [
  { id: 'bronze', name: 'Bronze', minPoints: 0, icon: '🥉', color: 'text-amber-600' },
  { id: 'silver', name: 'Prata', minPoints: 100, icon: '🥈', color: 'text-gray-400' },
  { id: 'gold', name: 'Ouro', minPoints: 500, icon: '🥇', color: 'text-yellow-500' },
  { id: 'platinum', name: 'Platina', minPoints: 1000, icon: '💎', color: 'text-cyan-400' },
  { id: 'diamond', name: 'Diamante', minPoints: 5000, icon: '💠', color: 'text-blue-500' },
];

function getPlanByPoints(points: number): Plan {
  for (let i = PLANS.length - 1; i >= 0; i--) {
    if (points >= PLANS[i].minPoints) {
      return PLANS[i];
    }
  }
  return PLANS[0];
}

function getNextPlan(points: number): Plan | null {
  const currentPlan = getPlanByPoints(points);
  const currentIndex = PLANS.findIndex(p => p.id === currentPlan.id);
  if (currentIndex < PLANS.length - 1) {
    return PLANS[currentIndex + 1];
  }
  return null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const STORAGE_KEY = 'nutraelite_auth';

const STATS_KEY = 'nutraelite_stats';
const ACHIEVEMENTS_KEY = 'nutraelite_achievements';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [stats, setStats] = useState({
    postsCount: 0,
    likesReceived: 0,
    prizesRedeemed: 0,
  });

  // Carregar sessão salva ao iniciar
  useEffect(() => {
    const savedAuth = localStorage.getItem(STORAGE_KEY);
    if (savedAuth) {
      try {
        const authData = JSON.parse(savedAuth);
        // Verificar se a sessão ainda é válida (opcional: adicionar expiração)
        if (authData.user && authData.token) {
          // Garantir que pontos existam
          if (!authData.user.points) {
            authData.user.points = 0;
          }
          setUser(authData.user);
          // Salvar de volta para garantir pontos
          localStorage.setItem(STORAGE_KEY, JSON.stringify(authData));
        }
      } catch (error) {
        console.error('Erro ao carregar sessão:', error);
        localStorage.removeItem(STORAGE_KEY);
      }
    }
    
    // Carregar stats
    const savedStats = localStorage.getItem(STATS_KEY);
    if (savedStats) {
      try {
        setStats(JSON.parse(savedStats));
      } catch (error) {
        console.error('Erro ao carregar stats:', error);
      }
    }
    
    // Carregar conquistas
    const savedAchievements = localStorage.getItem(ACHIEVEMENTS_KEY);
    if (savedAchievements) {
      try {
        const unlocked = JSON.parse(savedAchievements);
        const achievementsWithStatus = ACHIEVEMENTS.map(achievement => {
          const unlockedData = unlocked.find((u: any) => u.id === achievement.id);
          return {
            ...achievement,
            unlockedAt: unlockedData?.unlockedAt ? new Date(unlockedData.unlockedAt) : undefined,
            progress: unlockedData?.progress || 0,
          };
        });
        setAchievements(achievementsWithStatus);
      } catch (error) {
        console.error('Erro ao carregar conquistas:', error);
      }
    } else {
      // Inicializar com todas as conquistas não desbloqueadas
      setAchievements(ACHIEVEMENTS.map(a => ({ ...a, progress: 0 })));
    }
    
    setIsLoading(false);
  }, []);

  const userPoints = user?.points || 0;
  const userPlan = user ? getPlanByPoints(userPoints) : null;
  const nextPlan = user ? getNextPlan(userPoints) : null;

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      // Simulação de API - em produção, fazer requisição real
      // Por enquanto, aceita qualquer email/senha para demonstração
      // Em produção, validar com backend
      
      // Simular delay de API
      await new Promise(resolve => setTimeout(resolve, 500));

      // Buscar usuário mockado ou criar sessão
      const mockUsers = JSON.parse(localStorage.getItem('nutraelite_users') || '[]');
      const foundUser = mockUsers.find((u: any) => u.email === email && u.password === password);

      if (foundUser || email && password) {
        // Se encontrou ou é primeiro login, criar/atualizar usuário
        const userData: User = foundUser ? {
          id: foundUser.id,
          name: foundUser.name,
          email: foundUser.email,
          avatar: foundUser.avatar,
          level: foundUser.level || 'Iniciante',
          points: foundUser.points || 0,
          plan: foundUser.plan || 'bronze',
        } : {
          id: Date.now().toString(),
          name: email.split('@')[0],
          email: email,
          avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(email.split('@')[0])}&background=random`,
          level: 'Iniciante',
          points: 0,
          plan: 'bronze',
        };

        const token = `token_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        // Salvar no localStorage
        const authData = {
          user: userData,
          token: token,
          timestamp: Date.now(),
        };
        
        localStorage.setItem(STORAGE_KEY, JSON.stringify(authData));
        
        // Salvar usuário na lista de usuários (se não existir)
        if (!foundUser) {
          const updatedUsers = [...mockUsers, {
            ...userData,
            password: password, // Em produção, NUNCA salvar senha em texto plano!
          }];
          localStorage.setItem('nutraelite_users', JSON.stringify(updatedUsers));
        }
        
        setUser(userData);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Erro ao fazer login:', error);
      return false;
    }
  };

  const register = async (name: string, email: string, password: string): Promise<boolean> => {
    try {
      // Simulação de API
      await new Promise(resolve => setTimeout(resolve, 500));

      // Verificar se email já existe
      const mockUsers = JSON.parse(localStorage.getItem('nutraelite_users') || '[]');
      const emailExists = mockUsers.some((u: any) => u.email === email);

      if (emailExists) {
        return false; // Email já cadastrado
      }

      // Criar novo usuário
      const newUser: User = {
        id: Date.now().toString(),
        name: name,
        email: email,
        avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random`,
        level: 'Iniciante',
        points: 0,
        plan: 'bronze',
      };

      const token = `token_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Salvar no localStorage
      const authData = {
        user: newUser,
        token: token,
        timestamp: Date.now(),
      };
      
      localStorage.setItem(STORAGE_KEY, JSON.stringify(authData));
      
      // Adicionar à lista de usuários
      const updatedUsers = [...mockUsers, {
        ...newUser,
        password: password, // Em produção, NUNCA salvar senha em texto plano!
      }];
      localStorage.setItem('nutraelite_users', JSON.stringify(updatedUsers));
      
      setUser(newUser);
      return true;
    } catch (error) {
      console.error('Erro ao cadastrar:', error);
      return false;
    }
  };

  const logout = () => {
    localStorage.removeItem(STORAGE_KEY);
    setUser(null);
  };

  const addPoints = (points: number) => {
    if (!user) return;
    
    const newPoints = (user.points || 0) + points;
    const newPlan = getPlanByPoints(newPoints);
    
    const updatedUser: User = {
      ...user,
      points: newPoints,
      plan: newPlan.id,
      level: newPlan.name,
    };
    
    setUser(updatedUser);
    
    // Salvar no localStorage
    const savedAuth = localStorage.getItem(STORAGE_KEY);
    if (savedAuth) {
      try {
        const authData = JSON.parse(savedAuth);
        authData.user = updatedUser;
        localStorage.setItem(STORAGE_KEY, JSON.stringify(authData));
      } catch (error) {
        console.error('Erro ao salvar pontos:', error);
      }
    }
  };

  const updateProfile = async (data: { name?: string; avatar?: string }) => {
    if (!user) {
      console.error('updateProfile: Usuário não autenticado');
      throw new Error('Usuário não autenticado');
    }
    
    try {
      console.log('updateProfile: Dados recebidos:', data);
      console.log('updateProfile: Usuário atual:', user);
      
      // Criar objeto atualizado
      const updatedUser: User = {
        ...user,
      };
      
      // Atualizar nome se fornecido
      if (data.name !== undefined) {
        updatedUser.name = data.name;
      }
      
      // Atualizar avatar se fornecido (pode ser string vazia para remover)
      if (data.avatar !== undefined) {
        updatedUser.avatar = data.avatar || undefined;
      }
      
      console.log('updateProfile: Usuário atualizado:', updatedUser);
      
      // Atualizar estado
      setUser(updatedUser);
      
      // Salvar no localStorage
      const savedAuth = localStorage.getItem(STORAGE_KEY);
      if (!savedAuth) {
        throw new Error('Sessão não encontrada no localStorage');
      }
      
      const authData = JSON.parse(savedAuth);
      authData.user = updatedUser;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(authData));
      console.log('updateProfile: Dados salvos no localStorage');
      
      // Atualizar também na lista de usuários (se existir)
      try {
        const mockUsers = JSON.parse(localStorage.getItem('nutraelite_users') || '[]');
        const userIndex = mockUsers.findIndex((u: any) => u.id === user.id);
        if (userIndex !== -1) {
          // Preservar senha e outros campos não atualizados
          mockUsers[userIndex] = { 
            ...mockUsers[userIndex], 
            name: updatedUser.name,
            avatar: updatedUser.avatar,
            email: updatedUser.email,
            level: updatedUser.level,
            points: updatedUser.points,
            plan: updatedUser.plan,
          };
          localStorage.setItem('nutraelite_users', JSON.stringify(mockUsers));
          console.log('updateProfile: Lista de usuários atualizada');
        } else {
          console.warn('updateProfile: Usuário não encontrado na lista de usuários');
        }
      } catch (listError) {
        console.warn('updateProfile: Erro ao atualizar lista de usuários (não crítico):', listError);
        // Não é crítico, continuar
      }
      
      // Retornar explicitamente
      return;
    } catch (error) {
      console.error('updateProfile: Erro completo:', error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Erro desconhecido ao atualizar perfil');
    }
  };

  const unlockAchievement = (achievementId: string): Achievement | null => {
    const achievement = ACHIEVEMENTS.find(a => a.id === achievementId);
    if (!achievement) return null;

    // Verificar se já está desbloqueada
    const existing = achievements.find(a => a.id === achievementId);
    if (existing?.unlockedAt) return null;

    // Desbloquear
    const unlockedAchievement: Achievement = {
      ...achievement,
      unlockedAt: new Date(),
      progress: achievement.target || 1,
    };

    const updatedAchievements = achievements.map(a =>
      a.id === achievementId ? unlockedAchievement : a
    );
    setAchievements(updatedAchievements);

    // Salvar no localStorage
    const unlocked = updatedAchievements
      .filter(a => a.unlockedAt)
      .map(a => ({
        id: a.id,
        unlockedAt: a.unlockedAt?.toISOString(),
        progress: a.progress,
      }));
    localStorage.setItem(ACHIEVEMENTS_KEY, JSON.stringify(unlocked));

    // Disparar evento customizado para notificação
    window.dispatchEvent(new CustomEvent('achievement-unlocked', {
      detail: unlockedAchievement
    }));

    return unlockedAchievement;
  };

  const updateStats = (newStats: { postsCount?: number; likesReceived?: number; prizesRedeemed?: number }) => {
    setStats(prev => {
      const updated = { ...prev, ...newStats };
      localStorage.setItem(STATS_KEY, JSON.stringify(updated));
      return updated;
    });
    
    // Verificar conquistas baseadas em stats atualizados (usar setTimeout para garantir que o estado foi atualizado)
    setTimeout(() => {
      setStats(currentStats => {
        // Verificar conquistas de postagens
        if (newStats.postsCount !== undefined) {
          if (currentStats.postsCount >= 1) checkAchievement('first_post');
          if (currentStats.postsCount >= 10) checkAchievement('10_posts');
          if (currentStats.postsCount >= 50) checkAchievement('50_posts');
          if (currentStats.postsCount >= 100) checkAchievement('100_posts');
        }

        // Verificar conquistas de curtidas
        if (newStats.likesReceived !== undefined) {
          if (currentStats.likesReceived >= 1) checkAchievement('first_like');
          if (currentStats.likesReceived >= 10) checkAchievement('10_likes');
          if (currentStats.likesReceived >= 50) checkAchievement('50_likes');
          if (currentStats.likesReceived >= 100) checkAchievement('100_likes');
          if (currentStats.likesReceived >= 500) checkAchievement('500_likes');
        }

        // Verificar conquistas de prêmios
        if (newStats.prizesRedeemed !== undefined) {
          if (currentStats.prizesRedeemed >= 1) checkAchievement('first_prize');
          if (currentStats.prizesRedeemed >= 5) checkAchievement('5_prizes');
        }
        
        return currentStats;
      });
    }, 100);
  };

  const checkAchievement = (achievementId: string): Achievement | null => {
    return unlockAchievement(achievementId);
  };

  // Verificar conquistas de pontos e rank quando pontos mudarem
  useEffect(() => {
    if (!user) return;

    // Conquistas de pontos
    if (userPoints >= 100) checkAchievement('100_points');
    if (userPoints >= 500) checkAchievement('500_points');
    if (userPoints >= 1000) checkAchievement('1000_points');

    // Conquistas de rank
    if (userPlan) {
      const rankAchievements: Record<string, string> = {
        bronze: 'rank_bronze',
        silver: 'rank_silver',
        gold: 'rank_gold',
        platinum: 'rank_platinum',
        diamond: 'rank_diamond',
      };
      const achievementId = rankAchievements[userPlan.id];
      if (achievementId) {
        checkAchievement(achievementId);
      }
    }
  }, [userPoints, userPlan, user]);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        userPoints,
        userPlan,
        nextPlan,
        achievements,
        stats,
        login,
        register,
        logout,
        addPoints,
        updateProfile,
        unlockAchievement,
        updateStats,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
}

