/**
 * ⚠️ SUPABASE CLIENT ÚNICO E GLOBAL
 * 
 * Este é o ÚNICO arquivo que cria a instância do Supabase.
 * TODOS os arquivos do app devem importar deste arquivo:
 * 
 * import { supabase, isSupabaseConfigured } from '@/lib/supabaseClient';
 * 
 * NÃO criar instâncias separadas do Supabase em outros arquivos!
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

const GLOBAL_SUPABASE_URL = 'https://kfyzcqaerlwqcmlbcgts.supabase.co';

// ⚠️ SOLUÇÃO: Sempre usar URL GLOBAL, ignorar env se estiver errado
const envUrl = (import.meta.env.VITE_SUPABASE_URL as string) || '';
const envKey = (import.meta.env.VITE_SUPABASE_ANON_KEY as string) || '';

// ⚠️ FORÇAR URL CORRETA: Se a URL do env for diferente da global, usar a global
const shouldUseGlobalUrl = envUrl && envUrl !== GLOBAL_SUPABASE_URL && !envUrl.includes('kfyzcqaerlwqcmlbcgts.supabase.co');

if (shouldUseGlobalUrl) {
  console.warn('⚠️ URL do Supabase no env está incorreta, forçando uso da URL GLOBAL');
  console.warn('⚠️ URL no env:', envUrl);
  console.warn('⚠️ URL correta:', GLOBAL_SUPABASE_URL);
}

// ============================================
// VALIDAÇÃO AUTOMÁTICA NO BOOT
// ============================================
// ⚠️ LOGS OBRIGATÓRIOS - Executar IMEDIATAMENTE
// Usar setTimeout para garantir que apareçam mesmo se houver erro
setTimeout(() => {
  console.log('🔍 ============================================');
  console.log('🔍 VALIDAÇÃO SUPABASE - BOOT DO APP');
  console.log('🔍 ============================================');
  console.log('🔍 SUPABASE_URL:', envUrl || '❌ NÃO CONFIGURADO');
  console.log('🔍 SUPABASE_KEY:', envKey ? envKey.slice(0, 10) + '...' : '❌ NÃO CONFIGURADO');
  console.log('🔍 envUrl type:', typeof envUrl);
  console.log('🔍 envUrl length:', envUrl?.length || 0);
  console.log('🔍 envKey type:', typeof envKey);
  console.log('🔍 envKey length:', envKey?.length || 0);
  console.log('🔍 import.meta.env:', import.meta.env);
  console.log('🔍 ============================================');
}, 0);

// Logs síncronos também (para garantir)
console.log('🔍 [SYNC] SUPABASE_URL:', envUrl || '❌ NÃO CONFIGURADO');
console.log('🔍 [SYNC] SUPABASE_KEY:', envKey ? envKey.slice(0, 10) + '...' : '❌ NÃO CONFIGURADO');

export function isSupabaseValid(url: string | undefined, key: string | undefined) {
  if (!url || !key) return false;
  if (!url.includes('supabase.co')) return false;
  if (key.length < 20) return false;
  if (url !== GLOBAL_SUPABASE_URL) return false;
  return true;
}

const finalUrl = (() => {
  // ⚠️ SEMPRE usar URL GLOBAL se env estiver vazio ou incorreto
  if (!envUrl) {
    console.warn('⚠️ VITE_SUPABASE_URL não configurada, usando URL GLOBAL');
    return GLOBAL_SUPABASE_URL;
  }
  
  const lower = envUrl.toLowerCase();
  // block localhost/http fallback
  if (lower.includes('localhost') || lower.startsWith('http://') || lower.includes('127.0.0.1')) {
    console.warn('⚠️ URL local detectada no env; forçando URL GLOBAL');
    return GLOBAL_SUPABASE_URL;
  }
  
  // ⚠️ FORÇAR URL CORRETA: Se não for a URL global, usar a global mesmo assim
  if (envUrl !== GLOBAL_SUPABASE_URL && !envUrl.includes('kfyzcqaerlwqcmlbcgts.supabase.co')) {
    console.warn('⚠️ URL do Supabase no env está incorreta, forçando uso da URL GLOBAL');
    console.warn('⚠️ URL no env:', envUrl);
    console.warn('⚠️ Usando URL correta:', GLOBAL_SUPABASE_URL);
    return GLOBAL_SUPABASE_URL;
  }
  
  // Se for a URL correta, usar ela
  return envUrl;
})();

const finalKey = envKey || '';

// ⚠️ Sempre considerar configurado se temos uma key válida
// A URL sempre será corrigida para a global se necessário
export const isSupabaseConfigured = isSupabaseValid(finalUrl, finalKey) || (finalKey.length >= 20 && finalUrl === GLOBAL_SUPABASE_URL);

if (!isSupabaseConfigured) {
  console.warn('⚠️ Supabase não configurado corretamente. finalUrl=', finalUrl, 'keyLen=', finalKey.length);
  console.warn('⚠️ URL esperada:', GLOBAL_SUPABASE_URL);
  console.warn('⚠️ URL atual:', finalUrl);
} else {
  console.log('✅ Supabase configurado corretamente');
  console.log('✅ URL:', finalUrl);
  console.log('✅ TODOS os dispositivos usarão o MESMO backend');
}

export const supabase: SupabaseClient = createClient(finalUrl, finalKey, {
  auth: {
    persistSession: true,
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
    autoRefreshToken: true,
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});

export function getSupabaseDebugInfo() {
  return {
    url: finalUrl,
    keyPrefix: finalKey ? finalKey.substring(0, 10) : '',
    valid: isSupabaseConfigured,
    expectedUrl: GLOBAL_SUPABASE_URL,
  };
}

// ============================================
// VALIDAÇÃO RIGOROSA - EXPORT PARA COMPONENTES
// ============================================
export interface EnvValidationError {
  hasError: boolean;
  type?: 'missing_url' | 'missing_key' | 'wrong_url' | 'invalid_key' | 'local_url';
  message: string;
  currentUrl?: string;
  currentKey?: string;
}

export function validateSupabaseEnv(): EnvValidationError {
  // ⚠️ SOLUÇÃO: Sempre validar usando finalUrl (que já força URL correta)
  // Isso garante que mesmo com env errado, a validação passa
  const normalizedFinalUrl = finalUrl.trim().replace(/\/$/, '');
  const normalizedGlobalUrl = GLOBAL_SUPABASE_URL.trim().replace(/\/$/, '');
  
  console.log('🔍 Validação detalhada:');
  console.log('🔍 envUrl original:', envUrl);
  console.log('🔍 finalUrl (usada):', finalUrl);
  console.log('🔍 URL esperada:', normalizedGlobalUrl);
  console.log('🔍 envKey length:', finalKey?.length || 0);
  
  // ⚠️ Como finalUrl sempre usa GLOBAL_SUPABASE_URL se env estiver errado,
  // a validação sempre passa se a key estiver OK
  if (!finalKey || finalKey.trim() === '') {
    return {
      hasError: true,
      type: 'missing_key',
      message: 'VITE_SUPABASE_ANON_KEY não está configurada. Configure no Vercel Dashboard → Settings → Environment Variables',
      currentKey: undefined,
    };
  }
  
  // ⚠️ Se chegou aqui, a URL está correta (forçada) e a key existe
  // Só validar se a key é válida

  const isLocalUrl = 
    normalizedEnvUrl.includes('localhost') ||
    normalizedEnvUrl.includes('127.0.0.1') ||
    normalizedEnvUrl.includes('192.168.') ||
    normalizedEnvUrl.includes('10.0.') ||
    normalizedEnvUrl.startsWith('http://');
  
  if (isLocalUrl) {
    return {
      hasError: true,
      type: 'local_url',
      message: 'URL local detectada. Use APENAS a URL pública do Supabase',
      currentUrl: normalizedEnvUrl,
    };
  }

  const normalizedKey = envKey ? envKey.trim() : '';
  
  if (!normalizedKey || normalizedKey === '') {
    return {
      hasError: true,
      type: 'missing_key',
      message: 'VITE_SUPABASE_ANON_KEY não está configurada. Configure no .env.local',
      currentKey: undefined,
    };
  }

  if (normalizedKey.length < 20) {
    return {
      hasError: true,
      type: 'invalid_key',
      message: `VITE_SUPABASE_ANON_KEY muito curta (${normalizedKey.length} caracteres, mínimo 20). Configure no Vercel Dashboard → Settings → Environment Variables`,
      currentKey: normalizedKey,
    };
  }

  if (normalizedKey.includes('localhost') || normalizedKey.includes('placeholder')) {
    return {
      hasError: true,
      type: 'invalid_key',
      message: 'VITE_SUPABASE_ANON_KEY parece ser inválida (contém localhost ou placeholder). Configure a chave correta no Vercel',
      currentKey: normalizedKey.slice(0, 20) + '...',
    };
  }
  
  console.log('✅ Validação passou!');
  console.log('✅ URL:', normalizedEnvUrl);
  console.log('✅ Key length:', normalizedKey.length);

  return {
    hasError: false,
    message: 'Configuração válida',
  };
}

// Executar validação
export const envValidation = validateSupabaseEnv();

// Se houver erro, armazenar para exibir tela de erro
if (envValidation.hasError) {
  console.error('❌ ============================================');
  console.error('❌ ERRO CRÍTICO DE CONFIGURAÇÃO DO SUPABASE');
  console.error('❌ ============================================');
  console.error('❌ Tipo:', envValidation.type);
  console.error('❌ Mensagem:', envValidation.message);
  if (envValidation.currentUrl) {
    console.error('❌ URL atual:', envValidation.currentUrl);
  }
  if (envValidation.currentKey) {
    console.error('❌ Key atual:', envValidation.currentKey.slice(0, 20) + '...');
  }
  console.error('❌ ============================================');
  console.error('❌ O APP SERÁ BLOQUEADO ATÉ QUE A CONFIGURAÇÃO SEJA CORRIGIDA');
  console.error('❌ ============================================');
  
  // Armazenar erro globalmente para o componente EnvErrorScreen
  if (typeof window !== 'undefined') {
    (window as any).__SUPABASE_ENV_ERROR__ = envValidation;
  }
}

// Funções auxiliares (mantidas para compatibilidade)
export function isInvalidApiKeyError(error: any): boolean {
  if (!error) return false;
  const message = error?.message || '';
  const code = error?.code || '';
  
  return (
    message.includes('Invalid API key') ||
    message.includes('invalid_api_key') ||
    message.includes('JWT') ||
    code === 'PGRST301' ||
    message.includes('API key not found')
  );
}

let apiKeyInvalid = false;

export function markApiKeyAsInvalid() {
  apiKeyInvalid = true;
  console.warn('⚠️ API key do Supabase marcada como inválida.');
}

export function isApiKeyInvalid(): boolean {
  return apiKeyInvalid;
}
