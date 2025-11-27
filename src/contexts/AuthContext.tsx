import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Achievement, ACHIEVEMENTS } from '@/types/achievements';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import type { User as SupabaseUser } from '@supabase/supabase-js';

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
  logout: () => Promise<void>;
  addPoints: (points: number) => Promise<void>;
  updateProfile: (data: { name?: string; avatar?: string }) => Promise<void>;
  unlockAchievement: (achievementId: string) => Promise<Achievement | null>;
  updateStats: (stats: { postsCount?: number; likesReceived?: number; prizesRedeemed?: number }) => Promise<void>;
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
  const persistAuthData = (userData: User | null) => {
    if (typeof window === 'undefined') return;
    try {
      if (userData) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({
          user: userData,
          timestamp: Date.now(),
        }));
      } else {
        localStorage.removeItem(STORAGE_KEY);
      }
    } catch (error) {
      console.error('Erro ao persistir dados de autenticação:', error);
    }
  };

  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [stats, setStats] = useState({
    postsCount: 0,
    likesReceived: 0,
    prizesRedeemed: 0,
  });

  // Carregar perfil do Supabase
  const loadProfile = async (userId: string) => {
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;

      if (profile) {
        const userData: User = {
          id: profile.id,
          name: profile.name,
          email: profile.email,
          avatar: profile.avatar || undefined,
          level: profile.level || 'Bronze',
          points: profile.points || 0,
          plan: profile.plan || 'bronze',
        };
        setUser(userData);
        persistAuthData(userData);
      }
    } catch (error) {
      console.error('Erro ao carregar perfil:', error);
    }
  };

  // Carregar stats do Supabase
  const loadStats = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('user_stats')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') throw error; // PGRST116 = não encontrado

      if (data) {
        setStats({
          postsCount: data.posts_count || 0,
          likesReceived: data.likes_received || 0,
          prizesRedeemed: data.prizes_redeemed || 0,
        });
      }
    } catch (error) {
      console.error('Erro ao carregar stats:', error);
    }
  };

  // Carregar conquistas do Supabase
  const loadAchievements = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('achievements')
        .select('*')
        .eq('user_id', userId);

      if (error) throw error;

      const achievementsWithStatus = ACHIEVEMENTS.map(achievement => {
        const unlockedData = data?.find((a: any) => a.achievement_id === achievement.id);
        return {
          ...achievement,
          unlockedAt: unlockedData?.unlocked_at ? new Date(unlockedData.unlocked_at) : undefined,
          progress: unlockedData ? (achievement.target || 1) : (achievement.target ? 0 : undefined),
        };
      });
      setAchievements(achievementsWithStatus);
    } catch (error) {
      console.error('Erro ao carregar conquistas:', error);
      setAchievements(ACHIEVEMENTS.map(a => ({ ...a, progress: a.target ? 0 : undefined })));
    }
  };

  // Verificar sessão e carregar dados ao iniciar
  useEffect(() => {
    console.log('🔄 AuthContext: Iniciando verificação de sessão...', { isSupabaseConfigured });
    
    if (!isSupabaseConfigured) {
      console.log('📦 Modo offline: carregando do localStorage');
      // Modo offline - carregar do localStorage
      const savedAuth = localStorage.getItem(STORAGE_KEY);
      if (savedAuth) {
        try {
          const authData = JSON.parse(savedAuth);
          if (authData.user && authData.token) {
            if (!authData.user.points) {
              authData.user.points = 0;
            }
            setUser(authData.user);
            console.log('✅ Usuário carregado do localStorage:', authData.user.email);
          }
        } catch (error) {
          console.error('Erro ao carregar sessão:', error);
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
              progress: unlockedData?.progress || (achievement.target ? 0 : undefined),
            };
          });
          setAchievements(achievementsWithStatus);
        } catch (error) {
          console.error('Erro ao carregar conquistas:', error);
          setAchievements(ACHIEVEMENTS.map(a => ({ ...a, progress: a.target ? 0 : undefined })));
        }
      } else {
        setAchievements(ACHIEVEMENTS.map(a => ({ ...a, progress: a.target ? 0 : undefined })));
      }
      
      console.log('✅ Modo offline: loading finalizado');
      setIsLoading(false);
      return;
    }

    let isMounted = true;
    let hasInitialized = false;

    console.log('🌐 Modo Supabase: iniciando verificação de sessão...');

    // Timeout de segurança - sempre para o loading após 5 segundos
    const safetyTimeout = setTimeout(() => {
      if (isMounted && !hasInitialized) {
        console.warn('⚠️ TIMEOUT: Parando loading após 5 segundos');
        setIsLoading(false);
        hasInitialized = true;
      }
    }, 5000);

    const initializeSession = async () => {
      try {
        console.log('🔍 Buscando sessão do Supabase...');
        const sessionPromise = supabase.auth.getSession();
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Timeout ao buscar sessão')), 4000)
        );
        
        const { data: { session }, error } = await Promise.race([
          sessionPromise,
          timeoutPromise,
        ]) as any;

        if (error) {
          console.error('❌ Erro ao buscar sessão:', error);
          throw error;
        }

        console.log('📊 Sessão encontrada:', { hasSession: !!session, hasUser: !!session?.user });

        if (session?.user) {
          console.log('👤 Carregando dados do usuário:', session.user.id);
          await Promise.all([
            loadProfile(session.user.id).catch(err => console.error('Erro ao carregar perfil:', err)),
            loadStats(session.user.id).catch(err => console.error('Erro ao carregar stats:', err)),
            loadAchievements(session.user.id).catch(err => console.error('Erro ao carregar conquistas:', err)),
          ]);
          console.log('✅ Dados do usuário carregados');
        } else {
          console.log('ℹ️ Nenhuma sessão ativa');
          persistAuthData(null);
          setUser(null);
        }
      } catch (error: any) {
        console.error('❌ Erro ao verificar sessão:', error?.message || error);
        // Mesmo com erro, parar o loading
        persistAuthData(null);
        setUser(null);
      } finally {
        if (isMounted) {
          clearTimeout(safetyTimeout);
          console.log('✅ Finalizando loading');
          setIsLoading(false);
          hasInitialized = true;
        }
      }
    };

    initializeSession();

    // Ouvir mudanças de autenticação (apenas após inicialização)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      // Ignorar eventos durante a inicialização
      if (!hasInitialized && event === 'INITIAL_SESSION') {
        return;
      }

      if (session?.user) {
        try {
          await Promise.all([
            loadProfile(session.user.id).catch(err => console.error('Erro ao carregar perfil:', err)),
            loadStats(session.user.id).catch(err => console.error('Erro ao carregar stats:', err)),
            loadAchievements(session.user.id).catch(err => console.error('Erro ao carregar conquistas:', err)),
          ]);
        } catch (error) {
          console.error('Erro ao carregar dados do usuário:', error);
        }
      } else {
        setUser(null);
        persistAuthData(null);
        setStats({ postsCount: 0, likesReceived: 0, prizesRedeemed: 0 });
        setAchievements(ACHIEVEMENTS.map(a => ({ ...a, progress: a.target ? 0 : undefined })));
      }
    });

    return () => {
      isMounted = false;
      clearTimeout(safetyTimeout);
      subscription.unsubscribe();
    };
  }, []);

  const userPoints = user?.points || 0;
  const userPlan = user ? getPlanByPoints(userPoints) : null;
  const nextPlan = user ? getNextPlan(userPoints) : null;

  const login = async (email: string, password: string): Promise<boolean> => {
    console.log('🔐 AuthContext.login chamado', { email, isSupabaseConfigured });
    
    if (!isSupabaseConfigured) {
      console.log('📦 Modo offline: usando localStorage');
      // Modo offline - usar localStorage
      const mockUsers = JSON.parse(localStorage.getItem('nutraelite_users') || '[]');
      const foundUser = mockUsers.find((u: any) => u.email === email && u.password === password);
      
      if (foundUser || (email && password)) {
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
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ user: userData, token, timestamp: Date.now() }));
        setUser(userData);
        console.log('✅ Login offline realizado');
        return true;
      }
      console.log('❌ Login offline falhou');
      return false;
    }

    try {
      console.log('🌐 Tentando login no Supabase...');
      
      // Timeout de 10 segundos para o signInWithPassword
      const signInPromise = supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout: Login demorou mais de 10 segundos')), 10000)
      );
      
      const { data, error } = await Promise.race([signInPromise, timeoutPromise]) as any;

      if (error) {
        console.error('❌ Erro ao fazer login:', error.message || error);
        return false;
      }

      if (data?.user) {
        console.log('✅ Login no Supabase bem-sucedido, carregando dados...', data.user.id);
        
        // Carregar dados com timeout individual de 5s cada
        try {
          await Promise.all([
            Promise.race([
              loadProfile(data.user.id),
              new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout loadProfile')), 5000))
            ]).catch(err => {
              console.warn('⚠️ Erro ao carregar perfil (não crítico):', err);
              // Criar perfil básico se não conseguir carregar
              const basicUser: User = {
                id: data.user.id,
                name: data.user.user_metadata?.name || email.split('@')[0],
                email: data.user.email || email,
                level: 'Bronze',
                points: 0,
                plan: 'bronze',
              };
              setUser(basicUser);
              persistAuthData(basicUser);
            }),
            Promise.race([
              loadStats(data.user.id),
              new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout loadStats')), 5000))
            ]).catch(err => console.warn('⚠️ Erro ao carregar stats (não crítico):', err)),
            Promise.race([
              loadAchievements(data.user.id),
              new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout loadAchievements')), 5000))
            ]).catch(err => console.warn('⚠️ Erro ao carregar conquistas (não crítico):', err)),
          ]);
          console.log('✅ Dados do usuário carregados');
        } catch (err) {
          console.error('❌ Erro ao carregar dados do usuário:', err);
          // Mesmo com erro, permitir login com dados básicos
        }
        
        return true;
      }

      console.log('❌ Login falhou: nenhum usuário retornado');
      return false;
    } catch (error: any) {
      console.error('❌ Erro ao fazer login:', error?.message || error);
      return false;
    }
  };

  const register = async (name: string, email: string, password: string): Promise<boolean> => {
    if (!isSupabaseConfigured) {
      // Modo offline - usar localStorage
      const mockUsers = JSON.parse(localStorage.getItem('nutraelite_users') || '[]');
      const emailExists = mockUsers.some((u: any) => u.email === email);
      
      if (emailExists) {
        return false;
      }
      
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
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ user: newUser, token, timestamp: Date.now() }));
      localStorage.setItem('nutraelite_users', JSON.stringify([...mockUsers, { ...newUser, password }]));
      setUser(newUser);
      return true;
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
          },
        },
      });

      if (error) {
        console.error('Erro ao cadastrar:', error);
        return false;
      }

      if (data.user) {
        // Perfil será criado automaticamente pelo trigger no Supabase
        // Aguardar um pouco para garantir que o trigger executou
        await new Promise(resolve => setTimeout(resolve, 1000));
        await loadProfile(data.user.id);
        await loadStats(data.user.id);
        await loadAchievements(data.user.id);
        return true;
      }

      return false;
    } catch (error) {
      console.error('Erro ao cadastrar:', error);
      return false;
    }
  };

  const logout = async () => {
    if (isSupabaseConfigured) {
      await supabase.auth.signOut();
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
    setUser(null);
    persistAuthData(null);
    setStats({ postsCount: 0, likesReceived: 0, prizesRedeemed: 0 });
    setAchievements(ACHIEVEMENTS.map(a => ({ ...a, progress: a.target ? 0 : undefined })));
  };

  const addPoints = async (points: number) => {
    if (!user) return;
    
    const newPoints = (user.points || 0) + points;
    const newPlan = getPlanByPoints(newPoints);
    
    const updatedUser: User = {
      ...user,
      points: newPoints,
      plan: newPlan.id,
      level: newPlan.name,
    };
    
    if (isSupabaseConfigured) {
      try {
        const { error } = await supabase
          .from('profiles')
          .update({
            points: newPoints,
            plan: newPlan.id,
            level: newPlan.name,
            updated_at: new Date().toISOString(),
          })
          .eq('id', user.id);

        if (error) throw error;
      } catch (error) {
        console.error('Erro ao adicionar pontos:', error);
      }
    } else {
      // Modo offline - salvar no localStorage
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
    }
    
    setUser(updatedUser);
    persistAuthData(updatedUser);
  };

  const updateProfile = async (data: { name?: string; avatar?: string }) => {
    if (!user) {
      throw new Error('Usuário não autenticado');
    }
    
    try {
      const updateData: any = {
        updated_at: new Date().toISOString(),
      };

      if (data.name !== undefined) {
        updateData.name = data.name;
      }

      if (data.avatar !== undefined) {
        updateData.avatar = data.avatar || null;
      }

      const { error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', user.id);

      if (error) throw error;

      // Recarregar perfil atualizado
      await loadProfile(user.id);
    } catch (error) {
      console.error('Erro ao atualizar perfil:', error);
      throw error;
    }
  };

  const unlockAchievement = async (achievementId: string): Promise<Achievement | null> => {
    if (!user) return null;

    const achievement = ACHIEVEMENTS.find(a => a.id === achievementId);
    if (!achievement) return null;

    // Verificar se já está desbloqueada
    const existing = achievements.find(a => a.id === achievementId);
    if (existing?.unlockedAt) return null;

    try {
      // Salvar no Supabase
      const { error } = await supabase
        .from('achievements')
        .insert({
          user_id: user.id,
          achievement_id: achievementId,
        });

      if (error) {
        // Se já existe, não é erro
        if (error.code !== '23505') throw error;
      }

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

      // Disparar evento customizado para notificação
      window.dispatchEvent(new CustomEvent('achievement-unlocked', {
        detail: unlockedAchievement
      }));

      return unlockedAchievement;
    } catch (error) {
      console.error('Erro ao desbloquear conquista:', error);
      return null;
    }
  };

  const updateStats = async (newStats: { postsCount?: number; likesReceived?: number; prizesRedeemed?: number }) => {
    if (!user) return;

    setStats(prev => {
      const updated = { ...prev, ...newStats };
      
      // Salvar no Supabase
      supabase
        .from('user_stats')
        .upsert({
          user_id: user.id,
          posts_count: updated.postsCount,
          likes_received: updated.likesReceived,
          prizes_redeemed: updated.prizesRedeemed,
          updated_at: new Date().toISOString(),
        })
        .then(({ error }) => {
          if (error) console.error('Erro ao salvar stats:', error);
        });
      
      // Verificar conquistas baseadas em stats atualizados
      // Verificar conquistas de postagens
      if (newStats.postsCount !== undefined) {
        if (updated.postsCount >= 1) checkAchievement('first_post');
        if (updated.postsCount >= 10) checkAchievement('10_posts');
        if (updated.postsCount >= 50) checkAchievement('50_posts');
        if (updated.postsCount >= 100) checkAchievement('100_posts');
      }

      // Verificar conquistas de curtidas
      if (newStats.likesReceived !== undefined) {
        if (updated.likesReceived >= 1) checkAchievement('first_like');
        if (updated.likesReceived >= 10) checkAchievement('10_likes');
        if (updated.likesReceived >= 50) checkAchievement('50_likes');
        if (updated.likesReceived >= 100) checkAchievement('100_likes');
        if (updated.likesReceived >= 500) checkAchievement('500_likes');
      }

      // Verificar conquistas de prêmios
      if (newStats.prizesRedeemed !== undefined) {
        if (updated.prizesRedeemed >= 1) checkAchievement('first_prize');
        if (updated.prizesRedeemed >= 5) checkAchievement('5_prizes');
      }
      
      return updated;
    });
  };

  const checkAchievement = async (achievementId: string) => {
    await unlockAchievement(achievementId);
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

