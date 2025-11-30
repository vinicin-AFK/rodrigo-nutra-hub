/**
 * Logger simples que detecta se o app está apontando para a URL correta
 * e envia um resumo para /debug/supabase
 */

type LogPayload = {
  appUrl: string;
  supabaseUrl: string;
  keyPrefix: string;
  platform: string;
  userAgent: string;
  timestamp: string;
};

const DEBUG_ENDPOINT = (import.meta.env.VITE_DEBUG_ENDPOINT as string) || '/api/debug/supabase';

import { getSupabaseDebugInfo } from './supabaseClient';

export async function sendInstanceLog() {
  try {
    const appUrl = window.location.href;
    const { url: supabaseUrl, keyPrefix } = getSupabaseDebugInfo();

    const payload: LogPayload = {
      appUrl,
      supabaseUrl,
      keyPrefix,
      platform: navigator.platform || 'unknown',
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString(),
    };

    // Console local sempre
    console.log('📊 InstanceLog:', payload);

    // Enviar para o servidor de debug (não crítico - não bloqueia se falhar)
    await fetch(DEBUG_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }).catch(err => console.warn('⚠️ Não foi possível enviar log de instância:', err.message || err));
  } catch (err) {
    console.warn('⚠️ Erro no sendInstanceLog:', err);
  }
}

