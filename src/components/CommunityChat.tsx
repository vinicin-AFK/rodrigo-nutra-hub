import { useState, useRef, useEffect } from 'react';
import { Send, Image as ImageIcon, Mic, Smile, Play, Pause, X } from 'lucide-react';
import { Message } from '@/types';
import { cn } from '@/lib/utils';
import { currentUser, users } from '@/data/mockData';

export function CommunityChat() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      content: '👋 Bem-vindos à comunidade NutraElite!',
      isUser: false,
      timestamp: new Date(Date.now() - 3600000),
      type: 'text',
      author: {
        name: 'SOCIO GUSTAVO',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face',
        role: 'admin',
      },
    },
    {
      id: '2',
      content: '🔥 RESULTADO INSANO! Fechei mais uma venda de R$ 5.000!',
      isUser: false,
      timestamp: new Date(Date.now() - 1800000),
      type: 'text',
      author: {
        name: users[0].name,
        avatar: users[0].avatar,
      },
    },
    {
      id: '3',
      content: '',
      isUser: false,
      timestamp: new Date(Date.now() - 900000),
      type: 'audio',
      audioDuration: 5,
      author: {
        name: users[1].name,
        avatar: users[1].avatar,
      },
    },
  ]);

  const [input, setInput] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [playingAudio, setPlayingAudio] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isRecording) {
      recordingIntervalRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } else {
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
        recordingIntervalRef.current = null;
      }
    }

    return () => {
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
      }
    };
  }, [isRecording]);

  const formatTime = (date: Date) => {
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  const formatRecordingTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSend = () => {
    if (!input.trim() && !selectedImage) return;

    const newMessage: Message = {
      id: Date.now().toString(),
      content: input || (selectedImage ? '📷' : ''),
      isUser: true,
      timestamp: new Date(),
      type: selectedImage ? 'image' : input.length <= 2 && /[\u{1F300}-\u{1F9FF}]/u.test(input) ? 'emoji' : 'text',
      image: selectedImage || undefined,
      author: {
        name: currentUser.name,
        avatar: currentUser.avatar,
      },
    };

    setMessages((prev) => [...prev, newMessage]);
    setInput('');
    setSelectedImage(null);
  };

  const handleStartRecording = () => {
    setIsRecording(true);
    setRecordingTime(0);
  };

  const handleStopRecording = () => {
    setIsRecording(false);
    if (recordingTime > 0) {
      const audioMessage: Message = {
        id: Date.now().toString(),
        content: '',
        isUser: true,
        timestamp: new Date(),
        type: 'audio',
        audioDuration: recordingTime,
        author: {
          name: currentUser.name,
          avatar: currentUser.avatar,
        },
      };
      setMessages((prev) => [...prev, audioMessage]);
    }
    setRecordingTime(0);
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setSelectedImage(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const toggleAudio = (messageId: string) => {
    if (playingAudio === messageId) {
      setPlayingAudio(null);
    } else {
      setPlayingAudio(messageId);
    }
  };

  const commonEmojis = ['😀', '😂', '😍', '🔥', '💪', '🎉', '👍', '❤️', '😊', '👏'];

  return (
    <div className="flex flex-col h-[calc(100vh-180px)] bg-[#e5ddd5] dark:bg-[#0b141a] relative">
      {/* Background pattern */}
      <div 
        className="absolute inset-0 opacity-5"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' xmlns='http://www.w3.org/2000/svg'%3E%3Cdefs%3E%3Cpattern id='grid' width='100' height='100' patternUnits='userSpaceOnUse'%3E%3Cpath d='M 100 0 L 0 0 0 100' fill='none' stroke='%23000' stroke-width='1'/%3E%3C/pattern%3E%3C/defs%3E%3Crect width='100' height='100' fill='url(%23grid)' /%3E%3C/svg%3E")`,
        }}
      />

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-1 p-4 relative z-10">
        {messages.map((message) => {
          const isCurrentUser = message.isUser;
          return (
            <div
              key={message.id}
              className={cn(
                "flex gap-2 animate-fade-in",
                isCurrentUser ? "flex-row-reverse" : "flex-row"
              )}
            >
              {/* Avatar */}
              {!isCurrentUser && message.author && (
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white text-xs font-bold overflow-hidden">
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
                isCurrentUser ? "items-end" : "items-start"
              )}>
                {/* Author info */}
                {!isCurrentUser && message.author && (
                  <div className="flex items-center gap-2 mb-0.5 px-1">
                    <span className="text-[11px] font-semibold text-[#667781] dark:text-[#8696a0]">
                      {message.author.name}
                    </span>
                    {message.author.role && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-primary/20 text-primary">
                        {message.author.role}
                      </span>
                    )}
                  </div>
                )}

                {/* Message Bubble */}
                <div className={cn(
                  "rounded-lg px-2 py-1.5 shadow-sm",
                  isCurrentUser
                    ? "bg-[#d9fdd3] dark:bg-[#005c4b] text-[#111b21] dark:text-white rounded-tr-none"
                    : "bg-white dark:bg-[#202c33] text-[#111b21] dark:text-[#e9edef] rounded-tl-none"
                )}>
                  {message.type === 'audio' ? (
                    <div className="flex items-center gap-3 min-w-[200px]">
                      <button
                        onClick={() => toggleAudio(message.id)}
                        className="flex-shrink-0 w-8 h-8 rounded-full bg-[#00a884] dark:bg-[#00a884] flex items-center justify-center hover:opacity-80 transition-opacity"
                      >
                        {playingAudio === message.id ? (
                          <Pause className="w-4 h-4 text-white" />
                        ) : (
                          <Play className="w-4 h-4 text-white ml-0.5" />
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
                                  ? "bg-[#00a884] h-full animate-pulse"
                                  : "bg-[#00a884]/40 h-2"
                              )}
                              style={{
                                height: playingAudio === message.id
                                  ? `${Math.random() * 100}%`
                                  : '8px',
                              }}
                            />
                          ))}
                        </div>
                        <div className="flex items-center gap-2 mt-1 text-[11px] text-[#667781] dark:text-[#8696a0]">
                          <span>{formatRecordingTime(0)}</span>
                          <span>/</span>
                          <span>{formatRecordingTime(message.audioDuration || 0)}</span>
                        </div>
                      </div>
                    </div>
                  ) : message.type === 'image' && message.image ? (
                    <div className="max-w-[250px]">
                      <img
                        src={message.image}
                        alt="Imagem"
                        className="rounded-lg w-full"
                      />
                      {message.content && message.content !== '📷' && (
                        <p className="text-sm mt-2 whitespace-pre-wrap break-words">
                          {message.content}
                        </p>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm whitespace-pre-wrap break-words">
                      {message.content}
                    </p>
                  )}
                </div>

                {/* Timestamp and status */}
                <div className={cn(
                  "flex items-center gap-1 mt-0.5 px-1 text-[11px] text-[#667781] dark:text-[#8696a0]",
                  isCurrentUser ? "flex-row-reverse" : "flex-row"
                )}>
                  <span>{formatTime(message.timestamp)}</span>
                  {isCurrentUser && (
                    <span className="text-[#53bdeb]">✓✓</span>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        <div ref={messagesEndRef} />
      </div>

      {/* Recording indicator */}
      {isRecording && (
        <div className="absolute bottom-20 left-0 right-0 bg-red-500 text-white px-4 py-3 flex items-center justify-between z-20">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 bg-white rounded-full animate-pulse" />
            <span className="font-medium">Gravando... {formatRecordingTime(recordingTime)}</span>
          </div>
          <button
            onClick={handleStopRecording}
            className="px-4 py-1 bg-white/20 rounded-lg hover:bg-white/30 transition-colors"
          >
            Enviar
          </button>
        </div>
      )}

      {/* Selected image preview */}
      {selectedImage && (
        <div className="absolute bottom-20 left-4 right-4 z-20">
          <div className="bg-white dark:bg-[#202c33] rounded-lg p-2 shadow-lg">
            <div className="relative">
              <img
                src={selectedImage}
                alt="Preview"
                className="w-full max-h-40 object-cover rounded"
              />
              <button
                onClick={() => setSelectedImage(null)}
                className="absolute top-2 right-2 w-6 h-6 bg-black/50 rounded-full flex items-center justify-center hover:bg-black/70 transition-colors"
              >
                <X className="w-4 h-4 text-white" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Emoji picker */}
      {showEmojiPicker && (
        <div className="absolute bottom-20 left-0 right-0 bg-white dark:bg-[#202c33] border-t border-border p-4 z-20">
          <div className="grid grid-cols-10 gap-2">
            {commonEmojis.map((emoji) => (
              <button
                key={emoji}
                onClick={() => {
                  setInput((prev) => prev + emoji);
                  setShowEmojiPicker(false);
                }}
                className="text-2xl hover:bg-gray-100 dark:hover:bg-[#2a3942] rounded-lg p-2 transition-colors"
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input Bar */}
      <div className="p-2 bg-[#f0f2f5] dark:bg-[#202c33] border-t border-border/50 relative z-10">
        <div className="flex items-end gap-2">
          {/* Icons */}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-10 h-10 rounded-lg bg-white dark:bg-[#2a3942] flex items-center justify-center hover:bg-gray-100 dark:hover:bg-[#323d45] transition-colors flex-shrink-0"
          >
            <ImageIcon className="w-5 h-5 text-[#54656f] dark:text-[#8696a0]" />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageSelect}
            className="hidden"
          />

          {isRecording ? (
            <button
              onMouseUp={handleStopRecording}
              onTouchEnd={handleStopRecording}
              className="flex-1 h-10 bg-red-500 text-white rounded-lg flex items-center justify-center hover:bg-red-600 transition-colors"
            >
              <Mic className="w-5 h-5 mr-2" />
              Solte para enviar
            </button>
          ) : (
            <>
              <button
                onMouseDown={handleStartRecording}
                onTouchStart={handleStartRecording}
                className="w-10 h-10 rounded-lg bg-white dark:bg-[#2a3942] flex items-center justify-center hover:bg-gray-100 dark:hover:bg-[#323d45] transition-colors flex-shrink-0"
              >
                <Mic className="w-5 h-5 text-[#54656f] dark:text-[#8696a0]" />
              </button>
              <button
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                className="w-10 h-10 rounded-lg bg-[#ffd93d] flex items-center justify-center hover:bg-[#ffd93d]/90 transition-colors flex-shrink-0"
              >
                <Smile className="w-5 h-5 text-yellow-900" />
              </button>

              {/* Input */}
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
                placeholder="Digite uma mensagem"
                className="flex-1 bg-white dark:bg-[#2a3942] rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 text-[#111b21] dark:text-[#e9edef] placeholder:text-[#667781] dark:placeholder:text-[#8696a0]"
              />

              {/* Send Button */}
              <button
                onClick={handleSend}
                disabled={!input.trim() && !selectedImage}
                className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center transition-colors flex-shrink-0",
                  input.trim() || selectedImage
                    ? "bg-[#00a884] hover:bg-[#00a884]/90"
                    : "bg-gray-300 dark:bg-[#2a3942] cursor-not-allowed"
                )}
              >
                <Send className="w-5 h-5 text-white" />
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

