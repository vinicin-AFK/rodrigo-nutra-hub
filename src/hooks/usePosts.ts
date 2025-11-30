import { useState, useEffect, useRef } from 'react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { Post, Comment } from '@/types';
import { safeSetItem, safeGetItem, ensureStorageSpace } from '@/lib/storage';
import { toast } from '@/hooks/use-toast';

export function usePosts() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const postsRef = useRef<Post[]>([]);
  
  // Manter ref atualizada
  useEffect(() => {
    postsRef.current = posts;
  }, [posts]);

  const loadPosts = async (forceFromSupabase: boolean = false) => {
    setIsLoading(true);
    
    console.log('📥 Carregando postagens...', { isSupabaseConfigured, forceFromSupabase });
    
    const savedAuth = safeGetItem('nutraelite_auth');
    let currentUser: any = null;
    
    // Buscar perfil atual do usuário
    if (savedAuth) {
      try {
        const authData = JSON.parse(savedAuth);
        currentUser = authData?.user;
      } catch (e) {
        console.warn('Erro ao parsear auth:', e);
      }
    }
    
    // FEED GLOBAL: SEMPRE sincronizar com Supabase PRIMEIRO para garantir que todos veem o mesmo conteúdo
    // CRÍTICO: No mobile, NUNCA usar localStorage como fonte primária - sempre Supabase
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    const syncTimeout = isMobile ? 20000 : 15000; // Mobile: 20s, Desktop: 15s (aumentado)
    
    if (isSupabaseConfigured) {
      // MOBILE: Tentar múltiplas vezes antes de desistir
      let attempts = isMobile ? 3 : 2; // Mobile: 3 tentativas, Desktop: 2
      let lastError: any = null;
      
      for (let attempt = 1; attempt <= attempts; attempt++) {
        try {
          console.log(`📱 ${isMobile ? 'Mobile' : 'Desktop'} - Tentativa ${attempt}/${attempts} - timeout: ${syncTimeout}ms`);
          
          // Se for forçado ou primeira tentativa, limpar cache local primeiro
          if (forceFromSupabase || attempt === 1) {
            console.log('🗑️ Limpando cache local de posts para forçar sincronização...');
            localStorage.removeItem('nutraelite_posts');
          }
          
          await Promise.race([
            syncWithSupabase(currentUser, attempt === 1), // Mostrar loading apenas na primeira tentativa
            new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), syncTimeout))
          ]);
          
          console.log(`✅ Feed global sincronizado do Supabase (tentativa ${attempt})`);
          return; // Sucesso - não precisa mais tentar
        } catch (error) {
          lastError = error;
          console.warn(`⚠️ Tentativa ${attempt} falhou:`, error);
          
          // Se não for a última tentativa, aguardar um pouco antes de tentar novamente
          if (attempt < attempts) {
            const waitTime = isMobile ? 2000 : 1000; // Mobile: 2s, Desktop: 1s
            console.log(`⏳ Aguardando ${waitTime}ms antes da próxima tentativa...`);
            await new Promise(resolve => setTimeout(resolve, waitTime));
          }
        }
      }
      
      // Se todas as tentativas falharam, mostrar erro mas NÃO usar localStorage
      console.error('❌ Todas as tentativas de sincronização falharam:', lastError);
      toast({
        title: '⚠️ Erro ao carregar feed',
        description: isMobile 
          ? 'Não foi possível sincronizar. Verifique sua conexão e tente novamente.'
          : 'Erro ao carregar publicações do servidor.',
        variant: 'destructive',
        duration: 5000,
      });
      
      // ⚠️ CRÍTICO: NUNCA usar localStorage como fallback se Supabase está configurado
      // localStorage é isolado por dispositivo e causaria feeds diferentes
      // Se Supabase falhou, mostrar erro e tentar novamente, não usar cache local
      console.log('❌ Supabase configurado mas falhou - NÃO usando localStorage (garantir feed global)');
      setPosts([]);
      setIsLoading(false);
      
      // Tentar novamente após 5 segundos
      setTimeout(() => {
        console.log('🔄 Tentando recarregar feed após falha...');
        loadPosts(true);
      }, 5000);
      
      return;
    }
    
    // ⚠️ CRÍTICO: localStorage é APENAS cache, NÃO fonte primária
    // Se Supabase está configurado mas falhou, NÃO usar localStorage
    // Isso garante que todos os dispositivos veem o mesmo conteúdo
    // localStorage isolado por dispositivo causaria feeds diferentes
    const savedPosts = safeGetItem('nutraelite_posts');
    if (savedPosts && !isSupabaseConfigured) {
      try {
        const parsed = JSON.parse(savedPosts);
        const loadedPosts: Post[] = parsed.map((post: any) => {
          let author = post.author || {
            id: 'unknown',
            name: 'Usuário',
            avatar: 'https://ui-avatars.com/api/?name=Usuario&background=random',
            level: 'Bronze',
            points: 0,
            rank: 999,
            totalSales: 0,
          };
          
          if (currentUser && author.id === currentUser.id) {
            author = {
              ...author,
              name: currentUser.name || author.name,
              avatar: currentUser.avatar || author.avatar,
            };
          }
          
          const commentsList = post.commentsList?.map((c: any) => {
            let commentAuthor = c.author || {
              id: 'unknown',
              name: 'Usuário',
              avatar: 'https://ui-avatars.com/api/?name=Usuario&background=random',
            };
            
            if (currentUser && commentAuthor.id === currentUser.id) {
              commentAuthor = {
                ...commentAuthor,
                name: currentUser.name || commentAuthor.name,
                avatar: currentUser.avatar || commentAuthor.avatar,
              };
            }
            
            return {
              ...c,
              createdAt: new Date(c.createdAt),
              author: commentAuthor,
            };
          }) || [];
          
          return {
            ...post,
            createdAt: new Date(post.createdAt),
            author,
            commentsList,
          };
        });
        
        setPosts(loadedPosts);
        setIsLoading(false);
        console.log('✅ Feed carregado do localStorage (instantâneo):', loadedPosts.length);
        
        // Sincronizar com Supabase em background (não bloqueia)
        if (isSupabaseConfigured) {
          syncWithSupabase(currentUser, false).catch(err => {
            console.warn('⚠️ Erro ao sincronizar (não crítico):', err);
          });
        }
        return;
      } catch (error) {
        console.warn('Erro ao carregar do localStorage:', error);
      }
    }
    
    // Se não há dados locais, tentar Supabase
    if (isSupabaseConfigured) {
      await syncWithSupabase(currentUser, true);
    } else {
      setPosts([]);
      setIsLoading(false);
    }
  };

  const syncWithSupabase = async (currentUser: any, showLoading: boolean = true) => {
    try {
      if (showLoading) {
        setIsLoading(true);
      }
      console.log('🌍 COMUNIDADE GLOBAL: Sincronizando FEED GLOBAL com Supabase...');
      console.log('📌 PRINCÍPIO: Todos os usuários veem o mesmo feed - SEM filtro por usuário');
      
      // ============================================
      // FEED GLOBAL - COMUNIDADE ÚNICA
      // ============================================
      // ❌ ERRADO (exemplo do que NÃO fazer):
      //   const posts = await prisma.post.findMany({
      //     where: { userId: currentUser.id }  // ← ISOLAMENTO POR USUÁRIO
      //   });
      //   Isso faria cada usuário ver apenas suas próprias publicações!
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
              reactions: 0,
            },
          };
        });

        setPosts(transformedPosts);
        // FEED GLOBAL: Salvar no localStorage compartilhado
        const serialized = JSON.stringify(transformedPosts.map(p => ({
          ...p,
          createdAt: p.createdAt.toISOString(),
          commentsList: p.commentsList?.map(c => ({
            ...c,
            createdAt: c.createdAt.toISOString(),
          })) || [],
        })));
        safeSetItem('nutraelite_posts', serialized);
        setIsLoading(false);
        console.log('✅ Feed global sincronizado do Supabase:', transformedPosts.length);
      } else if (error) {
        console.warn('⚠️ Erro ao buscar do Supabase:', error);
        setIsLoading(false);
      } else {
        // Sem dados mas sem erro
        setPosts([]);
        setIsLoading(false);
      }
    } catch (error: any) {
      if (error?.message === 'Timeout ao carregar posts') {
        console.warn('⚠️ Timeout ao buscar do Supabase (3s)');
      } else {
        console.warn('⚠️ Erro ao sincronizar com Supabase:', error?.message || error);
      }
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadPosts();

    // Listener para atualizar posts quando o perfil mudar
    const handleProfileUpdate = (event: CustomEvent) => {
      const updatedUser = event.detail;
      console.log('🔄 Atualizando posts com novo perfil:', updatedUser.name);
      
      // Recarregar posts do localStorage para pegar as atualizações
      loadPosts();
      
      // Também atualizar estado imediatamente
      setPosts(prevPosts => {
        const updated = prevPosts.map(post => {
          // Se o post é do usuário atual, atualizar o autor
          if (post.author?.id === updatedUser.id) {
            return {
              ...post,
              author: {
                ...post.author,
                name: updatedUser.name,
                avatar: updatedUser.avatar || post.author.avatar,
              },
            };
          }
          // Atualizar comentários do usuário também
          if (post.commentsList) {
            return {
              ...post,
              commentsList: post.commentsList.map(comment => {
                if (comment.author?.id === updatedUser.id) {
                  return {
                    ...comment,
                    author: {
                      ...comment.author,
                      name: updatedUser.name,
                      avatar: updatedUser.avatar || comment.author.avatar,
                    },
                  };
                }
                return comment;
              }),
            };
          }
          return post;
        });
        // Salvar posts atualizados no localStorage
        try {
          const serialized = JSON.stringify(updated.map(p => ({
            ...p,
            createdAt: p.createdAt.toISOString(),
            commentsList: p.commentsList?.map(c => ({
              ...c,
              createdAt: c.createdAt.toISOString(),
            })) || [],
          })));
          safeSetItem('nutraelite_posts', serialized);
        } catch (error) {
          console.error('Erro ao salvar posts atualizados:', error);
        }
        return updated;
      });
    };

    window.addEventListener('profile-updated', handleProfileUpdate as EventListener);

    if (!isSupabaseConfigured) {
      return () => {
        window.removeEventListener('profile-updated', handleProfileUpdate as EventListener);
      };
    }

    // ============================================
    // REAL-TIME: Sincronização Instantânea
    // ============================================
    // ✅ Supabase Realtime notifica TODOS os usuários quando há mudanças
    // ✅ Garante que o feed global seja atualizado em tempo real
    // ============================================
    const subscription = supabase
      .channel('posts_changes')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'posts' },
        (payload) => {
          console.log('🔄 Real-time: Nova postagem detectada - atualizando feed global');
          loadPosts(false); // Recarregar feed global sem mostrar loading
        }
      )
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'comments' },
        (payload) => {
          console.log('🔄 Real-time: Novo comentário detectado - atualizando feed global');
          loadPosts(false); // Recarregar feed global sem mostrar loading
        }
      )
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'post_likes' },
        (payload) => {
          console.log('🔄 Real-time: Nova curtida detectada - atualizando feed global');
          loadPosts(false); // Recarregar feed global sem mostrar loading
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('✅ Real-time ativo - feed global sincronizado');
        }
      });

    // Salvar posts no localStorage quando o app for fechado
    const handleBeforeUnload = () => {
      try {
        const currentPosts = postsRef.current;
        const serialized = JSON.stringify(currentPosts.map(p => ({
          ...p,
          createdAt: p.createdAt.toISOString(),
          commentsList: p.commentsList?.map(c => ({
            ...c,
            createdAt: c.createdAt.toISOString(),
          })) || [],
        })));
        safeSetItem('nutraelite_posts', serialized);
        console.log('💾 Posts salvos antes de fechar o app');
      } catch (error) {
        console.error('Erro ao salvar posts antes de fechar:', error);
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('pagehide', handleBeforeUnload);

    return () => {
      subscription.unsubscribe();
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('pagehide', handleBeforeUnload);
      window.removeEventListener('profile-updated', handleProfileUpdate as EventListener);
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

    // VALIDAÇÃO: Post não pode existir sem usuário (regra da Comunidade)
    if (!authorData || !authorData.id) {
      throw new Error('Publicação não pode ser criada sem um usuário válido');
    }

    // Verificar se é suporte
    const isSupportUser = authorData.role === 'support' || authorData.role === 'admin';
    
    // Criar postagem
    const newPost: Post = {
      id: `post_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      author: {
        id: authorData.id, // OBRIGATÓRIO - validado acima
        name: authorData.name || 'Usuário',
        avatar: authorData.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(authorData.name || 'Usuario')}&background=random`,
        level: authorData.level || 'Bronze',
        points: authorData.points || 0,
        rank: authorData.rank || 999,
        totalSales: authorData.totalSales || 0,
        role: isSupportUser ? 'support' : undefined,
      },
      content: content || '',
      image: image || undefined,
      likes: 0,
      comments: 0,
      isLiked: false,
      createdAt: new Date(),
      resultValue: resultValue || undefined,
      type: resultValue ? 'result' : 'post',
      status: 'active', // Status padrão
      commentsList: [],
      engagement: {
        likes: 0,
        comments: 0,
        reactions: 0,
      },
    };

    console.log('📝 Criando postagem...', { 
      isSupabaseConfigured, 
      content: content.substring(0, 50),
      authorId: authorData.id,
      authorName: authorData.name,
    });
    
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
    setPosts(prevPosts => {
      // Verificar se o post já existe (evitar duplicação)
      const exists = prevPosts.some(p => p.id === newPost.id);
      if (exists) {
        console.log('⚠️ Post já existe no estado, não duplicando');
        return prevPosts;
      }
      return [newPost, ...prevPosts];
    });
    console.log('✅ Postagem salva localmente (feedback imediato)');
    
    // Mostrar notificação imediata de sucesso local
    toast({
      title: '📝 Publicação criada!',
      description: 'Sua publicação foi criada. Sincronizando com o servidor...',
      duration: 3000,
    });
    
    // Depois tentar sincronizar com Supabase (em background, não bloqueia)
    console.log('🔍 Verificando Supabase...', { 
      isSupabaseConfigured,
      willSync: isSupabaseConfigured,
      supabaseUrl: import.meta.env.VITE_SUPABASE_URL?.substring(0, 30) + '...',
      hasAnonKey: !!import.meta.env.VITE_SUPABASE_ANON_KEY,
    });
    
    if (!isSupabaseConfigured) {
      console.error('❌ CRÍTICO: Supabase NÃO está configurado!');
      console.error('📋 Variáveis de ambiente:', {
        url: import.meta.env.VITE_SUPABASE_URL,
        hasKey: !!import.meta.env.VITE_SUPABASE_ANON_KEY,
        keyLength: import.meta.env.VITE_SUPABASE_ANON_KEY?.length || 0,
      });
      
      // Mostrar aviso se Supabase não estiver configurado
      toast({
        title: '⚠️ Modo offline',
        description: 'Supabase não configurado. A publicação foi salva apenas localmente. Verifique o .env.local e reinicie o servidor.',
        variant: 'destructive',
        duration: 10000,
      });
      return newPost; // Retornar sem tentar sincronizar
    }
    
    // CRÍTICO: Tentar salvar no Supabase de forma SÍNCRONA (aguardar resultado)
    // Não fazer em background - precisamos saber se salvou ou não
    if (isSupabaseConfigured) {
      try {
        console.log('🔐 Buscando usuário autenticado...');
        const { data: { user }, error: userError } = await supabase.auth.getUser();
          
        console.log('👤 Resultado da autenticação:', { 
          hasUser: !!user, 
          userId: user?.id,
          userEmail: user?.email,
          error: userError?.message,
          errorCode: userError?.code,
        });
        
        // Verificar também a sessão
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        console.log('🔑 Sessão:', {
          hasSession: !!session,
          userId: session?.user?.id,
          expiresAt: session?.expires_at,
          sessionError: sessionError?.message,
        });
        
        if (userError) {
          console.error('❌ ERRO CRÍTICO ao buscar usuário do Supabase:', userError);
          console.error('📋 Detalhes completos:', {
            message: userError.message,
            code: userError.code,
            status: userError.status,
            name: userError.name,
          });
          
          toast({
            title: '❌ Erro de Autenticação',
            description: `Não foi possível verificar sua autenticação: ${userError.message}. Faça login novamente.`,
            variant: 'destructive',
            duration: 10000,
          });
          return;
        }
        
        if (!user) {
          console.error('❌ ERRO CRÍTICO: Usuário não autenticado!');
          console.error('📋 Isso significa que o post NÃO será salvo no Supabase.');
          
          toast({
            title: '⚠️ Não autenticado',
            description: 'Você não está autenticado. Faça login para salvar posts no servidor.',
            variant: 'destructive',
            duration: 10000,
          });
          return;
        }
          
          if (user) {
            console.log('💾 Sincronizando com Supabase...', { 
              userId: user.id, 
              content: content.substring(0, 30),
              hasImage: !!image,
              resultValue,
            });
            
            // Verificar se o perfil existe no Supabase
            const { data: profile, error: profileError } = await supabase
              .from('profiles')
              .select('id')
              .eq('id', user.id)
              .single();
            
            if (profileError && profileError.code !== 'PGRST116') {
              console.warn('⚠️ Erro ao verificar perfil:', profileError);
              // Tentar criar perfil se não existir
              const { error: insertProfileError } = await supabase
                .from('profiles')
                .insert({
                  id: user.id,
                  name: authorData.name || 'Usuário',
                  email: authorData.email || user.email || 'usuario@temp.com',
                  avatar: authorData.avatar,
                });
              
              if (insertProfileError) {
                console.warn('⚠️ Erro ao criar perfil:', insertProfileError);
              }
            }
            
            // ============================================
            // CRIAR POST NO FEED GLOBAL
            // ============================================
            // Equivalente ao Prisma:
            //   prisma.post.create({
            //     data: { userId, content, imageUrl }
            //   })
            // ============================================
            // ✅ Post é criado no feed GLOBAL - visível para TODOS
            // ✅ Não há filtro ou isolamento por usuário
            // ============================================
            console.log('📤 Criando post no feed global...', {
              author_id: user.id,
              content_length: content.length,
              has_image: !!image,
              type: resultValue ? 'result' : 'post',
            });
            
            // CRÍTICO: Tentar inserir com retry em caso de falha
            let insertedPost: any = null;
            let error: any = null;
            const maxAttempts = 3;
            
            for (let attempt = 1; attempt <= maxAttempts; attempt++) {
              console.log(`📤 Tentativa ${attempt}/${maxAttempts} de inserir post no Supabase...`);
              console.log(`📋 Dados:`, {
                author_id: user.id,
                content_length: content.length,
                has_image: !!image,
                type: resultValue ? 'result' : 'post',
              });
              
              const result = await supabase
                .from('posts')
                .insert({
                  author_id: user.id,      // Equivalente a: userId
                  content,                 // Equivalente a: content
                  image: image || null,     // Equivalente a: imageUrl
                  result_value: resultValue || null,
                  type: resultValue ? 'result' : 'post',
                  status: 'active',         // Garantir que o status seja 'active' (visível para todos)
                })
                .select(`
                  id,
                  created_at,
                  author:profiles(id, name, avatar, level, points, rank, total_sales, role)
                `)
                .single();
              
              insertedPost = result.data;
              error = result.error;
              
              console.log(`📥 Resposta do Supabase (tentativa ${attempt}):`, {
                hasData: !!insertedPost,
                hasError: !!error,
                postId: insertedPost?.id,
                errorMessage: error?.message,
                errorCode: error?.code,
                errorDetails: error?.details,
                errorHint: error?.hint,
              });
              
              if (!error && insertedPost) {
                console.log(`✅ Post inserido com sucesso na tentativa ${attempt}!`);
                break; // Sucesso - sair do loop
              } else {
                console.error(`❌ Tentativa ${attempt} falhou:`, {
                  error: error?.message,
                  code: error?.code,
                  details: error?.details,
                  hint: error?.hint,
                  fullError: JSON.stringify(error, null, 2),
                });
                
                // Se for erro de RLS, mostrar mensagem específica
                if (error?.code === '42501' || error?.message?.includes('row-level security') || error?.message?.includes('permission denied')) {
                  console.error('🔒 ERRO DE RLS DETECTADO!');
                  console.error('💡 Execute o script supabase_fix_posts_definitivo.sql no Supabase SQL Editor');
                  
                  if (attempt === maxAttempts) {
                    toast({
                      title: '🔒 Erro de Permissão (RLS)',
                      description: 'As políticas de segurança estão bloqueando. Execute o script supabase_fix_posts_definitivo.sql no Supabase.',
                      variant: 'destructive',
                      duration: 15000,
                    });
                  }
                }
                
                if (attempt < maxAttempts) {
                  // Aguardar antes de tentar novamente
                  const waitTime = attempt * 1000; // 1s, 2s, 3s
                  console.log(`⏳ Aguardando ${waitTime}ms antes da próxima tentativa...`);
                  await new Promise(resolve => setTimeout(resolve, waitTime));
                } else {
                  // Última tentativa falhou - mostrar erro final
                  console.error('❌ TODAS AS TENTATIVAS FALHARAM!');
                  console.error('📋 Erro final:', {
                    message: error?.message,
                    code: error?.code,
                    details: error?.details,
                    hint: error?.hint,
                  });
                }
              }
            }

            if (!error && insertedPost) {
              console.log('✅ Postagem sincronizada com Supabase:', insertedPost.id);
              console.log('📊 Dados inseridos:', { 
                id: insertedPost.id, 
                author_id: user.id, 
                content: content.substring(0, 50),
                created_at: insertedPost.created_at,
              });
              
              // Mostrar notificação de sucesso (visível no mobile)
              toast({
                title: '✅ Publicação salva!',
                description: 'Sua publicação foi salva no servidor e está visível para todos.',
                duration: 3000,
              });
              
              // Atualizar o post local com o ID do Supabase e dados atualizados
              setPosts(prevPosts => {
                return prevPosts.map(p => {
                  if (p.id === newPost.id) {
                    return {
                      ...p,
                      id: insertedPost.id,
                      createdAt: new Date(insertedPost.created_at),
                      author: {
                        ...p.author,
                        ...(insertedPost.author ? {
                          id: insertedPost.author.id,
                          name: insertedPost.author.name || p.author.name,
                          avatar: insertedPost.author.avatar || p.author.avatar,
                          level: insertedPost.author.level || p.author.level,
                          points: insertedPost.author.points || p.author.points,
                          rank: insertedPost.author.rank || p.author.rank,
                          totalSales: insertedPost.author.total_sales || p.author.totalSales,
                          role: insertedPost.author.role || p.author.role,
                        } : {}),
                      },
                    };
                  }
                  return p;
                });
              });
              
              // Recarregar do Supabase IMEDIATAMENTE para garantir que todos veem a nova publicação
              console.log('🔄 Recarregando feed global após criar publicação...');
              await loadPosts(false);
              console.log('✅ Feed global atualizado - publicação visível para TODOS os usuários');
            } else {
              // ERRO CRÍTICO: Mostrar todos os detalhes
              console.error('❌ ERRO CRÍTICO ao salvar post no Supabase:', error);
              console.error('📋 Detalhes completos do erro:', {
                message: error?.message,
                code: error?.code,
                details: error?.details,
                hint: error?.hint,
                userId: user.id,
                userEmail: user.email,
                content: content.substring(0, 50),
                hasImage: !!image,
                type: resultValue ? 'result' : 'post',
              });
              
              // Verificar se é erro de RLS (política bloqueando)
              const isRLSError = error?.code === '42501' || 
                                error?.message?.includes('permission denied') ||
                                error?.message?.includes('row-level security') ||
                                error?.message?.includes('policy violation');
              
              // Verificar se é erro de autenticação
              const isAuthError = error?.code === 'PGRST301' ||
                                 error?.message?.includes('JWT') ||
                                 error?.message?.includes('authentication');
              
              // Construir mensagem de erro detalhada
              let errorTitle = '❌ Erro ao salvar no servidor';
              let errorDescription = error?.message || 'Erro desconhecido';
              
              if (isRLSError) {
                errorTitle = '🔒 Erro de Permissão (RLS)';
                errorDescription = 'As políticas de segurança estão bloqueando a criação do post. Execute o script supabase_fix_insert_posts.sql no Supabase.';
              } else if (isAuthError) {
                errorTitle = '🔐 Erro de Autenticação';
                errorDescription = 'Você não está autenticado corretamente. Faça login novamente.';
              }
              
              if (error?.hint) {
                errorDescription += `\n\n💡 Dica: ${error.hint}`;
              }
              
              // Mostrar notificação de erro (visível no mobile) com mais detalhes
              toast({
                title: errorTitle,
                description: errorDescription,
                variant: 'destructive',
                duration: 15000, // 15 segundos para garantir que seja lido
              });
              
              // Log adicional para debug
              console.error('🔍 DEBUG: Verificando autenticação...');
              const { data: { user: verifyUser }, error: verifyError } = await supabase.auth.getUser();
              console.error('🔍 DEBUG: Usuário verificado:', {
                hasUser: !!verifyUser,
                userId: verifyUser?.id,
                email: verifyUser?.email,
                verifyError: verifyError?.message,
              });
              
              // Não lançar erro - apenas mostrar notificação
              // O post já foi salvo localmente, então não é crítico
            }
          } else {
            console.warn('⚠️ Usuário não autenticado no Supabase!');
            console.warn('📋 Isso significa que a publicação será salva apenas localmente.');
            console.warn('💡 Solução: Faça login novamente no aplicativo.');
            
            // Mostrar notificação de aviso (visível no mobile)
            toast({
              title: '⚠️ Não autenticado',
              description: 'A publicação foi salva localmente. Faça login para sincronizar com o servidor.',
              variant: 'destructive',
              duration: 5000,
            });
          }
      } catch (error: any) {
        console.error('❌ Erro crítico ao sincronizar com Supabase:', error?.message || error);
        console.error('📋 Stack trace:', error?.stack);
        
        // Mostrar notificação de erro crítico
        toast({
          title: '❌ Erro crítico ao salvar',
          description: `Erro inesperado: ${error?.message || 'Erro desconhecido'}. Verifique o console para mais detalhes.`,
          variant: 'destructive',
          duration: 10000,
        });
        
        // Não propagar erro - post já está salvo localmente
      }
    } else {
      console.warn('⚠️ Supabase não configurado - publicação salva apenas localmente');
    }

    return newPost;
  };

  const likePost = async (postId: string) => {
    // ATUALIZAR ESTADO IMEDIATAMENTE (antes de salvar)
    setPosts(prevPosts => {
      const updated = prevPosts.map(post => {
        if (post.id === postId) {
          const wasLiked = post.isLiked;
          const updatedPost = {
            ...post,
            isLiked: !wasLiked,
            likes: wasLiked ? Math.max(0, (post.likes || 0) - 1) : (post.likes || 0) + 1,
          };
          console.log('🔄 Like atualizado no estado:', { postId, isLiked: updatedPost.isLiked, likes: updatedPost.likes });
          return updatedPost;
        }
        return post;
      });
      return updated;
    });

    // Salvar no localStorage IMEDIATAMENTE
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
              likes: wasLiked ? Math.max(0, (post.likes || 0) - 1) : (post.likes || 0) + 1,
            };
          }
          return post;
        });
        safeSetItem('nutraelite_posts', JSON.stringify(updated));
        console.log('✅ Like salvo no localStorage');
      } catch (error) {
        console.warn('⚠️ Erro ao salvar like (não crítico):', error);
      }
    }

    // Tentar sincronizar com Supabase em background (não bloqueia)
    if (isSupabaseConfigured) {
      (async () => {
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
            console.log('✅ Like sincronizado com Supabase');
            // Recarregar do Supabase em background para sincronizar com todos
            loadPosts();
          }
        } catch (error) {
          console.warn('⚠️ Erro ao sincronizar like com Supabase (não crítico):', error);
        }
      })();
    }
  };

  const addComment = async (postId: string, content: string) => {
    console.log('💬 addComment chamado:', { postId, content: content.substring(0, 50) });
    
    // VALIDAÇÃO: Comentário não pode existir sem publicação (regra da Comunidade)
    const postExists = postsRef.current.find(p => p.id === postId);
    if (!postExists) {
      throw new Error('Comentário não pode ser criado sem uma publicação válida');
    }
    
    // SEMPRE salvar no localStorage PRIMEIRO (para feedback imediato)
    const savedAuth = localStorage.getItem('nutraelite_auth');
    if (!savedAuth) {
      console.error('❌ Usuário não autenticado');
      throw new Error('Usuário não autenticado');
    }
    
    const authData = JSON.parse(savedAuth);
    const authorData = authData?.user;
    
    // VALIDAÇÃO: Comentário não pode existir sem usuário (regra da Comunidade)
    if (!authorData || !authorData.id) {
      console.error('❌ Dados do usuário não encontrados');
      throw new Error('Comentário não pode ser criado sem um usuário válido');
    }

    // Verificar se é suporte
    const isSupportUser = authorData.role === 'support' || authorData.role === 'admin';
    
    const newComment: Comment = {
      id: `comment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      postId: postId, // OBRIGATÓRIO - validado acima
      author: {
        id: authorData.id, // OBRIGATÓRIO - validado acima
        name: authorData.name || 'Usuário',
        avatar: authorData.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(authorData.name || 'Usuario')}&background=random`,
        level: authorData.level || 'Bronze',
        points: authorData.points || 0,
        rank: authorData.rank || 999,
        totalSales: authorData.totalSales || 0,
        role: isSupportUser ? 'support' : undefined,
      },
      content: content.trim(),
      createdAt: new Date(),
      status: 'active', // Status padrão
    };

    console.log('✅ Comentário criado:', newComment.id);

    // ATUALIZAR ESTADO IMEDIATAMENTE (antes de salvar no localStorage)
    setPosts(prevPosts => {
      const updated = prevPosts.map(post => {
        if (post.id === postId) {
          const updatedPost = {
            ...post,
            comments: (post.comments || 0) + 1,
            commentsList: [...(post.commentsList || []), newComment],
          };
          console.log('🔄 Post atualizado no estado:', updatedPost.id, 'comentários:', updatedPost.commentsList.length);
          return updatedPost;
        }
        return post;
      });
      return updated;
    });

    // Salvar no localStorage
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
        console.log('✅ Comentário salvo no localStorage');
      } catch (error) {
        console.warn('⚠️ Erro ao salvar comentário no localStorage:', error);
      }
    }

    // Tentar sincronizar com Supabase em background (não bloqueia)
    if (isSupabaseConfigured) {
      (async () => {
        try {
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            console.log('🔄 Tentando sincronizar comentário com Supabase...');
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

            if (error) {
              console.warn('⚠️ Erro ao salvar comentário no Supabase:', error);
              return;
            }

            console.log('✅ Comentário sincronizado com Supabase');
            // Recarregar do Supabase para sincronizar com todos (em background)
            loadPosts();
          }
        } catch (error) {
          console.warn('⚠️ Erro ao sincronizar comentário com Supabase (não crítico):', error);
        }
      })();
    }

    return newComment;
  };

  const deletePost = async (postId: string) => {
    console.log('🗑️ Deletando publicação:', postId);
    
    // Remover do localStorage
    try {
      const savedPosts = safeGetItem('nutraelite_posts');
      if (savedPosts) {
        const parsed = JSON.parse(savedPosts);
        const filtered = parsed.filter((post: any) => post.id !== postId);
        safeSetItem('nutraelite_posts', JSON.stringify(filtered));
        setPosts(filtered.map((post: any) => ({
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
        })));
        console.log('✅ Publicação deletada do localStorage');
      }
    } catch (error) {
      console.error('Erro ao deletar publicação:', error);
    }
    
    // Deletar do Supabase em background
    if (isSupabaseConfigured) {
      (async () => {
        try {
          // Deletar likes primeiro
          await supabase.from('post_likes').delete().eq('post_id', postId);
          // Deletar comentários
          await supabase.from('post_comments').delete().eq('post_id', postId);
          // Deletar post
          await supabase.from('posts').delete().eq('id', postId);
          console.log('✅ Publicação deletada do Supabase');
        } catch (error) {
          console.warn('⚠️ Erro ao deletar publicação do Supabase:', error);
        }
      })();
    }
  };

  const deleteComment = async (postId: string, commentId: string) => {
    console.log('🗑️ Deletando comentário:', commentId);
    
    // Remover do localStorage
    try {
      const savedPosts = safeGetItem('nutraelite_posts');
      if (savedPosts) {
        const parsed = JSON.parse(savedPosts);
        const updated = parsed.map((post: any) => {
          if (post.id === postId) {
            return {
              ...post,
              commentsList: (post.commentsList || []).filter((c: any) => c.id !== commentId),
              comments: Math.max(0, (post.comments || 0) - 1),
            };
          }
          return post;
        });
        safeSetItem('nutraelite_posts', JSON.stringify(updated));
        setPosts(updated.map((post: any) => ({
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
        })));
        console.log('✅ Comentário deletado do localStorage');
      }
    } catch (error) {
      console.error('Erro ao deletar comentário:', error);
    }
    
    // Deletar do Supabase em background
    if (isSupabaseConfigured) {
      (async () => {
        try {
          await supabase.from('post_comments').delete().eq('id', commentId);
          console.log('✅ Comentário deletado do Supabase');
        } catch (error) {
          console.warn('⚠️ Erro ao deletar comentário do Supabase:', error);
        }
      })();
    }
  };

    return {
      posts,
      isLoading,
      createPost,
      likePost,
      addComment,
      deletePost,
      deleteComment,
      refresh: loadPosts,
      forceRefresh: () => loadPosts(true), // Forçar recarregamento do Supabase (limpa cache local)
    };
}
