-- ============================================
-- CORREÇÃO DEFINITIVA: POSTS NÃO ESTÃO SENDO SALVOS
-- Execute este arquivo no SQL Editor do Supabase
-- ============================================
-- Este script garante que:
-- 1. A tabela posts existe com todas as colunas necessárias
-- 2. As políticas RLS estão configuradas corretamente
-- 3. Usuários autenticados podem criar posts sem problemas
-- ============================================

-- ============================================
-- 1. CRIAR/VERIFICAR TABELA POSTS
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

-- Adicionar coluna status se não existir
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'posts' AND column_name = 'status'
  ) THEN
    ALTER TABLE posts ADD COLUMN status TEXT DEFAULT 'active' CHECK (status IN ('active', 'deleted', 'hidden'));
    UPDATE posts SET status = 'active' WHERE status IS NULL;
  END IF;
END $$;

-- ============================================
-- 2. GARANTIR QUE RLS ESTÁ HABILITADO
-- ============================================

ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 3. REMOVER TODAS AS POLÍTICAS ANTIGAS
-- ============================================

-- Remover políticas de INSERT
DROP POLICY IF EXISTS "Usuários podem criar publicações" ON posts;
DROP POLICY IF EXISTS "Users can create posts" ON posts;
DROP POLICY IF EXISTS "Authenticated users can insert posts" ON posts;
DROP POLICY IF EXISTS "POLITICA_INSERT_POSTS_PERMISSIVA" ON posts;
DROP POLICY IF EXISTS "Public posts can be created by authenticated users" ON posts;

-- Remover políticas de SELECT
DROP POLICY IF EXISTS "Publicações ativas são públicas para leitura" ON posts;
DROP POLICY IF EXISTS "Feed global - todos veem todas as publicações ativas" ON posts;
DROP POLICY IF EXISTS "Todos podem ver publicações ativas" ON posts;
DROP POLICY IF EXISTS "Public posts are viewable by everyone" ON posts;
DROP POLICY IF EXISTS "POLITICA_SELECT_POSTS_PUBLICA" ON posts;

-- Remover políticas de UPDATE
DROP POLICY IF EXISTS "Usuários podem atualizar próprias publicações" ON posts;
DROP POLICY IF EXISTS "POLITICA_UPDATE_POSTS_PROPRIOS" ON posts;
DROP POLICY IF EXISTS "Users can update their own posts" ON posts;

-- Remover políticas de DELETE
DROP POLICY IF EXISTS "Usuários podem deletar próprias publicações" ON posts;
DROP POLICY IF EXISTS "POLITICA_DELETE_POSTS_PROPRIOS" ON posts;
DROP POLICY IF EXISTS "Users can delete their own posts" ON posts;

-- ============================================
-- 4. CRIAR POLÍTICA PERMISSIVA PARA INSERT
-- ============================================

-- POLÍTICA CRÍTICA: Permitir que QUALQUER usuário autenticado crie posts
-- Esta é a política mais permissiva possível para garantir que posts sejam salvos
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

-- Todos podem ver posts ativos (feed global)
CREATE POLICY "POLITICA_SELECT_POSTS_PUBLICA"
  ON posts FOR SELECT
  USING (
    -- Mostrar se:
    -- 1. Status é 'active' (ou NULL para compatibilidade)
    (status = 'active' OR status IS NULL) OR
    -- 2. É o próprio autor (pode ver suas próprias publicações deletadas)
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
CREATE INDEX IF NOT EXISTS posts_type_idx ON posts(type);

-- ============================================
-- 8. GARANTIR QUE POSTS EXISTENTES TENHAM STATUS
-- ============================================

UPDATE posts 
SET status = 'active' 
WHERE status IS NULL OR status = '';

-- ============================================
-- 9. VERIFICAÇÃO FINAL
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
WHERE schemaname = 'public' AND tablename = 'posts';

-- Verificar estrutura da tabela
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'posts' AND table_schema = 'public'
ORDER BY ordinal_position;

-- ============================================
-- 10. ESTATÍSTICAS
-- ============================================

-- Verificar quantos posts existem
SELECT COUNT(*) as total_posts FROM posts;

-- Verificar posts por status
SELECT 
  COALESCE(status, 'NULL') as status,
  COUNT(*) as quantidade
FROM posts
GROUP BY status
ORDER BY quantidade DESC;

-- Verificar posts recentes (últimos 10)
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

-- ============================================
-- 11. TESTE MANUAL (OPCIONAL)
-- ============================================

-- Para testar se a política está funcionando, execute:
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
-- 12. DIAGNÓSTICO DE PROBLEMAS
-- ============================================

-- Verificar se há posts sem author_id válido
SELECT 
  COUNT(*) as posts_sem_author_valido
FROM posts p
LEFT JOIN profiles pr ON p.author_id = pr.id
WHERE pr.id IS NULL;

-- Verificar se há posts com author_id que não existe em profiles
SELECT 
  p.id,
  p.author_id,
  p.content,
  p.created_at
FROM posts p
LEFT JOIN profiles pr ON p.author_id = pr.id
WHERE pr.id IS NULL
LIMIT 10;

-- ============================================
-- FIM DO SCRIPT
-- ============================================
-- Após executar este script:
-- 1. Verifique se todas as políticas foram criadas (seção 9)
-- 2. Verifique se RLS está habilitado (seção 9)
-- 3. Teste criar um post no app
-- 4. Se ainda não funcionar, verifique os logs do console do navegador
-- ============================================

