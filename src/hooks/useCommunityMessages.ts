import { useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { Message } from '@/types';

export function useCommunityMessages() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadMessages = async () => {
    // SEMPRE carregar do localStorage primeiro
    try {
      const savedMessages = localStorage.getItem('nutraelite_community_messages');
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

    // Tentar carregar do Supabase em background (opcional)
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('community_messages')
          .select(`
            *,
            author:profiles(*)
          `)
          .order('created_at', { ascending: true });

        if (!error && data) {
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
          localStorage.setItem('nutraelite_community_messages', JSON.stringify(transformed.map(m => ({
            ...m,
            timestamp: m.timestamp.toISOString(),
          }))));
        }
      } catch (error) {
        console.warn('Erro ao carregar do Supabase (não crítico):', error);
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
    const savedAuth = localStorage.getItem('nutraelite_auth');
    if (!savedAuth) {
      throw new Error('Usuário não autenticado. Faça login primeiro.');
    }
    
    const authData = JSON.parse(savedAuth);
    const authorData = authData?.user;
    
    if (!authorData) {
      throw new Error('Usuário não autenticado. Faça login primeiro.');
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

    // Salvar no localStorage
    const savedMessages = localStorage.getItem('nutraelite_community_messages');
    const existingMessages = savedMessages ? JSON.parse(savedMessages) : [];
    const updatedMessages = [...existingMessages, {
      ...newMessage,
      timestamp: newMessage.timestamp.toISOString(),
    }];
    
    localStorage.setItem('nutraelite_community_messages', JSON.stringify(updatedMessages));

    // Atualizar estado
    setMessages(prevMessages => [...prevMessages, newMessage]);

    // Tentar Supabase em background (não bloqueia)
    if (isSupabaseConfigured) {
      (async () => {
        try {
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            await supabase.from('community_messages').insert({
              author_id: user.id,
              content,
              type,
              image,
              audio_url: audioUrl,
              audio_duration: audioDuration,
            });
            await loadMessages();
          }
        } catch (error) {
          // Ignorar erro - já está salvo localmente
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
