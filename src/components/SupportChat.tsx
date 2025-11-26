import { useState, useRef, useEffect } from 'react';
import { Send, Image as ImageIcon, Mic, Smile, Play, Pause } from 'lucide-react';
import { Message } from '@/types';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { currentUser } from '@/data/mockData';

interface SupportChatProps {
  initialMessage?: string;
}

const botResponses = [
  "Olá! 👋 Bem-vindo ao suporte NutraElite. Como posso ajudar você hoje?",
  "Entendi sua dúvida! Deixa eu verificar isso para você... 🔍",
  "Claro! Para essa questão, recomendo acessar o módulo 2 do treinamento onde explicamos esse processo em detalhes.",
  "Ótima pergunta! Você pode entrar em contato diretamente com nosso time pelo WhatsApp (11) 99999-9999 para casos urgentes.",
  "Sua dúvida foi registrada! Um de nossos especialistas irá retornar em até 24 horas úteis. 📩",
];

export function SupportChat({ initialMessage }: SupportChatProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      content: '👋',
      isUser: false,
      timestamp: new Date(Date.now() - 300000),
      type: 'emoji',
      author: {
        name: 'SOCIO GUSTAVO',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face',
        role: 'admin',
      },
    },
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [playingAudio, setPlayingAudio] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const formatTime = (date: Date) => {
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  const handleSend = () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: input,
      isUser: true,
      timestamp: new Date(),
      type: input.length <= 2 && /[\u{1F300}-\u{1F9FF}]/u.test(input) ? 'emoji' : 'text',
      author: {
        name: currentUser.name,
        avatar: currentUser.avatar,
      },
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    // Simulate bot response
    setTimeout(() => {
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: botResponses[Math.floor(Math.random() * botResponses.length)],
        isUser: false,
        timestamp: new Date(),
        type: 'text',
        author: {
          name: 'SOCIO GUSTAVO',
          avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face',
          role: 'admin',
        },
      };
      setMessages((prev) => [...prev, botMessage]);
      setIsTyping(false);
    }, 1500);
  };

  const handleAudioMessage = () => {
    // Simular mensagem de áudio
    const audioMessage: Message = {
      id: Date.now().toString(),
      content: '',
      isUser: true,
      timestamp: new Date(),
      type: 'audio',
      audioDuration: 5,
      author: {
        name: currentUser.name,
        avatar: currentUser.avatar,
      },
    };
    setMessages((prev) => [...prev, audioMessage]);
  };

  const toggleAudio = (messageId: string) => {
    if (playingAudio === messageId) {
      setPlayingAudio(null);
    } else {
      setPlayingAudio(messageId);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-200px)] bg-white dark:bg-background">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-2 p-4">
        {messages.map((message) => (
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
              {/* Author info for admin */}
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
                      {/* Waveform simulation */}
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
        ))}

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
          <button
            onClick={handleAudioMessage}
            className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-secondary flex items-center justify-center hover:bg-gray-200 dark:hover:bg-secondary/80 transition-colors"
          >
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
            placeholder="Digite sua mensagem"
            className="flex-1 bg-gray-100 dark:bg-secondary rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
          />

          {/* Send Button */}
          <button
            onClick={handleSend}
            className="w-10 h-10 rounded-full bg-primary flex items-center justify-center hover:bg-primary/90 transition-colors flex-shrink-0"
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
