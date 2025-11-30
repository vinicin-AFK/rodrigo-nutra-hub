-- ============================================
-- TESTE COMPLETO DE CONEXÃO E PERMISSÕES
-- Execute este arquivo no SQL Editor do Supabase
-- ============================================
-- Este script testa se tudo está funcionando corretamente
-- ============================================

-- ============================================
-- 1. VERIFICAR SE AS TABELAS EXISTEM
-- ============================================

SELECT 
  'Tabelas existentes:' as info,
  table_name
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('profiles', 'posts', 'comments', 'post_likes', 'community_messages', 'achievements', 'user_stats')
ORDER BY table_name;

-- ============================================
-- 2. VERIFICAR SE RLS ESTÁ HABILITADO
-- ============================================

SELECT 
  'RLS Status:' as info,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public' 
  AND tablename IN ('profiles', 'posts', 'comments', 'post_likes', 'community_messages', 'achievements', 'user_stats')
ORDER BY tablename;

-- ============================================
-- 3. VERIFICAR TODAS AS POLÍTICAS RLS
-- ============================================

SELECT 
  'Políticas RLS:' as info,
  tablename,
  policyname,
  cmd as operacao,
  permissive,
  roles
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('profiles', 'posts', 'comments', 'post_likes', 'community_messages', 'achievements', 'user_stats')
ORDER BY tablename, cmd, policyname;

-- ============================================
-- 4. VERIFICAR SE HÁ DADOS NAS TABELAS
-- ============================================

SELECT 'profiles' as tabela, COUNT(*) as total FROM profiles
UNION ALL
SELECT 'posts', COUNT(*) FROM posts
UNION ALL
SELECT 'comments', COUNT(*) FROM comments
UNION ALL
SELECT 'post_likes', COUNT(*) FROM post_likes
UNION ALL
SELECT 'community_messages', COUNT(*) FROM community_messages
UNION ALL
SELECT 'achievements', COUNT(*) FROM achievements
UNION ALL
SELECT 'user_stats', COUNT(*) FROM user_stats
ORDER BY tabela;

-- ============================================
-- 5. VERIFICAR USUÁRIOS AUTENTICADOS
-- ============================================

SELECT 
  'Usuários autenticados:' as info,
  id,
  email,
  created_at
FROM auth.users
ORDER BY created_at DESC
LIMIT 10;

-- ============================================
-- 6. VERIFICAR PERFIS CRIADOS
-- ============================================

SELECT 
  'Perfis criados:' as info,
  id,
  name,
  email,
  points,
  created_at
FROM profiles
ORDER BY created_at DESC
LIMIT 10;

-- ============================================
-- 7. TESTE DE INSERÇÃO MANUAL (OPCIONAL)
-- ============================================

-- Descomente as linhas abaixo e substitua USER_ID pelo ID de um usuário autenticado
-- Para pegar o USER_ID, veja o resultado da query acima "Usuários autenticados"

/*
-- Pegar o primeiro user_id
DO $$
DECLARE
  test_user_id UUID;
BEGIN
  SELECT id INTO test_user_id FROM auth.users LIMIT 1;
  
  IF test_user_id IS NOT NULL THEN
    -- Criar perfil se não existir
    INSERT INTO profiles (id, name, email)
    VALUES (test_user_id, 'Teste Manual', 'teste@exemplo.com')
    ON CONFLICT (id) DO NOTHING;
    
    -- Criar post de teste
    INSERT INTO posts (author_id, content, status, type)
    VALUES (test_user_id, 'Post de teste manual', 'active', 'post')
    RETURNING id, author_id, content, created_at;
  ELSE
    RAISE NOTICE 'Nenhum usuário autenticado encontrado. Faça login no app primeiro.';
  END IF;
END $$;
*/

-- ============================================
-- 8. VERIFICAR ESTRUTURA DAS TABELAS
-- ============================================

SELECT 
  'Estrutura da tabela posts:' as info,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'posts' AND table_schema = 'public'
ORDER BY ordinal_position;

-- ============================================
-- 9. VERIFICAR POLÍTICAS DE INSERT ESPECIFICAMENTE
-- ============================================

SELECT 
  'Políticas de INSERT:' as info,
  tablename,
  policyname,
  with_check as condicao_insert
FROM pg_policies
WHERE schemaname = 'public'
  AND cmd = 'INSERT'
  AND tablename IN ('profiles', 'posts', 'comments', 'post_likes', 'community_messages', 'achievements', 'user_stats')
ORDER BY tablename;

-- ============================================
-- 10. DIAGNÓSTICO FINAL
-- ============================================

SELECT 
  'DIAGNÓSTICO FINAL:' as info,
  CASE 
    WHEN (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'posts') > 0 
    THEN '✅ Tabela posts existe'
    ELSE '❌ Tabela posts NÃO existe'
  END as status_tabela,
  CASE 
    WHEN (SELECT COUNT(*) FROM pg_policies WHERE tablename = 'posts' AND cmd = 'INSERT') > 0 
    THEN '✅ Política de INSERT existe'
    ELSE '❌ Política de INSERT NÃO existe'
  END as status_politica_insert,
  CASE 
    WHEN (SELECT COUNT(*) FROM auth.users) > 0 
    THEN '✅ Há usuários autenticados'
    ELSE '❌ Nenhum usuário autenticado'
  END as status_usuarios;

