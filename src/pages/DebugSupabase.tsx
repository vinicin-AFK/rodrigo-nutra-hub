/**
 * 🔍 Página de Debug do Supabase
 * 
 * Acesse: /debug/supabase
 * 
 * Mostra:
 * - URL do Supabase configurada
 * - 5 últimos posts
 * - 5 últimas mensagens do chat
 * - Status da conexão
 */

import { useEffect, useState } from 'react';
import { supabase, isSupabaseConfigured, validateSupabaseEnv } from '@/lib/supabaseClient';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertCircle, CheckCircle2 } from 'lucide-react';

interface DebugInfo {
  supabaseUrl: string;
  supabaseKey: string;
  isConfigured: boolean;
  connectionStatus: 'connected' | 'error' | 'checking';
  lastPosts: any[];
  lastMessages: any[];
  error?: string;
  validation: {
    isValid: boolean;
    errors: string[];
  };
  urlMatches: boolean;
}

export default function DebugSupabase() {
  const [debugInfo, setDebugInfo] = useState<DebugInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadDebugInfo();
  }, []);

  const loadDebugInfo = async () => {
    setIsLoading(true);
    
    try {
      const SUPABASE_URL_REQUIRED = 'https://kfyzcqaerlwqcmlbcgts.supabase.co';
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'NÃO CONFIGURADO';
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY 
        ? import.meta.env.VITE_SUPABASE_ANON_KEY.slice(0, 20) + '...' 
        : 'NÃO CONFIGURADO';
      
      // Validar configuração
      const validation = validateSupabaseEnv();
      const urlMatches = supabaseUrl === SUPABASE_URL_REQUIRED;

      let connectionStatus: 'connected' | 'error' | 'checking' = 'checking';
      let lastPosts: any[] = [];
      let lastMessages: any[] = [];
      let error: string | undefined;

      if (isSupabaseConfigured) {
        try {
          // Testar conexão buscando posts
          const { data: postsData, error: postsError } = await supabase
            .from('posts')
            .select('id, content, created_at, author_id')
            .order('created_at', { ascending: false })
            .limit(5);

          if (postsError) {
            connectionStatus = 'error';
            error = `Erro ao buscar posts: ${postsError.message}`;
          } else {
            lastPosts = postsData || [];
            connectionStatus = 'connected';
          }

          // Buscar mensagens
          const { data: messagesData, error: messagesError } = await supabase
            .from('community_messages')
            .select('id, content, created_at, author_id')
            .order('created_at', { ascending: false })
            .limit(5);

          if (messagesError) {
            if (!error) {
              connectionStatus = 'error';
              error = `Erro ao buscar mensagens: ${messagesError.message}`;
            }
          } else {
            lastMessages = messagesData || [];
          }
        } catch (err: any) {
          connectionStatus = 'error';
          error = err?.message || 'Erro desconhecido';
        }
      } else {
        connectionStatus = 'error';
        error = 'Supabase não configurado';
      }

      setDebugInfo({
        supabaseUrl,
        supabaseKey,
        isConfigured: isSupabaseConfigured,
        connectionStatus,
        lastPosts,
        lastMessages,
        error,
        validation: {
          isValid: !validation.hasError,
          errors: validation.hasError ? [validation.message] : [],
        },
        urlMatches,
      });
    } catch (err: any) {
      const validation = validateSupabaseEnv();
      setDebugInfo({
        supabaseUrl: 'ERRO',
        supabaseKey: 'ERRO',
        isConfigured: false,
        connectionStatus: 'error',
        lastPosts: [],
        lastMessages: [],
        error: err?.message || 'Erro ao carregar informações',
        validation: {
          isValid: false,
          errors: [err?.message || 'Erro desconhecido'],
        },
        urlMatches: false,
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardHeader>
            <CardTitle>🔍 Debug Supabase</CardTitle>
            <CardDescription>Carregando informações...</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (!debugInfo) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardHeader>
            <CardTitle>🔍 Debug Supabase</CardTitle>
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
          <CardTitle>🔍 Debug Supabase</CardTitle>
          <CardDescription>Informações de conexão e sincronização</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-semibold mb-2">Configuração</h3>
            <div className="space-y-2">
              <div>
                <span className="font-mono text-sm">SUPABASE_URL:</span>
                <Badge variant={debugInfo.supabaseUrl.includes('supabase.co') ? 'default' : 'destructive'} className="ml-2">
                  {debugInfo.supabaseUrl}
                </Badge>
              </div>
              <div>
                <span className="font-mono text-sm">SUPABASE_KEY:</span>
                <Badge variant={debugInfo.supabaseKey !== 'NÃO CONFIGURADO' ? 'default' : 'destructive'} className="ml-2">
                  {debugInfo.supabaseKey}
                </Badge>
              </div>
              <div>
                <span className="font-mono text-sm">Configurado:</span>
                <Badge variant={debugInfo.isConfigured ? 'default' : 'destructive'} className="ml-2">
                  {debugInfo.isConfigured ? 'Sim' : 'Não'}
                </Badge>
              </div>
            </div>
          </div>

          <div>
            <h3 className="font-semibold mb-2">Validação de Configuração</h3>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                {debugInfo.validation.isValid ? (
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-red-500" />
                )}
                <Badge variant={debugInfo.validation.isValid ? 'default' : 'destructive'}>
                  {debugInfo.validation.isValid ? '✅ Configuração Válida' : '❌ Configuração Inválida'}
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                {debugInfo.urlMatches ? (
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-red-500" />
                )}
                <Badge variant={debugInfo.urlMatches ? 'default' : 'destructive'}>
                  {debugInfo.urlMatches ? '✅ URL Correta' : '❌ URL Incorreta'}
                </Badge>
              </div>
              {debugInfo.validation.errors.length > 0 && (
                <div className="bg-destructive/10 border border-destructive/20 rounded p-3 mt-2">
                  <p className="text-sm font-semibold text-destructive mb-1">Erros:</p>
                  <ul className="list-disc list-inside text-sm text-muted-foreground">
                    {debugInfo.validation.errors.map((error, idx) => (
                      <li key={idx}>{error}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>

          <div>
            <h3 className="font-semibold mb-2">Status da Conexão</h3>
            <Badge 
              variant={
                debugInfo.connectionStatus === 'connected' ? 'default' : 
                debugInfo.connectionStatus === 'error' ? 'destructive' : 
                'secondary'
              }
            >
              {debugInfo.connectionStatus === 'connected' ? '✅ Conectado' : 
               debugInfo.connectionStatus === 'error' ? '❌ Erro' : 
               '⏳ Verificando...'}
            </Badge>
            {debugInfo.error && (
              <p className="text-sm text-red-500 mt-2">{debugInfo.error}</p>
            )}
          </div>

          <Button onClick={loadDebugInfo} variant="outline">
            🔄 Atualizar
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>📝 Últimos 5 Posts</CardTitle>
          <CardDescription>Posts mais recentes do feed global</CardDescription>
        </CardHeader>
        <CardContent>
          {debugInfo.lastPosts.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum post encontrado</p>
          ) : (
            <div className="space-y-3">
              {debugInfo.lastPosts.map((post) => (
                <div key={post.id} className="border rounded p-3">
                  <div className="text-xs text-muted-foreground mb-1">
                    ID: {post.id} | {new Date(post.created_at).toLocaleString()}
                  </div>
                  <div className="text-sm">{post.content?.substring(0, 100)}...</div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>💬 Últimas 5 Mensagens</CardTitle>
          <CardDescription>Mensagens mais recentes do chat global</CardDescription>
        </CardHeader>
        <CardContent>
          {debugInfo.lastMessages.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhuma mensagem encontrada</p>
          ) : (
            <div className="space-y-3">
              {debugInfo.lastMessages.map((msg) => (
                <div key={msg.id} className="border rounded p-3">
                  <div className="text-xs text-muted-foreground mb-1">
                    ID: {msg.id} | {new Date(msg.created_at).toLocaleString()}
                  </div>
                  <div className="text-sm">{msg.content?.substring(0, 100)}...</div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

