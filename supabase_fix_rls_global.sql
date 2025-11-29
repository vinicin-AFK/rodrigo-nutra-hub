-- ============================================
-- CORREÇÃO DAS POLÍTICAS RLS PARA FEED GLOBAL
-- Execute este arquivo no SQL Editor do Supabase
-- ============================================

-- ============================================
-- 1. CORRIGIR POLÍTICAS DE POSTS
-- ============================================

-- Remover políticas existentes (incluindo a nova que pode já existir)
DROP POLICY IF EXISTS "Publicações ativas são públicas para leitura" ON posts;
DROP POLICY IF EXISTS "Feed global - todos veem todas as publicações ativas" ON posts;
DROP POLICY IF EXISTS "Usuários podem criar publicações" ON posts;
DROP POLICY IF EXISTS "Usuários podem atualizar próprias publicações" ON posts;
DROP POLICY IF EXISTS "Usuários podem deletar próprias publicações" ON posts;
DROP POLICY IF EXISTS "Suporte pode ver todas as publicações" ON posts;

-- NOVA POLÍTICA: TODOS podem ver TODAS as publicações ativas (feed global)
CREATE POLICY "Feed global - todos veem todas as publicações ativas"
  ON posts FOR SELECT
  USING (
    status = 'active' OR 
    status IS NULL OR 
    auth.uid() = author_id
  );

-- Política: usuários autenticados podem criar publicações
CREATE POLICY "Usuários podem criar publicações"
  ON posts FOR INSERT
  WITH CHECK (auth.uid() = author_id);

-- Política: usuários podem atualizar apenas suas próprias publicações
CREATE POLICY "Usuários podem atualizar próprias publicações"
  ON posts FOR UPDATE
  USING (auth.uid() = author_id);

-- Política: usuários podem deletar apenas suas próprias publicações
CREATE POLICY "Usuários podem deletar próprias publicações"
  ON posts FOR DELETE
  USING (auth.uid() = author_id);

-- ============================================
-- 2. CORRIGIR POLÍTICAS DE MENSAGENS
-- ============================================

-- Remover políticas existentes (incluindo a nova que pode já existir)
DROP POLICY IF EXISTS "Mensagens ativas são públicas para leitura" ON community_messages;
DROP POLICY IF EXISTS "Chat global - todos veem todas as mensagens ativas" ON community_messages;
DROP POLICY IF EXISTS "Usuários podem criar mensagens" ON community_messages;
DROP POLICY IF EXISTS "Usuários podem atualizar próprias mensagens" ON community_messages;
DROP POLICY IF EXISTS "Usuários podem deletar próprias mensagens" ON community_messages;
DROP POLICY IF EXISTS "Suporte pode ver todas as mensagens" ON community_messages;

-- NOVA POLÍTICA: TODOS podem ver TODAS as mensagens ativas (chat global)
CREATE POLICY "Chat global - todos veem todas as mensagens ativas"
  ON community_messages FOR SELECT
  USING (
    status = 'active' OR 
    status IS NULL OR 
    auth.uid() = author_id
  );

-- Política: usuários autenticados podem criar mensagens
CREATE POLICY "Usuários podem criar mensagens"
  ON community_messages FOR INSERT
  WITH CHECK (auth.uid() = author_id);

-- Política: usuários podem atualizar apenas suas próprias mensagens
CREATE POLICY "Usuários podem atualizar próprias mensagens"
  ON community_messages FOR UPDATE
  USING (auth.uid() = author_id);

-- Política: usuários podem deletar apenas suas próprias mensagens
CREATE POLICY "Usuários podem deletar próprias mensagens"
  ON community_messages FOR DELETE
  USING (auth.uid() = author_id);

-- ============================================
-- 3. GARANTIR QUE TODOS OS POSTS TENHAM STATUS 'active'
-- ============================================

-- Atualizar posts sem status para 'active'
UPDATE posts 
SET status = 'active' 
WHERE status IS NULL;

-- Atualizar mensagens sem status para 'active'
UPDATE community_messages 
SET status = 'active' 
WHERE status IS NULL;

-- ============================================
-- 4. VERIFICAÇÃO
-- ============================================

-- Verificar quantas publicações ativas existem
SELECT 
  'posts' as tabela,
  COUNT(*) as total,
  COUNT(*) FILTER (WHERE status = 'active') as ativas,
  COUNT(*) FILTER (WHERE status IS NULL) as sem_status
FROM posts
UNION ALL
SELECT 
  'community_messages' as tabela,
  COUNT(*) as total,
  COUNT(*) FILTER (WHERE status = 'active') as ativas,
  COUNT(*) FILTER (WHERE status IS NULL) as sem_status
FROM community_messages;

