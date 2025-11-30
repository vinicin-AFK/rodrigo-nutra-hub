# 📋 Informações do Backend e Endpoints

## 🔗 URL do Backend

**Backend:** Supabase (BaaS - Backend as a Service)

**URL Base:** Configurada via variável de ambiente `VITE_SUPABASE_URL`

**Arquivo de Configuração:** `.env.local` (na raiz do projeto)

```env
VITE_SUPABASE_URL=https://kfyzcqaerlwqcmlbcgts.supabase.co
VITE_SUPABASE_ANON_KEY=sua_chave_anon_aqui
```

**Código de Configuração:**
```typescript
// src/lib/supabase.ts
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl!, supabaseAnonKey!, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  }
});
```

**⚠️ IMPORTANTE:**
- URL deve ser pública (não localhost)
- Todos os dispositivos devem usar a mesma URL
- URL é validada no código para evitar uso de IPs locais

---

## 🗄️ Banco de Dados

**Tipo:** PostgreSQL (gerenciado pelo Supabase)

**Host:** Gerenciado pelo Supabase (não exposto diretamente)

**Acesso:** Via Supabase Client SDK (REST API + Realtime)

**Tabelas Principais:**
- `profiles` - Perfis de usuários
- `posts` - Publicações do feed global
- `comments` - Comentários dos posts
- `post_likes` - Curtidas dos posts
- `community_messages` - Mensagens do chat global
- `user_stats` - Estatísticas dos usuários
- `achievements` - Conquistas desbloqueadas

**Segurança:** Row Level Security (RLS) habilitado em todas as tabelas

---

## 📡 Endpoint do Feed

### Código Completo

**Arquivo:** `src/hooks/usePosts.ts`

**Função:** `syncWithSupabase()`

```typescript
// Buscar TODAS as postagens (feed global - sem filtro por usuário)
const supabasePromise = supabase
  .from('posts')
  .select(`
    id,
    author_id,
    content,
    image,
    result_value,
    type,
    created_at,
    status,
    author:profiles(id, name, avatar, level, points, rank, total_sales, role)
  `)
  // FEED GLOBAL: Sem filtro de usuário - todos veem o mesmo conteúdo
  .order('created_at', { ascending: false })  // Mais recentes primeiro
  .limit(500); // Limite alto para mostrar mais posts da comunidade

// Buscar TODAS as curtidas (globais - sem filtro por usuário)
const { data: likesData } = await supabase
  .from('post_likes')
  .select('post_id, user_id')
  .in('post_id', postIds); // Sem filtro por usuário - todas as curtidas

// Buscar TODOS os comentários (globais - sem filtro por usuário)
const { data: commentsData } = await supabase
  .from('comments')
  .select(`
    id,
    post_id,
    author_id,
    content,
    created_at,
    status,
    author:profiles(id, name, avatar, level, points, rank, total_sales, role)
  `)
  .in('post_id', postIds) // Sem filtro por usuário - todos os comentários
  .order('created_at', { ascending: true }); // Ordenar por data (mais antigos primeiro)
```

### Endpoint REST Equivalente

**URL:** `https://kfyzcqaerlwqcmlbcgts.supabase.co/rest/v1/posts`

**Método:** `GET`

**Headers:**
```
apikey: VITE_SUPABASE_ANON_KEY
Authorization: Bearer <token>
```

**Query Parameters:**
```
select=id,author_id,content,image,result_value,type,created_at,status,author:profiles(*)
order=created_at.desc
limit=500
```

**Resposta:**
```json
[
  {
    "id": "uuid",
    "author_id": "uuid",
    "content": "Texto do post",
    "image": "url_imagem",
    "result_value": 123,
    "type": "post",
    "created_at": "2024-01-01T00:00:00Z",
    "status": "active",
    "author": {
      "id": "uuid",
      "name": "Nome do Autor",
      "avatar": "url_avatar",
      "level": "Bronze",
      "points": 1000,
      "rank": 1,
      "total_sales": 50000,
      "role": "user"
    }
  }
]
```

### Real-time Subscription

```typescript
// src/hooks/usePosts.ts
const subscription = supabase
  .channel('posts_changes')
  .on('postgres_changes',
    { event: '*', schema: 'public', table: 'posts' },
    (payload) => {
      console.log('🔄 Real-time: Nova postagem detectada');
      loadPosts(false); // Recarregar feed global
    }
  )
  .on('postgres_changes',
    { event: '*', schema: 'public', table: 'comments' },
    (payload) => {
      console.log('🔄 Real-time: Novo comentário detectado');
      loadPosts(false);
    }
  )
  .on('postgres_changes',
    { event: '*', schema: 'public', table: 'post_likes' },
    (payload) => {
      console.log('🔄 Real-time: Nova curtida detectada');
      loadPosts(false);
    }
  )
  .subscribe();
```

---

## 💬 Endpoint do Chat

### Código Completo

**Arquivo:** `src/hooks/useCommunityMessages.ts`

**Função:** `syncWithSupabase()`

```typescript
// Buscar TODAS as mensagens (chat global - sem filtro por usuário)
const supabasePromise = supabase
  .from('community_messages')
  .select(`
    id,
    author_id,
    content,
    type,
    image,
    audio_duration,
    audio_url,
    created_at,
    status,
    author:profiles(id, name, avatar, role)
  `)
  // CHAT GLOBAL: Sem filtro de usuário - todos veem o mesmo chat
  .order('created_at', { ascending: true })  // Ordem cronológica (mais antigas primeiro)
  .limit(500); // Limite alto para mostrar mais mensagens da comunidade
```

