import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  level?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  register: (name: string, email: string, password: string) => Promise<boolean>;
  logout: () => void;
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
          setUser(authData.user);
        }
      } catch (error) {
        console.error('Erro ao carregar sessão:', error);
        localStorage.removeItem(STORAGE_KEY);
      }
    }
    setIsLoading(false);
  }, []);

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
        } : {
          id: Date.now().toString(),
          name: email.split('@')[0],
          email: email,
          avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(email.split('@')[0])}&background=random`,
          level: 'Iniciante',
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

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        logout,
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

