# 🌍 COMUNIDADE GLOBAL - DOCUMENTAÇÃO TÉCNICA

## 📌 Princípios Fundamentais

Este aplicativo implementa uma **comunidade global única** onde:

1. **Todos os usuários fazem parte da mesma comunidade**
2. **Não existe feed individual** - todos veem o mesmo feed
3. **Não existe chat separado** - todos usam o mesmo chat global
4. **Comentários e curtidas são globais** - pertencem ao post, não ao usuário

## 🏗️ Estrutura de Dados

### Feed Global (`posts`)
- **Sem filtro por usuário**: Busca TODAS as postagens sem `WHERE user_id = ...`
- **Ordenação**: `created_at DESC` (mais recentes primeiro)
- **Visibilidade**: Todos os usuários veem o mesmo feed
- **Comentários**: Pertencem ao post, visíveis para todos
- **Curtidas**: Pertencem ao post, visíveis para todos

### Chat Global (`community_messages`)
- **Sala única**: Apenas uma sala de chat para todos
- **Sem rooms por usuário**: Não criar chats separados
- **Real-time**: Usa Supabase Realtime para sincronização instantânea
- **Visibilidade**: Todas as mensagens são visíveis para todos

## 🔍 Verificações de Código

### ❌ NUNCA FAZER:
```typescript
// ❌ ERRADO - Filtrar por usuário
supabase.from('posts').select('*').eq('author_id', userId)

// ❌ ERRADO - Criar chat por usuário
supabase.from('community_messages').select('*').eq('user_id', userId)

// ❌ ERRADO - Feed individual
const userPosts = posts.filter(p => p.author.id === currentUser.id)
```

### ✅ SEMPRE FAZER:
```typescript
// ✅ CORRETO - Buscar todos os posts
supabase.from('posts').select('*').order('created_at', { ascending: false })

// ✅ CORRETO - Buscar todas as mensagens
supabase.from('community_messages').select('*').order('created_at', { ascending: false })

// ✅ CORRETO - Feed global
const globalPosts = posts // Todos os posts, sem filtro
```

## 📁 Arquivos Principais

### `src/hooks/usePosts.ts`
- **Função**: Gerenciar feed global de postagens
- **Query**: Busca TODAS as postagens sem filtro de usuário
- **Real-time**: Subscription para `posts`, `comments`, `post_likes`
- **Cache**: localStorage como fallback, Supabase como fonte primária

### `src/hooks/useCommunityMessages.ts`
- **Função**: Gerenciar chat global da comunidade
- **Query**: Busca TODAS as mensagens sem filtro de usuário
- **Real-time**: Subscription para `community_messages`
- **Cache**: localStorage como fallback, Supabase como fonte primária

### `src/pages/Index.tsx`
- **Feed**: Exibe todos os posts sem filtro
- **Chat**: Exibe todas as mensagens sem filtro
- **Filtro**: Apenas remove posts com `status = 'deleted'` ou `status = 'hidden'`

## 🔄 Sincronização Real-time

### Supabase Realtime
O app usa Supabase Realtime para sincronização instantânea:

```typescript
// Subscription para posts
supabase
  .channel('posts_changes')
  .on('postgres_changes', { event: '*', schema: 'public', table: 'posts' }, () => {
    loadPosts(false) // Recarregar feed global
  })
  .subscribe()

// Subscription para mensagens
supabase
  .channel('community_messages_changes')
  .on('postgres_changes', { event: '*', schema: 'public', table: 'community_messages' }, () => {
    loadMessages(false) // Recarregar chat global
  })
  .subscribe()
```

## 🛡️ Políticas RLS (Row Level Security)

As políticas RLS garantem que:
- **Todos podem ver** todas as publicações ativas
- **Todos podem ver** todas as mensagens ativas
- **Apenas o autor** pode criar/editar/deletar suas próprias publicações
- **Apenas o autor** pode criar/editar/deletar suas próprias mensagens

Ver arquivo: `supabase_fix_rls_global.sql`

## ✅ Checklist de Implementação

- [x] Feed busca todos os posts sem filtro de usuário
- [x] Chat busca todas as mensagens sem filtro de usuário
- [x] Real-time subscriptions configuradas
- [x] Políticas RLS configuradas para feed global
- [x] Comentários e curtidas são globais
- [x] localStorage usado apenas como cache
- [x] Supabase é fonte primária de dados
- [x] Sem lógica de feed individual
- [x] Sem lógica de chat por usuário

## 🚀 Como Funciona

1. **Usuário A cria publicação** → Salva no Supabase → Real-time notifica todos
2. **Usuário B faz login** → Busca do Supabase → Vê publicação do Usuário A
3. **Usuário A envia mensagem** → Salva no Supabase → Real-time notifica todos
4. **Usuário B vê mensagem** → Aparece no chat global imediatamente

## 📝 Notas Importantes

- **Não criar feeds individuais**: Todos veem o mesmo conteúdo
- **Não criar chats separados**: Todos usam o mesmo chat
- **Real-time é essencial**: Garante sincronização instantânea
- **RLS protege dados**: Mas permite visibilidade global
- **Cache é secundário**: Supabase é sempre a fonte da verdade

