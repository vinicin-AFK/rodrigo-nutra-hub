import { useState, useEffect, useRef } from 'react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { Message } from '@/types';
import { safeSetItem, safeGetItem, ensureStorageSpace } from '@/lib/storage';

export function useCommunityMessages() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const messagesRef = useRef<Message[]>([]);
  
  // Manter ref atualizada
  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  const loadMessages = async (showLoading: boolean = true) => {
    if (showLoading) {
      setIsLoading(true);
    }
    
    console.log('📥 Carregando mensagens...', { isSupabaseConfigured });
    
    const savedAuth = safeGetItem('nutraelite_auth');
    let currentUserId: string | null = null;
    let currentUser: any = null;
    if (savedAuth) {
      try {
        const authData = JSON.parse(savedAuth);
        currentUserId = authData?.user?.id || null;
        currentUser = authData?.user || null;
      } catch (e) {
        console.warn('Erro ao parsear auth:', e);
      }
    }
    
    // PRIORIDADE: Carregar do localStorage PRIMEIRO (mais rápido no mobile)
    const savedMessages = safeGetItem('nutraelite_community_messages');
    if (savedMessages) {
      try {
        const parsed = JSON.parse(savedMessages);
        const loadedMessages: Message[] = parsed.map((msg: any) => {
          const authorId = msg.author?.id || null;
          const isUser = currentUserId && authorId ? authorId === currentUserId : msg.isUser;
          
          return {
            ...msg,
            timestamp: new Date(msg.timestamp),
            isUser,
            author: {
              ...(msg.author || {
                name: 'Usuário',
                avatar: 'https://ui-avatars.com/api/?name=Usuario&background=random',
              }),
              id: msg.author?.id || authorId,
            },
          };
        });
        
            setMessages(loadedMessages);
            if (showLoading) {
              setIsLoading(false);
            }
            console.log('✅ Mensagens carregadas do localStorage (cache):', loadedMessages.length);
            
            // Sincronizar com Supabase em background para atualizar (não bloqueia)
            if (isSupabaseConfigured) {
              syncWithSupabase(currentUserId, showLoading).catch(err => {
                console.warn('⚠️ Erro ao sincronizar em background (não crítico):', err);
              });
            }
            return;
      } catch (error) {
        console.warn('Erro ao carregar do localStorage:', error);
      }
    }
    
    // Se não há dados locais, tentar Supabase
    if (isSupabaseConfigured) {
      await syncWithSupabase(currentUserId, showLoading);
    } else {
      setMessages([]);
      if (showLoading) {
        setIsLoading(false);
      }
    }
  };

  const syncWithSupabase = async (currentUserId: string | null, showLoading: boolean) => {
    try {
      console.log('🔍 Sincronizando CHAT GLOBAL com Supabase...');
      
      // CHAT GLOBAL: Buscar TODAS as mensagens (sem filtrar por usuário)
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
          author:profiles(id, name, avatar, role)
        `)
        .order('created_at', { ascending: false })
        .limit(200); // Aumentar limite para mostrar mais mensagens do chat global

      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout')), 3000) // Timeout reduzido para 3s
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
        const transformed: Message[] = data
          .reverse() // Reverter para ordem cronológica (mais antigas primeiro)
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

  useEffect(() => {
    // Carregar inicialmente (com loading)
    loadMessages(true);
    
    // Listener para atualizar mensagens quando o perfil mudar
    const handleProfileUpdate = (event: CustomEvent) => {
      const updatedUser = event.detail;
      console.log('🔄 Atualizando mensagens com novo perfil:', updatedUser.name);
      
      // Recarregar mensagens do localStorage para pegar as atualizações
      loadMessages(false);
      
      // Também atualizar estado imediatamente
      setMessages(prevMessages => {
        const updated = prevMessages.map(msg => {
          // Se a mensagem é do usuário atual, atualizar o autor
          if (msg.author?.id === updatedUser.id) {
            return {
              ...msg,
              author: {
                ...msg.author,
                name: updatedUser.name,
                avatar: updatedUser.avatar || null, // Usar null se não houver avatar
              },
            };
          }
          return msg;
        });
        // Salvar mensagens atualizadas no localStorage
        try {
          const serialized = JSON.stringify(updated.map(m => ({
            ...m,
            timestamp: m.timestamp.toISOString(),
          })));
          safeSetItem('nutraelite_community_messages', serialized);
        } catch (error) {
          console.error('Erro ao salvar mensagens atualizadas:', error);
        }
        return updated;
      });
    };
    
    // Listener adicional para forçar recarregamento
    const handleMessagesReload = () => {
      console.log('🔄 Forçando recarregamento de mensagens...');
      loadMessages(false);
    };

    window.addEventListener('profile-updated', handleProfileUpdate as EventListener);
    window.addEventListener('messages-need-reload', handleMessagesReload);
    
    // Timeout de segurança - sempre parar loading após 3 segundos (já carregou do localStorage)
    const safetyTimeout = setTimeout(() => {
      console.warn('⚠️ Timeout de segurança: parando loading de mensagens');
      setIsLoading(false);
    }, 3000);
    
    if (!isSupabaseConfigured) {
      return () => {
        clearTimeout(safetyTimeout);
        window.removeEventListener('profile-updated', handleProfileUpdate as EventListener);
        window.removeEventListener('messages-need-reload', handleMessagesReload);
      };
    }

    // Subscription para atualizações em tempo real
    const subscription = supabase
      .channel('community_messages_changes')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'community_messages' },
        (payload) => {
          console.log('🔄 Nova mensagem detectada via Realtime:', payload);
          // Aguardar um pouco para garantir que o Supabase processou
          setTimeout(() => {
            // Recarregar sem mostrar loading (já temos mensagens)
            loadMessages(false);
          }, 300);
        }
      )
      .subscribe((status) => {
        console.log('📡 Status da subscription:', status);
        if (status === 'SUBSCRIBED') {
          console.log('✅ Subscription ativa - recebendo atualizações em tempo real');
        }
      });

    // Recarregar mensagens a cada 8 segundos para garantir sincronização (mobile precisa de sincronização mais frequente)
    const intervalId = setInterval(() => {
      console.log('🔄 Sincronização periódica de mensagens...');
      // Recarregar sem mostrar loading (já temos mensagens)
      loadMessages(false);
    }, 8000);

    // Salvar mensagens no localStorage quando o app for fechado
    const handleBeforeUnload = () => {
      try {
        const currentMessages = messagesRef.current;
        const serialized = JSON.stringify(currentMessages.map(m => ({
          ...m,
          timestamp: m.timestamp.toISOString(),
        })));
        safeSetItem('nutraelite_community_messages', serialized);
        console.log('💾 Mensagens salvas antes de fechar o app');
      } catch (error) {
        console.error('Erro ao salvar mensagens antes de fechar:', error);
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('pagehide', handleBeforeUnload);

    return () => {
      clearTimeout(safetyTimeout);
      clearInterval(intervalId);
      subscription.unsubscribe();
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('pagehide', handleBeforeUnload);
      window.removeEventListener('profile-updated', handleProfileUpdate as EventListener);
      window.removeEventListener('messages-need-reload', handleMessagesReload);
    };
  }, []);

  const sendMessage = async (content: string, type: string = 'text', image?: string, audioUrl?: string, audioDuration?: number): Promise<Message> => {
    console.log('📤 sendMessage iniciado', { content: content.substring(0, 50), type, hasImage: !!image, hasAudio: !!audioUrl });
    
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
    
    console.log('👤 Dados do autor:', { name: authorData.name, id: authorData.id });

    // Verificar se é suporte
    const isSupportUser = authorData.role === 'support' || authorData.role === 'admin';
    
    // Criar mensagem
    const newMessage: Message = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      content: content || '',
      isUser: true,
      timestamp: new Date(),
      type: type as 'text' | 'audio' | 'emoji' | 'image',
      image: image || undefined,
      audioDuration: audioDuration || undefined,
      audioUrl: audioUrl || undefined,
      author: {
        id: authorData.id,
        name: authorData.name || 'Usuário',
        avatar: authorData.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(authorData.name || 'Usuario')}&background=random`,
        role: isSupportUser ? 'support' : undefined,
      },
    };

    console.log('📝 Enviando mensagem...', { isSupabaseConfigured, type, content: content.substring(0, 50) });
    
    // SEMPRE salvar no localStorage PRIMEIRO (para feedback imediato)
    try {
      ensureStorageSpace();
      
      const savedMessages = safeGetItem('nutraelite_community_messages');
      const existingMessages = savedMessages ? JSON.parse(savedMessages) : [];
      const updatedMessages = [...existingMessages, {
        ...newMessage,
        timestamp: newMessage.timestamp.toISOString(),
      }];
      
      let serialized = JSON.stringify(updatedMessages);
      let saved = safeSetItem('nutraelite_community_messages', serialized);
      
      if (!saved) {
        console.warn('⚠️ Falha ao salvar todas as mensagens, tentando salvar apenas as recentes...');
        const recentMessages = updatedMessages.slice(-30);
        serialized = JSON.stringify(recentMessages);
        saved = safeSetItem('nutraelite_community_messages', serialized);
        
        if (!saved) {
          console.warn('⚠️ Falha ao salvar mensagens recentes, salvando apenas a nova...');
          const minimalMessages = [{
            ...newMessage,
            timestamp: newMessage.timestamp.toISOString(),
          }];
          safeSetItem('nutraelite_community_messages', JSON.stringify(minimalMessages));
        }
      }

      // Atualizar estado local IMEDIATAMENTE
      setMessages(prevMessages => [...prevMessages, newMessage]);
      console.log('✅ Mensagem salva localmente (feedback imediato)');
    } catch (localError: any) {
      console.error('❌ Erro crítico ao salvar localmente:', localError);
      // Mesmo com erro, tentar atualizar o estado para feedback visual
      setMessages(prevMessages => [...prevMessages, newMessage]);
      throw new Error('Erro crítico: não foi possível salvar a mensagem localmente');
    }
    
    // Depois tentar sincronizar com Supabase (em background, não bloqueia)
    if (isSupabaseConfigured) {
      (async () => {
        try {
          const { data: { user } } = await supabase.auth.getUser();
          
          if (user) {
            console.log('💾 Sincronizando com Supabase...');
            const { data: insertedMessage, error } = await supabase
              .from('community_messages')
              .insert({
                author_id: user.id,
                content,
                type,
                image,
                audio_url: audioUrl,
                audio_duration: audioDuration,
              })
              .select(`
                *,
                author:profiles(*)
              `)
              .single();

            if (!error && insertedMessage) {
              console.log('✅ Mensagem sincronizada com Supabase:', insertedMessage.id);
              // Recarregar do Supabase IMEDIATAMENTE para garantir que todos veem a nova mensagem
              console.log('🔄 Recarregando chat global após enviar mensagem...');
              await loadMessages(false);
              console.log('✅ Chat global atualizado - mensagem visível para TODOS os usuários');
            } else {
              console.warn('⚠️ Erro ao sincronizar com Supabase (não crítico):', error);
              // Mesmo com erro, tentar recarregar para pegar outras mensagens
              setTimeout(() => loadMessages(false), 1000);
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

    return newMessage;
  };

  const deleteMessage = async (messageId: string) => {
    console.log('🗑️ Deletando mensagem:', messageId);
    
    // Remover do localStorage
    try {
      const savedMessages = safeGetItem('nutraelite_community_messages');
      if (savedMessages) {
        const parsed = JSON.parse(savedMessages);
        const filtered = parsed.filter((msg: any) => msg.id !== messageId);
        safeSetItem('nutraelite_community_messages', JSON.stringify(filtered));
        setMessages(filtered.map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp),
          author: msg.author || {
            name: 'Usuário',
            avatar: 'https://ui-avatars.com/api/?name=Usuario&background=random',
          },
        })));
        console.log('✅ Mensagem deletada do localStorage');
      }
    } catch (error) {
      console.error('Erro ao deletar mensagem:', error);
    }
    
    // Deletar do Supabase em background
    if (isSupabaseConfigured) {
      (async () => {
        try {
          await supabase.from('community_messages').delete().eq('id', messageId);
          console.log('✅ Mensagem deletada do Supabase');
        } catch (error) {
          console.warn('⚠️ Erro ao deletar mensagem do Supabase:', error);
        }
      })();
    }
  };

  return {
    messages,
    isLoading,
    sendMessage,
    deleteMessage,
    refresh: loadMessages,
  };
}
