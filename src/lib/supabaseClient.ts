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

const envUrl = (import.meta.env.VITE_SUPABASE_URL as string) || '';
const envKey = (import.meta.env.VITE_SUPABASE_ANON_KEY as string) || '';

// ============================================
// VALIDAÇÃO AUTOMÁTICA NO BOOT
// ============================================
console.log('🔍 ============================================');
console.log('🔍 VALIDAÇÃO SUPABASE - BOOT DO APP');
console.log('🔍 ============================================');
console.log('🔍 SUPABASE_URL:', envUrl || '❌ NÃO CONFIGURADO');
console.log('🔍 SUPABASE_KEY:', envKey ? envKey.slice(0, 10) + '...' : '❌ NÃO CONFIGURADO');
console.log('🔍 ============================================');

export function isSupabaseValid(url: string | undefined, key: string | undefined) {
  if (!url || !key) return false;
  if (!url.includes('supabase.co')) return false;
  if (key.length < 20) return false;
  if (url !== GLOBAL_SUPABASE_URL) return false;
  return true;
}

const finalUrl = (() => {
  if (!envUrl) return GLOBAL_SUPABASE_URL;
  const lower = envUrl.toLowerCase();
  // block localhost/http fallback
  if (lower.includes('localhost') || lower.startsWith('http://') || lower.includes('127.0.0.1')) {
    console.warn('⚠️ URL local detectada no env; forçando URL GLOBAL');
    return GLOBAL_SUPABASE_URL;
  }
  return envUrl;
})();

const finalKey = envKey || '';

export const isSupabaseConfigured = isSupabaseValid(finalUrl, finalKey);

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
  if (!envUrl || envUrl.trim() === '') {
    return {
      hasError: true,
      type: 'missing_url',
      message: 'VITE_SUPABASE_URL não está configurada. Configure no .env.local',
      currentUrl: undefined,
    };
  }

  if (envUrl !== GLOBAL_SUPABASE_URL) {
    return {
      hasError: true,
      type: 'wrong_url',
      message: `URL do Supabase incorreta. Use APENAS: ${GLOBAL_SUPABASE_URL}`,
      currentUrl: envUrl,
    };
  }

  const isLocalUrl = 
    envUrl.includes('localhost') ||
    envUrl.includes('127.0.0.1') ||
    envUrl.includes('192.168.') ||
    envUrl.includes('10.0.') ||
    envUrl.startsWith('http://');
  
  if (isLocalUrl) {
    return {
      hasError: true,
      type: 'local_url',
      message: 'URL local detectada. Use APENAS a URL pública do Supabase',
      currentUrl: envUrl,
    };
  }

  if (!envKey || envKey.trim() === '') {
    return {
      hasError: true,
      type: 'missing_key',
      message: 'VITE_SUPABASE_ANON_KEY não está configurada. Configure no .env.local',
      currentKey: undefined,
    };
  }

  if (envKey.length < 20) {
    return {
      hasError: true,
      type: 'invalid_key',
      message: `VITE_SUPABASE_ANON_KEY muito curta (${envKey.length} caracteres, mínimo 20)`,
      currentKey: envKey,
    };
  }

  if (envKey.includes('localhost') || envKey.includes('placeholder')) {
    return {
      hasError: true,
      type: 'invalid_key',
      message: 'VITE_SUPABASE_ANON_KEY parece ser inválida (contém localhost ou placeholder)',
      currentKey: envKey,
    };
  }

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
