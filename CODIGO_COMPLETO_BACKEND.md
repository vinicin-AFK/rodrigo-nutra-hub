# 📋 Código Completo do Backend

## 1. Supabase Client (`src/lib/supabase.ts`)

```typescript
import { createClient } from '@supabase/supabase-js';

// ⚠️ CRÍTICO: URL ÚNICA E GLOBAL - TODOS OS DISPOSITIVOS DEVEM USAR A MESMA URL
// Não usar localhost, IPs locais ou URLs diferentes para dev/prod
const SUPABASE_URL_GLOBAL = 'https://kfyzcqaerlwqcmlbcgts.supabase.co';

// Variáveis de ambiente (devem apontar para a mesma URL global)
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || SUPABASE_URL_GLOBAL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Variável para desabilitar Supabase completamente (modo offline forçado)
// Defina VITE_DISABLE_SUPABASE=true no .env.local para desabilitar
const isSupabaseDisabled = import.meta.env.VITE_DISABLE_SUPABASE === 'true';

// Verificar se está realmente configurado (não apenas se existe, mas se tem valor válido)
export const isSupabaseConfigured = !isSupabaseDisabled && !!(
  supabaseUrl && 
  supabaseAnonKey && 
  supabaseUrl.trim() !== '' && 
  supabaseAnonKey.trim() !== '' &&
  supabaseUrl !== 'https://placeholder.supabase.co' &&
  supabaseAnonKey !== 'placeholder-key'
);

// Flag para rastrear se a API key foi detectada como inválida
let apiKeyInvalid = false;

// Função para verificar se um erro é de API key inválida
export function isInvalidApiKeyError(error: any): boolean {
  if (!error) return false;
  const message = error?.message || '';
  const code = error?.code || '';
  
  return (
    message.includes('Invalid API key') ||
    message.includes('invalid_api_key') ||
    message.includes('JWT') ||
    code === 'PGRST301' ||
    message.includes('API key not found')
  );
}

// Função para marcar a API key como inválida
export function markApiKeyAsInvalid() {
  apiKeyInvalid = true;
  console.warn('⚠️ API key do Supabase marcada como inválida. Usando modo offline.');
}

// Função para verificar se a API key está inválida
export function isApiKeyInvalid(): boolean {
  return apiKeyInvalid;
}

// ⚠️ CRÍTICO: SEMPRE usar URL GLOBAL ÚNICA
// Garantir que TODOS os dispositivos usam a MESMA instância do Supabase
// Se a variável de ambiente tiver localhost ou IP local, forçar uso da URL global
let finalSupabaseUrl = SUPABASE_URL_GLOBAL;
if (supabaseUrl && supabaseUrl !== SUPABASE_URL_GLOBAL) {
  const isLocalUrl = supabaseUrl.includes('localhost') || 
                     supabaseUrl.includes('127.0.0.1') || 
                     supabaseUrl.includes('192.168.') || 
                     supabaseUrl.includes('10.0.') || 
                     supabaseUrl.startsWith('http://');
  
  if (isLocalUrl) {
    console.warn('⚠️ URL local detectada, forçando uso da URL global:', SUPABASE_URL_GLOBAL);
    finalSupabaseUrl = SUPABASE_URL_GLOBAL;
  } else if (supabaseUrl.includes('supabase.co')) {
    // Se for uma URL válida do Supabase (mesmo que diferente), usar ela
    finalSupabaseUrl = supabaseUrl;
    if (supabaseUrl !== SUPABASE_URL_GLOBAL) {
      console.warn('⚠️ URL do Supabase diferente da global configurada:', supabaseUrl);
      console.warn('⚠️ Recomendado usar a URL global:', SUPABASE_URL_GLOBAL);
    }
  } else {
    // URL inválida, usar global
    finalSupabaseUrl = SUPABASE_URL_GLOBAL;
  }
}

// Criar cliente mesmo sem variáveis (modo fallback)
// Isso permite que a aplicação carregue mesmo sem Supabase configurado
export const supabase = isSupabaseConfigured
  ? createClient(finalSupabaseUrl, supabaseAnonKey!, {
      auth: {
        storage: localStorage,
        persistSession: true,
        autoRefreshToken: true,
      }
    })
  : createClient(SUPABASE_URL_GLOBAL, 'placeholder-key', {
      auth: {
        storage: localStorage,
        persistSession: true,
        autoRefreshToken: true,
      }
    });

if (isSupabaseDisabled) {
  console.warn('🚫 Supabase DESABILITADO manualmente (VITE_DISABLE_SUPABASE=true)');
  console.warn('📱 Aplicação funcionando em modo OFFLINE completo');
} else if (!isSupabaseConfigured) {
  console.warn(
    '⚠️ Supabase não configurado! ' +
    'A aplicação funcionará em modo offline. ' +
    'Configure VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY no .env.local para usar o Supabase.'
  );
  console.warn('📋 Variáveis encontradas:', {
    hasUrl: !!supabaseUrl,
    hasKey: !!supabaseAnonKey,
    urlLength: supabaseUrl?.length || 0,
    keyLength: supabaseAnonKey?.length || 0,
  });
} else {
  // ⚠️ VALIDAÇÃO CRÍTICA: Garantir que TODOS os dispositivos usam a MESMA URL
  const finalUrl = (supabaseUrl && !supabaseUrl.includes('localhost') && 
    !supabaseUrl.includes('127.0.0.1') && !supabaseUrl.includes('192.168.') && 
    !supabaseUrl.includes('10.0.') && !supabaseUrl.startsWith('http://')) 
    ? supabaseUrl 
    : SUPABASE_URL_GLOBAL;
  
  if (finalUrl !== SUPABASE_URL_GLOBAL && supabaseUrl) {
    console.warn('⚠️ URL do Supabase diferente da global. Usando URL global para garantir sincronização.');
    console.warn('⚠️ URL na variável de ambiente:', supabaseUrl);
    console.warn('⚠️ URL global forçada:', SUPABASE_URL_GLOBAL);
  }
  
  console.log('✅ Supabase configurado com URL GLOBAL:', finalUrl);
  console.log('🔑 Chave configurada:', supabaseAnonKey?.substring(0, 20) + '...');
  console.log('🌍 TODOS os dispositivos usarão o MESMO backend Supabase');
}
```

