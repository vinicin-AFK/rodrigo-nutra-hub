import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Criar cliente mesmo sem variáveis (modo fallback)
// Isso permite que a aplicação carregue mesmo sem Supabase configurado
export const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : createClient('https://placeholder.supabase.co', 'placeholder-key');

// Verificar se está configurado
export const isSupabaseConfigured = !!(supabaseUrl && supabaseAnonKey);

if (!isSupabaseConfigured) {
  console.warn(
    '⚠️ Supabase não configurado! ' +
    'A aplicação funcionará em modo offline. ' +
    'Configure VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY no .env.local para usar o Supabase.'
  );
}

