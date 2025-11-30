/**
 * ⚠️ DEPRECATED: Este arquivo está sendo substituído por supabaseClient.ts
 * 
 * Por favor, use:
 * import { supabase, isSupabaseConfigured } from '@/lib/supabaseClient';
 * 
 * Este arquivo será removido em breve.
 * 
 * Este arquivo apenas re-exporta do supabaseClient.ts para manter compatibilidade
 * com código existente que ainda usa @/lib/supabase
 */

// Re-exportar tudo do novo arquivo para compatibilidade
export { 
  supabase, 
  isSupabaseConfigured, 
  isInvalidApiKeyError, 
  markApiKeyAsInvalid, 
  isApiKeyInvalid,
  validateSupabaseEnv,
  envValidation,
  type EnvValidationError
} from './supabaseClient';