---

## 2. Variáveis de Ambiente (`.env.local`)

```env
# ⚠️ CRÍTICO: Use EXATAMENTE esta URL (não use localhost ou IPs locais)
VITE_SUPABASE_URL=https://kfyzcqaerlwqcmlbcgts.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtmeXpjcWFlcmx3cWNtbGJjZ3RzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ1MDQ2MjksImV4cCI6MjA4MDA4MDYyOX0.gj215HUlQ_b-68u2LC2LCwxpCDWGia1OaBOq5Zfoa04
```

**⚠️ IMPORTANTE:**
- Arquivo `.env.local` deve estar na raiz do projeto
- Não commitar este arquivo (já está no `.gitignore`)
- Todos os dispositivos devem usar as MESMAS variáveis

---

## 3. Código de Fetch do Feed (`src/hooks/usePosts.ts`)

### Função `syncWithSupabase` (Buscar Posts)

```typescript
const syncWithSupabase = async (currentUser: any, showLoading: boolean = true) => {
  try {
    if (showLoading) {
      setIsLoading(true);
    }
    
    console.log('🌍 COMUNIDADE GLOBAL: Sincronizando FEED GLOBAL com Supabase...');
    console.log('📌 PRINCÍPIO: Todos os usuários veem o mesmo feed - SEM filtros por usuário');
    
    // ============================================
    // FEED GLOBAL - COMUNIDADE ÚNICA
    // ============================================
    // ✅ CORRETO (exemplo Prisma - o que queremos):
    //   const posts = await prisma.post.findMany({
    //     orderBy: { createdAt: 'desc' },
    //     include: {
    //       user: true,
    //       comments: true,
    //       likes: true
    //     }
    //   });
    //   SEM where: { userId: ... } - busca TODAS as postagens
    // ============================================
    // ✅ NOSSA IMPLEMENTAÇÃO (equivalente ao Prisma acima):
    //   - orderBy: { createdAt: 'desc' } → .order('created_at', { ascending: false })
    //   - include: { user: true } → author:profiles(...)
    //   - include: { comments: true } → Buscamos separadamente e agrupamos
    //   - include: { likes: true } → Buscamos separadamente e agrupamos
    // ============================================
    // ❌ NUNCA usar: .eq('author_id', userId) ou qualquer filtro por usuário
    // ✅ SEMPRE buscar: TODAS as postagens, ordenadas por data
    // ✅ RLS já filtra: Apenas posts ativos são visíveis
    // ============================================
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
      // Equivalente a: orderBy: { createdAt: 'desc' }
      .order('created_at', { ascending: false })
      .limit(500); // Limite alto para mostrar mais posts da comunidade

    // Mobile: timeout maior devido a conexões mais lentas
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    const queryTimeout = isMobile ? 15000 : 10000; // Mobile: 15s, Desktop: 10s
    
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Timeout ao carregar posts')), queryTimeout)
    );

    const { data, error } = await Promise.race([
      supabasePromise,
      timeoutPromise,
    ]) as any;

    console.log('📊 Resultado Supabase:', { data: data?.length || 0, error });

    if (!error && data && data.length > 0) {
      const { data: { user } } = await supabase.auth.getUser();
      const currentUserId = user?.id;

      // ============================================
      // COMENTÁRIOS E CURTIDAS GLOBAIS
      // ============================================
      // Equivalente ao Prisma:
      //   include: {
      //     comments: true,  // ← Todos os comentários do post
      //     likes: true     // ← Todas as curtidas do post
      //   }
      // ============================================
      // ✅ Comentários e curtidas pertencem ao POST, não ao usuário
      // ✅ Todos veem os mesmos comentários e curtidas para cada post
      // ✅ Buscamos TODAS as curtidas e comentários (sem filtro por usuário)
      // ============================================
      const postIds = data.map((p: any) => p.id);
      
      // Buscar TODAS as curtidas dos posts (globais - sem filtro por usuário)
      // Equivalente a: include: { likes: true }
      const { data: likesData } = await supabase
        .from('post_likes')
        .select('post_id, user_id')
        .in('post_id', postIds); // Sem filtro por usuário - todas as curtidas
      
      // Buscar TODOS os comentários dos posts (globais - sem filtro por usuário)
      // Equivalente a: include: { comments: { include: { user: true } } }
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

      // Agrupar curtidas e comentários por post
      const likesByPost = new Map<string, any[]>();
      const commentsByPost = new Map<string, any[]>();
      
      likesData?.forEach((like: any) => {
        if (!likesByPost.has(like.post_id)) {
          likesByPost.set(like.post_id, []);
        }
        likesByPost.get(like.post_id)!.push(like);
      });
      
      commentsData?.forEach((comment: any) => {
        if (!commentsByPost.has(comment.post_id)) {
          commentsByPost.set(comment.post_id, []);
        }
        commentsByPost.get(comment.post_id)!.push(comment);
      });

      // Transformar dados do Supabase para o formato do app
      const transformedPosts: Post[] = data.map((post: any) => {
        const postLikes = likesByPost.get(post.id) || [];
        const postComments = commentsByPost.get(post.id) || [];
        
        return {
          id: post.id,
          author: {
            id: post.author?.id || post.author_id,
            name: post.author?.name || 'Usuário',
            avatar: post.author?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(post.author?.name || 'Usuario')}&background=random`,
            level: post.author?.level || 'Bronze',
            points: post.author?.points || 0,
            rank: post.author?.rank || 999,
            totalSales: post.author?.total_sales || 0,
            role: post.author?.role || undefined,
          },
          content: post.content,
          image: post.image || undefined,
          likes: postLikes.length,
          comments: postComments.length,
          isLiked: postLikes.some((like: any) => like.user_id === currentUserId) || false,
          createdAt: new Date(post.created_at),
          resultValue: post.result_value || undefined,
          type: post.type || 'post',
          status: 'active',
          commentsList: postComments.map((c: any) => ({
            id: c.id,
            postId: post.id,
            author: {
              id: c.author?.id || c.author_id,
              name: c.author?.name || 'Usuário',
              avatar: c.author?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(c.author?.name || 'Usuario')}&background=random`,
              level: c.author?.level || 'Bronze',
              points: c.author?.points || 0,
              rank: c.author?.rank || 999,
              totalSales: c.author?.total_sales || 0,
              role: c.author?.role || undefined,
            },
            content: c.content,
            createdAt: new Date(c.created_at),
            status: 'active',
          })),
          engagement: {
            likes: postLikes.length,
            comments: postComments.length,
            shares: 0,
          },
        };
      });

      setPosts(transformedPosts);
      // Salvar no localStorage para cache
      const serialized = JSON.stringify(transformedPosts.map(p => ({
        ...p,
        createdAt: p.createdAt.toISOString(),
        commentsList: p.commentsList?.map(c => ({
          ...c,
          createdAt: c.createdAt.toISOString(),
        })) || [],
      })));
      safeSetItem('nutraelite_posts', serialized);
      if (showLoading) {
        setIsLoading(false);
      }
      console.log('✅ Feed global sincronizado do Supabase:', transformedPosts.length);
    } else if (error) {
      console.warn('⚠️ Erro ao buscar do Supabase:', error);
      if (showLoading) {
        setIsLoading(false);
      }
    } else {
      // Sem dados mas sem erro
      setPosts([]);
      if (showLoading) {
        setIsLoading(false);
      }
    }
  } catch (error: any) {
    if (error?.message === 'Timeout ao carregar posts') {
      console.warn('⚠️ Timeout ao buscar do Supabase (3s)');
    } else {
      console.warn('⚠️ Erro ao sincronizar com Supabase:', error?.message || error);
    }
    if (showLoading) {
      setIsLoading(false);
    }
  }
};
```

---

## 4. Código de Fetch do Chat (`src/hooks/useCommunityMessages.ts`)

### Função `syncWithSupabase` (Buscar Mensagens)

```typescript
const syncWithSupabase = async (currentUserId: string | null, showLoading: boolean) => {
  try {
    if (showLoading) {
      setIsLoading(true);
    }
    console.log('🌍 COMUNIDADE GLOBAL: Sincronizando CHAT GLOBAL com Supabase...');
    console.log('📌 PRINCÍPIO: Todos os usuários usam o mesmo chat - SEM rooms separados');
    
    // ============================================
    // CHAT GLOBAL - COMUNIDADE ÚNICA
    // ============================================
    // ❌ ERRADO (exemplo do que NÃO fazer):
    //   const messages = await prisma.communityMessage.findMany({
    //     where: { userId: currentUser.id }  // ← ISOLAMENTO POR USUÁRIO
    //   });
    //   Isso faria cada usuário ver apenas suas próprias mensagens!
    // ============================================
    // ✅ CORRETO (o que estamos fazendo):
    //   Equivalente ao Prisma:
    //     prisma.communityMessage.findMany({
    //       orderBy: { createdAt: 'asc' },
    //       include: { user: true }
    //     })
    //   SEM where: { userId: ... } - busca TODAS as mensagens
    // ============================================
    // ❌ NUNCA usar: .eq('author_id', userId) ou criar rooms por usuário
    // ✅ SEMPRE buscar: TODAS as mensagens, ordenadas por data
    // ✅ RLS já filtra: Apenas mensagens ativas são visíveis
    // ============================================
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
      // Equivalente a: orderBy: { createdAt: 'asc' }
      .order('created_at', { ascending: true })  // Ordem cronológica (mais antigas primeiro)
      .limit(500); // Limite alto para mostrar mais mensagens da comunidade

    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Timeout')), 10000) // Timeout de 10s para garantir sucesso
    );

    const { data, error } = await Promise.race([
      supabasePromise,
      timeoutPromise,
    ]) as any;

    console.log('📊 Resultado Supabase:', { data: data?.length || 0, error });

    if (!error && data && data.length > 0) {
      const { data: { user } } = await supabase.auth.getUser();
      const supabaseUserId = user?.id;

      // Transformação otimizada (sem processamento desnecessário)
      // Equivalente ao Prisma: include: { user: true }
      // Ordem já está correta (ascending: true) - não precisa reverter
      const transformed: Message[] = data
        .map((msg: any) => {
          const authorId = msg.author?.id || msg.author_id;
          const isUser = authorId === supabaseUserId || authorId === currentUserId;
          
          return {
            id: msg.id,
            content: msg.content || '',
            isUser,
            timestamp: new Date(msg.created_at),
            type: msg.type || 'text',
            image: msg.image || undefined,
            audioDuration: msg.audio_duration || undefined,
            audioUrl: msg.audio_url || undefined,
            author: {
              id: authorId,
              name: msg.author?.name || 'Usuário',
              avatar: msg.author?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(msg.author?.name || 'Usuario')}&background=random`,
              role: msg.author?.role || undefined,
            },
          };
        });

      // Mesclar com mensagens locais não sincronizadas
      const savedMessages = safeGetItem('nutraelite_community_messages');
      let allMessages = [...transformed];
      
      if (savedMessages) {
        try {
          const parsed = JSON.parse(savedMessages);
          const supabaseIds = new Set(transformed.map(m => m.id));
          const localOnly = parsed
            .filter((m: any) => !supabaseIds.has(m.id))
            .map((msg: any) => ({
              ...msg,
              timestamp: new Date(msg.timestamp),
              author: {
                ...(msg.author || {
                  name: 'Usuário',
                  avatar: 'https://ui-avatars.com/api/?name=Usuario&background=random',
                }),
                id: msg.author?.id,
              },
            }));
            
          allMessages = [...transformed, ...localOnly].sort((a, b) => 
            a.timestamp.getTime() - b.timestamp.getTime()
          );
        } catch (err) {
          console.warn('Erro ao mesclar mensagens locais:', err);
        }
      }
      
      setMessages(allMessages);
      // Salvar no localStorage para cache
      const serialized = JSON.stringify(allMessages.map(m => ({
        ...m,
        timestamp: m.timestamp.toISOString(),
      })));
      safeSetItem('nutraelite_community_messages', serialized);
      if (showLoading) {
        setIsLoading(false);
      }
      console.log('✅ Mensagens sincronizadas do Supabase:', allMessages.length);
    } else if (error) {
      console.warn('⚠️ Erro ao buscar do Supabase:', error);
      if (showLoading) {
        setIsLoading(false);
      }
    } else {
      // Sem dados mas sem erro
      setMessages([]);
      if (showLoading) {
        setIsLoading(false);
      }
    }
  } catch (error: any) {
    if (error?.message === 'Timeout') {
      console.warn('⚠️ Timeout ao buscar do Supabase (3s)');
    } else {
      console.warn('⚠️ Erro ao sincronizar com Supabase:', error?.message || error);
    }
    if (showLoading) {
      setIsLoading(false);
    }
  }
};
```

---

## 📝 Resumo

### URL do Backend
```
https://kfyzcqaerlwqcmlbcgts.supabase.co
```

### Tabelas Usadas
- **Feed:** `posts` (sem filtros por usuário)
- **Chat:** `community_messages` (sem filtros por usuário)
- **Comentários:** `comments` (agrupados por post)
- **Curtidas:** `post_likes` (agrupadas por post)
- **Perfis:** `profiles` (join com posts e mensagens)

### Características
- ✅ Feed global (todos veem todas as postagens)
- ✅ Chat global (todos veem todas as mensagens)
- ✅ Sem filtros por usuário
- ✅ Ordenação por data (posts: desc, mensagens: asc)
- ✅ Real-time via Supabase Realtime
- ✅ Cache local como fallback apenas

