-- ============================================
-- TABELAS PARA COMUNIDADE - PUBLICACOES E CHAT
-- Execute este arquivo no SQL Editor do Supabase
-- ============================================

-- ============================================
-- 1. TABELA DE PUBLICAÇÕES DA COMUNIDADE
-- ============================================

-- Criar tabela de publicações (se não existir)
CREATE TABLE IF NOT EXISTS posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  author_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  image TEXT,
  result_value INTEGER,
  type TEXT DEFAULT 'post' CHECK (type IN ('post', 'result')),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'deleted', 'hidden')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS posts_author_id_idx ON posts(author_id);
CREATE INDEX IF NOT EXISTS posts_created_at_idx ON posts(created_at DESC);
CREATE INDEX IF NOT EXISTS posts_status_idx ON posts(status) WHERE status = 'active';

-- Habilitar RLS (Row Level Security)
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

-- Política: todos podem ver publicações ativas
CREATE POLICY "Publicações ativas são públicas para leitura"
  ON posts FOR SELECT
  USING (status = 'active' OR auth.uid() = author_id);

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

-- Política: suporte/admin pode ver todas as publicações
CREATE POLICY "Suporte pode ver todas as publicações"
  ON posts FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('support', 'admin')
    )
  );

-- ============================================
-- 2. TABELA DE MENSAGENS DO CHAT DA COMUNIDADE
-- ============================================

-- Criar tabela de mensagens da comunidade (se não existir)
CREATE TABLE IF NOT EXISTS community_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  author_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  content TEXT,
  type TEXT DEFAULT 'text' CHECK (type IN ('text', 'audio', 'emoji', 'image')),
  image TEXT,
  audio_duration INTEGER,
  audio_url TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'deleted', 'hidden')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS community_messages_author_id_idx ON community_messages(author_id);
CREATE INDEX IF NOT EXISTS community_messages_created_at_idx ON community_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS community_messages_status_idx ON community_messages(status) WHERE status = 'active';

-- Habilitar RLS (Row Level Security)
ALTER TABLE community_messages ENABLE ROW LEVEL SECURITY;

-- Política: todos podem ver mensagens ativas
CREATE POLICY "Mensagens ativas são públicas para leitura"
  ON community_messages FOR SELECT
  USING (status = 'active' OR auth.uid() = author_id);

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

-- Política: suporte/admin pode ver todas as mensagens
CREATE POLICY "Suporte pode ver todas as mensagens"
  ON community_messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('support', 'admin')
    )
  );

-- ============================================
-- 3. TABELA DE CURTIDAS (se não existir)
-- ============================================

CREATE TABLE IF NOT EXISTS post_likes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(post_id, user_id)
);

CREATE INDEX IF NOT EXISTS post_likes_post_id_idx ON post_likes(post_id);
CREATE INDEX IF NOT EXISTS post_likes_user_id_idx ON post_likes(user_id);

ALTER TABLE post_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Curtidas são públicas para leitura"
  ON post_likes FOR SELECT
  USING (true);

CREATE POLICY "Usuários podem criar curtidas"
  ON post_likes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem deletar próprias curtidas"
  ON post_likes FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- 4. TABELA DE COMENTÁRIOS (se não existir)
-- ============================================

CREATE TABLE IF NOT EXISTS comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE NOT NULL,
  author_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'deleted', 'hidden')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS comments_post_id_idx ON comments(post_id);
CREATE INDEX IF NOT EXISTS comments_author_id_idx ON comments(author_id);
CREATE INDEX IF NOT EXISTS comments_status_idx ON comments(status) WHERE status = 'active';

ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Comentários ativos são públicos para leitura"
  ON comments FOR SELECT
  USING (status = 'active' OR auth.uid() = author_id);

CREATE POLICY "Usuários podem criar comentários"
  ON comments FOR INSERT
  WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Usuários podem atualizar próprios comentários"
  ON comments FOR UPDATE
  USING (auth.uid() = author_id);

