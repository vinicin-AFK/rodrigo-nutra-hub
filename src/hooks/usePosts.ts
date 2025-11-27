import { useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { Post, Comment } from '@/types';

export function usePosts() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadPosts = async () => {
    if (!isSupabaseConfigured) {
      // Modo offline - carregar do localStorage
      try {
        const savedPosts = localStorage.getItem('nutraelite_posts');
        if (savedPosts) {
          const parsed = JSON.parse(savedPosts);
          const loadedPosts: Post[] = parsed.map((post: any) => ({
            ...post,
            createdAt: new Date(post.createdAt),
            author: post.author || {
              id: 'unknown',
              name: 'Usuário',
              avatar: 'https://ui-avatars.com/api/?name=Usuario&background=random',
              level: 'Bronze',
              points: 0,
              rank: 999,
              totalSales: 0,
            },
            commentsList: post.commentsList?.map((c: any) => ({
              ...c,
              createdAt: new Date(c.createdAt),
            })) || [],
          }));
          setPosts(loadedPosts);
        } else {
          setPosts([]);
        }
      } catch (error) {
        console.error('Erro ao carregar postagens do localStorage:', error);
        setPosts([]);
      }
      setIsLoading(false);
      return;
    }

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

      // Obter usuário atual para verificar curtidas
      const { data: { user } } = await supabase.auth.getUser();
      const currentUserId = user?.id;

      // Transformar dados do Supabase para formato do app
      const transformedPosts: Post[] = (data || []).map((post: any) => ({
        id: post.id,
        author: {
          id: post.author.id,
          name: post.author.name,
          avatar: post.author.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(post.author.name)}&background=random`,
          level: post.author.level || 'Bronze',
          points: post.author.points || 0,
          rank: post.author.rank || 999,
          totalSales: post.author.total_sales || 0,
        },
        content: post.content,
        image: post.image || undefined,
        likes: post.likes || 0,
        comments: post.comments_count || 0,
        isLiked: post.likes?.some((like: any) => like.user_id === currentUserId) || false,
        createdAt: new Date(post.created_at),
        resultValue: post.result_value || undefined,
        type: post.type || 'post',
        commentsList: (post.comments || []).map((c: any) => ({
          id: c.id,
          author: {
            id: c.author.id,
            name: c.author.name,
            avatar: c.author.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(c.author.name)}&background=random`,
            level: c.author.level || 'Bronze',
            points: c.author.points || 0,
            rank: c.author.rank || 999,
            totalSales: c.author.total_sales || 0,
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

  useEffect(() => {
    loadPosts();

    if (!isSupabaseConfigured) return;

    // Ouvir novas postagens em tempo real
    const subscription = supabase
      .channel('posts_changes')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'posts' },
        () => {
          loadPosts();
        }
      )
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'comments' },
        () => {
          loadPosts();
        }
      )
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'post_likes' },
        () => {
          loadPosts();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const createPost = async (content: string, resultValue?: number, image?: string) => {
    console.log('📝 Criando postagem...', { content, resultValue, image: !!image, isSupabaseConfigured });
    
    try {
      if (!isSupabaseConfigured) {
        console.log('📦 Modo offline - criando postagem localmente');
        // Modo offline - criar post localmente
        // Buscar dados do usuário do localStorage
        const savedAuth = localStorage.getItem('nutraelite_auth');
        if (!savedAuth) {
          console.error('❌ Nenhuma autenticação encontrada no localStorage');
          throw new Error('Usuário não autenticado. Faça login primeiro.');
        }
        
        let authData;
        try {
          authData = JSON.parse(savedAuth);
        } catch (parseError) {
          console.error('❌ Erro ao fazer parse do localStorage:', parseError);
          throw new Error('Erro ao ler dados de autenticação. Faça login novamente.');
        }
        
        const authorData = authData.user;
        
        if (!authorData) {
          console.error('❌ Dados do usuário não encontrados');
          throw new Error('Usuário não autenticado. Faça login primeiro.');
        }

        console.log('✅ Dados do autor encontrados:', authorData.name);

        const newPost: Post = {
          id: Date.now().toString(),
          author: {
            id: authorData.id,
            name: authorData.name,
            avatar: authorData.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(authorData.name)}&background=random`,
            level: authorData.level || 'Bronze',
            points: authorData.points || 0,
            rank: authorData.rank || 999,
            totalSales: authorData.totalSales || 0,
          },
          content,
          image,
          likes: 0,
          comments: 0,
          isLiked: false,
          createdAt: new Date(),
          resultValue,
          type: resultValue ? 'result' : 'post',
          commentsList: [],
        };

        // Salvar no localStorage
        const savedPosts = localStorage.getItem('nutraelite_posts');
        const existingPosts = savedPosts ? JSON.parse(savedPosts) : [];
        const updatedPosts = [{
          ...newPost,
          createdAt: newPost.createdAt.toISOString(),
        }, ...existingPosts];
        
        try {
          localStorage.setItem('nutraelite_posts', JSON.stringify(updatedPosts));
          console.log('✅ Postagem salva no localStorage');
        } catch (storageError) {
          console.error('❌ Erro ao salvar no localStorage:', storageError);
          throw new Error('Erro ao salvar postagem. Tente novamente.');
        }

        // Atualizar estado local - adicionar nova postagem no início
        setPosts(prevPosts => [newPost, ...prevPosts]);
        console.log('✅ Postagem criada com sucesso (modo offline)');

        return newPost;
      }

      console.log('☁️ Modo Supabase - criando postagem no banco');
      // Modo Supabase - tentar usar, mas se falhar, usar modo offline
      try {
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        
        if (authError || !user) {
          console.warn('⚠️ Erro de autenticação no Supabase, usando modo offline');
          // Fallback para modo offline
          throw new Error('FALLBACK_TO_OFFLINE');
        }

        console.log('✅ Usuário autenticado:', user.id);

        const { data, error } = await supabase
          .from('posts')
          .insert({
            author_id: user.id,
            content,
            image,
            result_value: resultValue,
            type: resultValue ? 'result' : 'post',
          })
          .select(`
            *,
            author:profiles(*)
          `)
          .single();

        if (error) {
          console.warn('⚠️ Erro ao inserir no Supabase, usando modo offline:', error);
          throw new Error('FALLBACK_TO_OFFLINE');
        }

        console.log('✅ Postagem criada no Supabase');

        // Recarregar postagens
        await loadPosts();

        return data;
      } catch (supabaseError: any) {
        // Se for erro de fallback, usar modo offline
        if (supabaseError?.message === 'FALLBACK_TO_OFFLINE') {
          console.log('📦 Fallback para modo offline devido a erro no Supabase');
          // Recursivamente chamar em modo offline
          // Mas primeiro precisamos garantir que temos os dados do usuário
          const savedAuth = localStorage.getItem('nutraelite_auth');
          if (!savedAuth) {
            throw new Error('Usuário não autenticado. Faça login primeiro.');
          }
          
          const authData = JSON.parse(savedAuth);
          const authorData = authData.user;
          
          if (!authorData) {
            throw new Error('Usuário não autenticado. Faça login primeiro.');
          }

          const newPost: Post = {
            id: Date.now().toString(),
            author: {
              id: authorData.id,
              name: authorData.name,
              avatar: authorData.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(authorData.name)}&background=random`,
              level: authorData.level || 'Bronze',
              points: authorData.points || 0,
              rank: authorData.rank || 999,
              totalSales: authorData.totalSales || 0,
            },
            content,
            image,
            likes: 0,
            comments: 0,
            isLiked: false,
            createdAt: new Date(),
            resultValue,
            type: resultValue ? 'result' : 'post',
            commentsList: [],
          };

          const savedPosts = localStorage.getItem('nutraelite_posts');
          const existingPosts = savedPosts ? JSON.parse(savedPosts) : [];
          const updatedPosts = [{
            ...newPost,
            createdAt: newPost.createdAt.toISOString(),
          }, ...existingPosts];
          
          localStorage.setItem('nutraelite_posts', JSON.stringify(updatedPosts));
          setPosts(prevPosts => [newPost, ...prevPosts]);
          
          return newPost;
        }
        // Se for outro erro, relançar
        throw supabaseError;
      }
    } catch (error: any) {
      console.error('❌ Erro completo ao criar postagem:', error);
      throw error;
    }
  };

  const likePost = async (postId: string) => {
    if (!isSupabaseConfigured) {
      throw new Error('Supabase não configurado. Configure as variáveis de ambiente.');
    }

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
      const { error } = await supabase
        .from('post_likes')
        .delete()
        .eq('post_id', postId)
        .eq('user_id', user.id);

      if (error) throw error;
    } else {
      // Curtir
      const { error } = await supabase
        .from('post_likes')
        .insert({
          post_id: postId,
          user_id: user.id,
        });

      if (error) throw error;
    }

    // Recarregar postagens para atualizar contadores
    await loadPosts();
  };

  const addComment = async (postId: string, content: string) => {
    if (!isSupabaseConfigured) {
      throw new Error('Supabase não configurado. Configure as variáveis de ambiente.');
    }

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

    // Recarregar postagens para atualizar comentários
    await loadPosts();

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

