import { useState, useRef, useEffect } from 'react';
import { Send, Image as ImageIcon, Mic, Smile, Play, Pause, X } from 'lucide-react';
import { Message } from '@/types';
import { cn } from '@/lib/utils';
import { currentUser, users } from '@/data/mockData';

// Componente para player de áudio
function AudioPlayer({ 
  message, 
  isPlaying, 
  onToggle,
  formatTime 
}: { 
  message: Message; 
  isPlaying: boolean; 
  onToggle: () => void;
  formatTime: (seconds: number) => string;
}) {
  const [currentTime, setCurrentTime] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Criar áudio uma vez quando a URL mudar
  useEffect(() => {
    if (message.audioUrl) {
      // Limpar áudio anterior
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
        audioRef.current = null;
      }

      // Criar novo áudio
      const audio = new Audio(message.audioUrl);
      audioRef.current = audio;

      const updateTime = () => {
        if (audio && !audio.paused) {
          setCurrentTime(Math.floor(audio.currentTime));
        }
      };

      const handleEnded = () => {
        setCurrentTime(0);
        onToggle(); // Notificar que parou de tocar
      };

      const handleError = (e: Event) => {
        console.error('Erro ao carregar áudio:', e);
        onToggle(); // Parar estado de playing
      };

      audio.addEventListener('timeupdate', updateTime);
      audio.addEventListener('ended', handleEnded);
      audio.addEventListener('error', handleError);

      // Carregar metadados
      audio.load();

      return () => {
        audio.removeEventListener('timeupdate', updateTime);
        audio.removeEventListener('ended', handleEnded);
        audio.removeEventListener('error', handleError);
        audio.pause();
        audio.src = '';
      };
    }
  }, [message.audioUrl, onToggle]);

  // Controlar play/pause
  useEffect(() => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.play().catch((error) => {
          console.error('Erro ao reproduzir áudio:', error);
          onToggle(); // Parar estado de playing em caso de erro
        });
      } else {
        audioRef.current.pause();
      }
    }
  }, [isPlaying, onToggle]);

  // Generate waveform based on duration
  const waveformBars = 20;
  const barHeights = Array.from({ length: waveformBars }, (_, i) => {
    if (isPlaying) {
      // Animated waveform when playing
      return Math.random() * 60 + 20;
    }
    // Static waveform when not playing
    return Math.sin((i / waveformBars) * Math.PI * 4) * 20 + 30;
  });

  return (
    <div className="flex items-center gap-3 min-w-[200px]">
      <button
        onClick={onToggle}
        className="flex-shrink-0 w-8 h-8 rounded-full bg-[#00a884] dark:bg-[#00a884] flex items-center justify-center hover:opacity-80 transition-opacity"
      >
        {isPlaying ? (
          <Pause className="w-4 h-4 text-white" />
        ) : (
          <Play className="w-4 h-4 text-white ml-0.5" />
        )}
      </button>
      <div className="flex-1">
        <div className="flex items-center gap-1 h-4">
          {barHeights.map((height, i) => (
            <div
              key={i}
              className={cn(
                "w-0.5 rounded-full transition-all",
                isPlaying
                  ? "bg-[#00a884] animate-pulse"
                  : "bg-[#00a884]/40"
              )}
              style={{
                height: `${height}%`,
                minHeight: '4px',
                maxHeight: '16px',
              }}
            />
          ))}
        </div>
        <div className="flex items-center gap-2 mt-1 text-[11px] text-[#667781] dark:text-[#8696a0]">
          <span>{formatTime(currentTime)}</span>
          <span>/</span>
          <span>{formatTime(message.audioDuration || 0)}</span>
        </div>
      </div>
    </div>
  );
}

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
      audioUrl: undefined, // Áudio de exemplo sem URL real
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
  const [recordedAudio, setRecordedAudio] = useState<{ url: string; duration: number; blob: Blob } | null>(null);
  const [isPlayingPreview, setIsPlayingPreview] = useState(false);
  const [previewCurrentTime, setPreviewCurrentTime] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const previewAudioRef = useRef<HTMLAudioElement | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isRecording) {
      recordingIntervalRef.current = setInterval(() => {
        setRecordingTime((prev) => {
          const newTime = prev + 1;
          recordingTimeRef.current = newTime; // Atualizar ref também
          return newTime;
        });
      }, 1000);
    } else {
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
        recordingIntervalRef.current = null;
      }
      // NÃO resetar recordingTime aqui - será usado no preview
      // O recordingTime só será resetado quando o áudio for enviado ou cancelado
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

  const streamRef = useRef<MediaStream | null>(null);
  const recordingTimeRef = useRef<number>(0);

  const handleStartRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      
      // Determinar o tipo MIME suportado
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
        // Usar o ref para garantir que temos o tempo correto
        const finalDuration = recordingTimeRef.current;
        
        // Determinar o tipo MIME correto baseado no que o navegador suporta
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
          // Mostrar preview do áudio imediatamente
          setRecordedAudio({
            url: audioUrl,
            duration: finalDuration,
            blob: audioBlob,
          });
        } else {
          // Se gravou menos de 1 segundo, descartar
          URL.revokeObjectURL(audioUrl);
        }

        // Stop all tracks
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
      // Parar a gravação - o onstop será chamado automaticamente
      if (mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop();
      }
      setIsRecording(false);
      // Não resetar recordingTime - será usado no preview quando onstop for chamado
    }
  };

  const handleSendAudio = () => {
    if (recordedAudio) {
      // Criar nova URL para a mensagem (não revogar a original ainda)
      const audioUrl = URL.createObjectURL(recordedAudio.blob);
      
      const audioMessage: Message = {
        id: Date.now().toString(),
        content: '',
        isUser: true,
        timestamp: new Date(),
        type: 'audio',
        audioDuration: recordedAudio.duration,
        audioUrl: audioUrl,
        author: {
          name: currentUser.name,
          avatar: currentUser.avatar,
        },
      };
      
      setMessages((prev) => [...prev, audioMessage]);
      
      // Limpar preview
      if (previewAudioRef.current) {
        previewAudioRef.current.pause();
        previewAudioRef.current.src = '';
        previewAudioRef.current = null;
      }
      
      // Revogar URL do preview
      URL.revokeObjectURL(recordedAudio.url);
      
      setRecordedAudio(null);
      setRecordingTime(0);
      recordingTimeRef.current = 0;
      setPreviewCurrentTime(0);
      setIsPlayingPreview(false);
    }
  };

  const handleCancelAudio = () => {
    if (recordedAudio) {
      // Pausar áudio se estiver tocando
      if (previewAudioRef.current) {
        previewAudioRef.current.pause();
        previewAudioRef.current.src = '';
        previewAudioRef.current = null;
      }
      // Limpar URL do blob
      URL.revokeObjectURL(recordedAudio.url);
      setRecordedAudio(null);
      setRecordingTime(0); // Resetar apenas quando cancelar
      recordingTimeRef.current = 0;
      setPreviewCurrentTime(0);
      setIsPlayingPreview(false);
    }
  };

  // Inicializar áudio quando recordedAudio mudar
  useEffect(() => {
    if (recordedAudio) {
      // Limpar áudio anterior se existir
      if (previewAudioRef.current) {
        previewAudioRef.current.pause();
        previewAudioRef.current.src = '';
        previewAudioRef.current = null;
      }

      // Criar novo elemento de áudio
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

      const handleLoadedMetadata = () => {
        // Atualizar duração real do áudio se disponível
        if (audio.duration && audio.duration !== Infinity && !isNaN(audio.duration)) {
          const realDuration = Math.floor(audio.duration);
          if (realDuration > 0 && realDuration !== recordedAudio.duration) {
            setRecordedAudio(prev => prev ? { ...prev, duration: realDuration } : null);
          }
        }
      };

      const handleError = (e: Event) => {
        console.error('Erro ao carregar áudio:', e);
        setIsPlayingPreview(false);
      };

      audio.addEventListener('timeupdate', updateTime);
      audio.addEventListener('ended', handleEnded);
      audio.addEventListener('loadedmetadata', handleLoadedMetadata);
      audio.addEventListener('error', handleError);

      // Carregar metadados
      audio.load();

      return () => {
        audio.removeEventListener('timeupdate', updateTime);
        audio.removeEventListener('ended', handleEnded);
        audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
        audio.removeEventListener('error', handleError);
        audio.pause();
        audio.src = '';
      };
    } else {
      // Limpar áudio quando não há preview
      if (previewAudioRef.current) {
        previewAudioRef.current.pause();
        previewAudioRef.current.src = '';
        previewAudioRef.current = null;
      }
      setPreviewCurrentTime(0);
      setIsPlayingPreview(false);
    }
  }, [recordedAudio]);

  const handlePlayPreview = async () => {
    if (!recordedAudio) return;

    // Garantir que o áudio existe
    if (!previewAudioRef.current) {
      const audio = new Audio(recordedAudio.url);
      previewAudioRef.current = audio;
      
      // Configurar eventos
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
      
      // Carregar antes de tocar
      audio.load();
    }

    const audio = previewAudioRef.current;

    if (isPlayingPreview) {
      // Pausar
      audio.pause();
      setIsPlayingPreview(false);
    } else {
      // Reproduzir
      try {
        await audio.play();
        setIsPlayingPreview(true);
      } catch (error) {
        console.error('Erro ao reproduzir áudio:', error);
        setIsPlayingPreview(false);
        // Tentar carregar novamente
        audio.load();
        try {
          await audio.play();
          setIsPlayingPreview(true);
        } catch (retryError) {
          console.error('Erro ao reproduzir áudio após retry:', retryError);
          alert('Não foi possível reproduzir o áudio. Verifique se o formato é suportado.');
        }
      }
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

  const toggleAudio = (message: Message) => {
    if (!message.audioUrl) return;

    // Se já está tocando esta mensagem, pausar
    if (playingAudio === message.id) {
      setPlayingAudio(null);
    } else {
      // Parar qualquer outro áudio que esteja tocando
      setPlayingAudio(message.id);
    }
  };

  const commonEmojis = ['😀', '😂', '😍', '🔥', '💪', '🎉', '👍', '❤️', '😊', '👏'];

  return (
    <div className="flex flex-col h-[calc(100vh-180px)] bg-[#e5ddd5] dark:bg-[#0b141a] relative pb-safe">
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
                    message.audioUrl ? (
                      <AudioPlayer
                        message={message}
                        isPlaying={playingAudio === message.id}
                        onToggle={() => toggleAudio(message)}
                        formatTime={formatRecordingTime}
                      />
                    ) : (
                      <div className="flex items-center gap-3 min-w-[200px]">
                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[#00a884]/40 flex items-center justify-center">
                          <Play className="w-4 h-4 text-[#00a884] ml-0.5" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-1 h-4">
                            {[...Array(20)].map((_, i) => (
                              <div
                                key={i}
                                className="w-0.5 rounded-full bg-[#00a884]/40 h-2"
                              />
                            ))}
                          </div>
                          <div className="flex items-center gap-2 mt-1 text-[11px] text-[#667781] dark:text-[#8696a0]">
                            <span>0:00</span>
                            <span>/</span>
                            <span>{formatRecordingTime(message.audioDuration || 0)}</span>
                          </div>
                        </div>
                      </div>
                    )
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
            Parar
          </button>
        </div>
      )}

      {/* Audio Preview - Estilo WhatsApp - Acima da barra de input */}
      {recordedAudio && !isRecording && (
        <div className="px-2 pb-2 bg-[#f0f2f5] dark:bg-[#202c33] border-t border-border/50 relative z-20">
          <div className="bg-[#d9fdd3] dark:bg-[#005c4b] rounded-lg p-3 shadow-lg">
            <div className="flex items-center gap-3">
              {/* Play/Pause button */}
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

              {/* Waveform and duration */}
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

              {/* Action buttons */}
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
      <div className="p-2 pb-20 bg-[#f0f2f5] dark:bg-[#202c33] border-t border-border/50 relative z-10 safe-area-bottom">
        <div className="flex items-end gap-2 w-full">
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
              Solte para parar
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
                className="flex-1 min-w-0 bg-white dark:bg-[#2a3942] rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 text-[#111b21] dark:text-[#e9edef] placeholder:text-[#667781] dark:placeholder:text-[#8696a0]"
              />

              {/* Send Button */}
              <button
                onClick={handleSend}
                disabled={!input.trim() && !selectedImage}
                className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center transition-colors flex-shrink-0",
                  "min-w-[40px]",
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

