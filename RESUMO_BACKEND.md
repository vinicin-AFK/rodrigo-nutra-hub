# 📋 RESUMO RÁPIDO - Backend e Endpoints

## 🔗 URL do Backend

```
https://kfyzcqaerlwqcmlbcgts.supabase.co
```

**Tipo:** Supabase (Backend as a Service)

**Configuração:** `.env.local`
```env
VITE_SUPABASE_URL=https://kfyzcqaerlwqcmlbcgts.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## 🗄️ Banco de Dados

**Tipo:** PostgreSQL (gerenciado pelo Supabase)

**Acesso:** Via Supabase Client SDK

**Tabelas Principais:**
- `posts` - Feed global
- `community_messages` - Chat global
- `comments` - Comentários
- `post_likes` - Curtidas
- `profiles` - Perfis de usuários

---

## 📡 Endpoint do Feed

### Código (TypeScript)
```typescript
// src/hooks/usePosts.ts - syncWithSupabase()

supabase
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
  .order('created_at', { ascending: false })
  .limit(500);
```

### Endpoint REST
```
GET https://kfyzcqaerlwqcmlbcgts.supabase.co/rest/v1/posts
```

**Query:**
```
?select=id,author_id,content,image,result_value,type,created_at,status,author:profiles(*)
&order=created_at.desc
&limit=500
```

**Headers:**
```
apikey: VITE_SUPABASE_ANON_KEY
Authorization: Bearer <token>
```

---

## 💬 Endpoint do Chat

### Código (TypeScript)
```typescript
// src/hooks/useCommunityMessages.ts - syncWithSupabase()

supabase
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
  .order('created_at', { ascending: true })
  .limit(500);
```

### Endpoint REST
```
GET https://kfyzcqaerlwqcmlbcgts.supabase.co/rest/v1/community_messages
```

**Query:**
```
?select=id,author_id,content,type,image,audio_duration,audio_url,created_at,status,author:profiles(*)
&order=created_at.asc
&limit=500
```

**Headers:**
```
apikey: VITE_SUPABASE_ANON_KEY
Authorization: Bearer <token>
```

---

## 🌐 URLs do App

### Desenvolvimento (Dev)
```
http://localhost:8080
```

**Comando:** `npm run dev`

**Acesso na Rede Local:**
```
http://<seu-ip-local>:8080
```

### Produção (Prod)
```
https://seu-app.vercel.app
```

**Comando de Deploy:**
```bash
npm run deploy        # Produção
npm run deploy:preview # Preview
```

**Configuração:** Vercel Dashboard

---

## 🔄 Real-time

### Feed
```typescript
supabase
  .channel('posts_changes')
  .on('postgres_changes', { 
    event: '*', 
    schema: 'public', 
    table: 'posts' 
  }, (payload) => {
    loadPosts(false);
  })
  .subscribe();
```

### Chat
```typescript
supabase
  .channel('community_messages_changes')
  .on('postgres_changes', { 
    event: '*', 
    schema: 'public', 
    table: 'community_messages' 
  }, (payload) => {
    loadMessages(false);
  })
  .subscribe();
```

---

## 📝 Arquivos de Código

- **Backend Config:** `src/lib/supabase.ts`
- **Feed Hook:** `src/hooks/usePosts.ts`
- **Chat Hook:** `src/hooks/useCommunityMessages.ts`
- **Vite Config:** `vite.config.ts`
- **Env:** `.env.local`

---

## ✅ Verificação Rápida

1. **Backend configurado?**
   ```bash
   cat .env.local | grep VITE_SUPABASE_URL
   ```

2. **Console mostra?**
   ```
   ✅ Supabase configurado: https://kfyzcqaerlwqcmlbcgts.supabase...
   ✅ Real-time ativo
   ```

3. **App rodando?**
   ```
   http://localhost:8080
   ```

---

**📄 Documentação Completa:** Ver `INFORMACOES_BACKEND.md`

