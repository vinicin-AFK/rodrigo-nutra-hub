-- ============================================
-- CORREÇÃO DEFINITIVA: FEED GLOBAL PARA TODOS
-- Execute este arquivo no SQL Editor do Supabase
-- ============================================
-- Este script garante que TODOS os usuários vejam
-- TODAS as publicações, independente de quem criou
-- ============================================

-- ============================================
-- 1. GARANTIR QUE TODOS OS POSTS TENHAM STATUS 'active'
-- ============================================

-- Atualizar posts sem status para 'active'
UPDATE posts 
SET status = 'active' 
WHERE status IS NULL OR status = '';

-- Atualizar mensagens sem status para 'active'
UPDATE community_messages 
SET status = 'active' 
WHERE status IS NULL OR status = '';

-- ============================================
-- 2. REMOVER TODAS AS POLÍTICAS ANTIGAS DE POSTS
-- ============================================

DROP POLICY IF EXISTS "Publicações ativas são públicas para leitura" ON posts;
DROP POLICY IF EXISTS "Feed global - todos veem todas as publicações ativas" ON posts;
DROP POLICY IF EXISTS "Usuários podem criar publicações" ON posts;
DROP POLICY IF EXISTS "Usuários podem atualizar próprias publicações" ON posts;
DROP POLICY IF EXISTS "Usuários podem deletar próprias publicações" ON posts;
DROP POLICY IF EXISTS "Suporte pode ver todas as publicações" ON posts;
DROP POLICY IF EXISTS "Todos podem ver publicações ativas" ON posts;
DROP POLICY IF EXISTS "Public posts are viewable by everyone" ON posts;

-- ============================================
-- 3. CRIAR POLÍTICA GLOBAL PARA POSTS (FEED PÚBLICO)
-- ============================================

-- POLÍTICA PRINCIPAL: TODOS podem ver TODAS as publicações ativas
-- Esta é a política mais permissiva possível para garantir feed global
CREATE POLICY "Feed global - todos veem todas as publicações ativas"
  ON posts FOR SELECT
  USING (
    -- Mostrar se:
    -- 1. Status é 'active' (ou NULL para compatibilidade)
    (status = 'active' OR status IS NULL) OR
    -- 2. É o próprio autor (pode ver suas próprias publicações deletadas)
    auth.uid() = author_id
  );

-- Política: usuários autenticados podem criar publicações
CREATE POLICY "Usuários podem criar publicações"
  ON posts FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL AND 
    auth.uid() = author_id
  );

-- Política: usuários podem atualizar apenas suas próprias publicações
CREATE POLICY "Usuários podem atualizar próprias publicações"
  ON posts FOR UPDATE
  USING (auth.uid() = author_id)
  WITH CHECK (auth.uid() = author_id);

-- Política: usuários podem deletar apenas suas próprias publicações
CREATE POLICY "Usuários podem deletar próprias publicações"
  ON posts FOR DELETE
  USING (auth.uid() = author_id);

-- ============================================
-- 4. REMOVER TODAS AS POLÍTICAS ANTIGAS DE MENSAGENS
-- ============================================

DROP POLICY IF EXISTS "Mensagens ativas são públicas para leitura" ON community_messages;
DROP POLICY IF EXISTS "Chat global - todos veem todas as mensagens ativas" ON community_messages;
DROP POLICY IF EXISTS "Usuários podem criar mensagens" ON community_messages;
DROP POLICY IF EXISTS "Usuários podem atualizar próprias mensagens" ON community_messages;
DROP POLICY IF EXISTS "Usuários podem deletar próprias mensagens" ON community_messages;
DROP POLICY IF EXISTS "Suporte pode ver todas as mensagens" ON community_messages;
DROP POLICY IF EXISTS "Todos podem ver mensagens ativas" ON community_messages;

-- ============================================
-- 5. CRIAR POLÍTICA GLOBAL PARA MENSAGENS (CHAT PÚBLICO)
-- ============================================

-- POLÍTICA PRINCIPAL: TODOS podem ver TODAS as mensagens ativas
CREATE POLICY "Chat global - todos veem todas as mensagens ativas"
  ON community_messages FOR SELECT
  USING (
    -- Mostrar se:
    -- 1. Status é 'active' (ou NULL para compatibilidade)
    (status = 'active' OR status IS NULL) OR
    -- 2. É o próprio autor (pode ver suas próprias mensagens deletadas)
    auth.uid() = author_id
  );

-- Política: usuários autenticados podem criar mensagens
CREATE POLICY "Usuários podem criar mensagens"
  ON community_messages FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL AND 
    auth.uid() = author_id
  );

-- Política: usuários podem atualizar apenas suas próprias mensagens
CREATE POLICY "Usuários podem atualizar próprias mensagens"
  ON community_messages FOR UPDATE
  USING (auth.uid() = author_id)
  WITH CHECK (auth.uid() = author_id);

-- Política: usuários podem deletar apenas suas próprias mensagens
CREATE POLICY "Usuários podem deletar próprias mensagens"
  ON community_messages FOR DELETE
  USING (auth.uid() = author_id);

-- ============================================
-- 6. GARANTIR QUE RLS ESTÁ HABILITADO
-- ============================================

ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_messages ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 7. VERIFICAÇÃO FINAL
-- ============================================

-- Verificar quantas publicações existem e seus status
SELECT 
  'posts' as tabela,
  COUNT(*) as total,
  COUNT(*) FILTER (WHERE status = 'active') as ativas,
  COUNT(*) FILTER (WHERE status IS NULL) as sem_status,
  COUNT(*) FILTER (WHERE status = 'deleted') as deletadas
FROM posts
UNION ALL
SELECT 
  'community_messages' as tabela,
  COUNT(*) as total,
  COUNT(*) FILTER (WHERE status = 'active') as ativas,
  COUNT(*) FILTER (WHERE status IS NULL) as sem_status,
  COUNT(*) FILTER (WHERE status = 'deleted') as deletadas
FROM community_messages;

-- Verificar políticas criadas
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE tablename IN ('posts', 'community_messages')
ORDER BY tablename, policyname;

