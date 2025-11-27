import { useState, useRef, useEffect } from 'react';
import { Camera, Send, X, ImagePlus, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface CreatePostModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPost: (content: string, resultValue?: number, image?: string) => Promise<void>;
}

export function CreatePostModal({ isOpen, onClose, onPost }: CreatePostModalProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [content, setContent] = useState('');
  const [isResult, setIsResult] = useState(false);
  const [resultValue, setResultValue] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Resetar quando o modal fechar
  useEffect(() => {
    if (!isOpen) {
      setContent('');
      setResultValue('');
      setIsResult(false);
      setSelectedImage(null);
    }
  }, [isOpen]);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validar tamanho (máximo 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: 'Imagem muito grande',
          description: 'A imagem deve ter no máximo 5MB.',
          variant: 'destructive',
        });
        return;
      }

      // Validar tipo
      if (!file.type.startsWith('image/')) {
        toast({
          title: 'Tipo de arquivo inválido',
          description: 'Por favor, selecione uma imagem.',
          variant: 'destructive',
        });
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        setSelectedImage(event.target?.result as string);
      };
      reader.onerror = () => {
        toast({
          title: 'Erro ao carregar imagem',
          description: 'Não foi possível carregar a imagem. Tente novamente.',
          variant: 'destructive',
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setSelectedImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async () => {
    if (!content.trim() && !selectedImage) {
      toast({
        title: 'Conteúdo necessário',
        description: 'Adicione um texto ou uma imagem para publicar.',
        variant: 'destructive',
      });
      return;
    }

    if (isResult && !resultValue.trim()) {
      toast({
        title: 'Valor necessário',
        description: 'Informe o valor do resultado.',
        variant: 'destructive',
      });
      return;
    }

    // Salvar valores antes de limpar
    const postContent = content.trim();
    const postResultValue = isResult ? Number(resultValue) : undefined;
    const postImage = selectedImage || undefined;

    // Limpar campos primeiro
    setContent('');
    setResultValue('');
    setIsResult(false);
    setSelectedImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }

    // Fechar o modal
    onClose();

    // Chamar onPost - agora é async, então podemos aguardar
    try {
      // Usar setTimeout para garantir que o modal fechou antes de processar
      await new Promise(resolve => setTimeout(resolve, 100));
      await onPost(postContent, postResultValue, postImage);
    } catch (error) {
      console.error('Erro ao chamar onPost:', error);
      // O erro já será tratado no handleNewPost
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-background/80 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative w-full max-w-lg glass-card rounded-t-3xl sm:rounded-3xl p-6 animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-foreground">Nova Publicação</h3>
          <button onClick={onClose} className="p-2 hover:bg-secondary rounded-full transition-colors">
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        {/* User Info */}
        {user && (
          <div className="flex items-center gap-3 mb-4 pb-4 border-b border-border">
            <img
              src={user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=random`}
              alt={user.name}
              className="w-10 h-10 rounded-full object-cover ring-2 ring-primary/30"
            />
            <div>
              <p className="font-semibold text-sm text-foreground">{user.name}</p>
              <p className="text-xs text-muted-foreground">{user.level || 'Iniciante'}</p>
            </div>
          </div>
        )}

        {/* Content */}
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Compartilhe seus resultados, dúvidas ou dicas com a comunidade..."
          className="w-full h-32 bg-secondary rounded-xl p-4 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/50 text-foreground placeholder:text-muted-foreground"
        />

        {/* Image Preview */}
        {selectedImage && (
          <div className="mt-4 relative animate-fade-in">
            <div className="relative rounded-xl overflow-hidden border-2 border-primary/30">
              <img
                src={selectedImage}
                alt="Preview"
                className="w-full max-h-64 object-cover"
              />
              <button
                onClick={handleRemoveImage}
                className="absolute top-2 right-2 w-8 h-8 bg-black/70 hover:bg-black/90 rounded-full flex items-center justify-center transition-colors"
              >
                <XCircle className="w-5 h-5 text-white" />
              </button>
            </div>
          </div>
        )}

        {/* Result Toggle */}
        <div className="flex items-center gap-3 mt-4">
          <button
            onClick={() => setIsResult(!isResult)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
              isResult
                ? 'bg-primary text-primary-foreground'
                : 'bg-secondary text-muted-foreground'
            }`}
          >
            🔥 É um resultado
          </button>
        </div>

        {/* Result Value */}
        {isResult && (
          <div className="mt-4 animate-fade-in">
            <label className="block text-sm font-medium text-foreground mb-2">
              Valor do resultado (R$)
            </label>
            <input
              type="number"
              value={resultValue}
              onChange={(e) => setResultValue(e.target.value)}
              placeholder="Ex: 5000"
              className="w-full bg-secondary rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between mt-6">
          <div className="flex gap-2">
            <button
              onClick={() => fileInputRef.current?.click()}
              className={cn(
                "p-3 rounded-xl transition-colors",
                selectedImage
                  ? "bg-primary/20 text-primary"
                  : "bg-secondary text-muted-foreground hover:text-foreground"
              )}
              title="Adicionar imagem"
            >
              <ImagePlus className="w-5 h-5" />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageSelect}
              className="hidden"
            />
          </div>

          <Button
            onClick={handleSubmit}
            disabled={!content.trim() && !selectedImage}
            variant="fire"
            className="gap-2"
          >
            <Send className="w-4 h-4" />
            Publicar
          </Button>
        </div>
      </div>
    </div>
  );
}
