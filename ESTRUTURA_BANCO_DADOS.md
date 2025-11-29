# 📊 Estrutura de Banco de Dados - Comunidade Global

## 🔄 Comparação: Schema Prisma vs Supabase Atual

### Schema Prisma (Modelo de Referência)
```prisma
model User {
  id        String   @id @default(cuid())
  name      String
  email     String   @unique
  password  String
  posts     Post[]
  messages  CommunityMessage[]
  comments  Comment[]
  likes     Like[]
}

model Post {
  id        String     @id @default(cuid())
  content   String
  imageUrl  String?
  createdAt DateTime    @default(now())
  user      User        @relation(fields: [userId], references: [id])
  userId    String
  comments  Comment[]
  likes     Like[]
}

model Comment {
  id        String   @id @default(cuid())
  content   String
  createdAt DateTime @default(now())
  post      Post     @relation(fields: [postId], references: [id])
  postId    String
  user      User     @relation(fields: [userId], references: [id])
  userId    String
}

model Like {
  id        String   @id @default(cuid())
  post      Post     @relation(fields: [postId], references: [id])
  postId    String
  user      User     @relation(fields: [userId], references: [id])
  userId    String
}

model CommunityMessage {
  id        String   @id @default(cuid())
  message   String
  createdAt DateTime @default(now())
  user      User     @relation(fields: [userId], references: [id])
  userId    String
}
```

### Estrutura Supabase Atual (PostgreSQL)

#### Tabela: `profiles` (equivale a `User`)
```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  avatar TEXT,
  level TEXT DEFAULT 'Bronze',
  points INTEGER DEFAULT 0,
  rank INTEGER DEFAULT 999,
  total_sales INTEGER DEFAULT 0,
  role TEXT DEFAULT 'user',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### Tabela: `posts` (equivale a `Post`)
```sql
CREATE TABLE posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  author_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,  -- equivale a userId
  content TEXT NOT NULL,
  image TEXT,                                                          -- equivale a imageUrl
  result_value INTEGER,
  type TEXT DEFAULT 'post',
  status TEXT DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),                  -- equivale a createdAt
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### Tabela: `comments` (equivale a `Comment`)
```sql
CREATE TABLE comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE NOT NULL,       -- equivale a postId
  author_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,  -- equivale a userId
  content TEXT NOT NULL,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),                  -- equivale a createdAt
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### Tabela: `post_likes` (equivale a `Like`)
```sql
CREATE TABLE post_likes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE NOT NULL,       -- equivale a postId
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,     -- equivale a userId
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(post_id, user_id)
);
```

#### Tabela: `community_messages` (equivale a `CommunityMessage`)
```sql
CREATE TABLE community_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  author_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL, -- equivale a userId
  content TEXT,                                                        -- equivale a message
  type TEXT DEFAULT 'text',
  image TEXT,
  audio_duration INTEGER,
  audio_url TEXT,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),                  -- equivale a createdAt
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## 🔑 Mapeamento de Campos

| Prisma | Supabase | Observação |
|--------|----------|------------|
| `User.id` | `profiles.id` | UUID no Supabase |
| `User.name` | `profiles.name` | ✅ |
| `User.email` | `profiles.email` | ✅ |
| `Post.userId` | `posts.author_id` | ✅ |
| `Post.imageUrl` | `posts.image` | ✅ |
| `Post.createdAt` | `posts.created_at` | ✅ |
| `Comment.postId` | `comments.post_id` | ✅ |
| `Comment.userId` | `comments.author_id` | ✅ |
| `Comment.createdAt` | `comments.created_at` | ✅ |
| `Like.postId` | `post_likes.post_id` | ✅ |
| `Like.userId` | `post_likes.user_id` | ✅ |
| `CommunityMessage.userId` | `community_messages.author_id` | ✅ |
| `CommunityMessage.message` | `community_messages.content` | ✅ |
| `CommunityMessage.createdAt` | `community_messages.created_at` | ✅ |

## ✅ Princípios de Comunidade Global Implementados

### 1. Feed Global (`posts`)
- ✅ **Sem filtro por usuário**: Busca TODAS as postagens
- ✅ **Ordenação**: `created_at DESC` (mais recentes primeiro)
- ✅ **Relacionamentos**: `author_id` → `profiles.id` (não filtra por usuário)
- ✅ **Comentários globais**: `comments.post_id` → `posts.id`
- ✅ **Curtidas globais**: `post_likes.post_id` → `posts.id`

### 2. Chat Global (`community_messages`)
- ✅ **Sala única**: Apenas uma tabela para todos
- ✅ **Sem rooms**: Não há separação por usuário
- ✅ **Relacionamento**: `author_id` → `profiles.id` (apenas para identificar autor)
- ✅ **Real-time**: Supabase Realtime sincroniza para todos

### 3. Comentários Globais (`comments`)
- ✅ **Pertencem ao post**: `post_id` → `posts.id`
- ✅ **Visíveis para todos**: Sem filtro por usuário
- ✅ **Autor identificado**: `author_id` → `profiles.id` (apenas para exibição)

### 4. Curtidas Globais (`post_likes`)
- ✅ **Pertencem ao post**: `post_id` → `posts.id`
- ✅ **Visíveis para todos**: Sem filtro por usuário
- ✅ **Única por usuário**: `UNIQUE(post_id, user_id)` (evita duplicação)

## 🚫 O que NÃO fazer (Erros Comuns)

### ❌ ERRADO - Filtrar por usuário
```sql
-- ❌ NUNCA fazer isso
SELECT * FROM posts WHERE author_id = 'user-id-here';
SELECT * FROM community_messages WHERE author_id = 'user-id-here';
```

### ❌ ERRADO - Criar feeds individuais
```typescript
// ❌ NUNCA fazer isso
const userPosts = posts.filter(p => p.author.id === currentUser.id);
```

### ❌ ERRADO - Criar chats separados
```sql
-- ❌ NUNCA fazer isso
CREATE TABLE user_chat_rooms (...);
```

## ✅ O que SEMPRE fazer (Correto)

### ✅ CORRETO - Buscar tudo
```sql
-- ✅ SEMPRE fazer isso
SELECT * FROM posts ORDER BY created_at DESC;
SELECT * FROM community_messages ORDER BY created_at DESC;
```

### ✅ CORRETO - Feed global
```typescript
// ✅ SEMPRE fazer isso
const globalPosts = posts; // Todos os posts, sem filtro
```

## 📝 Notas Importantes

1. **Nomenclatura diferente**: Supabase usa `snake_case` (author_id, created_at), Prisma usa `camelCase` (userId, createdAt)
2. **Estrutura equivalente**: A lógica é a mesma, apenas a nomenclatura muda
3. **Comunidade global**: Ambos os modelos suportam comunidade global (sem filtros por usuário)
4. **Relacionamentos**: Todos os relacionamentos estão corretos e suportam feed/chat global

## 🔄 Conversão de Nomes

O código atual já está usando os nomes corretos do Supabase:
- `author_id` (não `userId`)
- `created_at` (não `createdAt`)
- `image` (não `imageUrl`)
- `content` (não `message`)

Tudo está funcionando corretamente! ✅

