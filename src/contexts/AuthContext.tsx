import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Achievement, ACHIEVEMENTS } from '@/types/achievements';
import { supabase, isSupabaseConfigured, isInvalidApiKeyError, markApiKeyAsInvalid } from '@/lib/supabase';
import type { User as SupabaseUser } from '@supabase/supabase-js';

interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  level?: string;
  points?: number;
  plan?: string;
  role?: 'user' | 'support' | 'admin';
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

// Credenciais de suporte fixas
const SUPPORT_CREDENTIALS = {
  email: 'suporte@gmail.com',
  password: 'suporte123',
};

// Lista de emails de suporte (pode ser expandida)
const SUPPORT_EMAILS = [
  'suporte@gmail.com',
  'suporte@nutraelite.com',
  'support@nutraelite.com',
  'atendimento@nutraelite.com',
  'gustavo@nutraelite.com',
  'socio.gustavo@nutraelite.com',
];

// Função para detectar se é email de suporte
const isSupportEmail = (email: string): boolean => {
  const emailLower = email.toLowerCase();
  return SUPPORT_EMAILS.some(supportEmail => emailLower === supportEmail.toLowerCase()) ||
         emailLower.includes('suporte') ||
         emailLower.includes('support') ||
         emailLower.includes('atendimento');
};

