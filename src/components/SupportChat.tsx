import { useState, useRef, useEffect } from 'react';
import { Send, Image as ImageIcon, Mic, Smile, Play, Pause, MessageSquare, Users } from 'lucide-react';
import { Message } from '@/types';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { useSupportMessages } from '@/hooks/useSupportMessages';
import { currentUser } from '@/data/mockData';

interface SupportChatProps {
  initialMessage?: string;
}

export function SupportChat({ initialMessage }: SupportChatProps) {
  const { user } = useAuth();
  const isSupport = user?.role === 'support' || user?.role === 'admin';
  const { 
    conversations, 
    currentConversation, 
    isLoading, 
    sendMessage, 
    openConversation 
  } = useSupportMessages(user?.id);

  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [playingAudio, setPlayingAudio] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  // Se é suporte e não há conversa aberta, mostrar lista de conversas
  const [showConversationList, setShowConversationList] = useState(isSupport && !currentConversation);

  useEffect(() => {
    if (initialMessage && !isSupport) {
      sendMessage(initialMessage, 'text', false);
    }
  }, [initialMessage]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [currentConversation?.messages]);

  const formatTime = (date: Date) => {
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  const handleSend = async () => {
    if (!input.trim()) return;

    const messageContent = input;
    setInput('');
    setIsTyping(true);

    try {
      if (isSupport && currentConversation) {
        // Suporte respondendo
        await sendMessage(messageContent, 'text', true, currentConversation.userId);
      } else {
        // Usuário enviando mensagem
        await sendMessage(messageContent, 'text', false);
      }
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
    } finally {
      setIsTyping(false);
    }
  };

  const toggleAudio = (messageId: string) => {
    if (playingAudio === messageId) {
      setPlayingAudio(null);
    } else {
      setPlayingAudio(messageId);
    }
  };

  // Se é suporte e está mostrando lista de conversas
  if (isSupport && showConversationList) {
    return (
      <div className="flex flex-col h-[calc(100vh-200px)] bg-white dark:bg-background">
        <div className="p-4 border-b border-border/50">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Users className="w-5 h-5" />
            Conversas de Suporte
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            {conversations.length} conversa{conversations.length !== 1 ? 's' : ''} ativa{conversations.length !== 1 ? 's' : ''}
          </p>
        </div>

        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
                <p className="mt-4 text-muted-foreground">Carregando conversas...</p>
              </div>
            </div>
          ) : conversations.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center text-muted-foreground">
                <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Nenhuma conversa ainda</p>
              </div>
            </div>
          ) : (
            <div className="divide-y divide-border/50">
              {conversations.map((conv) => (
                <button
                  key={conv.id}
                  onClick={() => {
                    openConversation(conv.id);
                    setShowConversationList(false);
                  }}
                  className="w-full p-4 hover:bg-gray-50 dark:hover:bg-secondary/50 transition-colors text-left"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-bold overflow-hidden flex-shrink-0">
                      {conv.userAvatar ? (
                        <img src={conv.userAvatar} alt={conv.userName} className="w-full h-full object-cover" />
                      ) : (
                        <span>{conv.userName.charAt(0)}</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="font-semibold truncate">{conv.userName}</h3>
                        <span className="text-xs text-muted-foreground">
                          {formatTime(conv.lastMessageTime)}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground truncate">{conv.lastMessage}</p>
                      {conv.unreadCount > 0 && (
                        <span className="inline-block mt-1 px-2 py-0.5 text-xs bg-primary text-white rounded-full">
                          {conv.unreadCount} nova{conv.unreadCount !== 1 ? 's' : ''}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Chat normal (usuário ou suporte com conversa aberta)
  const messages = currentConversation?.messages || [];
  const displayName = isSupport && currentConversation 
    ? currentConversation.userName 
    : (user?.name || currentUser.name);

  return (
    <div className="flex flex-col h-[calc(100vh-200px)] bg-white dark:bg-background">
      {/* Header - se for suporte, mostrar botão para voltar */}
      {isSupport && currentConversation && (
        <div className="p-3 border-b border-border/50 flex items-center gap-3">
          <button
            onClick={() => {
              setShowConversationList(true);
              setCurrentConversation(null);
            }}
            className="p-2 hover:bg-gray-100 dark:hover:bg-secondary rounded-lg transition-colors"
          >
            ← Voltar
          </button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white text-xs font-bold overflow-hidden">
              {currentConversation.userAvatar ? (
                <img src={currentConversation.userAvatar} alt={currentConversation.userName} className="w-full h-full object-cover" />
              ) : (
                <span>{currentConversation.userName.charAt(0)}</span>
              )}
            </div>
            <div>
              <p className="font-semibold text-sm">{currentConversation.userName}</p>
              <p className="text-xs text-muted-foreground">Conversa de suporte</p>
            </div>
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-2 p-4">
        {messages.length === 0 && !isSupport ? (
          <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
            <MessageSquare className="w-16 h-16 mb-4 opacity-50" />
            <p className="text-lg font-medium mb-2">Olá! 👋</p>
            <p className="text-sm">Como podemos ajudar você hoje?</p>
            <p className="text-xs mt-4">Nossa equipe de suporte responderá em breve</p>
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={cn(
                "flex gap-2 animate-fade-in",
                message.isUser ? "flex-row-reverse" : "flex-row"
              )}
            >
              {/* Avatar */}
              {!message.isUser && message.author && (
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white text-xs font-bold overflow-hidden">
                    {message.author.avatar ? (
                      <img
                        src={message.author.avatar}
                        alt={message.author.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span>{message.author.name.charAt(0)}</span>
                    )}
                  </div>
                </div>
              )}

              {/* Message Content */}
              <div className={cn(
                "flex flex-col max-w-[75%]",
                message.isUser ? "items-end" : "items-start"
              )}>
                {/* Author info */}
                {!message.isUser && message.author && (
                  <div className="flex items-center gap-2 mb-1 px-1">
                    <span className="text-xs font-semibold text-primary">
                      {message.author.name}
                    </span>
                    {message.author.role && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/20 text-primary">
                        {message.author.role}
                      </span>
                    )}
                  </div>
                )}

                {/* Message Bubble */}
                <div className={cn(
                  "rounded-2xl px-3 py-2",
                  message.isUser
                    ? "bg-primary text-white rounded-tr-sm"
                    : "bg-gray-100 dark:bg-secondary text-foreground rounded-tl-sm"
                )}>
                  {message.type === 'audio' ? (
                    <div className="flex items-center gap-3 min-w-[200px]">
                      <button
                        onClick={() => toggleAudio(message.id)}
                        className="flex-shrink-0 w-8 h-8 rounded-full bg-white/20 dark:bg-black/20 flex items-center justify-center"
                      >
                        {playingAudio === message.id ? (
                          <Pause className="w-4 h-4" />
                        ) : (
                          <Play className="w-4 h-4 ml-0.5" />
                        )}
                      </button>
                      <div className="flex-1">
                        <div className="flex items-center gap-1 h-4">
                          {[...Array(20)].map((_, i) => (
                            <div
                              key={i}
                              className={cn(
                                "w-0.5 rounded-full transition-all",
                                playingAudio === message.id
                                  ? "bg-white/80 h-full animate-pulse"
                                  : "bg-white/40 h-2"
                              )}
                              style={{
                                height: playingAudio === message.id
                                  ? `${Math.random() * 100}%`
                                  : '8px',
                              }}
                            />
                          ))}
                        </div>
                        <div className="flex items-center gap-2 mt-1 text-xs opacity-80">
                          <span>0:00</span>
                          <span>/</span>
                          <span>{message.audioDuration || 0}:00</span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm whitespace-pre-wrap break-words">
                      {message.content}
                    </p>
                  )}
                </div>

                {/* Timestamp and status */}
                <div className={cn(
                  "flex items-center gap-1 mt-1 px-1 text-[10px] text-muted-foreground",
                  message.isUser ? "flex-row-reverse" : "flex-row"
                )}>
                  <span>{formatTime(message.timestamp)}</span>
                  {message.isUser && (
                    <span className="text-primary">✓✓</span>
                  )}
                </div>
              </div>
            </div>
          ))
        )}

        {isTyping && (
          <div className="flex gap-2 animate-fade-in">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent flex-shrink-0" />
            <div className="bg-gray-100 dark:bg-secondary rounded-2xl rounded-tl-sm px-4 py-3">
              <div className="flex gap-1">
                <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Bar */}
      <div className="p-3 border-t border-border/50 bg-white dark:bg-background">
        <div className="flex items-center gap-2">
          {/* Icons */}
          <button className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-secondary flex items-center justify-center hover:bg-gray-200 dark:hover:bg-secondary/80 transition-colors">
            <ImageIcon className="w-5 h-5 text-muted-foreground" />
          </button>
          <button className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-secondary flex items-center justify-center hover:bg-gray-200 dark:hover:bg-secondary/80 transition-colors">
            <Mic className="w-5 h-5 text-muted-foreground" />
          </button>
          <button className="w-10 h-10 rounded-lg bg-yellow-400 flex items-center justify-center hover:bg-yellow-500 transition-colors">
            <Smile className="w-5 h-5 text-yellow-900" />
          </button>

          {/* Input */}
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            placeholder={isSupport ? "Digite sua resposta..." : "Digite sua mensagem"}
            className="flex-1 bg-gray-100 dark:bg-secondary rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
          />

          {/* Send Button */}
          <button
            onClick={handleSend}
            disabled={!input.trim()}
            className={cn(
              "w-10 h-10 rounded-full flex items-center justify-center transition-colors flex-shrink-0",
              input.trim()
                ? "bg-primary hover:bg-primary/90"
                : "bg-gray-300 dark:bg-secondary cursor-not-allowed"
            )}
          >
            <Send className="w-5 h-5 text-white" />
          </button>
        </div>
      </div>

      {/* Hidden audio element */}
      <audio ref={audioRef} />
    </div>
  );
}
