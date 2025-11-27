import { useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { Message } from '@/types';
import { safeSetItem, safeGetItem, ensureStorageSpace } from '@/lib/storage';

export function useCommunityMessages() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadMessages = async () => {
    setIsLoading(true);
    
    console.log('📥 Carregando mensagens...', { isSupabaseConfigured });
    
    // SEMPRE carregar do localStorage primeiro (para ter dados imediatamente)
    try {
      const savedMessages = safeGetItem('nutraelite_community_messages');
      if (savedMessages) {
        const parsed = JSON.parse(savedMessages);
        const loadedMessages: Message[] = parsed.map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp),
          author: msg.author || {
            name: 'Usuário',
            avatar: 'https://ui-avatars.com/api/?name=Usuario&background=random',
          },
        }));
        setMessages(loadedMessages);
        console.log('✅ Mensagens carregadas do localStorage (inicial):', loadedMessages.length);
      }
    } catch (error) {
      console.error('Erro ao carregar mensagens do localStorage:', error);
    }
    
    // Depois tentar sincronizar com Supabase (se configurado)
    if (isSupabaseConfigured) {
      try {
        console.log('🔍 Buscando mensagens no Supabase...');
        const { data, error } = await supabase
          .from('community_messages')
          .select(`
            *,
            author:profiles(*)
          `)
          .order('created_at', { ascending: true });

        console.log('📊 Resultado Supabase:', { data: data?.length || 0, error });

        if (error) {
          console.error('❌ Erro ao buscar do Supabase:', error);
          throw error;
        }

        if (data && data.length > 0) {
          const { data: { user } } = await supabase.auth.getUser();
          const currentUserId = user?.id;

          const transformed: Message[] = data.map((msg: any) => ({
            id: msg.id,
            content: msg.content || '',
            isUser: msg.author_id === currentUserId,
            timestamp: new Date(msg.created_at),
            type: msg.type || 'text',
            image: msg.image || undefined,
            audioDuration: msg.audio_duration || undefined,
            audioUrl: msg.audio_url || undefined,
            author: {
              name: msg.author.name,
              avatar: msg.author.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(msg.author.name)}&background=random`,
              role: msg.author.role || undefined,
            },
          }));

          // Mesclar com mensagens do localStorage (manter ambas)
          const savedMessages = safeGetItem('nutraelite_community_messages');
          let allMessages = [...transformed];
          
          if (savedMessages) {
            try {
              const parsed = JSON.parse(savedMessages);
              const localMessages: Message[] = parsed.map((msg: any) => ({
                ...msg,
                timestamp: new Date(msg.timestamp),
                author: msg.author || {
                  name: 'Usuário',
                  avatar: 'https://ui-avatars.com/api/?name=Usuario&background=random',
                },
              }));
              
              // Adicionar mensagens locais que não estão no Supabase
              const supabaseIds = new Set(transformed.map(m => m.id));
              const localOnly = localMessages.filter(m => !supabaseIds.has(m.id));
              allMessages = [...transformed, ...localOnly].sort((a, b) => 
                a.timestamp.getTime() - b.timestamp.getTime()
              );
            } catch (err) {
              console.warn('Erro ao mesclar mensagens locais:', err);
            }
          }
          
          setMessages(allMessages);
          // Salvar tudo no localStorage
          const serialized = JSON.stringify(allMessages.map(m => ({
            ...m,
            timestamp: m.timestamp.toISOString(),
          })));
          safeSetItem('nutraelite_community_messages', serialized);
          console.log('✅ Mensagens sincronizadas (Supabase + local):', allMessages.length);
        } else {
          console.log('⚠️ Nenhuma mensagem no Supabase, mantendo cache local');
          // Manter mensagens do localStorage que já foram carregadas
        }
      } catch (error: any) {
        console.error('❌ Erro ao carregar do Supabase, usando cache local:', error?.message || error);
        // Fallback para localStorage se Supabase falhar
        try {
          const savedMessages = safeGetItem('nutraelite_community_messages');
          if (savedMessages) {
            const parsed = JSON.parse(savedMessages);
            const loadedMessages: Message[] = parsed.map((msg: any) => ({
              ...msg,
              timestamp: new Date(msg.timestamp),
              author: msg.author || {
                name: 'Usuário',
                avatar: 'https://ui-avatars.com/api/?name=Usuario&background=random',
              },
            }));
            setMessages(loadedMessages);
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
        const savedMessages = safeGetItem('nutraelite_community_messages');
        if (savedMessages) {
          const parsed = JSON.parse(savedMessages);
          const loadedMessages: Message[] = parsed.map((msg: any) => ({
            ...msg,
            timestamp: new Date(msg.timestamp),
            author: msg.author || {
              name: 'Usuário',
              avatar: 'https://ui-avatars.com/api/?name=Usuario&background=random',
            },
          }));
          setMessages(loadedMessages);
        }
      } catch (error) {
        console.error('Erro ao carregar mensagens:', error);
      } finally {
        setIsLoading(false);
      }
    }
  };

  useEffect(() => {
    loadMessages();

    if (!isSupabaseConfigured) return;

    const subscription = supabase
      .channel('community_messages_changes')
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'community_messages' },
        () => {
          loadMessages();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
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
        name: authorData.name || 'Usuário',
        avatar: authorData.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(authorData.name || 'Usuario')}&background=random`,
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
              // Recarregar do Supabase para ter dados atualizados
              await loadMessages();
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

    return newMessage;
  };

  return {
    messages,
    isLoading,
    sendMessage,
    refresh: loadMessages,
  };
}