// Função para verificar se é login de suporte
const isSupportLogin = (email: string, password: string): boolean => {
  const emailLower = email.toLowerCase();
  return emailLower === SUPPORT_CREDENTIALS.email.toLowerCase() && 
         password === SUPPORT_CREDENTIALS.password;
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const persistAuthData = (userData: User | null) => {
    if (typeof window === 'undefined') return;
    try {
      if (userData) {
        // Garantir que avatar seja null (não undefined) para preservar
        const dataToSave = {
          user: {
            ...userData,
            avatar: userData.avatar || null, // Sempre salvar null se não houver (não undefined)
          },
          timestamp: Date.now(),
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave));
        console.log('💾 Perfil persistido no localStorage:', { 
          name: userData.name, 
          avatar: userData.avatar ? 'sim' : 'não',
          avatarValue: userData.avatar || null
        });
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
      console.log('📥 Carregando perfil do usuário:', userId);
      
      // PRIMEIRO: Carregar perfil do localStorage para preservar dados atualizados
      const savedAuth = localStorage.getItem(STORAGE_KEY);
      let localUser: User | null = null;
      if (savedAuth) {
        try {
          const authData = JSON.parse(savedAuth);
          if (authData.user && authData.user.id === userId) {
            localUser = authData.user;
            console.log('📦 Perfil local encontrado:', localUser.name);
          }
        } catch (e) {
          console.warn('Erro ao parsear auth local:', e);
        }
      }
      
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('❌ Erro ao buscar perfil:', error);
        // Se o perfil não existe (PGRST116), não é erro crítico
        if (error.code === 'PGRST116') {
          console.log('ℹ️ Perfil não encontrado no Supabase, mantendo dados locais');
          // Se temos dados locais, manter eles
          if (localUser) {
            setUser(localUser);
            persistAuthData(localUser);
            return localUser;
          }
          return null;
        }
        // Se houver erro mas temos dados locais, manter eles
        if (localUser) {
          console.log('⚠️ Erro ao buscar do Supabase, mantendo dados locais');
          setUser(localUser);
          persistAuthData(localUser);
          return localUser;
        }
        throw error;
      }

      if (profile) {
        console.log('✅ Perfil encontrado no Supabase:', profile.name);
        
        // Se temos dados locais, NÃO sobrescrever - apenas usar Supabase para campos que faltam
        if (localUser) {
          console.log('📦 Mantendo dados locais como prioridade, mesclando apenas campos faltantes');
          const userData: User = {
            id: localUser.id,
            name: localUser.name || profile.name, // SEMPRE priorizar localStorage
            email: profile.email || localUser.email,
            avatar: localUser.avatar || profile.avatar || undefined, // SEMPRE priorizar localStorage
            level: localUser.level || profile.level || 'Bronze',
            points: localUser.points ?? profile.points ?? 0,
            plan: localUser.plan || profile.plan || 'bronze',
            role: localUser.role || profile.role || undefined,
          };
          
          // Só atualizar se realmente mudou algo (evitar re-renders desnecessários)
          if (JSON.stringify(userData) !== JSON.stringify(localUser)) {
            console.log('🔄 Atualizando perfil com dados mesclados');
            setUser(userData);
            persistAuthData(userData);
          } else {
            console.log('✅ Perfil local já está atualizado, mantendo como está');
            // Garantir que está salvo
            persistAuthData(localUser);
          }
          return userData;
        }
        
        // Se não temos dados locais, usar dados do Supabase
        const userData: User = {
          id: profile.id,
          name: profile.name,
          email: profile.email,
          avatar: profile.avatar || undefined,
          level: profile.level || 'Bronze',
          points: profile.points || 0,
          plan: profile.plan || 'bronze',
          role: profile.role || undefined,
        };
        
        setUser(userData);
        persistAuthData(userData);
        console.log('✅ Perfil carregado do Supabase:', {
          name: userData.name,
          avatar: userData.avatar ? 'sim' : 'não'
        });
        return userData;
      }
      
      // Se não há perfil no Supabase mas temos local, manter local
      if (localUser) {
        console.log('ℹ️ Nenhum perfil no Supabase, mantendo dados locais');
        setUser(localUser);
        persistAuthData(localUser);
        return localUser;
      }
      
      return null;
    } catch (error: any) {
      console.error('❌ Erro ao carregar perfil:', error?.message || error);
      
      // Se houver erro mas temos dados locais, manter eles
      const savedAuth = localStorage.getItem(STORAGE_KEY);
      if (savedAuth) {
        try {
          const authData = JSON.parse(savedAuth);
          if (authData.user && authData.user.id === userId) {
            console.log('⚠️ Erro ao carregar do Supabase, mantendo dados locais');
            setUser(authData.user);
            persistAuthData(authData.user);
            return authData.user;
          }
        } catch (e) {
          console.warn('Erro ao parsear auth local:', e);
        }
      }
      
      // Se for erro de perfil não encontrado, retornar null para criar
      if (error?.code === 'PGRST116') {
        return null;
      }
      throw error;
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
    
    // SEMPRE carregar do localStorage primeiro (para ter dados imediatamente)
    const savedAuth = localStorage.getItem(STORAGE_KEY);
    if (savedAuth) {
      try {
        const authData = JSON.parse(savedAuth);
        if (authData.user) {
          if (!authData.user.points) {
            authData.user.points = 0;
          }
          // Carregar usuário IMEDIATAMENTE para manter sessão
          // Garantir que todos os campos do perfil estão presentes
          // CRÍTICO: Preservar avatar exatamente como está salvo (null, string ou undefined)
          const loadedUser: User = {
            id: authData.user.id,
            name: authData.user.name || 'Usuário',
            email: authData.user.email || '',
            avatar: authData.user.avatar !== undefined ? authData.user.avatar : undefined, // Preservar null, string ou undefined
            level: authData.user.level || 'Bronze',
            points: authData.user.points || 0,
            plan: authData.user.plan || 'bronze',
            role: authData.user.role || undefined,
          };
          
          // CRÍTICO: Definir no estado ANTES de qualquer outra coisa
          setUser(loadedUser);
          
          // NÃO chamar persistAuthData aqui - os dados já estão salvos!
          // Chamar persistAuthData aqui pode sobrescrever dados mais recentes
          
          // Verificar se foi carregado corretamente
          console.log('✅ Usuário carregado do localStorage:', {
            email: loadedUser.email,
            name: loadedUser.name,
            avatar: loadedUser.avatar ? 'sim' : (loadedUser.avatar === null ? 'null' : 'undefined'),
            id: loadedUser.id,
            hasAvatar: !!loadedUser.avatar,
            avatarValue: loadedUser.avatar,
            rawAvatar: authData.user.avatar
          });
          
          setIsLoading(false); // IMPORTANTE: Parar loading imediatamente após carregar do localStorage
          
          // Se há timestamp, verificar se não expirou (opcional - manter sessão indefinidamente por padrão)
          // Por enquanto, manter sessão sempre ativa se houver dados no localStorage
        } else {
          setIsLoading(false); // Se não há user, também parar loading
        }
      } catch (error) {
        console.error('Erro ao carregar sessão do localStorage:', error);
        setIsLoading(false); // Em caso de erro, parar loading
      }
    } else {
      console.log('ℹ️ Nenhum dado de autenticação encontrado no localStorage');
      setIsLoading(false); // Se não há dados salvos, parar loading
    }
    
    // Carregar stats do localStorage
    const savedStats = localStorage.getItem(STATS_KEY);
    if (savedStats) {
      try {
        const parsedStats = JSON.parse(savedStats);
        setStats(parsedStats);
        console.log('✅ Stats carregados do localStorage:', parsedStats);
      } catch (error) {
        console.error('Erro ao carregar stats:', error);
      }
    }
    
    // Carregar conquistas do localStorage
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
    
    // Se não estiver configurado, parar aqui
    if (!isSupabaseConfigured) {
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
          console.log('👤 Verificando dados do usuário:', session.user.id);
          
          // CRÍTICO: Verificar se já temos dados locais ANTES de carregar do Supabase
          const savedAuth = localStorage.getItem(STORAGE_KEY);
          let hasLocalData = false;
          let localUser: User | null = null;
          
          if (savedAuth) {
            try {
              const authData = JSON.parse(savedAuth);
              if (authData.user && authData.user.id === session.user.id) {
                localUser = authData.user;
                hasLocalData = true;
                console.log('📦 Dados locais encontrados:', {
                  name: localUser.name,
                  avatar: localUser.avatar ? 'sim' : 'não',
                  timestamp: authData.timestamp ? new Date(authData.timestamp).toISOString() : 'sem timestamp'
                });
                
                // Se temos dados locais, garantir que estão no estado ANTES de tentar Supabase
                setUser(localUser);
                // NÃO chamar persistAuthData aqui - pode sobrescrever dados mais recentes
                // Os dados já estão salvos no localStorage
              }
            } catch (e) {
              console.warn('Erro ao verificar dados locais:', e);
            }
          }
          
          // Se temos dados locais, NÃO chamar loadProfile - manter dados locais como fonte de verdade
          if (hasLocalData && localUser) {
            console.log('✅ Usando dados locais como fonte de verdade - NÃO carregando do Supabase');
            // Garantir que o estado está atualizado com dados locais (preservar avatar corretamente)
            const preservedUser: User = {
              ...localUser,
              avatar: localUser.avatar !== undefined ? localUser.avatar : undefined, // Preservar null, string ou undefined
            };
            setUser(preservedUser);
            // NÃO chamar persistAuthData aqui - pode sobrescrever dados mais recentes
            // Os dados já estão salvos no localStorage
            
            // Carregar apenas stats e achievements em background (sem tocar no perfil)
            Promise.all([
              loadStats(session.user.id).catch(err => {
                console.error('Erro ao carregar stats:', err);
              }),
              loadAchievements(session.user.id).catch(err => {
                console.error('Erro ao carregar conquistas:', err);
              }),
            ]).then(() => {
              console.log('✅ Stats e achievements carregados em background');
            });
            
            // NÃO chamar loadProfile - manter dados locais intactos
            console.log('🔒 Perfil local protegido - não será sobrescrito pelo Supabase');
          } else {
            // Se não temos dados locais, carregar do Supabase normalmente
            console.log('📥 Carregando dados do Supabase (sem dados locais)');
            await Promise.all([
              loadProfile(session.user.id).catch(err => {
                console.error('Erro ao carregar perfil:', err);
              }),
              loadStats(session.user.id).catch(err => {
                console.error('Erro ao carregar stats:', err);
              }),
              loadAchievements(session.user.id).catch(err => {
                console.error('Erro ao carregar conquistas:', err);
              }),
            ]);
            console.log('✅ Dados do usuário carregados do Supabase');
          }
        } else {
          console.log('ℹ️ Nenhuma sessão ativa no Supabase, mantendo dados do localStorage');
          // NÃO limpar dados do localStorage se não houver sessão no Supabase
          // Manter o usuário que já foi carregado do localStorage
          // Se não há user no estado mas há no localStorage, carregar novamente
          const savedAuth = localStorage.getItem(STORAGE_KEY);
          if (!user && savedAuth) {
            try {
              const authData = JSON.parse(savedAuth);
              if (authData.user) {
                setUser(authData.user);
                console.log('✅ Usuário restaurado do localStorage após verificação Supabase');
              }
            } catch (error) {
              console.error('Erro ao restaurar usuário:', error);
            }
          }
        }
      } catch (error: any) {
        console.error('❌ Erro ao verificar sessão:', error?.message || error);
        // Se houver erro, manter dados do localStorage (não limpar)
        // Se não há user no estado mas há no localStorage, carregar novamente
        const savedAuth = localStorage.getItem(STORAGE_KEY);
        if (!user && savedAuth) {
          try {
            const authData = JSON.parse(savedAuth);
            if (authData.user) {
              setUser(authData.user);
              console.log('✅ Usuário restaurado do localStorage após erro no Supabase');
            }
          } catch (localError) {
            console.error('Erro ao restaurar usuário:', localError);
          }
        } else if (user) {
          console.log('ℹ️ Mantendo dados do localStorage devido a erro no Supabase');
        }
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
    
    // SEMPRE verificar login de suporte PRIMEIRO (antes de qualquer outra coisa)
    if (isSupportLogin(email, password)) {
      console.log('✅ Login de suporte detectado');
      const userData: User = {
        id: 'support_user',
        name: 'Suporte NutraElite',
        email: SUPPORT_CREDENTIALS.email,
        avatar: 'https://ui-avatars.com/api/?name=Suporte&background=FF6B35&color=fff',
        level: 'Suporte',
        points: 0,
        plan: 'support',
        role: 'support',
      };
      
      const token = `token_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      persistAuthData(userData);
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ user: userData, token, timestamp: Date.now() }));
      setUser(userData);
      console.log('✅ Login de suporte realizado com sucesso', { role: userData.role });
      return true;
    }
    
    if (!isSupabaseConfigured) {
      console.log('📦 Modo offline: usando localStorage');
      // Modo offline - usar localStorage
      // (Login de suporte já foi verificado acima)
      
      const mockUsers = JSON.parse(localStorage.getItem('nutraelite_users') || '[]');
      const foundUser = mockUsers.find((u: any) => u.email === email && u.password === password);
      
      if (foundUser || (email && password)) {
        const isSupport = isSupportEmail(email);
        const userData: User = foundUser ? {
          id: foundUser.id,
          name: foundUser.name,
          email: foundUser.email,
          avatar: foundUser.avatar,
          level: foundUser.level || 'Iniciante',
          points: foundUser.points || 0,
          plan: foundUser.plan || 'bronze',
          role: foundUser.role || (isSupport ? 'support' : 'user'),
        } : {
          id: Date.now().toString(),
          name: email.split('@')[0],
          email: email,
          avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(email.split('@')[0])}&background=random`,
          level: 'Iniciante',
          points: 0,
          plan: 'bronze',
          role: isSupport ? 'support' : 'user',
        };
        
        const token = `token_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        // Usar persistAuthData para garantir consistência
        persistAuthData(userData);
        // Também salvar com token para compatibilidade
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ user: userData, token, timestamp: Date.now() }));
        setUser(userData);
        console.log('✅ Login offline realizado e salvo no localStorage', { role: userData.role });
        return true;
      }
      console.log('❌ Login offline falhou');
      return false;
    }

    try {
      console.log('🌐 Tentando login no Supabase...');
      
      // Timeout reduzido para 5 segundos - se demorar, usar modo offline
      const signInPromise = supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('TIMEOUT_SUPABASE')), 5000)
      );
      
      let supabaseResult: any;
      try {
        supabaseResult = await Promise.race([signInPromise, timeoutPromise]);
      } catch (timeoutError: any) {
        // Se der timeout, usar modo offline automaticamente
        if (timeoutError?.message === 'TIMEOUT_SUPABASE') {
          console.warn('⚠️ Supabase demorou muito, usando modo offline para login');
          // Fallback para modo offline
          
          // Verificar se é login de suporte primeiro
          if (isSupportLogin(email, password)) {
            const userData: User = {
              id: 'support_user',
              name: 'Suporte NutraElite',
              email: SUPPORT_CREDENTIALS.email,
              avatar: 'https://ui-avatars.com/api/?name=Suporte&background=FF6B35&color=fff',
              level: 'Suporte',
              points: 0,
              plan: 'support',
              role: 'support',
            };
            
            const token = `token_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            localStorage.setItem(STORAGE_KEY, JSON.stringify({ user: userData, token, timestamp: Date.now() }));
            setUser(userData);
            console.log('✅ Login de suporte realizado (Supabase timeout)', { role: userData.role });
            return true;
          }
          
          const mockUsers = JSON.parse(localStorage.getItem('nutraelite_users') || '[]');
          const foundUser = mockUsers.find((u: any) => u.email === email && u.password === password);
          
          if (foundUser || (email && password)) {
            const isSupport = isSupportEmail(email);
            const userData: User = foundUser ? {
              id: foundUser.id,
              name: foundUser.name,
              email: foundUser.email,
              avatar: foundUser.avatar,
              level: foundUser.level || 'Iniciante',
              points: foundUser.points || 0,
              plan: foundUser.plan || 'bronze',
              role: foundUser.role || (isSupport ? 'support' : 'user'),
            } : {
              id: Date.now().toString(),
              name: email.split('@')[0],
              email: email,
              avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(email.split('@')[0])}&background=random`,
              level: 'Iniciante',
              points: 0,
              plan: 'bronze',
              role: isSupport ? 'support' : 'user',
            };
            
            const token = `token_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            localStorage.setItem(STORAGE_KEY, JSON.stringify({ user: userData, token, timestamp: Date.now() }));
            setUser(userData);
            console.log('✅ Login realizado em modo offline (Supabase não respondeu)', { role: userData.role });
            return true;
          }
          throw new Error('Email ou senha incorretos. Tente novamente.');
        }
        throw timeoutError;
      }
      
      const { data, error } = supabaseResult;

      if (error) {
        console.error('❌ Erro ao fazer login no Supabase:', error.message || error);
        
        // Se for login de suporte e der erro no Supabase, usar modo offline
        if (isSupportLogin(email, password)) {
          console.log('✅ Login de suporte detectado após erro Supabase, usando modo offline');
          const userData: User = {
            id: 'support_user',
            name: 'Suporte NutraElite',
            email: SUPPORT_CREDENTIALS.email,
            avatar: 'https://ui-avatars.com/api/?name=Suporte&background=FF6B35&color=fff',
            level: 'Suporte',
            points: 0,
            plan: 'support',
            role: 'support',
          };
          
          const token = `token_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          localStorage.setItem(STORAGE_KEY, JSON.stringify({ user: userData, token, timestamp: Date.now() }));
          setUser(userData);
          persistAuthData(userData);
          console.log('✅ Login de suporte realizado (erro Supabase)', { role: userData.role });
          return true;
        }
        
        // Se for erro de API key inválida, usar modo offline automaticamente
        if (isInvalidApiKeyError(error)) {
          markApiKeyAsInvalid();
          console.warn('⚠️ API key inválida detectada, usando modo offline para login');
          // Fallback para modo offline
          
          // Verificar se é login de suporte primeiro
          if (isSupportLogin(email, password)) {
            const userData: User = {
              id: 'support_user',
              name: 'Suporte NutraElite',
              email: SUPPORT_CREDENTIALS.email,
              avatar: 'https://ui-avatars.com/api/?name=Suporte&background=FF6B35&color=fff',
              level: 'Suporte',
              points: 0,
              plan: 'support',
              role: 'support',
            };
            
            const token = `token_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            localStorage.setItem(STORAGE_KEY, JSON.stringify({ user: userData, token, timestamp: Date.now() }));
            setUser(userData);
            console.log('✅ Login de suporte realizado (API key inválida)', { role: userData.role });
            return true;
          }
          
          const mockUsers = JSON.parse(localStorage.getItem('nutraelite_users') || '[]');
          const foundUser = mockUsers.find((u: any) => u.email === email && u.password === password);
          
          if (foundUser || (email && password)) {
            const isSupport = isSupportEmail(email);
            const userData: User = foundUser ? {
              id: foundUser.id,
              name: foundUser.name,
              email: foundUser.email,
              avatar: foundUser.avatar,
              level: foundUser.level || 'Iniciante',
              points: foundUser.points || 0,
              plan: foundUser.plan || 'bronze',
              role: foundUser.role || (isSupport ? 'support' : 'user'),
            } : {
              id: Date.now().toString(),
              name: email.split('@')[0],
              email: email,
              avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(email.split('@')[0])}&background=random`,
              level: 'Iniciante',
              points: 0,
              plan: 'bronze',
              role: isSupport ? 'support' : 'user',
            };
            
            const token = `token_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            localStorage.setItem(STORAGE_KEY, JSON.stringify({ user: userData, token, timestamp: Date.now() }));
            setUser(userData);
            console.log('✅ Login realizado em modo offline (API key inválida)', { role: userData.role });
            return true;
          }
          throw new Error('Email ou senha incorretos. Tente novamente.');
        }
        
        // Verificar se é erro de email não confirmado
        if (error.message?.includes('email_not_confirmed') || error.message?.includes('Email not confirmed')) {
          throw new Error('Por favor, confirme seu email antes de fazer login. Verifique sua caixa de entrada.');
        }
        // Verificar se é erro de credenciais
        if (error.message?.includes('Invalid login credentials') || error.message?.includes('invalid_credentials')) {
          throw new Error('Email ou senha incorretos. Tente novamente.');
        }
        throw new Error(error.message || 'Erro ao fazer login. Tente novamente.');
      }

      if (data?.user) {
        console.log('✅ Login no Supabase bem-sucedido, carregando dados...', data.user.id);
        
        // Verificar se é login de suporte
        const isSupport = isSupportLogin(email, password);
        
        // Tentar carregar perfil - se não existir, criar automaticamente
        let profileLoaded = false;
        let loadedProfile: User | null = null;
        
        try {
          const profileResult = await Promise.race([
            loadProfile(data.user.id),
            new Promise<User | null>((_, reject) => setTimeout(() => reject(new Error('Timeout loadProfile')), 5000))
          ]) as User | null;
          
          if (profileResult) {
            profileLoaded = true;
            loadedProfile = profileResult;
            // Se for suporte, garantir que o role está correto
            if (isSupport && loadedProfile.role !== 'support') {
              loadedProfile.role = 'support';
            }
            console.log('✅ Perfil carregado com sucesso');
          } else {
            console.log('ℹ️ Perfil não encontrado, será criado');
          }
        } catch (err: any) {
          console.warn('⚠️ Erro ao carregar perfil:', err?.message || err);
          // Continuar para criar perfil
        }
        
        // Se perfil não foi carregado, criar automaticamente
        if (!profileLoaded) {
          console.log('🔨 Criando perfil automaticamente...');
          try {
            const userName = isSupport 
              ? 'Suporte NutraElite' 
              : (data.user.user_metadata?.name || email.split('@')[0]);
            const userEmail = data.user.email || email;
            
            const { data: newProfile, error: insertError } = await supabase
              .from('profiles')
              .insert({
                id: data.user.id,
                name: userName,
                email: userEmail,
                avatar: isSupport 
                  ? 'https://ui-avatars.com/api/?name=Suporte&background=FF6B35&color=fff'
                  : (data.user.user_metadata?.avatar || null),
                level: isSupport ? 'Suporte' : 'Bronze',
                points: 0,
                plan: isSupport ? 'support' : 'bronze',
                role: isSupport ? 'support' : 'user',
              })
              .select()
              .single();

            if (insertError) {
              // Se já existe (duplicate), tentar carregar novamente
              if (insertError.code === '23505' || insertError.message?.includes('duplicate')) {
                console.log('ℹ️ Perfil já existe, carregando...');
                const retryProfile = await loadProfile(data.user.id);
                if (retryProfile) {
                  profileLoaded = true;
                  loadedProfile = retryProfile;
                }
              } else {
                console.error('❌ Erro ao criar perfil:', insertError);
              }
            } else if (newProfile) {
              console.log('✅ Perfil criado com sucesso');
              const userData: User = {
                id: newProfile.id,
                name: newProfile.name,
                email: newProfile.email,
                avatar: newProfile.avatar || undefined,
                level: newProfile.level || 'Bronze',
                points: newProfile.points || 0,
                plan: newProfile.plan || 'bronze',
                role: isSupport ? 'support' : (newProfile.role || 'user'),
              };
              setUser(userData);
              persistAuthData(userData);
              profileLoaded = true;
              loadedProfile = userData;
            }
          } catch (createErr: any) {
            console.error('❌ Erro ao criar perfil:', createErr?.message || createErr);
          }
        }
        
        // Se ainda não conseguiu carregar/criar perfil, usar dados básicos
        if (!profileLoaded || !loadedProfile) {
          console.log('⚠️ Usando dados básicos do usuário (perfil não disponível)');
          const basicUser: User = {
            id: data.user.id,
            name: isSupport 
              ? 'Suporte NutraElite' 
              : (data.user.user_metadata?.name || email.split('@')[0]),
            email: data.user.email || email,
            avatar: isSupport
              ? 'https://ui-avatars.com/api/?name=Suporte&background=FF6B35&color=fff'
              : (data.user.user_metadata?.avatar || undefined),
            level: isSupport ? 'Suporte' : 'Bronze',
            points: 0,
            plan: isSupport ? 'support' : 'bronze',
            role: isSupport ? 'support' : 'user',
          };
          setUser(basicUser);
          persistAuthData(basicUser);
          return true;
        }
        
        // Usar perfil carregado (garantir role de suporte se necessário)
        if (loadedProfile) {
          if (isSupport && loadedProfile.role !== 'support') {
            loadedProfile.role = 'support';
          }
          setUser(loadedProfile);
          persistAuthData(loadedProfile);
          return true;
        }
        
        // Carregar stats e achievements (não críticos)
        try {
          await Promise.all([
            Promise.race([
              loadStats(data.user.id),
              new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout loadStats')), 5000))
            ]).catch(err => console.warn('⚠️ Erro ao carregar stats (não crítico):', err)),
            Promise.race([
              loadAchievements(data.user.id),
              new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout loadAchievements')), 5000))
            ]).catch(err => console.warn('⚠️ Erro ao carregar conquistas (não crítico):', err)),
          ]);
        } catch (err) {
          console.warn('⚠️ Erro ao carregar stats/conquistas (não crítico):', err);
        }
        
        console.log('✅ Login completo');
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
    console.log('📝 AuthContext.register chamado', { name, email, isSupabaseConfigured });
    
    if (!isSupabaseConfigured) {
      console.log('📦 Modo offline: usando localStorage');
      // Modo offline - usar localStorage
      const mockUsers = JSON.parse(localStorage.getItem('nutraelite_users') || '[]');
      const emailExists = mockUsers.some((u: any) => u.email === email);
      
      if (emailExists) {
        console.log('❌ Email já cadastrado no modo offline');
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
      console.log('✅ Cadastro offline realizado');
      return true;
    }

    try {
      console.log('🌐 Tentando cadastro no Supabase...');
      
      // Timeout reduzido para 5 segundos - se demorar, usar modo offline
      const signUpPromise = supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
          },
        },
      });
      
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('TIMEOUT_SUPABASE')), 5000)
      );
      
      let supabaseResult: any;
      try {
        supabaseResult = await Promise.race([signUpPromise, timeoutPromise]);
      } catch (timeoutError: any) {
        // Se der timeout, usar modo offline automaticamente
        if (timeoutError?.message === 'TIMEOUT_SUPABASE') {
          console.warn('⚠️ Supabase demorou muito, usando modo offline para cadastro');
          // Fallback para modo offline
          const mockUsers = JSON.parse(localStorage.getItem('nutraelite_users') || '[]');
          const emailExists = mockUsers.some((u: any) => u.email === email);
          
          if (emailExists) {
            throw new Error('Este email já está cadastrado. Tente fazer login.');
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
          console.log('✅ Cadastro realizado em modo offline (Supabase não respondeu)');
          return true;
        }
        throw timeoutError;
      }
      
      const { data, error } = supabaseResult;

      if (error) {
        console.error('❌ Erro ao cadastrar:', error.message || error);
        
        // Se for erro de API key inválida, usar modo offline automaticamente
        if (isInvalidApiKeyError(error)) {
          markApiKeyAsInvalid();
          console.warn('⚠️ API key inválida detectada, usando modo offline para cadastro');
          // Fallback para modo offline
          const mockUsers = JSON.parse(localStorage.getItem('nutraelite_users') || '[]');
          const emailExists = mockUsers.some((u: any) => u.email === email);
          
          if (emailExists) {
            throw new Error('Este email já está cadastrado. Tente fazer login.');
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
          console.log('✅ Cadastro realizado em modo offline (API key inválida)');
          return true;
        }
        
        // Verificar se é erro de email já cadastrado
        if (error.message?.includes('already registered') || error.message?.includes('User already registered')) {
          throw new Error('Este email já está cadastrado. Tente fazer login.');
        }
        throw new Error(error.message || 'Erro ao cadastrar. Tente novamente.');
      }

      if (data?.user) {
        console.log('✅ Cadastro no Supabase bem-sucedido, aguardando criação de perfil...', data.user.id);
        
        // Aguardar um pouco para o trigger criar o perfil
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Tentar carregar perfil - se não existir, criar
        let profileLoaded = false;
        try {
          const profile = await loadProfile(data.user.id);
          if (profile) {
            profileLoaded = true;
            console.log('✅ Perfil carregado após cadastro');
          }
        } catch (err) {
          console.warn('⚠️ Erro ao carregar perfil após cadastro:', err);
        }
        
        // Se perfil não foi carregado, criar manualmente
        if (!profileLoaded) {
          console.log('🔨 Criando perfil manualmente após cadastro...');
          try {
            const { error: insertError } = await supabase
              .from('profiles')
              .insert({
                id: data.user.id,
                name: name,
                email: email,
                avatar: null,
                level: 'Bronze',
                points: 0,
                plan: 'bronze',
              });

            if (insertError && !insertError.message?.includes('duplicate')) {
              console.error('❌ Erro ao criar perfil:', insertError);
            } else {
              console.log('✅ Perfil criado manualmente');
              await loadProfile(data.user.id);
            }
          } catch (createErr) {
            console.error('❌ Erro ao criar perfil manualmente:', createErr);
            // Usar dados básicos mesmo assim
            const basicUser: User = {
              id: data.user.id,
              name: name,
              email: email,
              level: 'Bronze',
              points: 0,
              plan: 'bronze',
            };
            setUser(basicUser);
            persistAuthData(basicUser);
          }
        }
        
        // Carregar stats e achievements (não críticos)
        try {
          await Promise.all([
            loadStats(data.user.id).catch(err => console.warn('⚠️ Erro ao carregar stats (não crítico):', err)),
            loadAchievements(data.user.id).catch(err => console.warn('⚠️ Erro ao carregar conquistas (não crítico):', err)),
          ]);
        } catch (err) {
          console.warn('⚠️ Erro ao carregar stats/conquistas (não crítico):', err);
        }
        
        console.log('✅ Cadastro completo');
        return true;
      }

      console.log('❌ Cadastro falhou: nenhum usuário retornado');
      return false;
    } catch (error: any) {
      console.error('❌ Erro ao cadastrar:', error?.message || error);
      throw error; // Re-throw para a página mostrar a mensagem
    }
  };

  const logout = async () => {
    console.log('🚪 Iniciando logout...');
    
    try {
      // Limpar estado PRIMEIRO (para atualizar UI imediatamente)
      setUser(null);
      setStats({ postsCount: 0, likesReceived: 0, prizesRedeemed: 0 });
      setAchievements(ACHIEVEMENTS.map(a => ({ ...a, progress: a.target ? 0 : undefined })));
      
      // Limpar dados do Supabase (se configurado)
      if (isSupabaseConfigured) {
        try {
          await supabase.auth.signOut();
          console.log('✅ Logout do Supabase realizado');
        } catch (error) {
          console.warn('⚠️ Erro ao fazer logout do Supabase (continuando):', error);
        }
      }
      
      // Limpar localStorage COMPLETAMENTE
      try {
        localStorage.removeItem(STORAGE_KEY);
        localStorage.removeItem(STATS_KEY);
        localStorage.removeItem(ACHIEVEMENTS_KEY);
        localStorage.removeItem('nutraelite_users');
        localStorage.removeItem('nutraelite_community_messages');
        localStorage.removeItem('nutraelite_posts');
        localStorage.removeItem('nutraelite_support_messages');
        console.log('✅ Todos os dados do localStorage removidos');
      } catch (error) {
        console.warn('⚠️ Erro ao limpar localStorage:', error);
        // Tentar limpar item por item
        try {
          localStorage.clear();
          console.log('✅ localStorage limpo completamente');
        } catch (clearError) {
          console.error('❌ Erro ao limpar localStorage completamente:', clearError);
        }
      }
      
      // Garantir que persistAuthData também limpe
      persistAuthData(null);
      
      console.log('✅ Logout concluído - todos os dados foram limpos');
    } catch (error) {
      console.error('❌ Erro durante logout:', error);
      // Mesmo com erro, limpar TUDO
      setUser(null);
      setStats({ postsCount: 0, likesReceived: 0, prizesRedeemed: 0 });
      setAchievements(ACHIEVEMENTS.map(a => ({ ...a, progress: a.target ? 0 : undefined })));
      
      // Tentar limpar localStorage mesmo com erro
      try {
        localStorage.removeItem(STORAGE_KEY);
        localStorage.removeItem(STATS_KEY);
        localStorage.removeItem(ACHIEVEMENTS_KEY);
      } catch (e) {
        // Ignorar
      }
      
      persistAuthData(null);
      throw error;
    }
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
    
    // Atualizar estado local IMEDIATAMENTE
    const updatedUser: User = {
      ...user,
      ...(data.name !== undefined && { name: data.name }),
      ...(data.avatar !== undefined && { avatar: data.avatar || undefined }),
    };
    
    // CRÍTICO: Atualizar estado ANTES de salvar
    setUser(updatedUser);
    
    // Salvar no localStorage - SIMPLES E DIRETO
    try {
      const dataToSave = {
        user: {
          id: updatedUser.id,
          name: updatedUser.name,
          email: updatedUser.email,
          avatar: updatedUser.avatar || null, // Salvar null se não houver avatar
          level: updatedUser.level || 'Bronze',
          points: updatedUser.points || 0,
          plan: updatedUser.plan || 'bronze',
          role: updatedUser.role || undefined,
        },
        timestamp: Date.now(),
      };
      
      // Salvar diretamente
      localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave));
      
      // Também usar a função helper
      persistAuthData(updatedUser);
      
      // Salvar mais uma vez para garantir (mobile pode ter problemas de sincronização)
      setTimeout(() => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave));
      }, 50);
      
      // Disparar evento para notificar que foi salvo
      window.dispatchEvent(new CustomEvent('profile-saved', {
        detail: { name: updatedUser.name, avatar: updatedUser.avatar, success: true }
      }));
      
    } catch (error) {
      console.error('Erro ao salvar perfil:', error);
      // Tentar salvar de forma mais simples
      try {
        persistAuthData(updatedUser);
      } catch (retryError) {
        console.error('Erro ao tentar salvar novamente:', retryError);
        throw new Error('Não foi possível salvar o perfil. Verifique se há espaço suficiente no dispositivo.');
      }
    }
    
    // Atualizar posts existentes no localStorage com o novo perfil
    try {
      const savedPosts = localStorage.getItem('nutraelite_posts');
      if (savedPosts) {
        const parsed = JSON.parse(savedPosts);
        const updatedPosts = parsed.map((post: any) => {
          // Se o post é do usuário atual, atualizar o autor
          if (post.author?.id === user.id) {
            return {
              ...post,
              author: {
                ...post.author,
                ...(data.name !== undefined && { name: data.name }),
                ...(data.avatar !== undefined && { avatar: data.avatar || undefined }),
              },
            };
          }
          // Atualizar comentários do usuário também
          if (post.commentsList) {
            post.commentsList = post.commentsList.map((comment: any) => {
              if (comment.author?.id === user.id) {
                return {
                  ...comment,
                  author: {
                    ...comment.author,
                    ...(data.name !== undefined && { name: data.name }),
                    ...(data.avatar !== undefined && { avatar: data.avatar || undefined }),
                  },
                };
              }
              return comment;
            });
          }
          return post;
        });
        localStorage.setItem('nutraelite_posts', JSON.stringify(updatedPosts));
        console.log('✅ Posts atualizados com novo perfil');
      }
    } catch (error) {
      console.error('Erro ao atualizar posts com novo perfil:', error);
    }
    
    // Atualizar mensagens existentes no localStorage com o novo perfil
    try {
      const savedMessages = localStorage.getItem('nutraelite_community_messages');
      if (savedMessages) {
        const parsed = JSON.parse(savedMessages);
        const updatedMessages = parsed.map((msg: any) => {
          // Se a mensagem é do usuário atual, atualizar o autor
          if (msg.author?.id === user.id) {
            return {
              ...msg,
              author: {
                ...msg.author,
                ...(data.name !== undefined && { name: data.name }),
                ...(data.avatar !== undefined && { avatar: data.avatar || undefined }),
              },
            };
          }
          return msg;
        });
        localStorage.setItem('nutraelite_community_messages', JSON.stringify(updatedMessages));
        console.log('✅ Mensagens atualizadas com novo perfil');
      }
    } catch (error) {
      console.error('Erro ao atualizar mensagens com novo perfil:', error);
    }
    
    // Disparar evento para atualizar os hooks
    window.dispatchEvent(new CustomEvent('profile-updated', {
      detail: updatedUser
    }));
    
    // Tentar sincronizar com Supabase em background (não bloqueia)
    if (isSupabaseConfigured) {
      (async () => {
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

          if (error) {
            console.warn('⚠️ Erro ao sincronizar perfil com Supabase (não crítico):', error);
            return;
          }

          console.log('✅ Perfil sincronizado com Supabase');
          // Recarregar perfil atualizado do Supabase
          await loadProfile(user.id);
        } catch (error) {
          console.warn('⚠️ Erro ao sincronizar perfil com Supabase (não crítico):', error);
          // Não é crítico - já está salvo no localStorage
        }
      })();
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

