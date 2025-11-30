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

import { createClient } from '@supabase/supabase-js';

// ============================================
// VARIÁVEIS DE AMBIENTE OBRIGATÓRIAS
// ============================================
// ⚠️ CRÍTICO: Use APENAS estas variáveis no .env.local:
//   VITE_SUPABASE_URL=https://kfyzcqaerlwqcmlbcgts.supabase.co
//   VITE_SUPABASE_ANON_KEY=sua_chave_aqui
// ============================================

const SUPABASE_URL_REQUIRED = 'https://kfyzcqaerlwqcmlbcgts.supabase.co';
const MIN_KEY_LENGTH = 20;

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

// ============================================
// VALIDAÇÃO AUTOMÁTICA NO BOOT
// ============================================
// ⚠️ OBRIGATÓRIO: Logs para confirmar que todos os builds usam a mesma URL
console.log('🔍 ============================================');
console.log('🔍 VALIDAÇÃO SUPABASE - BOOT DO APP');
console.log('🔍 ============================================');
console.log('🔍 SUPABASE_URL:', SUPABASE_URL || '❌ NÃO CONFIGURADO');
console.log('🔍 SUPABASE_KEY:', SUPABASE_ANON_KEY ? SUPABASE_ANON_KEY.slice(0, 10) + '...' : '❌ NÃO CONFIGURADO');
console.log('🔍 URL completa:', SUPABASE_URL);
console.log('🔍 ============================================');

// ============================================
// VALIDAÇÃO RIGOROSA - BLOQUEIA APP SE ERRADO
// ============================================
export interface EnvValidationError {
  hasError: boolean;
  type?: 'missing_url' | 'missing_key' | 'wrong_url' | 'invalid_key' | 'local_url';
  message: string;
  currentUrl?: string;
  currentKey?: string;
}

export function validateSupabaseEnv(): EnvValidationError {
  // Verificar se URL está vazia
  if (!SUPABASE_URL || SUPABASE_URL.trim() === '') {
    return {
      hasError: true,
      type: 'missing_url',
      message: 'VITE_SUPABASE_URL não está configurada. Configure no .env.local',
      currentUrl: undefined,
    };
  }

  // Verificar se URL é diferente da requerida
  if (SUPABASE_URL !== SUPABASE_URL_REQUIRED) {
    return {
      hasError: true,
      type: 'wrong_url',
      message: `URL do Supabase incorreta. Use APENAS: ${SUPABASE_URL_REQUIRED}`,
      currentUrl: SUPABASE_URL,
    };
  }

  // Verificar se URL contém localhost ou IP local
  const isLocalUrl = 
    SUPABASE_URL.includes('localhost') ||
    SUPABASE_URL.includes('127.0.0.1') ||
    SUPABASE_URL.includes('192.168.') ||
    SUPABASE_URL.includes('10.0.') ||
    SUPABASE_URL.startsWith('http://');
  
  if (isLocalUrl) {
    return {
      hasError: true,
      type: 'local_url',
      message: 'URL local detectada. Use APENAS a URL pública do Supabase',
      currentUrl: SUPABASE_URL,
    };
  }

  // Verificar se Key está vazia
  if (!SUPABASE_ANON_KEY || SUPABASE_ANON_KEY.trim() === '') {
    return {
      hasError: true,
      type: 'missing_key',
      message: 'VITE_SUPABASE_ANON_KEY não está configurada. Configure no .env.local',
      currentKey: undefined,
    };
  }

  // Verificar se Key é muito curta
  if (SUPABASE_ANON_KEY.length < MIN_KEY_LENGTH) {
    return {
      hasError: true,
      type: 'invalid_key',
      message: `VITE_SUPABASE_ANON_KEY muito curta (${SUPABASE_ANON_KEY.length} caracteres, mínimo ${MIN_KEY_LENGTH})`,
      currentKey: SUPABASE_ANON_KEY,
    };
  }

  // Verificar se Key parece inválida
  if (SUPABASE_ANON_KEY.includes('localhost') || SUPABASE_ANON_KEY.includes('placeholder')) {
    return {
      hasError: true,
      type: 'invalid_key',
      message: 'VITE_SUPABASE_ANON_KEY parece ser inválida (contém localhost ou placeholder)',
      currentKey: SUPABASE_ANON_KEY,
    };
  }

  // Tudo OK
  return {
    hasError: false,
    message: 'Configuração válida',
  };
}

// Executar validação
const envValidation = validateSupabaseEnv();

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
  (window as any).__SUPABASE_ENV_ERROR__ = envValidation;
}

// Exportar validação para uso em componentes
export { envValidation };

// ============================================
// VERIFICAÇÃO DE CONFIGURAÇÃO
// ============================================
// ⚠️ Só considerar configurado se não houver erros de validação
export const isSupabaseConfigured = !envValidation.hasError && !!(
  SUPABASE_URL && 
  SUPABASE_ANON_KEY && 
  SUPABASE_URL.trim() !== '' && 
  SUPABASE_ANON_KEY.trim() !== '' &&
  SUPABASE_URL.includes('supabase.co') &&
  SUPABASE_URL === SUPABASE_URL_REQUIRED
);

if (!isSupabaseConfigured) {
  console.error('❌ ============================================');
  console.error('❌ SUPABASE NÃO CONFIGURADO!');
  console.error('❌ ============================================');
  console.error('❌ Configure no .env.local:');
  console.error('❌   VITE_SUPABASE_URL=https://kfyzcqaerlwqcmlbcgts.supabase.co');
  console.error('❌   VITE_SUPABASE_ANON_KEY=sua_chave_aqui');
  console.error('❌ ============================================');
}

// ============================================
// CRIAÇÃO DO CLIENT SUPABASE
// ============================================
// ⚠️ ÚNICA INSTÂNCIA - TODOS OS ARQUIVOS USAM ESTA
export const supabase = isSupabaseConfigured
  ? createClient(SUPABASE_URL!, SUPABASE_ANON_KEY!, {
      auth: {
        storage: localStorage,
        persistSession: true,
        autoRefreshToken: true,
      },
      // Configurações adicionais para garantir sincronização
      realtime: {
        params: {
          eventsPerSecond: 10,
        },
      },
    })
  : createClient('https://placeholder.supabase.co', 'placeholder-key', {
      auth: {
        storage: localStorage,
        persistSession: true,
        autoRefreshToken: true,
      },
    });

// ============================================
// LOG FINAL DE CONFIRMAÇÃO
// ============================================
if (isSupabaseConfigured) {
  console.log('✅ ============================================');
  console.log('✅ SUPABASE CONFIGURADO COM SUCESSO');
  console.log('✅ ============================================');
  console.log('✅ URL:', SUPABASE_URL);
  console.log('✅ Key:', SUPABASE_ANON_KEY?.slice(0, 20) + '...');
  console.log('✅ TODOS os dispositivos usarão o MESMO backend');
  console.log('✅ ============================================');
} else {
  console.warn('⚠️ Supabase não configurado - app funcionará em modo offline');
}

// ============================================
// EXPORTS
// ============================================
export { isSupabaseConfigured };

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

