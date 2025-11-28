import { useState, useRef, useEffect } from 'react';
import { Send, Image as ImageIcon, Mic, Smile, Play, Pause, X, Trash2, Shield } from 'lucide-react';
import { Message } from '@/types';
import { cn } from '@/lib/utils';
import { useCommunityMessages } from '@/hooks/useCommunityMessages';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { currentUser as fallbackUser, users } from '@/data/mockData';

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
  const { messages, isLoading: messagesLoading, sendMessage, deleteMessage } = useCommunityMessages();
  const { user } = useAuth();
  const { toast } = useToast();
  const isSupport = user?.role === 'support' || user?.role === 'admin';
  
  const currentUser = user ? {
    ...fallbackUser,
    id: user.id, // Garantir que o ID está presente
    name: user.name,
    email: user.email,
    avatar: user.avatar || fallbackUser.avatar,
    level: user.level || fallbackUser.level,
  } : fallbackUser;

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

  const formatDate = (date: Date) => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    const messageDate = new Date(date);
    messageDate.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);
    yesterday.setHours(0, 0, 0, 0);
    
    if (messageDate.getTime() === today.getTime()) {
      return 'Hoje';
    } else if (messageDate.getTime() === yesterday.getTime()) {
      return 'Ontem';
    } else {
      return messageDate.toLocaleDateString('pt-BR', { 
        day: 'numeric', 
        month: 'long',
        year: messageDate.getFullYear() !== today.getFullYear() ? 'numeric' : undefined
      });
    }
  };

  // Agrupar mensagens consecutivas do mesmo autor
  const groupMessages = (messages: Message[]) => {
    if (messages.length === 0) return [];
    
    const grouped: Array<{
      messages: Message[];
      author: Message['author'];
      isCurrentUser: boolean;
      date: Date;
    }> = [];
    
    let currentGroup: {
      messages: Message[];
      author: Message['author'];
      isCurrentUser: boolean;
      date: Date;
    } | null = null;
    
    let lastDate: string | null = null;
    
    messages.forEach((message, index) => {
      const messageDate = new Date(message.timestamp);
      const dateKey = messageDate.toDateString();
      // Recalcular isCurrentUser comparando ID do autor com ID do usuário atual
      const authorId = message.author?.id || null;
      const isCurrentUser = authorId && currentUser.id ? authorId === currentUser.id : message.isUser;
      
      // Verificar se precisa de separador de data
      if (dateKey !== lastDate) {
        lastDate = dateKey;
      }
      
      // Verificar se é uma nova mensagem do mesmo autor (dentro de 5 minutos)
      const prevMessage = index > 0 ? messages[index - 1] : null;
      const timeDiff = prevMessage 
        ? Math.abs(message.timestamp.getTime() - prevMessage.timestamp.getTime()) / 1000 / 60
        : Infinity;
      
      // Recalcular isCurrentUser do prevMessage também
      const prevAuthorId = prevMessage?.author?.id || null;
      const prevIsCurrentUser = prevAuthorId && currentUser.id ? prevAuthorId === currentUser.id : prevMessage?.isUser || false;
      
      const sameAuthor = prevMessage && 
        ((isCurrentUser && prevIsCurrentUser) || 
         (!isCurrentUser && !prevIsCurrentUser && 
          (message.author?.id || message.author?.name) === (prevMessage.author?.id || prevMessage.author?.name)));
      
      if (currentGroup && sameAuthor && timeDiff < 5) {
        // Adicionar à mensagem atual
        currentGroup.messages.push(message);
      } else {
        // Nova mensagem ou novo autor
        if (currentGroup) {
          grouped.push(currentGroup);
        }
        currentGroup = {
          messages: [message],
          author: message.author || { name: currentUser.name, avatar: currentUser.avatar },
          isCurrentUser,
          date: messageDate,
        };
      }
    });
    
    if (currentGroup) {
      grouped.push(currentGroup);
    }
    
    return grouped;
  };

  const formatRecordingTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };


  const handleSend = async () => {
    if (!input.trim() && !selectedImage) return;

    // Limpar campos imediatamente para feedback visual
    const messageContent = input || (selectedImage ? '📷' : '');
    const messageType = selectedImage ? 'image' : input.length <= 2 && /[\u{1F300}-\u{1F9FF}]/u.test(input) ? 'emoji' : 'text';
    const imageToSend = selectedImage || undefined;
    
    // Limpar campos antes de enviar (feedback imediato)
    setInput('');
    setSelectedImage(null);

    try {
      console.log('💬 handleSend chamado', { messageContent: messageContent.substring(0, 50), messageType, hasImage: !!imageToSend });
      
      // Enviar mensagem (sempre salva localmente primeiro)
      await sendMessage(
        messageContent,
        messageType,
        imageToSend
      );
      
      console.log('✅ Mensagem enviada com sucesso');
    } catch (error: any) {
      console.error('❌ Erro ao enviar mensagem:', error);
      
      // Restaurar campos se houver erro crítico
      // (mas normalmente a mensagem já foi salva localmente)
      if (error?.message?.includes('crítico') || error?.message?.includes('não foi possível salvar')) {
        setInput(messageContent);
        setSelectedImage(imageToSend || null);
        toast({
          title: "Erro ao enviar mensagem",
          description: error?.message || "Não foi possível enviar a mensagem. Tente novamente.",
          variant: 'destructive',
        });
      } else {
        // Erro não crítico (já foi salvo localmente)
        console.log('⚠️ Erro não crítico na sincronização, mensagem já salva localmente');
      }
    }
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

  const handleSendAudio = async () => {
    if (recordedAudio) {
      try {
        console.log('🎤 Enviando áudio...', { duration: recordedAudio.duration });
        // Converter blob para base64 para salvar
        // Em produção, seria melhor fazer upload para Supabase Storage
        const reader = new FileReader();
        reader.onloadend = async () => {
          try {
            const base64Audio = reader.result as string;
            
            await sendMessage(
              '',
              'audio',
              undefined,
              base64Audio, // Salvar como base64 temporariamente
              recordedAudio.duration
            );
            
            console.log('✅ Áudio enviado com sucesso');
            
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
          } catch (error: any) {
            console.error('❌ Erro ao enviar áudio:', error);
            toast({
              title: "Erro ao enviar áudio",
              description: error?.message || "Não foi possível enviar o áudio. Tente novamente.",
              variant: 'destructive',
            });
          }
        };
        reader.onerror = () => {
          console.error('❌ Erro ao ler arquivo de áudio');
          toast({
            title: "Erro ao processar áudio",
            description: "Não foi possível processar o áudio. Tente novamente.",
            variant: 'destructive',
          });
        };
        reader.readAsDataURL(recordedAudio.blob);
      } catch (error: any) {
        console.error('❌ Erro ao enviar áudio:', error);
        toast({
          title: "Erro ao enviar áudio",
          description: error?.message || "Não foi possível enviar o áudio. Tente novamente.",
          variant: 'destructive',
        });
      }
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
    <div className="flex flex-col bg-[#e5ddd5] dark:bg-[#0b141a] relative" style={{ 
      height: 'calc(100vh - 64px)',
      minHeight: 'calc(100vh - 64px)',
      maxHeight: 'calc(100vh - 64px)',
      touchAction: 'pan-y',
      paddingBottom: '0'
    }}>
      {/* Background pattern */}
      <div 
        className="absolute inset-0 opacity-5 pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' xmlns='http://www.w3.org/2000/svg'%3E%3Cdefs%3E%3Cpattern id='grid' width='100' height='100' patternUnits='userSpaceOnUse'%3E%3Cpath d='M 100 0 L 0 0 0 100' fill='none' stroke='%23000' stroke-width='1'/%3E%3C/pattern%3E%3C/defs%3E%3Crect width='100' height='100' fill='url(%23grid)' /%3E%3C/svg%3E")`,
        }}
      />

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-2 relative z-10" style={{ 
        WebkitOverflowScrolling: 'touch',
        overscrollBehavior: 'contain',
        paddingBottom: '80px' // Espaço para a barra de input
      }}>
        {messagesLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-[#00a884] border-r-transparent"></div>
              <p className="mt-4 text-[#667781] dark:text-[#8696a0]">Carregando mensagens...</p>
            </div>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center text-[#667781] dark:text-[#8696a0]">
              <p className="text-lg font-medium mb-2">Nenhuma mensagem ainda</p>
              <p className="text-sm">Seja o primeiro a enviar uma mensagem!</p>
            </div>
          </div>
        ) : (
          <>
            {(() => {
              const grouped = groupMessages(messages);
              let lastDateKey: string | null = null;
              
              return grouped.map((group, groupIndex) => {
                const dateKey = group.date.toDateString();
                const showDateSeparator = dateKey !== lastDateKey;
                lastDateKey = dateKey;
                
                return (
                  <div key={`group-${groupIndex}`}>
                    {/* Date Separator */}
                    {showDateSeparator && (
                      <div className="flex items-center justify-center my-4">
                        <div className="bg-[#ffffff]/80 dark:bg-[#202c33]/80 backdrop-blur-sm px-3 py-1 rounded-full">
                          <span className="text-[12px] text-[#667781] dark:text-[#8696a0] font-medium">
                            {formatDate(group.date)}
                          </span>
                        </div>
                      </div>
                    )}
                    
                    {/* Message Group */}
                    <div className={cn(
                      "flex gap-2 mb-2 animate-fade-in",
                      group.isCurrentUser ? "flex-row-reverse" : "flex-row"
                    )}>
                      {/* Avatar - SEMPRE mostrar para mensagens de outros usuários (estilo grupo WhatsApp) */}
                      {!group.isCurrentUser && (
                        <div className="flex-shrink-0 w-10 h-10">
                          {groupIndex === 0 || grouped[groupIndex - 1]?.isCurrentUser !== group.isCurrentUser || 
                           grouped[groupIndex - 1]?.author?.id !== group.author?.id ||
                           grouped[groupIndex - 1]?.author?.name !== group.author?.name ? (
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white text-sm font-bold overflow-hidden border-2 border-white dark:border-[#202c33] shadow-sm">
                              {group.author?.avatar ? (
                                <img
                                  src={group.author.avatar}
                                  alt={group.author.name}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <span>{group.author?.name?.charAt(0)?.toUpperCase() || 'U'}</span>
                              )}
                            </div>
                          ) : (
                            <div className="w-10" /> // Espaço reservado para alinhamento
                          )}
                        </div>
                      )}

                      {/* Messages in group */}
                      <div className={cn(
                        "flex flex-col max-w-[75%]",
                        group.isCurrentUser ? "items-end" : "items-start"
                      )}>
                        {/* Author name - SEMPRE mostrar para mensagens de outros usuários (estilo grupo WhatsApp) */}
                        {!group.isCurrentUser && (
                          <div className="mb-1 px-1">
                            {(groupIndex === 0 || grouped[groupIndex - 1]?.isCurrentUser !== group.isCurrentUser || 
                              grouped[groupIndex - 1]?.author?.id !== group.author?.id ||
                              grouped[groupIndex - 1]?.author?.name !== group.author?.name) && (
                              <div className="flex items-center gap-2 mb-1">
                                <span className={cn(
                                  "text-[13px] font-semibold",
                                  group.author?.role === 'support' 
                                    ? "text-[#ff6b35] dark:text-[#ff8c5a] font-bold" 
                                    : "text-[#111b21] dark:text-[#e9edef]"
                                )}>
                                  ~ {group.author?.name || 'Usuário'}
                                </span>
                                {group.author?.role && (
                                  <span className={cn(
                                    "text-[10px] px-1.5 py-0.5 rounded-full flex items-center gap-1",
                                    group.author.role === 'support'
                                      ? "bg-[#ff6b35]/30 text-[#ff6b35] border border-[#ff6b35]/50 font-bold"
                                      : "bg-primary/20 text-primary"
                                  )}>
                                    {group.author.role === 'support' && <Shield className="w-3 h-3" />}
                                    {group.author.role === 'support' ? 'SUPORTE' : group.author.role}
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        )}

                        {/* Message bubbles */}
                        <div className="flex flex-col gap-0.5">
                          {group.messages.map((message, msgIndex) => {
                            const isLastInGroup = msgIndex === group.messages.length - 1;
                            
                            return (
                              <div
                                key={message.id}
                                className={cn(
                                  "rounded-lg px-3 py-2 shadow-sm max-w-[75%] relative group/message",
                                  group.isCurrentUser
                                    ? "bg-[#d9fdd3] dark:bg-[#005c4b] text-[#111b21] dark:text-white"
                                    : group.author?.role === 'support'
                                      ? "bg-gradient-to-r from-[#ff6b35]/20 to-[#ff8c5a]/20 dark:from-[#ff6b35]/30 dark:to-[#ff8c5a]/30 border-2 border-[#ff6b35]/50 text-[#111b21] dark:text-[#e9edef]"
                                      : "bg-white dark:bg-[#202c33] text-[#111b21] dark:text-[#e9edef]",
                                  // Bordas arredondadas apenas nas extremidades
                                  group.isCurrentUser
                                    ? isLastInGroup 
                                      ? "rounded-br-none" 
                                      : msgIndex === 0 
                                        ? "rounded-tr-none" 
                                        : "rounded-r-none"
                                    : isLastInGroup 
                                      ? "rounded-bl-none" 
                                      : msgIndex === 0 
                                        ? "rounded-tl-none" 
                                        : "rounded-l-none"
                                )}
                              >
                                {/* Botão de deletar - aparece no hover para suporte */}
                                {isSupport && (
                                  <button
                                    onClick={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      if (confirm('Tem certeza que deseja deletar esta mensagem?')) {
                                        console.log('🗑️ Deletando mensagem:', message.id);
                                        deleteMessage(message.id);
                                        toast({
                                          title: "Mensagem deletada",
                                          description: "A mensagem foi removida da comunidade.",
                                        });
                                      }
                                    }}
                                    className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center opacity-0 group-hover/message:opacity-100 transition-opacity shadow-lg z-10"
                                    title="Deletar mensagem"
                                    type="button"
                                  >
                                    <Trash2 className="w-3.5 h-3.5 text-white" />
                                  </button>
                                )}
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
                                      <p className="text-sm mt-2 break-words" style={{ wordBreak: 'break-word', whiteSpace: 'normal' }}>
                                        {message.content}
                                      </p>
                                    )}
                                  </div>
                                ) : (
                                  <p className="text-sm break-words leading-relaxed" style={{ wordBreak: 'break-word', whiteSpace: 'normal' }}>
                                    {message.content}
                                  </p>
                                )}
                                
                                {/* Timestamp and status - apenas na última mensagem do grupo */}
                                {isLastInGroup && (
                                  <div className={cn(
                                    "flex items-center gap-1 mt-1",
                                    group.isCurrentUser ? "flex-row-reverse" : "flex-row"
                                  )}>
                                    <span className="text-[11px] text-[#667781]/80 dark:text-[#8696a0]/80">
                                      {formatTime(message.timestamp)}
                                    </span>
                                    {group.isCurrentUser && (
                                      <span className="text-[#53bdeb] text-xs">✓✓</span>
                                    )}
                                    {/* Botão de deletar - apenas para suporte (pode deletar qualquer mensagem) */}
                                    {isSupport && (
                                      <button
                                        onClick={(e) => {
                                          e.preventDefault();
                                          e.stopPropagation();
                                          if (confirm('Tem certeza que deseja deletar esta mensagem?')) {
                                            console.log('🗑️ Deletando mensagem:', message.id);
                                            deleteMessage(message.id);
                                            toast({
                                              title: "Mensagem deletada",
                                              description: "A mensagem foi removida da comunidade.",
                                            });
                                          }
                                        }}
                                        className="ml-2 p-1.5 hover:bg-red-500/20 rounded transition-colors flex-shrink-0"
                                        title="Deletar mensagem"
                                        type="button"
                                      >
                                        <Trash2 className="w-4 h-4 text-red-500" />
                                      </button>
                                    )}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              });
            })()}
            
            <div ref={messagesEndRef} />
          </>
        )}
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
        <div className="absolute bottom-20 left-2 z-30 max-w-[100px] sm:max-w-[150px]" style={{ touchAction: 'none' }}>
          <div className="bg-white dark:bg-[#202c33] rounded-lg p-1 shadow-lg border border-gray-200 dark:border-gray-700">
            <div className="relative">
              <img
                src={selectedImage}
                alt="Preview"
                className="w-full max-h-16 sm:max-h-20 object-cover rounded"
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
        <div className="absolute left-0 right-0 bg-white dark:bg-[#202c33] border-t border-border p-4 z-40" style={{ 
          bottom: 'calc(env(safe-area-inset-bottom, 0px) + 80px)',
          touchAction: 'none' 
        }}>
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
      <div
        className="px-3 py-2 bg-[#f0f2f5] dark:bg-[#202c33] border-t border-border/50 sticky bottom-0"
        style={{ 
          paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 64px)',
          marginBottom: '0',
          touchAction: 'none',
          zIndex: 60
        }}
      >
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
                onTouchStart={(e) => {
                  e.preventDefault();
                  handleStartRecording();
                }}
                className="w-10 h-10 rounded-lg bg-white dark:bg-[#2a3942] flex items-center justify-center hover:bg-gray-100 dark:hover:bg-[#323d45] active:bg-gray-200 dark:active:bg-[#3a454d] transition-colors flex-shrink-0 touch-manipulation"
                style={{ touchAction: 'manipulation' }}
              >
                <Mic className="w-5 h-5 text-[#54656f] dark:text-[#8696a0]" />
              </button>
              <button
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                className="w-10 h-10 rounded-lg bg-[#ffd93d] flex items-center justify-center hover:bg-[#ffd93d]/90 active:bg-[#ffd93d]/80 transition-colors flex-shrink-0 touch-manipulation"
                style={{ touchAction: 'manipulation' }}
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
                className="flex-1 min-w-0 bg-white dark:bg-[#2a3942] rounded-lg px-4 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-primary/50 text-[#111b21] dark:text-[#e9edef] placeholder:text-[#667781] dark:placeholder:text-[#8696a0]"
                style={{ fontSize: '16px' }}
              />

              {/* Send Button */}
              <button
                onClick={handleSend}
                disabled={!input.trim() && !selectedImage}
                className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center transition-colors flex-shrink-0",
                  "min-w-[40px] touch-manipulation",
                  input.trim() || selectedImage
                    ? "bg-[#00a884] hover:bg-[#00a884]/90 active:bg-[#00a884]/80"
                    : "bg-gray-300 dark:bg-[#2a3942] cursor-not-allowed"
                )}
                style={{ touchAction: 'manipulation' }}
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

