import { useState, useRef, useEffect } from 'react';
import { Send, Image as ImageIcon, Mic, Smile, Play, Pause, MessageSquare, Users, X } from 'lucide-react';
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
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [recordedAudio, setRecordedAudio] = useState<{ url: string; duration: number; blob: Blob } | null>(null);
  const [isPlayingPreview, setIsPlayingPreview] = useState(false);
  const [previewCurrentTime, setPreviewCurrentTime] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const previewAudioRef = useRef<HTMLAudioElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recordingTimeRef = useRef<number>(0);

  // Removido showConversationList - agora usamos currentConversation diretamente

  useEffect(() => {
    if (initialMessage && !isSupport) {
      sendMessage(initialMessage, 'text', false, user?.id);
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

  const formatRecordingTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSend = async () => {
    console.log('📤 handleSend chamado', { input: input.substring(0, 50), hasImage: !!selectedImage, isSupport, hasConversation: !!currentConversation });
    
    if (!input.trim() && !selectedImage) {
      console.warn('⚠️ Nada para enviar - input vazio e sem imagem');
      return;
    }

    const messageContent = input || (selectedImage ? '📷' : '');
    const messageType = selectedImage ? 'image' : input.length <= 2 && /[\u{1F300}-\u{1F9FF}]/u.test(input) ? 'emoji' : 'text';
    const imageToSend = selectedImage || undefined;
    
    // Salvar valores antes de limpar
    const contentToSend = messageContent;
    const typeToSend = messageType;
    const imageToSendFinal = imageToSend;
    
    // Limpar campos imediatamente para feedback visual
    setInput('');
    setSelectedImage(null);
    setIsTyping(true);

    try {
      console.log('💬 Enviando mensagem...', { content: contentToSend.substring(0, 50), type: typeToSend, isSupport, hasConversation: !!currentConversation });
      
      if (isSupport) {
        // Suporte respondendo - precisa ter conversa aberta
        if (currentConversation) {
          console.log('✅ Suporte enviando para conversa:', currentConversation.userId);
          await sendMessage(contentToSend, typeToSend, true, currentConversation.userId, imageToSendFinal);
        } else {
          console.warn('⚠️ Nenhuma conversa aberta para o suporte responder');
          // Criar conversa se necessário
          if (conversations.length > 0) {
            openConversation(conversations[0].id);
            await sendMessage(contentToSend, typeToSend, true, conversations[0].userId, imageToSendFinal);
          } else {
            console.error('❌ Nenhuma conversa disponível para o suporte');
            // Restaurar campos se não conseguir enviar
            setInput(contentToSend);
            setSelectedImage(imageToSendFinal || null);
          }
        }
      } else {
        // Usuário enviando mensagem - sempre criar/enviar para própria conversa
        const userId = user?.id || 'current_user';
        console.log('✅ Usuário enviando mensagem:', { userId, content: contentToSend.substring(0, 50) });
        
        // SEMPRE enviar a mensagem - sendMessage vai criar a conversa se não existir
        // Não precisa abrir a conversa antes, pois sendMessage já faz isso internamente
        await sendMessage(contentToSend, typeToSend, false, userId, imageToSendFinal);
        console.log('✅ Mensagem enviada com sucesso');
        
        // Após enviar, garantir que a conversa está aberta para o usuário ver
        if (!currentConversation) {
          console.log('📝 Abrindo conversa do usuário após enviar mensagem:', userId);
          openConversation(userId);
        }
      }
    } catch (error: any) {
      console.error('❌ Erro ao enviar mensagem:', error);
      // Restaurar campos em caso de erro
      setInput(contentToSend);
      setSelectedImage(imageToSendFinal || null);
      alert('Erro ao enviar mensagem: ' + (error?.message || 'Erro desconhecido'));
    } finally {
      setIsTyping(false);
    }
  };

  const handleStartRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      
      let options: MediaRecorderOptions = {};
      if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
        options.mimeType = 'audio/webm;codecs=opus';
      } else if (MediaRecorder.isTypeSupported('audio/webm')) {
        options.mimeType = 'audio/webm';
      } else if (MediaRecorder.isTypeSupported('audio/ogg;codecs=opus')) {
        options.mimeType = 'audio/ogg;codecs=opus';
      }
      
      const mediaRecorder = new MediaRecorder(stream, options);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const finalDuration = recordingTimeRef.current;
        
        let mimeType = 'audio/webm';
        if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
          mimeType = 'audio/webm;codecs=opus';
        } else if (MediaRecorder.isTypeSupported('audio/webm')) {
          mimeType = 'audio/webm';
        } else if (MediaRecorder.isTypeSupported('audio/ogg;codecs=opus')) {
          mimeType = 'audio/ogg;codecs=opus';
        } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
          mimeType = 'audio/mp4';
        }
        
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
        const audioUrl = URL.createObjectURL(audioBlob);
        
        if (finalDuration > 0) {
          setRecordedAudio({
            url: audioUrl,
            duration: finalDuration,
            blob: audioBlob,
          });
        } else {
          URL.revokeObjectURL(audioUrl);
        }

        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
          streamRef.current = null;
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      recordingTimeRef.current = 0;
    } catch (error) {
      console.error('Erro ao iniciar gravação:', error);
      alert('Não foi possível acessar o microfone. Verifique as permissões.');
    }
  };

  const handleStopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      if (mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop();
      }
      setIsRecording(false);
    }
  };

  const handleSendAudio = async () => {
    if (recordedAudio) {
      try {
        const reader = new FileReader();
        reader.onloadend = async () => {
          try {
            const base64Audio = reader.result as string;
            
            if (isSupport && currentConversation) {
              await sendMessage('🎤 Áudio', 'audio', true, currentConversation.userId);
            } else {
              await sendMessage('🎤 Áudio', 'audio', false, user?.id);
            }
            
            if (previewAudioRef.current) {
              previewAudioRef.current.pause();
              previewAudioRef.current.src = '';
              previewAudioRef.current = null;
            }
            
            URL.revokeObjectURL(recordedAudio.url);
            setRecordedAudio(null);
            setRecordingTime(0);
            recordingTimeRef.current = 0;
            setPreviewCurrentTime(0);
            setIsPlayingPreview(false);
          } catch (error: any) {
            console.error('Erro ao enviar áudio:', error);
          }
        };
        reader.onerror = () => {
          console.error('Erro ao ler arquivo de áudio');
        };
        reader.readAsDataURL(recordedAudio.blob);
      } catch (error: any) {
        console.error('Erro ao enviar áudio:', error);
      }
    }
  };

  const handleCancelAudio = () => {
    if (recordedAudio) {
      if (previewAudioRef.current) {
        previewAudioRef.current.pause();
        previewAudioRef.current.src = '';
        previewAudioRef.current = null;
      }
      URL.revokeObjectURL(recordedAudio.url);
      setRecordedAudio(null);
      setRecordingTime(0);
      recordingTimeRef.current = 0;
      setPreviewCurrentTime(0);
      setIsPlayingPreview(false);
    }
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

  const handlePlayPreview = async () => {
    if (!recordedAudio) return;

    if (!previewAudioRef.current) {
      const audio = new Audio(recordedAudio.url);
      previewAudioRef.current = audio;
      
      const updateTime = () => {
        if (audio && !audio.paused) {
          setPreviewCurrentTime(Math.floor(audio.currentTime));
        }
      };

      const handleEnded = () => {
        setIsPlayingPreview(false);
        setPreviewCurrentTime(0);
        audio.currentTime = 0;
      };

      audio.addEventListener('timeupdate', updateTime);
      audio.addEventListener('ended', handleEnded);
      audio.load();
    }

    const audio = previewAudioRef.current;

    if (isPlayingPreview) {
      audio.pause();
      setIsPlayingPreview(false);
    } else {
      try {
        await audio.play();
        setIsPlayingPreview(true);
      } catch (error) {
        console.error('Erro ao reproduzir áudio:', error);
      }
    }
  };

  useEffect(() => {
    if (isRecording) {
      recordingIntervalRef.current = setInterval(() => {
        setRecordingTime((prev) => {
          const newTime = prev + 1;
          recordingTimeRef.current = newTime;
          return newTime;
        });
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

  useEffect(() => {
    if (recordedAudio) {
      if (previewAudioRef.current) {
        previewAudioRef.current.pause();
        previewAudioRef.current.src = '';
        previewAudioRef.current = null;
      }

      const audio = new Audio(recordedAudio.url);
      previewAudioRef.current = audio;
      
      const updateTime = () => {
        if (audio && !audio.paused) {
          setPreviewCurrentTime(Math.floor(audio.currentTime));
        }
      };

      const handleEnded = () => {
        setIsPlayingPreview(false);
        setPreviewCurrentTime(0);
        if (audio) {
          audio.currentTime = 0;
        }
      };

      audio.addEventListener('timeupdate', updateTime);
      audio.addEventListener('ended', handleEnded);
      audio.load();

      return () => {
        audio.removeEventListener('timeupdate', updateTime);
        audio.removeEventListener('ended', handleEnded);
        audio.pause();
        audio.src = '';
      };
    } else {
      if (previewAudioRef.current) {
        previewAudioRef.current.pause();
        previewAudioRef.current.src = '';
        previewAudioRef.current = null;
      }
      setPreviewCurrentTime(0);
      setIsPlayingPreview(false);
    }
  }, [recordedAudio]);

  const commonEmojis = ['😀', '😂', '😍', '🔥', '💪', '🎉', '👍', '❤️', '😊', '👏'];

  const toggleAudio = (messageId: string) => {
    if (playingAudio === messageId) {
      setPlayingAudio(null);
    } else {
      setPlayingAudio(messageId);
    }
  };

  // Se não há conversa aberta e não é suporte, criar uma conversa automaticamente
  useEffect(() => {
    if (!isSupport && !currentConversation && user?.id) {
      // Abrir conversa do usuário atual
      openConversation(user.id);
    }
  }, [isSupport, currentConversation, user?.id, openConversation]);

  // Debug: verificar se a conversa está aberta (ANTES de qualquer return)
  useEffect(() => {
    if (isSupport) {
      console.log('🔍 Estado do suporte:', { 
        hasConversation: !!currentConversation, 
        conversationId: currentConversation?.id
      });
    }
  }, [isSupport, currentConversation]);

  // Se é suporte e NÃO tem conversa aberta, mostrar lista
  if (isSupport && !currentConversation) {
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
                    console.log('📂 Abrindo conversa:', conv.id);
                    // Abrir conversa diretamente - o return vai mudar automaticamente
                    openConversation(conv.id);
                    console.log('✅ Conversa aberta:', conv.id);
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
    <div className="flex flex-col bg-white dark:bg-background" style={{ 
      height: 'calc(100vh - 200px)',
      minHeight: 'calc(100vh - 200px)',
      maxHeight: 'calc(100vh - 200px)',
      touchAction: 'pan-y'
    }}>
      {/* Header - se for suporte, mostrar botão para voltar */}
      {isSupport && currentConversation && (
        <div className="p-3 border-b border-border/50 flex items-center gap-3 bg-white dark:bg-background">
          <button
            onClick={() => {
              openConversation(null); // Voltar para lista (sem conversa aberta)
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
      <div className="flex-1 overflow-y-auto space-y-2 p-4" style={{ 
        WebkitOverflowScrolling: 'touch',
        overscrollBehavior: 'contain'
      }}>
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
                    : "bg-gray-100 dark:bg-secondary text-gray-900 dark:text-gray-100 rounded-tl-sm"
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
                  ) : message.type === 'image' && (message as any).image ? (
                    <div className="max-w-[250px]">
                      <img
                        src={(message as any).image}
                        alt="Imagem"
                        className="rounded-lg w-full"
                      />
                      {message.content && message.content !== '📷' && (
                        <p className="text-sm mt-2 whitespace-pre-wrap break-words text-gray-900 dark:text-gray-100">
                          {message.content}
                        </p>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm whitespace-pre-wrap break-words text-gray-900 dark:text-gray-100">
                      {message.content || ''}
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

      {/* Recording indicator */}
      {isRecording && (
        <div className="px-4 py-3 bg-red-500 text-white flex items-center justify-between z-20">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 bg-white rounded-full animate-pulse" />
            <span className="font-medium">Gravando... {formatRecordingTime(recordingTime)}</span>
          </div>
          <button
            onClick={handleStopRecording}
            className="px-4 py-1 bg-white/20 rounded-lg hover:bg-white/30 transition-colors"
          >
            Parar
          </button>
        </div>
      )}

      {/* Audio Preview */}
      {recordedAudio && !isRecording && (
        <div className="px-3 py-2 bg-gray-50 dark:bg-[#202c33] border-t border-border/50 relative z-20">
          <div className="bg-[#d9fdd3] dark:bg-[#005c4b] rounded-lg p-3 shadow-lg">
            <div className="flex items-center gap-3">
              <button
                onClick={handlePlayPreview}
                className="flex-shrink-0 w-10 h-10 rounded-full bg-[#00a884] flex items-center justify-center hover:bg-[#00a884]/90 transition-colors shadow-sm"
              >
                {isPlayingPreview ? (
                  <Pause className="w-5 h-5 text-white" />
                ) : (
                  <Play className="w-5 h-5 text-white ml-0.5" />
                )}
              </button>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-0.5 h-5 mb-1">
                  {[...Array(30)].map((_, i) => {
                    const baseHeight = Math.sin((i / 30) * Math.PI * 6) * 8 + 12;
                    const animatedHeight = isPlayingPreview 
                      ? baseHeight + Math.sin((Date.now() / 200) + i) * 6
                      : baseHeight;
                    
                    return (
                      <div
                        key={i}
                        className={cn(
                          "w-0.5 rounded-full transition-all duration-150",
                          isPlayingPreview
                            ? "bg-white animate-pulse"
                            : "bg-white/60"
                        )}
                        style={{
                          height: `${Math.max(4, Math.min(20, animatedHeight))}px`,
                        }}
                      />
                    );
                  })}
                </div>
                <div className="flex items-center justify-between text-xs text-white/90">
                  <span>{formatRecordingTime(previewCurrentTime)}</span>
                  <span>/</span>
                  <span>{formatRecordingTime(recordedAudio.duration)}</span>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={handleCancelAudio}
                  className="w-9 h-9 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center transition-colors shadow-sm"
                  title="Cancelar"
                >
                  <X className="w-4 h-4 text-white" />
                </button>
                <button
                  onClick={handleSendAudio}
                  className="w-9 h-9 rounded-full bg-[#00a884] hover:bg-[#00a884]/90 flex items-center justify-center transition-colors shadow-sm"
                  title="Enviar"
                >
                  <Send className="w-4 h-4 text-white" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Selected image preview */}
      {selectedImage && (
        <div className="px-3 py-2 bg-gray-50 dark:bg-[#202c33] border-t border-border/50 relative z-20">
          <div className="bg-white dark:bg-[#202c33] rounded-lg p-1 shadow-lg border border-gray-200 dark:border-gray-700 max-w-[150px]">
            <div className="relative">
              <img
                src={selectedImage}
                alt="Preview"
                className="w-full max-h-20 object-cover rounded"
              />
              <button
                onClick={() => setSelectedImage(null)}
                className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center hover:bg-red-600 transition-colors shadow-md"
                aria-label="Remover imagem"
              >
                <X className="w-3 h-3 text-white" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Emoji picker */}
      {showEmojiPicker && (
        <div className="px-3 py-2 bg-white dark:bg-[#202c33] border-t border-border z-20">
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

      {/* Input Bar - SEMPRE mostrar quando suporte tem conversa aberta */}
      {/* Se é suporte: mostrar quando tem conversa (simples assim!) */}
      {/* Se não é suporte: sempre mostrar */}
      {(!isSupport || (isSupport && !!currentConversation)) && (
      <div 
        className="p-3 border-t border-border/50 bg-white dark:bg-background relative z-20 pb-safe"
        style={{ 
          paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 65px)',
          touchAction: 'none'
        }}
      >
        <div className="flex items-end gap-2 w-full">
          {/* Icons */}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-secondary flex items-center justify-center hover:bg-gray-200 dark:hover:bg-secondary/80 transition-colors flex-shrink-0"
          >
            <ImageIcon className="w-5 h-5 text-muted-foreground" />
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
              Solte para parar
            </button>
          ) : (
            <>
              <button
                onMouseDown={handleStartRecording}
                onTouchStart={(e) => {
                  e.preventDefault();
                  handleStartRecording();
                }}
                className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-secondary flex items-center justify-center hover:bg-gray-200 dark:hover:bg-secondary/80 active:bg-gray-300 dark:active:bg-secondary/70 transition-colors flex-shrink-0 touch-manipulation"
                style={{ touchAction: 'manipulation' }}
              >
                <Mic className="w-5 h-5 text-muted-foreground" />
              </button>
              <button
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                className="w-10 h-10 rounded-lg bg-yellow-400 flex items-center justify-center hover:bg-yellow-500 transition-colors flex-shrink-0"
              >
                <Smile className="w-5 h-5 text-yellow-900" />
              </button>

              {/* Input */}
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
                placeholder={isSupport ? "Digite sua resposta..." : "Digite sua mensagem"}
                className="flex-1 min-w-0 bg-gray-100 dark:bg-secondary rounded-xl px-4 py-2.5 text-base text-gray-900 dark:text-gray-100 placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/50"
                style={{ fontSize: '16px' }}
              />

              {/* Send Button */}
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  console.log('🔘 Botão enviar clicado', { input: input.substring(0, 50), hasImage: !!selectedImage });
                  handleSend();
                }}
                disabled={!input.trim() && !selectedImage}
                className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center transition-colors flex-shrink-0 min-w-[40px] touch-manipulation",
                  input.trim() || selectedImage
                    ? "bg-primary hover:bg-primary/90 active:bg-primary/80 cursor-pointer"
                    : "bg-gray-300 dark:bg-secondary cursor-not-allowed opacity-50"
                )}
                type="button"
                style={{ touchAction: 'manipulation' }}
              >
                <Send className="w-5 h-5 text-white" />
              </button>
            </>
          )}
        </div>
      </div>
      )}

      {/* Hidden audio element */}
      <audio ref={audioRef} />
    </div>
  );
}
