# 🔧 Integração do Código com Supabase

Este guia mostra como atualizar o código existente para usar Supabase.

## 1. Instalar Dependências

```bash
npm install @supabase/supabase-js
```

## 2. Criar Arquivo de Configuração

Crie `src/lib/supabase.ts`:

```typescript
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Variáveis de ambiente do Supabase não configuradas!');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
```

## 3. Atualizar AuthContext para Usar Supabase

Substitua o `src/contexts/AuthContext.tsx` para usar autenticação do Supabase:

```typescript
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import { User } from '@supabase/supabase-js';

// ... resto do código de conquistas e plans ...

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  // ... outros estados ...

  useEffect(() => {
    // Verificar sessão atual
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        loadProfile(session.user.id);
      }
      setIsLoading(false);
    });

    // Ouvir mudanças de autenticação
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        loadProfile(session.user.id);
      } else {
        setProfile(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const loadProfile = async (userId: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Erro ao carregar perfil:', error);
      return;
    }

    setProfile(data);
  };

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      return !!data.user;
    } catch (error) {
      console.error('Erro ao fazer login:', error);
      return false;
    }
  };

  const register = async (name: string, email: string, password: string): Promise<boolean> => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
          },
        },
      });

      if (error) throw error;

      // Perfil será criado automaticamente pelo trigger
      return !!data.user;
    } catch (error) {
      console.error('Erro ao cadastrar:', error);
      return false;
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
  };

  const updateProfile = async (data: { name?: string; avatar?: string }) => {
    if (!user) throw new Error('Usuário não autenticado');

    const { error } = await supabase
      .from('profiles')
      .update({
        name: data.name,
        avatar: data.avatar,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id);

    if (error) throw error;
    await loadProfile(user.id);
  };

  // ... resto das funções ...
}
```

## 4. Criar Hook para Postagens

Crie `src/hooks/usePosts.ts`:

```typescript
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Post } from '@/types';

export function usePosts() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadPosts();

    // Ouvir novas postagens em tempo real
    const subscription = supabase
      .channel('posts')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'posts' },
        () => {
          loadPosts();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const loadPosts = async () => {
    try {
      const { data, error } = await supabase
        .from('posts')
        .select(`
          *,
          author:profiles(*),
          comments:comments(*, author:profiles(*)),
          likes:post_likes(*)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Transformar dados do Supabase para formato do app
      const transformedPosts = data.map((post: any) => ({
        id: post.id,
        author: {
          id: post.author.id,
          name: post.author.name,
          avatar: post.author.avatar,
          level: post.author.level,
          points: post.author.points,
          rank: post.author.rank,
          totalSales: post.author.total_sales,
        },
        content: post.content,
        image: post.image,
        likes: post.likes || 0,
        comments: post.comments_count || 0,
        isLiked: post.likes?.some((like: any) => like.user_id === supabase.auth.getUser().then(u => u.data.user?.id)) || false,
        createdAt: new Date(post.created_at),
        resultValue: post.result_value,
        type: post.type,
        commentsList: post.comments?.map((c: any) => ({
          id: c.id,
          author: {
            id: c.author.id,
            name: c.author.name,
            avatar: c.author.avatar,
            level: c.author.level,
            points: c.author.points,
            rank: c.author.rank,
            totalSales: c.author.total_sales,
          },
          content: c.content,
          createdAt: new Date(c.created_at),
        })) || [],
      }));

      setPosts(transformedPosts);
    } catch (error) {
      console.error('Erro ao carregar postagens:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const createPost = async (content: string, resultValue?: number, image?: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Usuário não autenticado');

    const { data, error } = await supabase
      .from('posts')
      .insert({
        author_id: user.id,
        content,
        image,
        result_value: resultValue,
        type: resultValue ? 'result' : 'post',
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  };

  const likePost = async (postId: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Usuário não autenticado');

    // Verificar se já curtiu
    const { data: existingLike } = await supabase
      .from('post_likes')
      .select('id')
      .eq('post_id', postId)
      .eq('user_id', user.id)
      .single();

    if (existingLike) {
      // Descurtir
      await supabase
        .from('post_likes')
        .delete()
        .eq('post_id', postId)
        .eq('user_id', user.id);
    } else {
      // Curtir
      await supabase
        .from('post_likes')
        .insert({
          post_id: postId,
          user_id: user.id,
        });
    }
  };

  const addComment = async (postId: string, content: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Usuário não autenticado');

    const { data, error } = await supabase
      .from('comments')
      .insert({
        post_id: postId,
        author_id: user.id,
        content,
      })
      .select(`
        *,
        author:profiles(*)
      `)
      .single();

    if (error) throw error;
    return data;
  };

  return {
    posts,
    isLoading,
    createPost,
    likePost,
    addComment,
    refresh: loadPosts,
  };
}
```

## 5. Criar Hook para Mensagens da Comunidade

Crie `src/hooks/useCommunityMessages.ts`:

```typescript
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export function useCommunityMessages() {
  const [messages, setMessages] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadMessages();

    // Ouvir novas mensagens em tempo real
    const subscription = supabase
      .channel('community_messages')
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'community_messages' },
        (payload) => {
          loadMessages();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const loadMessages = async () => {
    try {
      const { data, error } = await supabase
        .from('community_messages')
        .select(`
          *,
          author:profiles(*)
        `)
        .order('created_at', { ascending: true });

      if (error) throw error;

      const transformed = data.map((msg: any) => ({
        id: msg.id,
        content: msg.content,
        isUser: false, // Determinar baseado no usuário atual
        timestamp: new Date(msg.created_at),
        type: msg.type,
        image: msg.image,
        audioDuration: msg.audio_duration,
        audioUrl: msg.audio_url,
        author: {
          name: msg.author.name,
          avatar: msg.author.avatar,
        },
      }));

      setMessages(transformed);
    } catch (error) {
      console.error('Erro ao carregar mensagens:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const sendMessage = async (content: string, type: string = 'text', image?: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Usuário não autenticado');

    const { data, error } = await supabase
      .from('community_messages')
      .insert({
        author_id: user.id,
        content,
        type,
        image,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  };

  return {
    messages,
    isLoading,
    sendMessage,
    refresh: loadMessages,
  };
}
```

## 6. Atualizar .gitignore

Adicione ao `.gitignore`:

```
.env.local
.env
```

## 7. Exemplo de Uso no Index.tsx

```typescript
import { usePosts } from '@/hooks/usePosts';
import { useCommunityMessages } from '@/hooks/useCommunityMessages';

const Index = () => {
  const { posts, createPost, likePost, addComment } = usePosts();
  const { messages, sendMessage } = useCommunityMessages();

  // Usar posts do Supabase em vez de localStorage
  // ...
};
```

## Próximos Passos

1. Execute os SQLs do `GUIA_SUPABASE.md` no Supabase
2. Configure as variáveis de ambiente
3. Atualize os componentes para usar os hooks
4. Teste a integração