### Endpoint REST Equivalente

**URL:** `https://kfyzcqaerlwqcmlbcgts.supabase.co/rest/v1/community_messages`

**Método:** `GET`

**Headers:**
```
apikey: VITE_SUPABASE_ANON_KEY
Authorization: Bearer <token>
```

**Query Parameters:**
```
select=id,author_id,content,type,image,audio_duration,audio_url,created_at,status,author:profiles(*)
order=created_at.asc
limit=500
```

**Resposta:**
```json
[
  {
    "id": "uuid",
    "author_id": "uuid",
    "content": "Mensagem do chat",
    "type": "text",
    "image": "url_imagem",
    "audio_duration": 10,
    "audio_url": "url_audio",
    "created_at": "2024-01-01T00:00:00Z",
    "status": "active",
    "author": {
      "id": "uuid",
      "name": "Nome do Autor",
      "avatar": "url_avatar",
      "role": "user"
    }
  }
]
```

### Real-time Subscription

```typescript
// src/hooks/useCommunityMessages.ts
const subscription = supabase
  .channel('community_messages_changes')
  .on('postgres_changes',
    { event: '*', schema: 'public', table: 'community_messages' },
    (payload) => {
      console.log('🔄 Nova mensagem detectada via Realtime');
      setTimeout(() => {
        loadMessages(false); // Recarregar chat global
      }, 300);
    }
  )
  .subscribe();
```

---

## 🌐 URLs do App (Dev/Prod)

### Desenvolvimento (Dev)

**Comando:** `npm run dev`

**URL Local:** `http://localhost:8080` (porta configurada no vite.config.ts)

**Configuração:** `vite.config.ts`

```typescript
// vite.config.ts
export default defineConfig({
  server: {
    host: "::",
    port: 8080, // Porta configurada
  },
  plugins: [react()],
});
```

**Acesso na Rede Local:**
- `http://<seu-ip-local>:8080`
- Exemplo: `http://192.168.1.100:8080`

### Produção (Prod)

**Build:** `npm run build`

**Deploy:** Vercel (configurado no `package.json`)

**Comandos de Deploy:**
```bash
npm run deploy        # Deploy em produção
npm run deploy:preview # Deploy em preview
```

**URLs de Produção:**
- Configuradas no Vercel Dashboard
- Geralmente: `https://seu-app.vercel.app`

**Variáveis de Ambiente em Produção:**
- Configuradas no Vercel Dashboard
- Devem ser as mesmas do `.env.local`:
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_ANON_KEY`

---

## 📝 Resumo das URLs

### Backend (Supabase)
- **URL:** `https://kfyzcqaerlwqcmlbcgts.supabase.co`
- **REST API:** `https://kfyzcqaerlwqcmlbcgts.supabase.co/rest/v1/`
- **Realtime:** `wss://kfyzcqaerlwqcmlbcgts.supabase.co/realtime/v1/`

### Frontend (App)
- **Dev:** `http://localhost:8080`
- **Prod:** Configurado no Vercel (ex: `https://seu-app.vercel.app`)

### Endpoints Específicos
- **Feed:** `GET /rest/v1/posts?select=*&order=created_at.desc&limit=500`
- **Chat:** `GET /rest/v1/community_messages?select=*&order=created_at.asc&limit=500`
- **Criar Post:** `POST /rest/v1/posts`
- **Enviar Mensagem:** `POST /rest/v1/community_messages`

---

## 🔐 Autenticação

**Método:** Supabase Auth (JWT)

**Storage:** `localStorage` (persistSession: true)

**Token:** Automático via Supabase Client SDK

**Headers Necessários:**
```
apikey: VITE_SUPABASE_ANON_KEY
Authorization: Bearer <jwt_token>
```

---

## 📊 Estrutura de Dados

### Post
```typescript
{
  id: string;
  author_id: string;
  content: string;
  image?: string;
  result_value?: number;
  type: 'post' | 'result';
  created_at: string;
  status: 'active' | 'deleted';
  author: {
    id: string;
    name: string;
    avatar?: string;
    level: string;
    points: number;
    rank: number;
    total_sales: number;
    role?: 'user' | 'support' | 'admin';
  };
}
```

### Message
```typescript
{
  id: string;
  author_id: string;
  content: string;
  type: 'text' | 'image' | 'audio' | 'emoji';
  image?: string;
  audio_duration?: number;
  audio_url?: string;
  created_at: string;
  status: 'active' | 'deleted';
  author: {
    id: string;
    name: string;
    avatar?: string;
    role?: 'user' | 'support' | 'admin';
  };
}
```

---

## ✅ Checklist de Verificação

- [ ] `.env.local` tem `VITE_SUPABASE_URL` configurado
- [ ] `.env.local` tem `VITE_SUPABASE_ANON_KEY` configurado
- [ ] URL do Supabase é pública (não localhost)
- [ ] Console mostra `✅ Supabase configurado`
- [ ] Console mostra `✅ Real-time ativo`
- [ ] Todos os dispositivos usam as mesmas variáveis de ambiente
- [ ] URLs de produção configuradas no Vercel

