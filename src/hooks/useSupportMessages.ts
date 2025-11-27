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
      // SEMPRE carregar do localStorage primeiro (para ter dados imediatamente)
      const saved = safeGetItem(SUPPORT_MESSAGES_KEY);
      if (saved) {
        try {
          const data = JSON.parse(saved);
          const loaded: SupportConversation[] = data.map((conv: any) => ({
            ...conv,
            lastMessageTime: new Date(conv.lastMessageTime),
            messages: (conv.messages || []).map((msg: any) => ({
              ...msg,
              timestamp: new Date(msg.timestamp),
            })),
          }));
          setConversations(loaded);
          console.log('✅ Conversas carregadas do localStorage:', loaded.length, 'total de mensagens:', loaded.reduce((acc, c) => acc + (c.messages?.length || 0), 0));
        } catch (parseError) {
          console.error('Erro ao parsear conversas do localStorage:', parseError);
          setConversations([]);
        }
      } else {
        console.log('ℹ️ Nenhuma conversa salva no localStorage');
        setConversations([]);
      }
      
      // SEMPRE definir isLoading como false após carregar do localStorage
      setIsLoading(false);

      // Se Supabase configurado, tentar sincronizar (em background, não bloqueia)
      if (isSupabaseConfigured) {
        // Executar em background sem bloquear
        Promise.race([
          (async () => {
            try {
              console.log('🔍 Buscando conversas no Supabase...');
              const { data, error } = await supabase
                .from('support_messages')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(100);

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

                // Mesclar com conversas do localStorage (manter ambas, mas priorizar Supabase se mais recente)
                const saved = safeGetItem(SUPPORT_MESSAGES_KEY);
                const localConvs: SupportConversation[] = saved ? JSON.parse(saved).map((c: any) => ({
                  ...c,
                  lastMessageTime: new Date(c.lastMessageTime),
                  messages: (c.messages || []).map((m: any) => ({
                    ...m,
                    timestamp: new Date(m.timestamp),
                  })),
                })) : [];

                // Mesclar: usar Supabase se tiver mais mensagens ou se for mais recente
                const merged: SupportConversation[] = [];
                const allConvIds = new Set([...convs.map(c => c.id), ...localConvs.map(c => c.id)]);
                
                allConvIds.forEach(convId => {
                  const supabaseConv = convs.find(c => c.id === convId);
                  const localConv = localConvs.find(c => c.id === convId);
                  
                  if (supabaseConv && localConv) {
                    // Mesclar mensagens: pegar todas e ordenar por timestamp
                    const allMessages = [...supabaseConv.messages, ...localConv.messages];
                    const uniqueMessages = Array.from(
                      new Map(allMessages.map(m => [m.id, m])).values()
                    ).sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
                    
                    merged.push({
                      ...supabaseConv,
                      messages: uniqueMessages,
                      lastMessage: uniqueMessages[uniqueMessages.length - 1]?.content || supabaseConv.lastMessage,
                      lastMessageTime: uniqueMessages[uniqueMessages.length - 1]?.timestamp || supabaseConv.lastMessageTime,
                    });
                  } else if (supabaseConv) {
                    merged.push(supabaseConv);
                  } else if (localConv) {
                    merged.push(localConv);
                  }
                });

                setConversations(merged);
                safeSetItem(SUPPORT_MESSAGES_KEY, JSON.stringify(merged.map(c => ({
                  ...c,
                  lastMessageTime: c.lastMessageTime instanceof Date ? c.lastMessageTime.toISOString() : c.lastMessageTime,
                  messages: c.messages.map(m => ({
                    ...m,
                    timestamp: m.timestamp instanceof Date ? m.timestamp.toISOString() : (typeof m.timestamp === 'string' ? m.timestamp : new Date(m.timestamp).toISOString()),
                  })),
                }))));
                console.log('✅ Conversas sincronizadas do Supabase:', merged.length, 'total de mensagens:', merged.reduce((acc, c) => acc + (c.messages?.length || 0), 0));
              } else {
                console.log('ℹ️ Nenhuma conversa no Supabase');
              }
            } catch (error) {
              console.warn('⚠️ Erro ao carregar do Supabase (não crítico):', error);
            }
          })(),
          new Promise((resolve) => setTimeout(resolve, 3000)) // Timeout de 3s
        ]).catch(() => {
          // Ignorar erros
        });
      }
    } catch (error) {
      console.error('Erro ao carregar conversas:', error);
      setConversations([]);
    } finally {
      // SEMPRE parar o loading imediatamente após carregar do localStorage
      setIsLoading(false);
      console.log('✅ Loading finalizado');
    }
  };

  useEffect(() => {
    loadConversations();
  }, []);

  // Enviar mensagem (usuário ou suporte)
  const sendMessage = async (
    content: string,
    type: string = 'text',
    isFromSupport: boolean = false,
    targetUserId?: string,
    image?: string,
    audioUrl?: string,
    audioDuration?: number
  ): Promise<Message> => {
    const currentUserId = userId || 'current_user';
    const now = new Date();
    
    // Buscar dados do autor do localStorage
    let authorName = 'Usuário';
    let authorAvatar = '';
    if (!isFromSupport) {
      const savedAuth = safeGetItem('nutraelite_auth');
      if (savedAuth) {
        try {
          const authData = JSON.parse(savedAuth);
          const userData = authData?.user;
          if (userData) {
            authorName = userData.name || 'Usuário';
            authorAvatar = userData.avatar || '';
          }
        } catch (error) {
          console.warn('Erro ao buscar dados do usuário:', error);
        }
      }
    }
    
    const newMessage: Message = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      content,
      isUser: !isFromSupport,
      timestamp: now,
      type: type as any,
      image: image || undefined,
      audioUrl: audioUrl || undefined,
      audioDuration: audioDuration || undefined,
      author: isFromSupport ? {
        name: 'Suporte',
        avatar: '',
        role: 'support',
      } : {
        name: authorName,
        avatar: authorAvatar,
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

    // Salvar no localStorage ANTES de atualizar o estado
    const serialized = JSON.stringify(conversations.map(c => ({
      ...c,
      lastMessageTime: c.lastMessageTime instanceof Date ? c.lastMessageTime.toISOString() : c.lastMessageTime,
      messages: (c.messages || []).map(m => ({
        ...m,
        timestamp: m.timestamp instanceof Date ? m.timestamp.toISOString() : (typeof m.timestamp === 'string' ? m.timestamp : new Date(m.timestamp).toISOString()),
      })),
    })));
    
    const saved = safeSetItem(SUPPORT_MESSAGES_KEY, serialized);
    if (saved) {
      console.log('✅ Mensagem salva no localStorage');
    } else {
      console.warn('⚠️ Erro ao salvar mensagem no localStorage');
    }

    // Atualizar estado
    setConversations([...conversations]);
    
    // Atualizar conversa atual se estiver aberta
    if (currentConversation?.id === convId) {
      setCurrentConversation({
        ...conversation,
        lastMessageTime: now,
        messages: (conversation.messages || []).map(m => ({
          ...m,
          timestamp: typeof m.timestamp === 'string' ? new Date(m.timestamp) : m.timestamp instanceof Date ? m.timestamp : new Date(m.timestamp),
        })),
      });
      console.log('✅ Conversa atual atualizada com', conversation.messages?.length || 0, 'mensagens');
    }

    // Sincronizar com Supabase em background (não bloqueia)
    if (isSupabaseConfigured) {
      (async () => {
        try {
          console.log('🔄 Sincronizando mensagem com Supabase...', { convId, isFromSupport });
          const { error } = await supabase.from('support_messages').insert({
            user_id: convId,
            content,
            type,
            is_from_support: isFromSupport,
            image: image || null,
            audio_url: audioUrl || null,
            audio_duration: audioDuration || null,
            user_name: isFromSupport ? undefined : authorName,
            user_avatar: isFromSupport ? undefined : authorAvatar,
            support_name: isFromSupport ? 'Suporte' : undefined,
            support_avatar: isFromSupport ? '' : undefined,
          });
          
          if (error) {
            console.warn('⚠️ Erro ao sincronizar com Supabase:', error);
          } else {
            console.log('✅ Mensagem sincronizada com Supabase');
          }
        } catch (error) {
          console.warn('⚠️ Erro ao sincronizar com Supabase (não crítico):', error);
        }
      })();
    }

    return newMessage;
  };

  // Abrir conversa
  const openConversation = (conversationId: string | null) => {
    console.log('🔓 openConversation chamado:', conversationId);
    if (!conversationId) {
      console.log('❌ conversationId é null, limpando conversa');
      setCurrentConversation(null);
      return;
    }
    
    // Buscar conversa nas conversas carregadas
    let conv = conversations.find(c => c.id === conversationId);
    
    // Se não encontrou, tentar carregar do localStorage diretamente
    if (!conv) {
      console.log('⚠️ Conversa não encontrada no estado, buscando no localStorage...');
      const saved = safeGetItem(SUPPORT_MESSAGES_KEY);
      if (saved) {
        try {
          const data = JSON.parse(saved);
          const loaded: SupportConversation[] = data.map((c: any) => ({
            ...c,
            lastMessageTime: new Date(c.lastMessageTime),
            messages: (c.messages || []).map((msg: any) => ({
              ...msg,
              timestamp: new Date(msg.timestamp),
            })),
          }));
          conv = loaded.find(c => c.id === conversationId);
          if (conv) {
            console.log('✅ Conversa encontrada no localStorage');
            // Atualizar o estado de conversas também
            setConversations(loaded);
          }
        } catch (error) {
          console.error('Erro ao carregar do localStorage:', error);
        }
      }
    }
    
    if (conv) {
      console.log('✅ Conversa encontrada, abrindo:', conv.id, conv.userName, 'mensagens:', conv.messages?.length || 0);
      setCurrentConversation({
        ...conv,
        unreadCount: 0,
        messages: (conv.messages || []).map(m => ({
          ...m,
          timestamp: typeof m.timestamp === 'string' ? new Date(m.timestamp) : m.timestamp instanceof Date ? m.timestamp : new Date(m.timestamp),
        })),
      });
      console.log('✅ currentConversation atualizado com', conv.messages?.length || 0, 'mensagens');
      
      // Marcar como lida
      const updated = conversations.map(c => 
        c.id === conversationId ? { ...c, unreadCount: 0 } : c
      );
      setConversations(updated);
      safeSetItem(SUPPORT_MESSAGES_KEY, JSON.stringify(updated.map(c => ({
        ...c,
        lastMessageTime: c.lastMessageTime instanceof Date ? c.lastMessageTime.toISOString() : c.lastMessageTime,
        messages: c.messages.map(m => ({
          ...m,
          timestamp: m.timestamp instanceof Date ? m.timestamp.toISOString() : (typeof m.timestamp === 'string' ? m.timestamp : new Date(m.timestamp).toISOString()),
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

