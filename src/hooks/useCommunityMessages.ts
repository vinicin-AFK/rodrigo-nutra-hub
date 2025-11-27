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
    
    // PRIORIZAR Supabase se estiver configurado (rede social compartilhada)
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

          setMessages(transformed);
          // Salvar no localStorage também
          const serialized = JSON.stringify(transformed.map(m => ({
            ...m,
            timestamp: m.timestamp.toISOString(),
          })));
          safeSetItem('nutraelite_community_messages', serialized);
          console.log('✅ Mensagens carregadas do Supabase:', transformed.length);
        } else {
          console.log('⚠️ Nenhuma mensagem encontrada no Supabase, usando cache local');
          // Se não houver dados no Supabase, usar localStorage
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
            console.log('✅ Mensagens carregadas do localStorage:', loadedMessages.length);
          }
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
    
    // PRIORIZAR Supabase se estiver configurado (rede social compartilhada)
    if (isSupabaseConfigured) {
      try {
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        console.log('👤 Usuário autenticado:', { userId: user?.id, authError });
        
        if (!user) {
          console.warn('⚠️ Usuário não autenticado no Supabase, usando fallback');
          throw new Error('Usuário não autenticado');
        }
        
        // Salvar no Supabase PRIMEIRO
        console.log('💾 Salvando no Supabase...');
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

        if (error) {
          console.error('❌ Erro ao inserir no Supabase:', error);
          throw error;
        }
        
        console.log('✅ Mensagem salva no Supabase:', insertedMessage?.id);

          // Recarregar todas as mensagens do Supabase para garantir sincronização
          console.log('🔄 Recarregando mensagens do Supabase...');
          await loadMessages();
          
          // Retornar a mensagem criada
          if (insertedMessage) {
            console.log('✅ Mensagem criada e sincronizada:', insertedMessage.id);
            const transformedMessage: Message = {
              id: insertedMessage.id,
              content: insertedMessage.content || '',
              isUser: insertedMessage.author_id === user.id,
              timestamp: new Date(insertedMessage.created_at),
              type: (insertedMessage.type || 'text') as 'text' | 'audio' | 'emoji' | 'image',
              image: insertedMessage.image || undefined,
              audioDuration: insertedMessage.audio_duration || undefined,
              audioUrl: insertedMessage.audio_url || undefined,
              author: {
                name: insertedMessage.author.name,
                avatar: insertedMessage.author.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(insertedMessage.author.name)}&background=random`,
                role: insertedMessage.author.role || undefined,
              },
            };
            return transformedMessage;
          }
        }
      } catch (error: any) {
        console.error('❌ Erro ao salvar no Supabase, usando fallback:', error?.message || error);
        // Fallback para localStorage se Supabase falhar
        // Continuar com o código abaixo para salvar localmente
      }
    } else {
      console.log('⚠️ Supabase não configurado, salvando apenas localmente');
    }

    // Fallback: salvar no localStorage (modo offline ou se Supabase falhar)
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
      const recentMessages = updatedMessages.slice(-30);
      serialized = JSON.stringify(recentMessages);
      saved = safeSetItem('nutraelite_community_messages', serialized);
      
      if (!saved) {
        const minimalMessages = [{
          ...newMessage,
          timestamp: newMessage.timestamp.toISOString(),
        }];
        safeSetItem('nutraelite_community_messages', JSON.stringify(minimalMessages));
      }
    }

    // Atualizar estado local
    setMessages(prevMessages => [...prevMessages, newMessage]);

    return newMessage;
  };

  return {
    messages,
    isLoading,
    sendMessage,
    refresh: loadMessages,
  };
}
