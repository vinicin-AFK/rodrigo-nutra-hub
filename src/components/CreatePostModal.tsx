import { useState } from 'react';
import { Camera, Send, X, ImagePlus } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface CreatePostModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPost: (content: string, resultValue?: number) => void;
}

export function CreatePostModal({ isOpen, onClose, onPost }: CreatePostModalProps) {
  const [content, setContent] = useState('');
  const [isResult, setIsResult] = useState(false);
  const [resultValue, setResultValue] = useState('');

  if (!isOpen) return null;

  const handleSubmit = () => {
    if (!content.trim()) return;
    onPost(content, isResult ? Number(resultValue) : undefined);
    setContent('');
    setResultValue('');
    setIsResult(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-background/80 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative w-full max-w-lg glass-card rounded-t-3xl sm:rounded-3xl p-6 animate-slide-up">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-foreground">Nova Publicação</h3>
          <button onClick={onClose} className="p-2 hover:bg-secondary rounded-full transition-colors">
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        {/* Content */}
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Compartilhe seus resultados, dúvidas ou dicas com a comunidade..."
          className="w-full h-32 bg-secondary rounded-xl p-4 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/50"
        />

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
            <button className="p-3 bg-secondary rounded-xl text-muted-foreground hover:text-foreground transition-colors">
              <Camera className="w-5 h-5" />
            </button>
            <button className="p-3 bg-secondary rounded-xl text-muted-foreground hover:text-foreground transition-colors">
              <ImagePlus className="w-5 h-5" />
            </button>
          </div>

          <Button
            onClick={handleSubmit}
            disabled={!content.trim()}
            variant="fire"
          >
            <Send className="w-4 h-4" />
            Publicar
          </Button>
        </div>
      </div>
    </div>
  );
}
