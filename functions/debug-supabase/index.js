/**
 * Endpoint de Debug do Supabase
 * 
 * Deploy como endpoint simples (Vercel, Render, Heroku)
 * 
 * GET /debug/supabase - Retorna status do Supabase e últimas entradas
 * POST /debug/log - Recebe logs de instância
 */

const express = require('express');
const fetch = require('node-fetch');

const app = express();
app.use(express.json());

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://kfyzcqaerlwqcmlbcgts.supabase.co';
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY || '';

app.get('/debug/supabase', async (req, res) => {
  try {
    // Puxar 5 posts e 5 mensagens
    const postsResp = await fetch(`${SUPABASE_URL}/rest/v1/posts?select=id,content,created_at&order=created_at.desc&limit=5`, {
      headers: { 
        apikey: SUPABASE_KEY, 
        Authorization: `Bearer ${SUPABASE_KEY}` 
      }
    });
    const posts = await postsResp.json();

    const msgsResp = await fetch(`${SUPABASE_URL}/rest/v1/community_messages?select=id,content,created_at&order=created_at.asc&limit=5`, {
      headers: { 
        apikey: SUPABASE_KEY, 
        Authorization: `Bearer ${SUPABASE_KEY}` 
      }
    });
    const messages = await msgsResp.json();

    res.json({
      supabase_url: SUPABASE_URL,
      supabase_key_prefix: SUPABASE_KEY ? SUPABASE_KEY.substring(0, 10) : null,
      last_posts: posts,
      last_messages: messages,
    });
  } catch (err) {
    console.error('Erro debug:', err);
    res.status(500).json({ error: 'Erro ao consultar Supabase', details: String(err) });
  }
});

app.post('/debug/log', (req, res) => {
  // Recebe logs de instância e guarda em memória / DB / arquivo (opcional)
  console.log('📊 LOG RECEBIDO:', req.body);
  res.json({ ok: true, received: req.body });
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log('🔍 Debug server rodando na porta', port));

module.exports = app;

