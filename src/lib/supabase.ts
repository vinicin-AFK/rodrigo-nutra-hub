import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Verificar se está realmente configurado (não apenas se existe, mas se tem valor válido)
export const isSupabaseConfigured = !!(
  supabaseUrl && 
  supabaseAnonKey && 
  supabaseUrl.trim() !== '' && 
  supabaseAnonKey.trim() !== '' &&
  supabaseUrl !== 'https://placeholder.supabase.co' &&
  supabaseAnonKey !== 'placeholder-key'
);

// Criar cliente mesmo sem variáveis (modo fallback)
// Isso permite que a aplicação carregue mesmo sem Supabase configurado
export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl!, supabaseAnonKey!)
  : createClient('https://placeholder.supabase.co', 'placeholder-key');

if (!isSupabaseConfigured) {
  console.warn(
    '⚠️ Supabase não configurado! ' +
    'A aplicação funcionará em modo offline. ' +
    'Configure VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY no .env.local para usar o Supabase.'
  );
} else {
  console.log('✅ Supabase configurado:', supabaseUrl?.substring(0, 30) + '...');
}

