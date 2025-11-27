import { useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { Post, Comment } from '@/types';

export function usePosts() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadPosts = async () => {
    // SEMPRE carregar do localStorage primeiro
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
      }
    } catch (error) {
      console.error('Erro ao carregar postagens:', error);
    } finally {
      setIsLoading(false);
    }

    // Tentar carregar do Supabase em background (opcional)
    if (isSupabaseConfigured) {
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

        if (!error && data) {
          const { data: { user } } = await supabase.auth.getUser();
          const currentUserId = user?.id;

          const transformedPosts: Post[] = data.map((post: any) => ({
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
            likes: post.likes?.length || 0,
            comments: post.comments?.length || 0,
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
          // Salvar no localStorage também
          localStorage.setItem('nutraelite_posts', JSON.stringify(transformedPosts.map(p => ({
            ...p,
            createdAt: p.createdAt.toISOString(),
            commentsList: p.commentsList?.map(c => ({
              ...c,
              createdAt: c.createdAt.toISOString(),
            })) || [],
          }))));
        }
      } catch (error) {
        console.warn('Erro ao carregar do Supabase (não crítico):', error);
      }
    }
  };

  useEffect(() => {
    loadPosts();

    if (!isSupabaseConfigured) return;

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

  const createPost = async (content: string, resultValue?: number, image?: string): Promise<Post> => {
    // Buscar dados do usuário - SEMPRE do localStorage
    const savedAuth = localStorage.getItem('nutraelite_auth');
    if (!savedAuth) {
      throw new Error('Usuário não autenticado. Faça login primeiro.');
    }
    
    const authData = JSON.parse(savedAuth);
    const authorData = authData?.user;
    
    if (!authorData) {
      throw new Error('Usuário não autenticado. Faça login primeiro.');
    }

    // Criar postagem
    const newPost: Post = {
      id: `post_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      author: {
        id: authorData.id || 'unknown',
        name: authorData.name || 'Usuário',
        avatar: authorData.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(authorData.name || 'Usuario')}&background=random`,
        level: authorData.level || 'Bronze',
        points: authorData.points || 0,
        rank: authorData.rank || 999,
        totalSales: authorData.totalSales || 0,
      },
      content: content || '',
      image: image || undefined,
      likes: 0,
      comments: 0,
      isLiked: false,
      createdAt: new Date(),
      resultValue: resultValue || undefined,
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
    
    localStorage.setItem('nutraelite_posts', JSON.stringify(updatedPosts));

    // Atualizar estado
    setPosts(prevPosts => [newPost, ...prevPosts]);

    // Tentar Supabase em background (não bloqueia)
    if (isSupabaseConfigured) {
      (async () => {
        try {
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            await supabase.from('posts').insert({
              author_id: user.id,
              content,
              image,
              result_value: resultValue,
              type: resultValue ? 'result' : 'post',
            });
            await loadPosts();
          }
        } catch (error) {
          // Ignorar erro - já está salvo localmente
        }
      })();
    }

    return newPost;
  };

  const likePost = async (postId: string) => {
    // Atualizar localmente primeiro
    setPosts(prevPosts => prevPosts.map(post => {
      if (post.id === postId) {
        const wasLiked = post.isLiked;
        return {
          ...post,
          isLiked: !wasLiked,
          likes: wasLiked ? post.likes - 1 : post.likes + 1,
        };
      }
      return post;
    }));

    // Salvar no localStorage
    const savedPosts = localStorage.getItem('nutraelite_posts');
    if (savedPosts) {
      const parsed = JSON.parse(savedPosts);
      const updated = parsed.map((post: any) => {
        if (post.id === postId) {
          const wasLiked = post.isLiked;
          return {
            ...post,
            isLiked: !wasLiked,
            likes: wasLiked ? (post.likes || 0) - 1 : (post.likes || 0) + 1,
          };
        }
        return post;
      });
      localStorage.setItem('nutraelite_posts', JSON.stringify(updated));
    }

    // Tentar Supabase em background
    if (isSupabaseConfigured) {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: existingLike } = await supabase
            .from('post_likes')
            .select('id')
            .eq('post_id', postId)
            .eq('user_id', user.id)
            .single();

          if (existingLike) {
            await supabase
              .from('post_likes')
              .delete()
              .eq('post_id', postId)
              .eq('user_id', user.id);
          } else {
            await supabase
              .from('post_likes')
              .insert({
                post_id: postId,
                user_id: user.id,
              });
          }
          await loadPosts();
        }
      } catch (error) {
        // Ignorar - já atualizado localmente
      }
    }
  };

  const addComment = async (postId: string, content: string) => {
    const savedAuth = localStorage.getItem('nutraelite_auth');
    if (!savedAuth) {
      throw new Error('Usuário não autenticado');
    }
    
    const authData = JSON.parse(savedAuth);
    const authorData = authData?.user;
    
    if (!authorData) {
      throw new Error('Usuário não autenticado');
    }

    const newComment: Comment = {
      id: `comment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      author: {
        id: authorData.id || 'unknown',
        name: authorData.name || 'Usuário',
        avatar: authorData.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(authorData.name || 'Usuario')}&background=random`,
        level: authorData.level || 'Bronze',
        points: authorData.points || 0,
        rank: authorData.rank || 999,
        totalSales: authorData.totalSales || 0,
      },
      content,
      createdAt: new Date(),
    };

    // Atualizar localmente
    setPosts(prevPosts => prevPosts.map(post => {
      if (post.id === postId) {
        return {
          ...post,
          comments: (post.comments || 0) + 1,
          commentsList: [...(post.commentsList || []), newComment],
        };
      }
      return post;
    }));

    // Salvar no localStorage
    const savedPosts = localStorage.getItem('nutraelite_posts');
    if (savedPosts) {
      const parsed = JSON.parse(savedPosts);
      const updated = parsed.map((post: any) => {
        if (post.id === postId) {
          return {
            ...post,
            comments: (post.comments || 0) + 1,
            commentsList: [...(post.commentsList || []), {
              ...newComment,
              createdAt: newComment.createdAt.toISOString(),
            }],
          };
        }
        return post;
      });
      localStorage.setItem('nutraelite_posts', JSON.stringify(updated));
    }

    // Tentar Supabase em background
    if (isSupabaseConfigured) {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          await supabase.from('comments').insert({
            post_id: postId,
            author_id: user.id,
            content,
          });
          await loadPosts();
        }
      } catch (error) {
        // Ignorar - já salvo localmente
      }
    }

    return newComment;
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
