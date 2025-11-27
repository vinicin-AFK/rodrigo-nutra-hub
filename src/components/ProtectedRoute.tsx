import { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading } = useAuth();
  const [forceTimeout, setForceTimeout] = useState(false);

  // Timeout de segurança - para o loading após 8 segundos
  useEffect(() => {
    if (isLoading) {
      const timeout = setTimeout(() => {
        console.warn('⚠️ ProtectedRoute: Timeout no loading, forçando parada');
        setForceTimeout(true);
      }, 8000);

      return () => clearTimeout(timeout);
    } else {
      setForceTimeout(false);
    }
  }, [isLoading]);

  // Se passou do timeout, permitir acesso mesmo sem autenticação (modo offline)
  if (isLoading && !forceTimeout) {
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

  // Se não está autenticado e não é timeout, redirecionar para login
  if (!isAuthenticated && !forceTimeout) {
    return <Navigate to="/login" replace />;
  }

  // Se for timeout, permitir acesso (modo offline)
  if (forceTimeout && !isAuthenticated) {
    console.warn('⚠️ ProtectedRoute: Permitindo acesso em modo offline devido a timeout');
  }

  return <>{children}</>;
}

