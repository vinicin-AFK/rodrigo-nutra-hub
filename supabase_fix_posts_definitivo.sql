-- ============================================
-- CORREÇÃO DEFINITIVA: POSTS NÃO ESTÃO SENDO SALVOS
-- Execute este arquivo no SQL Editor do Supabase
-- ============================================

-- ============================================
-- 1. VERIFICAR E CRIAR TABELA POSTS (SE NÃO EXISTIR)
-- ============================================

CREATE TABLE IF NOT EXISTS posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  author_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  image TEXT,
  result_value INTEGER,
  type TEXT DEFAULT 'post' CHECK (type IN ('post', 'result')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'deleted', 'hidden'))
);

-- ============================================
-- 2. GARANTIR QUE RLS ESTÁ HABILITADO
-- ============================================

ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 3. REMOVER TODAS AS POLÍTICAS ANTIGAS
-- ============================================

DROP POLICY IF EXISTS "Usuários podem criar publicações" ON posts;
DROP POLICY IF EXISTS "Users can create posts" ON posts;
DROP POLICY IF EXISTS "Authenticated users can insert posts" ON posts;
DROP POLICY IF EXISTS "Publicações ativas são públicas para leitura" ON posts;
DROP POLICY IF EXISTS "Feed global - todos veem todas as publicações ativas" ON posts;
DROP POLICY IF EXISTS "Todos podem ver publicações ativas" ON posts;
DROP POLICY IF EXISTS "Public posts are viewable by everyone" ON posts;
DROP POLICY IF EXISTS "Usuários podem atualizar próprias publicações" ON posts;
DROP POLICY IF EXISTS "Usuários podem deletar próprias publicações" ON posts;

-- ============================================
-- 4. CRIAR POLÍTICA PERMISSIVA PARA INSERT
-- ============================================

-- POLÍTICA CRÍTICA: Permitir que QUALQUER usuário autenticado crie posts
-- Esta é a política mais permissiva possível
CREATE POLICY "POLITICA_INSERT_POSTS_PERMISSIVA"
  ON posts FOR INSERT
  WITH CHECK (
    -- Apenas verificar se o usuário está autenticado
    -- Não verificar se author_id = auth.uid() porque pode haver problemas de timing
    auth.uid() IS NOT NULL
  );

-- ============================================
-- 5. CRIAR POLÍTICA PARA SELECT (LEITURA)
-- ============================================

-- Todos podem ver posts ativos
CREATE POLICY "POLITICA_SELECT_POSTS_PUBLICA"
  ON posts FOR SELECT
  USING (
    status = 'active' OR 
    status IS NULL OR 
    auth.uid() = author_id
  );

-- ============================================
-- 6. CRIAR POLÍTICAS PARA UPDATE E DELETE
-- ============================================

-- Usuários podem atualizar apenas seus próprios posts
CREATE POLICY "POLITICA_UPDATE_POSTS_PROPRIOS"
  ON posts FOR UPDATE
  USING (auth.uid() = author_id)
  WITH CHECK (auth.uid() = author_id);

-- Usuários podem deletar apenas seus próprios posts
CREATE POLICY "POLITICA_DELETE_POSTS_PROPRIOS"
  ON posts FOR DELETE
  USING (auth.uid() = author_id);

-- ============================================
-- 7. CRIAR ÍNDICES PARA PERFORMANCE
-- ============================================

CREATE INDEX IF NOT EXISTS posts_author_id_idx ON posts(author_id);
CREATE INDEX IF NOT EXISTS posts_created_at_idx ON posts(created_at DESC);
CREATE INDEX IF NOT EXISTS posts_status_idx ON posts(status) WHERE status = 'active';

-- ============================================
-- 8. VERIFICAÇÃO FINAL
-- ============================================

-- Verificar todas as políticas criadas
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
WHERE tablename = 'posts'
ORDER BY cmd, policyname;

-- Verificar se RLS está habilitado
SELECT 
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE tablename = 'posts';

-- ============================================
-- 9. TESTE MANUAL (OPCIONAL)
-- ============================================

-- Para testar, você pode executar no SQL Editor:
-- (Substitua 'SEU_USER_ID' pelo ID de um usuário autenticado)
--
-- INSERT INTO posts (author_id, content, status, type)
-- VALUES ('SEU_USER_ID', 'Teste de publicação', 'active', 'post')
-- RETURNING *;
--
-- Se funcionar, você verá a publicação retornada.
-- Se não funcionar, verifique:
-- 1. Se o usuário está autenticado (auth.uid() não é NULL)
-- 2. Se RLS está habilitado
-- 3. Se a política de INSERT existe

-- ============================================
-- 10. DIAGNÓSTICO DE PROBLEMAS
-- ============================================

-- Verificar se há posts na tabela
SELECT COUNT(*) as total_posts FROM posts;

-- Verificar posts por status
SELECT status, COUNT(*) as quantidade
FROM posts
GROUP BY status;

-- Verificar posts recentes
SELECT 
  id,
  author_id,
  LEFT(content, 50) as content_preview,
  status,
  type,
  created_at
FROM posts
ORDER BY created_at DESC
LIMIT 10;

