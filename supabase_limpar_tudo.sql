-- ============================================
-- LIMPEZA COMPLETA DO BANCO DE DADOS
-- Execute este arquivo no SQL Editor do Supabase
-- ============================================
-- CUIDADO: Isso irá deletar TODOS os dados das tabelas abaixo!
-- Use apenas para testar do zero
-- ============================================

-- ============================================
-- 1. DELETAR TODOS OS DADOS DE POSTS E RELACIONADOS
-- ============================================

-- Deletar curtidas primeiro (dependem de posts)
DELETE FROM public.post_likes;

-- Deletar comentários (dependem de posts)
DELETE FROM public.comments;

-- Deletar posts
DELETE FROM public.posts;

-- ============================================
-- 2. DELETAR TODOS OS DADOS DE MENSAGENS
-- ============================================

-- Deletar mensagens da comunidade
DELETE FROM public.community_messages;

-- Deletar mensagens de suporte
DELETE FROM public.support_messages;

-- ============================================
-- 3. DELETAR DADOS DE ESTATÍSTICAS E CONQUISTAS
-- ============================================

-- Deletar conquistas de usuários
DELETE FROM public.user_achievements;

-- Deletar estatísticas de usuários
DELETE FROM public.user_stats;

-- ============================================
-- 4. RESETAR SEQUÊNCIAS (OPCIONAL)
-- ============================================

-- Resetar sequências para IDs auto-incrementais (se aplicável)
-- Isso garante que os próximos IDs comecem do zero
DO $$
BEGIN
  -- Verificar e resetar sequências se existirem
  IF EXISTS (SELECT 1 FROM pg_class WHERE relname = 'posts_id_seq') THEN
    PERFORM setval('public.posts_id_seq', 1, false);
  END IF;
  
  IF EXISTS (SELECT 1 FROM pg_class WHERE relname = 'comments_id_seq') THEN
    PERFORM setval('public.comments_id_seq', 1, false);
  END IF;
  
  IF EXISTS (SELECT 1 FROM pg_class WHERE relname = 'community_messages_id_seq') THEN
    PERFORM setval('public.community_messages_id_seq', 1, false);
  END IF;
  
  IF EXISTS (SELECT 1 FROM pg_class WHERE relname = 'support_messages_id_seq') THEN
    PERFORM setval('public.support_messages_id_seq', 1, false);
  END IF;
END $$;

-- ============================================
-- 5. VERIFICAÇÃO FINAL
-- ============================================

-- Verificar quantos registros restam em cada tabela
SELECT 
  'posts' as tabela,
  COUNT(*) as total
FROM posts
UNION ALL
SELECT 
  'comments' as tabela,
  COUNT(*) as total
FROM comments
UNION ALL
SELECT 
  'post_likes' as tabela,
  COUNT(*) as total
FROM post_likes
UNION ALL
SELECT 
  'community_messages' as tabela,
  COUNT(*) as total
FROM community_messages
UNION ALL
SELECT 
  'support_messages' as tabela,
  COUNT(*) as total
FROM support_messages
UNION ALL
SELECT 
  'user_achievements' as tabela,
  COUNT(*) as total
FROM user_achievements
UNION ALL
SELECT 
  'user_stats' as tabela,
  COUNT(*) as total
FROM user_stats;

-- ============================================
-- NOTA: PERFIS DE USUÁRIOS NÃO SÃO DELETADOS
-- ============================================
-- Os perfis (tabela 'profiles') são mantidos para preservar os logins
-- Se quiser deletar também os perfis, descomente as linhas abaixo:
-- DELETE FROM public.profiles;
-- TRUNCATE TABLE public.profiles RESTART IDENTITY CASCADE;

-- ============================================
-- NOTA: STORAGE (IMAGENS/ÁUDIOS)
-- ============================================
-- Para limpar imagens e áudios do storage, vá para:
-- Supabase Dashboard → Storage → Selecione o bucket → Delete all

