import { useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { Message } from '@/types';

export function useCommunityMessages() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadMessages = async () => {
    if (!isSupabaseConfigured) {
      // Modo offline - carregar do localStorage
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
        } else {
          setMessages([]);
        }
      } catch (error) {
        console.error('Erro ao carregar mensagens do localStorage:', error);
        setMessages([]);
      }
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('community_messages')
        .select(`
          *,
          author:profiles(*)
        `)
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Obter usuário atual
      const { data: { user } } = await supabase.auth.getUser();
      const currentUserId = user?.id;

      const transformed: Message[] = (data || []).map((msg: any) => ({
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
    } catch (error) {
      console.error('Erro ao carregar mensagens:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadMessages();

    if (!isSupabaseConfigured) return;

    // Ouvir novas mensagens em tempo real
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

  const sendMessage = async (content: string, type: string = 'text', image?: string, audioUrl?: string, audioDuration?: number) => {
    console.log('💬 Enviando mensagem...', { content, type, image: !!image, audioUrl: !!audioUrl, isSupabaseConfigured });
    
    if (!isSupabaseConfigured) {
      // Modo offline - salvar no localStorage
      console.log('📦 Modo offline - salvando mensagem localmente');
      
      // Buscar dados do usuário do localStorage
      const savedAuth = localStorage.getItem('nutraelite_auth');
      if (!savedAuth) {
        console.error('❌ Nenhuma autenticação encontrada');
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

      const newMessage: Message = {
        id: Date.now().toString(),
        content,
        isUser: true,
        timestamp: new Date(),
        type: type as 'text' | 'audio' | 'emoji' | 'image',
        image,
        audioDuration,
        audioUrl,
        author: {
          name: authorData.name,
          avatar: authorData.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(authorData.name)}&background=random`,
        },
      };

      // Salvar no localStorage
      const savedMessages = localStorage.getItem('nutraelite_community_messages');
      const existingMessages = savedMessages ? JSON.parse(savedMessages) : [];
      const updatedMessages = [...existingMessages, {
        ...newMessage,
        timestamp: newMessage.timestamp.toISOString(),
      }];
      
      try {
        localStorage.setItem('nutraelite_community_messages', JSON.stringify(updatedMessages));
        console.log('✅ Mensagem salva no localStorage');
      } catch (storageError) {
        console.error('❌ Erro ao salvar no localStorage:', storageError);
        throw new Error('Erro ao salvar mensagem. Tente novamente.');
      }

      // Atualizar estado local
      setMessages(prevMessages => [...prevMessages, newMessage]);
      console.log('✅ Mensagem enviada com sucesso (modo offline)');

      return newMessage;
    }

    console.log('☁️ Modo Supabase - enviando mensagem no banco');
    // Modo Supabase - tentar usar, mas se falhar, usar modo offline
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        console.warn('⚠️ Erro de autenticação no Supabase, usando modo offline');
        throw new Error('FALLBACK_TO_OFFLINE');
      }

      console.log('✅ Usuário autenticado:', user.id);

      const { data, error } = await supabase
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
        console.warn('⚠️ Erro ao inserir no Supabase, usando modo offline:', error);
        throw new Error('FALLBACK_TO_OFFLINE');
      }

      console.log('✅ Mensagem enviada no Supabase');

      // Recarregar mensagens
      await loadMessages();

      return data;
    } catch (supabaseError: any) {
      // Se for erro de fallback, usar modo offline
      if (supabaseError?.message === 'FALLBACK_TO_OFFLINE') {
        console.log('📦 Fallback para modo offline devido a erro no Supabase');
        // Usar modo offline
        const savedAuth = localStorage.getItem('nutraelite_auth');
        if (!savedAuth) {
          throw new Error('Usuário não autenticado. Faça login primeiro.');
        }
        
        const authData = JSON.parse(savedAuth);
        const authorData = authData.user;
        
        if (!authorData) {
          throw new Error('Usuário não autenticado. Faça login primeiro.');
        }

        const newMessage: Message = {
          id: Date.now().toString(),
          content,
          isUser: true,
          timestamp: new Date(),
          type: type as 'text' | 'audio' | 'emoji' | 'image',
          image,
          audioDuration,
          audioUrl,
          author: {
            name: authorData.name,
            avatar: authorData.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(authorData.name)}&background=random`,
          },
        };

        const savedMessages = localStorage.getItem('nutraelite_community_messages');
        const existingMessages = savedMessages ? JSON.parse(savedMessages) : [];
        const updatedMessages = [...existingMessages, {
          ...newMessage,
          timestamp: newMessage.timestamp.toISOString(),
        }];
        
        localStorage.setItem('nutraelite_community_messages', JSON.stringify(updatedMessages));
        setMessages(prevMessages => [...prevMessages, newMessage]);
        
        return newMessage;
      }
      // Se for outro erro, relançar
      throw supabaseError;
    }
  };

  return {
    messages,
    isLoading,
    sendMessage,
    refresh: loadMessages,
  };
}

