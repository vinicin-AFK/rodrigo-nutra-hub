import { useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { Post, Comment } from '@/types';
import { safeSetItem, safeGetItem, ensureStorageSpace } from '@/lib/storage';

export function usePosts() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadPosts = async () => {
    setIsLoading(true);
    
    console.log('📥 Carregando postagens...', { isSupabaseConfigured });
    
    // SEMPRE carregar do localStorage primeiro (para ter dados imediatamente)
    try {
      const savedPosts = safeGetItem('nutraelite_posts');
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
        console.log('✅ Postagens carregadas do localStorage (inicial):', loadedPosts.length);
      }
    } catch (error) {
      console.error('Erro ao carregar postagens do localStorage:', error);
    }
    
    // Depois tentar sincronizar com Supabase (se configurado)
    if (isSupabaseConfigured) {
      try {
        console.log('🔍 Buscando postagens no Supabase...');
        const { data, error } = await supabase
          .from('posts')
          .select(`
            *,
            author:profiles(*),
            comments:comments(*, author:profiles(*)),
            likes:post_likes(*)
          `)
          .order('created_at', { ascending: false });

        console.log('📊 Resultado Supabase:', { data: data?.length || 0, error });

        if (error) {
          console.error('❌ Erro ao buscar do Supabase:', error);
          throw error;
        }

        if (data && data.length > 0) {
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

          // Mesclar com postagens do localStorage (manter ambas)
          const savedPosts = safeGetItem('nutraelite_posts');
          let allPosts = [...transformedPosts];
          
          if (savedPosts) {
            try {
              const parsed = JSON.parse(savedPosts);
              const localPosts: Post[] = parsed.map((post: any) => ({
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
              
              // Adicionar postagens locais que não estão no Supabase
              const supabaseIds = new Set(transformedPosts.map(p => p.id));
              const localOnly = localPosts.filter(p => !supabaseIds.has(p.id));
              allPosts = [...transformedPosts, ...localOnly];
            } catch (err) {
              console.warn('Erro ao mesclar postagens locais:', err);
            }
          }
          
          setPosts(allPosts);
          // Salvar tudo no localStorage
          const serialized = JSON.stringify(allPosts.map(p => ({
            ...p,
            createdAt: p.createdAt.toISOString(),
            commentsList: p.commentsList?.map(c => ({
              ...c,
              createdAt: c.createdAt.toISOString(),
            })) || [],
          })));
          safeSetItem('nutraelite_posts', serialized);
          console.log('✅ Postagens sincronizadas (Supabase + local):', allPosts.length);
        } else {
          console.log('⚠️ Nenhuma postagem no Supabase, mantendo cache local');
          // Manter postagens do localStorage que já foram carregadas
        }
      } catch (error: any) {
        console.error('❌ Erro ao carregar do Supabase, usando cache local:', error?.message || error);
        // Fallback para localStorage se Supabase falhar
        try {
          const savedPosts = safeGetItem('nutraelite_posts');
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
        } catch (localError) {
          console.error('Erro ao carregar do localStorage:', localError);
        }
      } finally {
        setIsLoading(false);
      }
    } else {
      // Modo offline - usar apenas localStorage
      try {
        const savedPosts = safeGetItem('nutraelite_posts');
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
    let savedAuth: string | null = null;
    let authData: any = null;
    let authorData: any = null;
    
    try {
      savedAuth = localStorage.getItem('nutraelite_auth');
      if (!savedAuth) {
        // Tentar buscar de outro lugar ou criar usuário temporário
        const mockUsers = localStorage.getItem('nutraelite_users');
        if (mockUsers) {
          const users = JSON.parse(mockUsers);
          if (users.length > 0) {
            authorData = users[0];
          }
        }
        
        if (!authorData) {
          // Criar usuário temporário se não houver nenhum
          authorData = {
            id: `temp_${Date.now()}`,
            name: 'Usuário',
            email: 'usuario@temp.com',
            avatar: 'https://ui-avatars.com/api/?name=Usuario&background=random',
            level: 'Bronze',
            points: 0,
            rank: 999,
            totalSales: 0,
          };
        }
      } else {
        authData = JSON.parse(savedAuth);
        authorData = authData?.user;
      }
    } catch (error) {
      console.error('Erro ao ler localStorage:', error);
      // Criar usuário temporário em caso de erro
      authorData = {
        id: `temp_${Date.now()}`,
        name: 'Usuário',
        email: 'usuario@temp.com',
        avatar: 'https://ui-avatars.com/api/?name=Usuario&background=random',
        level: 'Bronze',
        points: 0,
        rank: 999,
        totalSales: 0,
      };
    }
    
    if (!authorData) {
      // Último recurso - criar usuário padrão
      authorData = {
        id: `user_${Date.now()}`,
        name: 'Usuário',
        email: 'usuario@temp.com',
        avatar: 'https://ui-avatars.com/api/?name=Usuario&background=random',
        level: 'Bronze',
        points: 0,
        rank: 999,
        totalSales: 0,
      };
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

    console.log('📝 Criando postagem...', { isSupabaseConfigured, content: content.substring(0, 50) });
    
    // SEMPRE salvar no localStorage PRIMEIRO (para feedback imediato)
    ensureStorageSpace();
    
    const savedPosts = safeGetItem('nutraelite_posts');
    const existingPosts = savedPosts ? JSON.parse(savedPosts) : [];
    const updatedPosts = [{
      ...newPost,
      createdAt: newPost.createdAt.toISOString(),
    }, ...existingPosts];
    
    let serialized = JSON.stringify(updatedPosts);
    let saved = safeSetItem('nutraelite_posts', serialized);
    
    if (!saved) {
      const recentPosts = updatedPosts.slice(0, 10);
      serialized = JSON.stringify(recentPosts);
      saved = safeSetItem('nutraelite_posts', serialized);
      
      if (!saved) {
        const minimalPost = [{
          ...newPost,
          createdAt: newPost.createdAt.toISOString(),
        }];
        safeSetItem('nutraelite_posts', JSON.stringify(minimalPost));
      }
    }

    // Atualizar estado local IMEDIATAMENTE
    setPosts(prevPosts => [newPost, ...prevPosts]);
    console.log('✅ Postagem salva localmente (feedback imediato)');
    
    // Depois tentar sincronizar com Supabase (em background, não bloqueia)
    if (isSupabaseConfigured) {
      (async () => {
        try {
          const { data: { user } } = await supabase.auth.getUser();
          
          if (user) {
            console.log('💾 Sincronizando com Supabase...');
            const { data: insertedPost, error } = await supabase
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

            if (!error && insertedPost) {
              console.log('✅ Postagem sincronizada com Supabase:', insertedPost.id);
              // Recarregar do Supabase para ter dados atualizados
              await loadPosts();
            } else {
              console.warn('⚠️ Erro ao sincronizar com Supabase (não crítico):', error);
            }
          } else {
            console.log('ℹ️ Usuário não autenticado no Supabase, mantendo apenas local');
          }
        } catch (error: any) {
          console.warn('⚠️ Erro ao sincronizar com Supabase (não crítico):', error?.message || error);
          // Não é crítico - já está salvo localmente
        }
      })();
    }

    return newPost;
  };

  const likePost = async (postId: string) => {
    // PRIORIZAR Supabase se estiver configurado
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
          // Recarregar do Supabase para sincronizar com todos
          await loadPosts();
          return;
        }
      } catch (error) {
        console.error('Erro ao salvar like no Supabase:', error);
        // Fallback para localStorage
      }
    }

    // Fallback: atualizar localmente
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

    const savedPosts = safeGetItem('nutraelite_posts');
    if (savedPosts) {
      try {
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
        safeSetItem('nutraelite_posts', JSON.stringify(updated));
      } catch (error) {
        console.warn('Erro ao salvar like (não crítico):', error);
      }
    }
  };

  const addComment = async (postId: string, content: string) => {
    // PRIORIZAR Supabase se estiver configurado
    if (isSupabaseConfigured) {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          // Salvar no Supabase PRIMEIRO
          const { data: insertedComment, error } = await supabase
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

          // Recarregar do Supabase para sincronizar com todos
          await loadPosts();
          
          // Retornar o comentário criado
          if (insertedComment) {
            const newComment: Comment = {
              id: insertedComment.id,
              author: {
                id: insertedComment.author.id,
                name: insertedComment.author.name,
                avatar: insertedComment.author.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(insertedComment.author.name)}&background=random`,
                level: insertedComment.author.level || 'Bronze',
                points: insertedComment.author.points || 0,
                rank: insertedComment.author.rank || 999,
                totalSales: insertedComment.author.total_sales || 0,
              },
              content: insertedComment.content,
              createdAt: new Date(insertedComment.created_at),
            };
            return newComment;
          }
        }
      } catch (error) {
        console.error('Erro ao salvar comentário no Supabase:', error);
        // Fallback para localStorage
      }
    }

    // Fallback: usar localStorage
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

    const savedPosts = safeGetItem('nutraelite_posts');
    if (savedPosts) {
      try {
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
        safeSetItem('nutraelite_posts', JSON.stringify(updated));
      } catch (error) {
        console.warn('Erro ao salvar comentário (não crítico):', error);
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
