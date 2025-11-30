/**
 * 🔐 Página de Status (Apenas para Admins)
 * 
 * Acesse: /status
 * 
 * Mostra informações detalhadas sobre o Supabase:
 * - URL ativa
 * - Última sincronização
 * - Quantidade de posts globais
 * - Quantidade de mensagens do chat global
 */

import { useEffect, useState } from 'react';
import { supabase, isSupabaseConfigured, validateSupabaseEnv } from '@/lib/supabaseClient';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';

interface StatusInfo {
  supabaseUrl: string;
  supabaseKeyPrefix: string;
  lastSync: Date | null;
  totalPosts: number;
  totalMessages: number;
  validation: {
    isValid: boolean;
    urlMatches: boolean;
  };
  connectionStatus: 'connected' | 'error';
}

export default function Status() {
  const { user } = useAuth();
  const [statusInfo, setStatusInfo] = useState<StatusInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Verificar se é admin
  const isAdmin = user?.role === 'admin' || user?.role === 'support';

  useEffect(() => {
    if (isAdmin) {
      loadStatus();
    }
  }, [isAdmin]);

  const loadStatus = async () => {
    setIsLoading(true);
    
    try {
      const SUPABASE_URL_REQUIRED = 'https://kfyzcqaerlwqcmlbcgts.supabase.co';
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'NÃO CONFIGURADO';
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
      const supabaseKeyPrefix = supabaseKey ? supabaseKey.slice(0, 10) + '...' : 'NÃO CONFIGURADO';

      const validation = validateSupabaseEnv();
      const urlMatches = supabaseUrl === SUPABASE_URL_REQUIRED;

      let totalPosts = 0;
      let totalMessages = 0;
      let connectionStatus: 'connected' | 'error' = 'error';
      let lastSync: Date | null = null;

      if (isSupabaseConfigured) {
        try {
          // Contar posts
          const { count: postsCount, error: postsError } = await supabase
            .from('posts')
            .select('*', { count: 'exact', head: true });

          if (!postsError) {
            totalPosts = postsCount || 0;
          }

          // Contar mensagens
          const { count: messagesCount, error: messagesError } = await supabase
            .from('community_messages')
            .select('*', { count: 'exact', head: true });

          if (!messagesError) {
            totalMessages = messagesCount || 0;
          }

          // Buscar último post para saber última sincronização
          const { data: lastPost } = await supabase
            .from('posts')
            .select('created_at')
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

          if (lastPost) {
            lastSync = new Date(lastPost.created_at);
          }

          connectionStatus = 'connected';
        } catch (err) {
          console.error('Erro ao buscar estatísticas:', err);
          connectionStatus = 'error';
        }
      }

      setStatusInfo({
        supabaseUrl,
        supabaseKeyPrefix,
        lastSync,
        totalPosts,
        totalMessages,
        validation: {
          isValid: !validation.hasError,
          urlMatches,
        },
        connectionStatus,
      });
    } catch (err: any) {
      console.error('Erro ao carregar status:', err);
      setStatusInfo({
        supabaseUrl: 'ERRO',
        supabaseKeyPrefix: 'ERRO',
        lastSync: null,
        totalPosts: 0,
        totalMessages: 0,
        validation: {
          isValid: false,
          urlMatches: false,
        },
        connectionStatus: 'error',
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!isAdmin) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardHeader>
            <CardTitle>🔐 Acesso Restrito</CardTitle>
            <CardDescription>Esta página é apenas para administradores</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardHeader>
            <CardTitle>🔐 Status do Sistema</CardTitle>
            <CardDescription>Carregando informações...</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (!statusInfo) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardHeader>
            <CardTitle>🔐 Status do Sistema</CardTitle>
            <CardDescription>Erro ao carregar informações</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>🔐 Status do Sistema (Admin)</CardTitle>
          <CardDescription>Informações detalhadas sobre o Supabase e sincronização</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h3 className="font-semibold mb-3">Configuração do Supabase</h3>
            <div className="space-y-2">
              <div>
                <span className="text-sm text-muted-foreground">URL Ativa:</span>
                <div className="mt-1 font-mono text-sm bg-muted p-2 rounded">
                  {statusInfo.supabaseUrl}
                </div>
              </div>
              <div>
                <span className="text-sm text-muted-foreground">Key Prefix:</span>
                <div className="mt-1 font-mono text-sm bg-muted p-2 rounded">
                  {statusInfo.supabaseKeyPrefix}
                </div>
              </div>
              <div className="flex items-center gap-2 mt-3">
                <Badge variant={statusInfo.validation.isValid ? 'default' : 'destructive'}>
                  {statusInfo.validation.isValid ? '✅ Configuração Válida' : '❌ Configuração Inválida'}
                </Badge>
                <Badge variant={statusInfo.validation.urlMatches ? 'default' : 'destructive'}>
                  {statusInfo.validation.urlMatches ? '✅ URL Correta' : '❌ URL Incorreta'}
                </Badge>
                <Badge variant={statusInfo.connectionStatus === 'connected' ? 'default' : 'destructive'}>
                  {statusInfo.connectionStatus === 'connected' ? '✅ Conectado' : '❌ Erro'}
                </Badge>
              </div>
            </div>
          </div>

          <div>
            <h3 className="font-semibold mb-3">Estatísticas Globais</h3>
            <div className="grid grid-cols-2 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold">{statusInfo.totalPosts}</div>
                  <div className="text-sm text-muted-foreground">Posts Globais</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold">{statusInfo.totalMessages}</div>
                  <div className="text-sm text-muted-foreground">Mensagens do Chat</div>
                </CardContent>
              </Card>
            </div>
          </div>

          <div>
            <h3 className="font-semibold mb-3">Última Sincronização</h3>
            <div className="text-sm text-muted-foreground">
              {statusInfo.lastSync 
                ? statusInfo.lastSync.toLocaleString('pt-BR')
                : 'Nenhuma sincronização registrada'}
            </div>
          </div>

          <Button onClick={loadStatus} variant="outline" className="w-full">
            🔄 Atualizar Status
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

