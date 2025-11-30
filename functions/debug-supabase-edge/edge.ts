/**
 * Supabase Edge Function - Versão Deno
 * 
 * Coloque essa função em supabase/functions/debug-supabase
 * Exemplo minimalista para retornar dados usando a REST API do PostgREST
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const SUPABASE_URL = Deno.env.get('VITE_SUPABASE_URL') || 'https://kfyzcqaerlwqcmlbcgts.supabase.co';
const SUPABASE_KEY = Deno.env.get('VITE_SUPABASE_ANON_KEY') || '';

serve(async (req) => {
  try {
    const postsResp = await fetch(`${SUPABASE_URL}/rest/v1/posts?select=id,content,created_at&order=created_at.desc&limit=5`, {
      headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` }
    });
    const posts = await postsResp.json();

    const msgsResp = await fetch(`${SUPABASE_URL}/rest/v1/community_messages?select=id,content,created_at&order=created_at.asc&limit=5`, {
      headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` }
    });
    const messages = await msgsResp.json();

    return new Response(JSON.stringify({ 
      supabase_url: SUPABASE_URL, 
      supabase_key_prefix: SUPABASE_KEY ? SUPABASE_KEY.substring(0, 10) : null, 
      last_posts: posts, 
      last_messages: messages 
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), { 
      status: 500, 
      headers: { 'Content-Type': 'application/json' }
    });
  }
});

