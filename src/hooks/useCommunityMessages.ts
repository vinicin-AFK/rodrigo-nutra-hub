import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Message } from '@/types';

export function useCommunityMessages() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Usuário não autenticado');

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

    if (error) throw error;

    // Recarregar mensagens
    await loadMessages();

    return data;
  };

  return {
    messages,
    isLoading,
    sendMessage,
    refresh: loadMessages,
  };
}

