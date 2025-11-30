import { createClient } from '@supabase/supabase-js';

// ⚠️ CRÍTICO: URL ÚNICA E GLOBAL - TODOS OS DISPOSITIVOS DEVEM USAR A MESMA URL
// Não usar localhost, IPs locais ou URLs diferentes para dev/prod
const SUPABASE_URL_GLOBAL = 'https://kfyzcqaerlwqcmlbcgts.supabase.co';

// Variáveis de ambiente (devem apontar para a mesma URL global)
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || SUPABASE_URL_GLOBAL;
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

// ⚠️ CRÍTICO: SEMPRE usar URL GLOBAL ÚNICA
// Garantir que TODOS os dispositivos usam a MESMA instância do Supabase
// Se a variável de ambiente tiver localhost ou IP local, forçar uso da URL global
let finalSupabaseUrl = SUPABASE_URL_GLOBAL;
if (supabaseUrl && supabaseUrl !== SUPABASE_URL_GLOBAL) {
  const isLocalUrl = supabaseUrl.includes('localhost') || 
                     supabaseUrl.includes('127.0.0.1') || 
                     supabaseUrl.includes('192.168.') || 
                     supabaseUrl.includes('10.0.') || 
                     supabaseUrl.startsWith('http://');
  
  if (isLocalUrl) {
    console.warn('⚠️ URL local detectada, forçando uso da URL global:', SUPABASE_URL_GLOBAL);
    finalSupabaseUrl = SUPABASE_URL_GLOBAL;
  } else if (supabaseUrl.includes('supabase.co')) {
    // Se for uma URL válida do Supabase (mesmo que diferente), usar ela
    finalSupabaseUrl = supabaseUrl;
    if (supabaseUrl !== SUPABASE_URL_GLOBAL) {
      console.warn('⚠️ URL do Supabase diferente da global configurada:', supabaseUrl);
      console.warn('⚠️ Recomendado usar a URL global:', SUPABASE_URL_GLOBAL);
    }
  } else {
    // URL inválida, usar global
    finalSupabaseUrl = SUPABASE_URL_GLOBAL;
  }
}

// Criar cliente mesmo sem variáveis (modo fallback)
// Isso permite que a aplicação carregue mesmo sem Supabase configurado
export const supabase = isSupabaseConfigured
  ? createClient(finalSupabaseUrl, supabaseAnonKey!, {
      auth: {
        storage: localStorage,
        persistSession: true,
        autoRefreshToken: true,
      }
    })
  : createClient(SUPABASE_URL_GLOBAL, 'placeholder-key', {
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
  // ⚠️ VALIDAÇÃO CRÍTICA: Garantir que TODOS os dispositivos usam a MESMA URL
  const finalUrl = (supabaseUrl && !supabaseUrl.includes('localhost') && 
    !supabaseUrl.includes('127.0.0.1') && !supabaseUrl.includes('192.168.') && 
    !supabaseUrl.includes('10.0.') && !supabaseUrl.startsWith('http://')) 
    ? supabaseUrl 
    : SUPABASE_URL_GLOBAL;
  
  if (finalUrl !== SUPABASE_URL_GLOBAL && supabaseUrl) {
    console.warn('⚠️ URL do Supabase diferente da global. Usando URL global para garantir sincronização.');
    console.warn('⚠️ URL na variável de ambiente:', supabaseUrl);
    console.warn('⚠️ URL global forçada:', SUPABASE_URL_GLOBAL);
  }
  
  console.log('✅ Supabase configurado com URL GLOBAL:', finalUrl);
  console.log('🔑 Chave configurada:', supabaseAnonKey?.substring(0, 20) + '...');
  console.log('🌍 TODOS os dispositivos usarão o MESMO backend Supabase');
}

