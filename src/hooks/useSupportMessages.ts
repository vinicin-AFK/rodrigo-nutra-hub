import { useState, useEffect } from 'react';
import { Message } from '@/types';
import { safeSetItem, safeGetItem, ensureStorageSpace } from '@/lib/storage';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

const SUPPORT_MESSAGES_KEY = 'nutraelite_support_messages';

interface SupportConversation {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  lastMessage: string;
  lastMessageTime: Date;
  unreadCount: number;
  messages: Message[];
}

export function useSupportMessages(userId?: string) {
  const [conversations, setConversations] = useState<SupportConversation[]>([]);
  const [currentConversation, setCurrentConversation] = useState<SupportConversation | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Carregar conversas
  const loadConversations = async () => {
    setIsLoading(true);
    
    try {
      // Carregar do localStorage primeiro
      const saved = safeGetItem(SUPPORT_MESSAGES_KEY);
      if (saved) {
        try {
          const data = JSON.parse(saved);
          const loaded: SupportConversation[] = data.map((conv: any) => ({
            ...conv,
            lastMessageTime: new Date(conv.lastMessageTime),
            messages: conv.messages.map((msg: any) => ({
              ...msg,
              timestamp: new Date(msg.timestamp),
            })),
          }));
          setConversations(loaded);
          console.log('✅ Conversas carregadas do localStorage:', loaded.length);
        } catch (parseError) {
          console.error('Erro ao parsear conversas do localStorage:', parseError);
        }
      } else {
        console.log('ℹ️ Nenhuma conversa salva no localStorage');
        setConversations([]);
      }

      // Se Supabase configurado, tentar sincronizar (em background, não bloqueia)
      if (isSupabaseConfigured) {
        (async () => {
          try {
            console.log('🔍 Buscando conversas no Supabase...');
            const { data, error } = await supabase
              .from('support_messages')
              .select('*')
              .order('created_at', { ascending: false })
              .limit(100); // Limitar para não travar

            if (error) {
              console.warn('⚠️ Erro ao buscar do Supabase:', error);
              return;
            }

            if (data && data.length > 0) {
              // Agrupar por usuário
              const grouped: Record<string, any[]> = {};
              data.forEach((msg: any) => {
                const key = msg.user_id;
                if (!grouped[key]) grouped[key] = [];
                grouped[key].push(msg);
              });

              const convs: SupportConversation[] = Object.entries(grouped).map(([userId, msgs]) => {
                const sorted = msgs.sort((a, b) => 
                  new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
                );
                const lastMsg = sorted[sorted.length - 1];
                
                return {
                  id: userId,
                  userId,
                  userName: lastMsg.user_name || 'Usuário',
                  userAvatar: lastMsg.user_avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(userId)}&background=random`,
                  lastMessage: lastMsg.content || '',
                  lastMessageTime: new Date(lastMsg.created_at),
                  unreadCount: msgs.filter(m => !m.read && !m.is_from_support).length,
                  messages: sorted.map((msg: any) => ({
                    id: msg.id,
                    content: msg.content,
                    isUser: !msg.is_from_support,
                    timestamp: new Date(msg.created_at),
                    type: msg.type || 'text',
                    author: msg.is_from_support ? {
                      name: msg.support_name || 'Suporte',
                      avatar: msg.support_avatar || '',
                      role: 'support',
                    } : {
                      name: msg.user_name || 'Usuário',
                      avatar: msg.user_avatar || '',
                    },
                  })),
                };
              });

              setConversations(convs);
              safeSetItem(SUPPORT_MESSAGES_KEY, JSON.stringify(convs.map(c => ({
                ...c,
                lastMessageTime: c.lastMessageTime.toISOString(),
                messages: c.messages.map(m => ({
                  ...m,
                  timestamp: m.timestamp.toISOString(),
                })),
              }))));
              console.log('✅ Conversas sincronizadas do Supabase:', convs.length);
            } else {
              console.log('ℹ️ Nenhuma conversa no Supabase');
            }
          } catch (error) {
            console.warn('⚠️ Erro ao carregar do Supabase (não crítico):', error);
          }
        })();
      }
    } catch (error) {
      console.error('Erro ao carregar conversas:', error);
      setConversations([]);
    } finally {
      // Sempre parar o loading após um tempo máximo
      setTimeout(() => {
        setIsLoading(false);
      }, 2000); // Máximo 2 segundos de loading
    }
  };

  useEffect(() => {
    loadConversations();
    
    // Timeout de segurança - sempre parar loading após 3 segundos
    const safetyTimeout = setTimeout(() => {
      if (isLoading) {
        console.warn('⚠️ Timeout no carregamento de conversas, parando loading');
        setIsLoading(false);
      }
    }, 3000);
    
    return () => clearTimeout(safetyTimeout);
  }, []);

  // Enviar mensagem (usuário ou suporte)
  const sendMessage = async (
    content: string,
    type: string = 'text',
    isFromSupport: boolean = false,
    targetUserId?: string
  ): Promise<Message> => {
    const currentUserId = userId || 'current_user';
    const now = new Date();
    
    const newMessage: Message = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      content,
      isUser: !isFromSupport,
      timestamp: now,
      type: type as any,
      author: isFromSupport ? {
        name: 'Suporte',
        avatar: '',
        role: 'support',
      } : {
        name: 'Usuário',
        avatar: '',
      },
    };

    // Salvar no localStorage
    ensureStorageSpace();
    const saved = safeGetItem(SUPPORT_MESSAGES_KEY);
    const conversations: SupportConversation[] = saved ? JSON.parse(saved) : [];
    
    const convId = isFromSupport ? targetUserId || currentUserId : currentUserId;
    let conversation = conversations.find(c => c.id === convId);
    
    if (!conversation) {
      conversation = {
        id: convId,
        userId: convId,
        userName: isFromSupport ? 'Usuário' : 'Você',
        userAvatar: '',
        lastMessage: content,
        lastMessageTime: now,
        unreadCount: 0,
        messages: [],
      };
      conversations.push(conversation);
    }

    conversation.messages.push(newMessage);
    conversation.lastMessage = content;
    conversation.lastMessageTime = now;
    if (!isFromSupport) {
      conversation.unreadCount++;
    }

    safeSetItem(SUPPORT_MESSAGES_KEY, JSON.stringify(conversations.map(c => ({
      ...c,
      lastMessageTime: c.lastMessageTime.toISOString(),
      messages: c.messages.map(m => ({
        ...m,
        timestamp: m.timestamp.toISOString(),
      })),
    }))));

    setConversations([...conversations]);
    
    if (currentConversation?.id === convId) {
      setCurrentConversation({
        ...conversation,
        lastMessageTime: now,
        messages: conversation.messages.map(m => ({
          ...m,
          timestamp: typeof m.timestamp === 'string' ? new Date(m.timestamp) : m.timestamp,
        })),
      });
    }

    // Sincronizar com Supabase em background
    if (isSupabaseConfigured) {
      (async () => {
        try {
          await supabase.from('support_messages').insert({
            user_id: convId,
            content,
            type,
            is_from_support: isFromSupport,
            user_name: isFromSupport ? undefined : 'Usuário',
            user_avatar: isFromSupport ? undefined : '',
            support_name: isFromSupport ? 'Suporte' : undefined,
            support_avatar: isFromSupport ? '' : undefined,
          });
        } catch (error) {
          console.warn('Erro ao sincronizar com Supabase:', error);
        }
      })();
    }

    return newMessage;
  };

  // Abrir conversa
  const openConversation = (conversationId: string | null) => {
    if (!conversationId) {
      setCurrentConversation(null);
      return;
    }
    const conv = conversations.find(c => c.id === conversationId);
    if (conv) {
      setCurrentConversation({
        ...conv,
        unreadCount: 0,
        messages: conv.messages.map(m => ({
          ...m,
          timestamp: typeof m.timestamp === 'string' ? new Date(m.timestamp) : m.timestamp,
        })),
      });
      
      // Marcar como lida
      const updated = conversations.map(c => 
        c.id === conversationId ? { ...c, unreadCount: 0 } : c
      );
      setConversations(updated);
      safeSetItem(SUPPORT_MESSAGES_KEY, JSON.stringify(updated.map(c => ({
        ...c,
        lastMessageTime: c.lastMessageTime.toISOString(),
        messages: c.messages.map(m => ({
          ...m,
          timestamp: m.timestamp.toISOString(),
        })),
      }))));
    }
  };

  return {
    conversations,
    currentConversation,
    isLoading,
    sendMessage,
    openConversation,
    refresh: loadConversations,
  };
}

