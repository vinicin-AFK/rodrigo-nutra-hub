# 🚀 Guia Completo: Integração com Supabase

## Passo 1: Criar Conta no Supabase

1. Acesse [https://supabase.com](https://supabase.com)
2. Clique em "Start your project"
3. Faça login com GitHub ou crie uma conta
4. Crie um novo projeto:
   - Escolha um nome (ex: "nutraelite")
   - Escolha uma senha forte para o banco de dados
   - Escolha uma região próxima (ex: South America - São Paulo)
   - Aguarde a criação do projeto (2-3 minutos)

## Passo 2: Obter Credenciais

1. No dashboard do Supabase, vá em **Settings** → **API**
2. Copie as seguintes informações:
   - **Project URL** (ex: `https://xxxxx.supabase.co`)
   - **anon/public key** (chave pública)
   - **service_role key** (chave privada - mantenha segura!)

## Passo 3: Instalar Dependências

```bash
npm install @supabase/supabase-js
```

## Passo 4: Configurar Variáveis de Ambiente

Crie um arquivo `.env.local` na raiz do projeto:

```env
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=sua-chave-publica-aqui
```

⚠️ **IMPORTANTE**: Adicione `.env.local` ao `.gitignore` para não commitar suas credenciais!

## Passo 5: Criar Cliente Supabase

Crie o arquivo `src/lib/supabase.ts`:

```typescript
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Variáveis de ambiente do Supabase não configuradas!');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
```

## Passo 6: Criar Tabelas no Supabase

No dashboard do Supabase, vá em **SQL Editor** e execute os seguintes comandos:

### Tabela de Usuários (extensão do auth.users)
```sql
-- Tabela de perfis de usuários
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  avatar TEXT,
  level TEXT DEFAULT 'Bronze',
  points INTEGER DEFAULT 0,
  rank INTEGER DEFAULT 999,
  total_sales INTEGER DEFAULT 0,
  plan TEXT DEFAULT 'bronze',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS (Row Level Security)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Política: usuários podem ver todos os perfis
CREATE POLICY "Perfis são públicos para leitura"
  ON profiles FOR SELECT
  USING (true);

-- Política: usuários podem atualizar apenas seu próprio perfil
CREATE POLICY "Usuários podem atualizar próprio perfil"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);
```

### Tabela de Postagens
```sql
CREATE TABLE IF NOT EXISTS posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  author_id UUID REFERENCES profiles(id) NOT NULL,
  content TEXT NOT NULL,
  image TEXT,
  likes INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  result_value INTEGER,
  type TEXT DEFAULT 'post' CHECK (type IN ('post', 'result')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS posts_author_id_idx ON posts(author_id);
CREATE INDEX IF NOT EXISTS posts_created_at_idx ON posts(created_at DESC);

-- RLS
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

-- Política: todos podem ver postagens
CREATE POLICY "Postagens são públicas para leitura"
  ON posts FOR SELECT
  USING (true);

-- Política: usuários autenticados podem criar postagens
CREATE POLICY "Usuários podem criar postagens"
  ON posts FOR INSERT
  WITH CHECK (auth.uid() = author_id);

-- Política: usuários podem atualizar apenas suas postagens
CREATE POLICY "Usuários podem atualizar próprias postagens"
  ON posts FOR UPDATE
  USING (auth.uid() = author_id);
```

### Tabela de Curtidas
```sql
CREATE TABLE IF NOT EXISTS post_likes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) NOT NULL,
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
```

### Tabela de Comentários
```sql
CREATE TABLE IF NOT EXISTS comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE NOT NULL,
  author_id UUID REFERENCES profiles(id) NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS comments_post_id_idx ON comments(post_id);
CREATE INDEX IF NOT EXISTS comments_author_id_idx ON comments(author_id);

ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Comentários são públicos para leitura"
  ON comments FOR SELECT
  USING (true);

CREATE POLICY "Usuários podem criar comentários"
  ON comments FOR INSERT
  WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Usuários podem atualizar próprios comentários"
  ON comments FOR UPDATE
  USING (auth.uid() = author_id);

CREATE POLICY "Usuários podem deletar próprios comentários"
  ON comments FOR DELETE
  USING (auth.uid() = author_id);
```

### Tabela de Mensagens da Comunidade
```sql
CREATE TABLE IF NOT EXISTS community_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  author_id UUID REFERENCES profiles(id) NOT NULL,
  content TEXT,
  type TEXT DEFAULT 'text' CHECK (type IN ('text', 'audio', 'emoji', 'image')),
  image TEXT,
  audio_duration INTEGER,
  audio_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS community_messages_created_at_idx ON community_messages(created_at DESC);

ALTER TABLE community_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Mensagens são públicas para leitura"
  ON community_messages FOR SELECT
  USING (true);

CREATE POLICY "Usuários autenticados podem criar mensagens"
  ON community_messages FOR INSERT
  WITH CHECK (auth.uid() = author_id);
```

### Tabela de Conquistas
```sql
CREATE TABLE IF NOT EXISTS achievements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) NOT NULL,
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
```

### Tabela de Stats do Usuário
```sql
CREATE TABLE IF NOT EXISTS user_stats (
  user_id UUID REFERENCES profiles(id) PRIMARY KEY,
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
```

## Passo 7: Trigger para Atualizar Contadores

```sql
-- Função para atualizar contador de comentários
CREATE OR REPLACE FUNCTION update_post_comments_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE posts
  SET comments_count = (
    SELECT COUNT(*) FROM comments WHERE post_id = NEW.post_id
  )
  WHERE id = NEW.post_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_comments_count
  AFTER INSERT OR DELETE ON comments
  FOR EACH ROW
  EXECUTE FUNCTION update_post_comments_count();

-- Função para atualizar contador de curtidas
CREATE OR REPLACE FUNCTION update_post_likes_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE posts
  SET likes = (
    SELECT COUNT(*) FROM post_likes WHERE post_id = NEW.post_id
  )
  WHERE id = NEW.post_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_likes_count
  AFTER INSERT OR DELETE ON post_likes
  FOR EACH ROW
  EXECUTE FUNCTION update_post_likes_count();
```

## Passo 8: Função para Criar Perfil Automaticamente

```sql
-- Função para criar perfil quando usuário se registra
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email, avatar)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', 'Usuário'),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'avatar', NULL)
  );
  
  INSERT INTO public.user_stats (user_id)
  VALUES (NEW.id);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para criar perfil automaticamente
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
```

## Próximos Passos

Agora você precisa:

1. ✅ Instalar `@supabase/supabase-js`
2. ✅ Configurar variáveis de ambiente
3. ✅ Criar o cliente Supabase
4. ✅ Executar os SQLs acima no Supabase
5. 🔄 Atualizar o código para usar Supabase em vez de localStorage

Veja o arquivo `INTEGRACAO_SUPABASE.md` para o código de integração!

