import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

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
  login: (email: string, password: string) => Promise<boolean>;
  register: (name: string, email: string, password: string) => Promise<boolean>;
  logout: () => void;
  addPoints: (points: number) => void;
  updateProfile: (data: { name?: string; avatar?: string }) => Promise<void>;
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

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

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
    if (!user) return;
    
    const updatedUser: User = {
      ...user,
      ...(data.name && { name: data.name }),
      ...(data.avatar && { avatar: data.avatar }),
    };
    
    setUser(updatedUser);
    
    // Salvar no localStorage
    const savedAuth = localStorage.getItem(STORAGE_KEY);
    if (savedAuth) {
      try {
        const authData = JSON.parse(savedAuth);
        authData.user = updatedUser;
        localStorage.setItem(STORAGE_KEY, JSON.stringify(authData));
        
        // Atualizar também na lista de usuários
        const mockUsers = JSON.parse(localStorage.getItem('nutraelite_users') || '[]');
        const userIndex = mockUsers.findIndex((u: any) => u.id === user.id);
        if (userIndex !== -1) {
          mockUsers[userIndex] = { ...mockUsers[userIndex], ...updatedUser };
          localStorage.setItem('nutraelite_users', JSON.stringify(mockUsers));
        }
      } catch (error) {
        console.error('Erro ao atualizar perfil:', error);
        throw error;
      }
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        userPoints,
        userPlan,
        nextPlan,
        login,
        register,
        logout,
        addPoints,
        updateProfile,
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

