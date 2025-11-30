-- ============================================
-- SETUP COMPLETO DO BANCO DE DADOS
-- ============================================

-- Tabela de perfis de usuários
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  avatar TEXT,
  level TEXT DEFAULT 'Bronze',
  points INTEGER DEFAULT 0,
  rank INTEGER DEFAULT 999,
  total_sales INTEGER DEFAULT 0,
  plan TEXT DEFAULT 'bronze',
  role TEXT DEFAULT 'user' CHECK (role IN ('user', 'support', 'admin')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para profiles
CREATE POLICY "Perfis são públicos para leitura"
  ON profiles FOR SELECT
  USING (true);

CREATE POLICY "Usuários podem atualizar próprio perfil"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Usuários podem inserir próprio perfil"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Tabela de Postagens
CREATE TABLE IF NOT EXISTS posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  author_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  image TEXT,
  likes INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  result_value INTEGER,
  type TEXT DEFAULT 'post' CHECK (type IN ('post', 'result')),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'hidden', 'deleted')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS posts_author_id_idx ON posts(author_id);
CREATE INDEX IF NOT EXISTS posts_created_at_idx ON posts(created_at DESC);
CREATE INDEX IF NOT EXISTS posts_status_idx ON posts(status);

-- RLS para posts
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Postagens ativas são públicas para leitura"
  ON posts FOR SELECT
  USING (status = 'active');

CREATE POLICY "Usuários podem criar postagens"
  ON posts FOR INSERT
  WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Usuários podem atualizar próprias postagens"
  ON posts FOR UPDATE
  USING (auth.uid() = author_id);

CREATE POLICY "Usuários podem deletar próprias postagens"
  ON posts FOR DELETE
  USING (auth.uid() = author_id);

-- Tabela de Curtidas
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

-- Tabela de Comentários
CREATE TABLE IF NOT EXISTS comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE NOT NULL,
  author_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'hidden', 'deleted')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS comments_post_id_idx ON comments(post_id);
CREATE INDEX IF NOT EXISTS comments_author_id_idx ON comments(author_id);
CREATE INDEX IF NOT EXISTS comments_status_idx ON comments(status);

ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Comentários ativos são públicos para leitura"
  ON comments FOR SELECT
  USING (status = 'active');

CREATE POLICY "Usuários podem criar comentários"
  ON comments FOR INSERT
  WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Usuários podem atualizar próprios comentários"
  ON comments FOR UPDATE
  USING (auth.uid() = author_id);

CREATE POLICY "Usuários podem deletar próprios comentários"
  ON comments FOR DELETE
  USING (auth.uid() = author_id);

-- Tabela de Mensagens da Comunidade
CREATE TABLE IF NOT EXISTS community_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  author_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  content TEXT,
  type TEXT DEFAULT 'text' CHECK (type IN ('text', 'audio', 'emoji', 'image')),
  image TEXT,
  audio_duration INTEGER,
  audio_url TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'hidden', 'deleted')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS community_messages_created_at_idx ON community_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS community_messages_status_idx ON community_messages(status);

ALTER TABLE community_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Mensagens ativas são públicas para leitura"
  ON community_messages FOR SELECT
  USING (status = 'active');

CREATE POLICY "Usuários autenticados podem criar mensagens"
  ON community_messages FOR INSERT
  WITH CHECK (auth.uid() = author_id);

-- Tabela de Conquistas
CREATE TABLE IF NOT EXISTS achievements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  achievement_id TEXT NOT NULL,
  unlocked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, achievement_id)
);

CREATE INDEX IF NOT EXISTS achievements_user_id_idx ON achievements(user_id);

ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Conquistas são públicas para leitura"
  ON achievements FOR SELECT
  USING (true);

CREATE POLICY "Usuários podem criar próprias conquistas"
  ON achievements FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Tabela de Stats do Usuário
CREATE TABLE IF NOT EXISTS user_stats (
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE PRIMARY KEY,
  posts_count INTEGER DEFAULT 0,
  likes_received INTEGER DEFAULT 0,
  prizes_redeemed INTEGER DEFAULT 0,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE user_stats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Stats são públicos para leitura"
  ON user_stats FOR SELECT
  USING (true);

CREATE POLICY "Usuários podem atualizar próprios stats"
  ON user_stats FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem inserir próprios stats"
  ON user_stats FOR INSERT
  WITH CHECK (auth.uid() = user_id);

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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para atualizar contador de comentários
DROP TRIGGER IF EXISTS update_comments_count ON comments;
CREATE TRIGGER update_comments_count
  AFTER INSERT OR DELETE OR UPDATE ON comments
  FOR EACH ROW
  EXECUTE FUNCTION update_post_comments_count();

-- Função para atualizar contador de curtidas
CREATE OR REPLACE FUNCTION update_post_likes_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE posts
  SET likes = (
    SELECT COUNT(*) FROM post_likes WHERE post_id = COALESCE(NEW.post_id, OLD.post_id)
  )
  WHERE id = COALESCE(NEW.post_id, OLD.post_id);
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para atualizar contador de curtidas
DROP TRIGGER IF EXISTS update_likes_count ON post_likes;
CREATE TRIGGER update_likes_count
  AFTER INSERT OR DELETE ON post_likes
  FOR EACH ROW
  EXECUTE FUNCTION update_post_likes_count();

-- Função para criar perfil quando usuário se registra
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email, avatar)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', 'Usuário'),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'avatar', 'https://ui-avatars.com/api/?name=' || COALESCE(NEW.raw_user_meta_data->>'name', 'Usuario') || '&background=random')
  );
  
  INSERT INTO public.user_stats (user_id)
  VALUES (NEW.id);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para criar perfil automaticamente
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Função para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para atualizar updated_at
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

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