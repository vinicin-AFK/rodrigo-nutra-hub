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
// VALIDAÇÃO DE URL
// ============================================
// ⚠️ BLOQUEAR: localhost, IPs locais, URLs diferentes
if (SUPABASE_URL) {
  const isInvalidUrl = 
    SUPABASE_URL.includes('localhost') ||
    SUPABASE_URL.includes('127.0.0.1') ||
    SUPABASE_URL.includes('192.168.') ||
    SUPABASE_URL.includes('10.0.') ||
    SUPABASE_URL.startsWith('http://') ||
    !SUPABASE_URL.includes('supabase.co');
  
  if (isInvalidUrl) {
    console.error('❌ ERRO CRÍTICO: URL do Supabase inválida!');
    console.error('❌ URL detectada:', SUPABASE_URL);
    console.error('❌ Use APENAS: https://kfyzcqaerlwqcmlbcgts.supabase.co');
    throw new Error('URL do Supabase inválida. Use apenas a URL pública do Supabase.');
  }
}

// ============================================
// VERIFICAÇÃO DE CONFIGURAÇÃO
// ============================================
export const isSupabaseConfigured = !!(
  SUPABASE_URL && 
  SUPABASE_ANON_KEY && 
  SUPABASE_URL.trim() !== '' && 
  SUPABASE_ANON_KEY.trim() !== '' &&
  SUPABASE_URL.includes('supabase.co')
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

