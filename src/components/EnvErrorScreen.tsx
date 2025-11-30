/**
 * ⚠️ Tela de Erro de Configuração do Supabase
 * 
 * Exibida quando o Supabase está configurado incorretamente
 * Bloqueia o app completamente até que a configuração seja corrigida
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle, Copy, RefreshCw } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface EnvErrorScreenProps {
  error: {
    type: 'missing_url' | 'missing_key' | 'wrong_url' | 'invalid_key' | 'local_url';
    message: string;
    currentUrl?: string;
    currentKey?: string;
  };
}

const CORRECT_URL = 'https://kfyzcqaerlwqcmlbcgts.supabase.co';

export default function EnvErrorScreen({ error }: EnvErrorScreenProps) {
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: '✅ Copiado!',
      description: 'Texto copiado para a área de transferência',
    });
  };

  const getErrorTitle = () => {
    switch (error.type) {
      case 'missing_url':
        return 'URL do Supabase não configurada';
      case 'missing_key':
        return 'Chave do Supabase não configurada';
      case 'wrong_url':
        return 'URL do Supabase incorreta';
      case 'invalid_key':
        return 'Chave do Supabase inválida';
      case 'local_url':
        return 'URL local detectada (não permitida)';
      default:
        return 'Erro de configuração do Supabase';
    }
  };

  const getInstructions = () => {
    switch (error.type) {
      case 'missing_url':
      case 'wrong_url':
      case 'local_url':
        return (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              A URL do Supabase está incorreta ou não foi configurada. Use APENAS a URL pública:
            </p>
            <div className="bg-muted p-3 rounded-md font-mono text-sm flex items-center justify-between">
              <span>{CORRECT_URL}</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => copyToClipboard(CORRECT_URL)}
              >
                <Copy className="h-4 w-4 mr-2" />
                Copiar
              </Button>
            </div>
            {error.currentUrl && (
              <div className="bg-destructive/10 p-3 rounded-md">
                <p className="text-sm font-semibold text-destructive mb-1">URL atual (incorreta):</p>
                <p className="text-xs font-mono text-muted-foreground">{error.currentUrl}</p>
              </div>
            )}
          </div>
        );
      case 'missing_key':
      case 'invalid_key':
        return (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              A chave do Supabase está ausente ou inválida. Configure no arquivo .env.local:
            </p>
            <div className="bg-muted p-3 rounded-md font-mono text-sm">
              <p>VITE_SUPABASE_ANON_KEY=sua_chave_aqui</p>
            </div>
            {error.currentKey && (
              <div className="bg-destructive/10 p-3 rounded-md">
                <p className="text-sm font-semibold text-destructive mb-1">Chave atual (inválida):</p>
                <p className="text-xs font-mono text-muted-foreground">
                  {error.currentKey.length > 0 ? error.currentKey.slice(0, 20) + '...' : '(vazia)'}
                </p>
              </div>
            )}
          </div>
        );
      default:
        return <p className="text-sm text-muted-foreground">{error.message}</p>;
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <div className="flex items-center gap-3">
            <AlertCircle className="h-8 w-8 text-destructive" />
            <div>
              <CardTitle className="text-2xl text-destructive">
                {getErrorTitle()}
              </CardTitle>
              <CardDescription className="mt-2">
                O app não pode iniciar devido a uma configuração incorreta do Supabase
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
            <p className="text-sm font-semibold text-destructive mb-2">Erro:</p>
            <p className="text-sm text-muted-foreground">{error.message}</p>
          </div>

          <div>
            <h3 className="font-semibold mb-3">Como corrigir:</h3>
            {getInstructions()}
          </div>

          <div className="bg-muted rounded-lg p-4 space-y-2">
            <h4 className="font-semibold text-sm">Para desenvolvedores:</h4>
            <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
              <li>Edite o arquivo <code className="bg-background px-1 rounded">.env.local</code> na raiz do projeto</li>
              <li>Configure as variáveis corretas (veja acima)</li>
              <li>Reinicie o servidor de desenvolvimento</li>
              <li>Para APK: Reconstrua o APK após corrigir o .env.local</li>
            </ol>
          </div>

          <div className="flex gap-3">
            <Button
              variant="default"
              onClick={() => window.location.reload()}
              className="flex-1"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Tentar Novamente
            </Button>
            <Button
              variant="outline"
              onClick={() => copyToClipboard(`VITE_SUPABASE_URL=${CORRECT_URL}\nVITE_SUPABASE_ANON_KEY=sua_chave_aqui`)}
            >
              <Copy className="h-4 w-4 mr-2" />
              Copiar Config
            </Button>
          </div>

          <div className="text-xs text-muted-foreground text-center pt-4 border-t">
            <p>Este erro impede que o app funcione com um Supabase incorreto.</p>
            <p>Corrija a configuração e recarregue a página.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

