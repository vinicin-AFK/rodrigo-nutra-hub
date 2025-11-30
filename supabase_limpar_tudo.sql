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
-- Verificar se a tabela existe antes de deletar
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'post_likes') THEN
    DELETE FROM public.post_likes;
    RAISE NOTICE '✅ post_likes limpa';
  END IF;
END $$;

-- Deletar comentários (dependem de posts)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'comments') THEN
    DELETE FROM public.comments;
    RAISE NOTICE '✅ comments limpa';
  END IF;
END $$;

-- Deletar posts
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'posts') THEN
    DELETE FROM public.posts;
    RAISE NOTICE '✅ posts limpa';
  END IF;
END $$;

-- ============================================
-- 2. DELETAR TODOS OS DADOS DE MENSAGENS
-- ============================================

-- Deletar mensagens da comunidade
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'community_messages') THEN
    DELETE FROM public.community_messages;
    RAISE NOTICE '✅ community_messages limpa';
  END IF;
END $$;

-- Deletar mensagens de suporte (se existir)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'support_messages') THEN
    DELETE FROM public.support_messages;
    RAISE NOTICE '✅ support_messages limpa';
  ELSE
    RAISE NOTICE 'ℹ️ Tabela support_messages não existe (ignorando)';
  END IF;
END $$;

-- ============================================
-- 3. DELETAR DADOS DE ESTATÍSTICAS E CONQUISTAS
-- ============================================

-- Deletar conquistas de usuários (se existir)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'user_achievements') THEN
    DELETE FROM public.user_achievements;
    RAISE NOTICE '✅ user_achievements limpa';
  ELSE
    RAISE NOTICE 'ℹ️ Tabela user_achievements não existe (ignorando)';
  END IF;
END $$;

-- Deletar estatísticas de usuários (se existir)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'user_stats') THEN
    DELETE FROM public.user_stats;
    RAISE NOTICE '✅ user_stats limpa';
  ELSE
    RAISE NOTICE 'ℹ️ Tabela user_stats não existe (ignorando)';
  END IF;
END $$;

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
    RAISE NOTICE '✅ Sequência posts_id_seq resetada';
  END IF;
  
  IF EXISTS (SELECT 1 FROM pg_class WHERE relname = 'comments_id_seq') THEN
    PERFORM setval('public.comments_id_seq', 1, false);
    RAISE NOTICE '✅ Sequência comments_id_seq resetada';
  END IF;
  
  IF EXISTS (SELECT 1 FROM pg_class WHERE relname = 'community_messages_id_seq') THEN
    PERFORM setval('public.community_messages_id_seq', 1, false);
    RAISE NOTICE '✅ Sequência community_messages_id_seq resetada';
  END IF;
  
  IF EXISTS (SELECT 1 FROM pg_class WHERE relname = 'support_messages_id_seq') THEN
    PERFORM setval('public.support_messages_id_seq', 1, false);
    RAISE NOTICE '✅ Sequência support_messages_id_seq resetada';
  END IF;
END $$;

-- ============================================
-- 5. VERIFICAÇÃO FINAL
-- ============================================

-- Verificar quantos registros restam em cada tabela (apenas se existirem)
DO $$
DECLARE
  result_text TEXT := '';
  count_val INTEGER;
BEGIN
  -- Posts
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'posts') THEN
    SELECT COUNT(*) INTO count_val FROM posts;
    result_text := result_text || 'posts: ' || count_val::TEXT || E'\n';
  END IF;
  
  -- Comments
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'comments') THEN
    SELECT COUNT(*) INTO count_val FROM comments;
    result_text := result_text || 'comments: ' || count_val::TEXT || E'\n';
  END IF;
  
  -- Post likes
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'post_likes') THEN
    SELECT COUNT(*) INTO count_val FROM post_likes;
    result_text := result_text || 'post_likes: ' || count_val::TEXT || E'\n';
  END IF;
  
  -- Community messages
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'community_messages') THEN
    SELECT COUNT(*) INTO count_val FROM community_messages;
    result_text := result_text || 'community_messages: ' || count_val::TEXT || E'\n';
  END IF;
  
  -- Support messages (se existir)
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'support_messages') THEN
    SELECT COUNT(*) INTO count_val FROM support_messages;
    result_text := result_text || 'support_messages: ' || count_val::TEXT || E'\n';
  END IF;
  
  -- User achievements (se existir)
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'user_achievements') THEN
    SELECT COUNT(*) INTO count_val FROM user_achievements;
    result_text := result_text || 'user_achievements: ' || count_val::TEXT || E'\n';
  END IF;
  
  -- User stats (se existir)
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'user_stats') THEN
    SELECT COUNT(*) INTO count_val FROM user_stats;
    result_text := result_text || 'user_stats: ' || count_val::TEXT || E'\n';
  END IF;
  
  RAISE NOTICE E'\n📊 Verificação Final:\n%', result_text;
END $$;

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

