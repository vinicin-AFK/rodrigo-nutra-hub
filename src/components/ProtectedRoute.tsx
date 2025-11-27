import { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading } = useAuth();
  const [forceTimeout, setForceTimeout] = useState(false);
  const [hasLocalAuth, setHasLocalAuth] = useState<boolean | null>(null);

  // Verificar localStorage diretamente para sessão persistida
  useEffect(() => {
    const checkLocalAuth = () => {
      try {
        const savedAuth = localStorage.getItem('nutraelite_auth');
        if (savedAuth) {
          const authData = JSON.parse(savedAuth);
          if (authData?.user) {
            setHasLocalAuth(true);
            console.log('✅ ProtectedRoute: Sessão encontrada no localStorage');
            return;
          }
        }
        setHasLocalAuth(false);
      } catch (error) {
        console.error('Erro ao verificar localStorage:', error);
        setHasLocalAuth(false);
      }
    };

    checkLocalAuth();
  }, []);

  // Timeout de segurança - para o loading após 5 segundos (reduzido)
  useEffect(() => {
    if (isLoading) {
      const timeout = setTimeout(() => {
        console.warn('⚠️ ProtectedRoute: Timeout no loading, forçando parada');
        setForceTimeout(true);
      }, 5000);

      return () => clearTimeout(timeout);
    } else {
      setForceTimeout(false);
    }
  }, [isLoading]);

  // Se há sessão no localStorage, permitir acesso mesmo durante loading
  if (isLoading && !forceTimeout && hasLocalAuth === true) {
    // Há sessão salva, permitir acesso enquanto carrega
    console.log('✅ ProtectedRoute: Permitindo acesso com sessão local durante loading');
    return <>{children}</>;
  }

  // Se passou do timeout, permitir acesso mesmo sem autenticação (modo offline)
  if (isLoading && !forceTimeout && hasLocalAuth !== true) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
          <p className="mt-4 text-muted-foreground">Carregando...</p>
          <p className="mt-2 text-xs text-muted-foreground">Se demorar, tente recarregar a página</p>
        </div>
      </div>
    );
  }

  // Se não está autenticado e não há sessão local, redirecionar para login
  if (!isAuthenticated && !forceTimeout && hasLocalAuth !== true) {
    return <Navigate to="/login" replace />;
  }

  // Se for timeout ou há sessão local, permitir acesso
  if ((forceTimeout || hasLocalAuth === true) && !isAuthenticated) {
    console.warn('⚠️ ProtectedRoute: Permitindo acesso com sessão local ou timeout');
  }

  return <>{children}</>;
}

