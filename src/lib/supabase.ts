import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Variável para desabilitar Supabase completamente (modo offline forçado)
// Defina VITE_DISABLE_SUPABASE=true no .env.local para desabilitar
const isSupabaseDisabled = import.meta.env.VITE_DISABLE_SUPABASE === 'true';

// Verificar se está realmente configurado (não apenas se existe, mas se tem valor válido)
export const isSupabaseConfigured = !isSupabaseDisabled && !!(
  supabaseUrl && 
  supabaseAnonKey && 
  supabaseUrl.trim() !== '' && 
  supabaseAnonKey.trim() !== '' &&
  supabaseUrl !== 'https://placeholder.supabase.co' &&
  supabaseAnonKey !== 'placeholder-key'
);

// Flag para rastrear se a API key foi detectada como inválida
let apiKeyInvalid = false;

// Função para verificar se um erro é de API key inválida
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

// Função para marcar a API key como inválida
export function markApiKeyAsInvalid() {
  apiKeyInvalid = true;
  console.warn('⚠️ API key do Supabase marcada como inválida. Usando modo offline.');
}

// Função para verificar se a API key está inválida
export function isApiKeyInvalid(): boolean {
  return apiKeyInvalid;
}

// Criar cliente mesmo sem variáveis (modo fallback)
// Isso permite que a aplicação carregue mesmo sem Supabase configurado
export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl!, supabaseAnonKey!, {
      auth: {
        storage: localStorage,
        persistSession: true,
        autoRefreshToken: true,
      }
    })
  : createClient('https://placeholder.supabase.co', 'placeholder-key', {
      auth: {
        storage: localStorage,
        persistSession: true,
        autoRefreshToken: true,
      }
    });

if (isSupabaseDisabled) {
  console.warn('🚫 Supabase DESABILITADO manualmente (VITE_DISABLE_SUPABASE=true)');
  console.warn('📱 Aplicação funcionando em modo OFFLINE completo');
} else if (!isSupabaseConfigured) {
  console.warn(
    '⚠️ Supabase não configurado! ' +
    'A aplicação funcionará em modo offline. ' +
    'Configure VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY no .env.local para usar o Supabase.'
  );
  console.warn('📋 Variáveis encontradas:', {
    hasUrl: !!supabaseUrl,
    hasKey: !!supabaseAnonKey,
    urlLength: supabaseUrl?.length || 0,
    keyLength: supabaseAnonKey?.length || 0,
  });
} else {
  console.log('✅ Supabase configurado:', supabaseUrl?.substring(0, 30) + '...');
  console.log('🔑 Chave configurada:', supabaseAnonKey?.substring(0, 20) + '...');
  
  // ⚠️ VALIDAÇÃO: Garantir que não está usando localhost ou URLs locais
  if (supabaseUrl && (
    supabaseUrl.includes('localhost') ||
    supabaseUrl.includes('127.0.0.1') ||
    supabaseUrl.includes('192.168.') ||
    supabaseUrl.includes('10.0.') ||
    supabaseUrl.startsWith('http://')
  )) {
    console.error('❌ ERRO CRÍTICO: URL do Supabase contém localhost ou IP local!');
    console.error('❌ Isso fará com que cada dispositivo use um servidor diferente!');
    console.error('❌ Use uma URL pública do Supabase (https://xxx.supabase.co)');
    console.error('❌ URL atual:', supabaseUrl);
  } else {
    console.log('✅ URL do Supabase é pública - todos os dispositivos usarão o mesmo backend');
  }
}

