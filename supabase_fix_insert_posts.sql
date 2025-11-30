-- ============================================
-- CORREÇÃO: POLÍTICAS RLS PARA INSERIR POSTS
-- Execute este arquivo no SQL Editor do Supabase
-- ============================================
-- Este script garante que usuários autenticados
-- possam CRIAR publicações na tabela posts
-- ============================================

-- ============================================
-- 1. REMOVER POLÍTICAS DE INSERT EXISTENTES
-- ============================================

DROP POLICY IF EXISTS "Usuários podem criar publicações" ON posts;
DROP POLICY IF EXISTS "Users can create posts" ON posts;
DROP POLICY IF EXISTS "Authenticated users can insert posts" ON posts;

-- ============================================
-- 2. CRIAR POLÍTICA PERMISSIVA PARA INSERT
-- ============================================

-- Política: QUALQUER usuário autenticado pode criar publicações
-- Esta é a política mais permissiva possível para garantir que posts sejam salvos
CREATE POLICY "Usuários podem criar publicações"
  ON posts FOR INSERT
  WITH CHECK (
    -- Permitir se:
    -- 1. Usuário está autenticado (auth.uid() não é NULL)
    auth.uid() IS NOT NULL AND
    -- 2. O author_id do post é o mesmo do usuário autenticado
    auth.uid() = author_id
  );

-- ============================================
-- 3. VERIFICAR SE RLS ESTÁ HABILITADO
-- ============================================

ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 4. VERIFICAÇÃO
-- ============================================

-- Verificar políticas de INSERT criadas
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'posts' AND cmd = 'INSERT'
ORDER BY policyname;

-- ============================================
-- 5. TESTE MANUAL (OPCIONAL)
-- ============================================

-- Para testar se a política está funcionando, execute:
-- (Substitua 'USER_ID_AQUI' pelo ID de um usuário autenticado)
-- 
-- INSERT INTO posts (author_id, content, status, type)
-- VALUES ('USER_ID_AQUI', 'Teste de publicação', 'active', 'post');
-- 
-- Se funcionar, você verá a publicação na tabela.
-- Se não funcionar, verifique:
-- 1. Se o usuário está autenticado (auth.uid() não é NULL)
-- 2. Se o author_id corresponde ao auth.uid()
-- 3. Se RLS está habilitado na tabela