CREATE POLICY "Usuários podem deletar próprios comentários"
  ON comments FOR DELETE
  USING (auth.uid() = author_id);

-- ============================================
-- 5. FUNÇÕES E TRIGGERS PARA ATUALIZAÇÃO AUTOMÁTICA
-- ============================================

-- Função para atualizar contador de comentários
CREATE OR REPLACE FUNCTION update_post_comments_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE posts
  SET comments_count = (
    SELECT COUNT(*) FROM comments 
    WHERE post_id = COALESCE(NEW.post_id, OLD.post_id)
    AND status = 'active'
  )
  WHERE id = COALESCE(NEW.post_id, OLD.post_id);
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar contador de comentários
DROP TRIGGER IF EXISTS update_comments_count ON comments;
CREATE TRIGGER update_comments_count
  AFTER INSERT OR UPDATE OR DELETE ON comments
  FOR EACH ROW
  EXECUTE FUNCTION update_post_comments_count();

-- Função para atualizar contador de curtidas
CREATE OR REPLACE FUNCTION update_post_likes_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE posts
  SET likes = (
    SELECT COUNT(*) FROM post_likes 
    WHERE post_id = COALESCE(NEW.post_id, OLD.post_id)
  )
  WHERE id = COALESCE(NEW.post_id, OLD.post_id);
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar contador de curtidas
DROP TRIGGER IF EXISTS update_likes_count ON post_likes;
CREATE TRIGGER update_likes_count
  AFTER INSERT OR DELETE ON post_likes
  FOR EACH ROW
  EXECUTE FUNCTION update_post_likes_count();

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para updated_at
DROP TRIGGER IF EXISTS update_posts_updated_at ON posts;
CREATE TRIGGER update_posts_updated_at
  BEFORE UPDATE ON posts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_comments_updated_at ON comments;
CREATE TRIGGER update_comments_updated_at
  BEFORE UPDATE ON comments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_community_messages_updated_at ON community_messages;
CREATE TRIGGER update_community_messages_updated_at
  BEFORE UPDATE ON community_messages
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 6. ADICIONAR COLUNAS SE NÃO EXISTIREM
-- ============================================

-- Adicionar coluna status na tabela posts (se não existir)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'posts' AND column_name = 'status'
  ) THEN
    ALTER TABLE posts ADD COLUMN status TEXT DEFAULT 'active' CHECK (status IN ('active', 'deleted', 'hidden'));
    CREATE INDEX IF NOT EXISTS posts_status_idx ON posts(status) WHERE status = 'active';
  END IF;
END $$;

-- Adicionar coluna status na tabela community_messages (se não existir)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'community_messages' AND column_name = 'status'
  ) THEN
    ALTER TABLE community_messages ADD COLUMN status TEXT DEFAULT 'active' CHECK (status IN ('active', 'deleted', 'hidden'));
    CREATE INDEX IF NOT EXISTS community_messages_status_idx ON community_messages(status) WHERE status = 'active';
  END IF;
END $$;

-- Adicionar coluna status na tabela comments (se não existir)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'comments' AND column_name = 'status'
  ) THEN
    ALTER TABLE comments ADD COLUMN status TEXT DEFAULT 'active' CHECK (status IN ('active', 'deleted', 'hidden'));
    CREATE INDEX IF NOT EXISTS comments_status_idx ON comments(status) WHERE status = 'active';
  END IF;
END $$;

-- Adicionar coluna updated_at na tabela community_messages (se não existir)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'community_messages' AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE community_messages ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
  END IF;
END $$;

-- ============================================
-- 7. VERIFICAÇÃO FINAL
-- ============================================

-- Verificar se as tabelas foram criadas corretamente
SELECT 
  'posts' as tabela,
  COUNT(*) as total_publicacoes
FROM posts
WHERE status = 'active'
UNION ALL
SELECT 
  'community_messages' as tabela,
  COUNT(*) as total_mensagens
FROM community_messages
WHERE status = 'active';

