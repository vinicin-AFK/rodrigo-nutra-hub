import { useState } from 'react';
import { Sparkles, Copy, RefreshCw, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function AICopyGenerator() {
  const [product, setProduct] = useState('');
  const [audience, setAudience] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedCopy, setGeneratedCopy] = useState<{
    title: string;
    subtitle: string;
    description: string;
  } | null>(null);
  const [copied, setCopied] = useState('');

  const generateCopy = () => {
    if (!product.trim()) return;
    
    setIsGenerating(true);
    
    // Simulate AI generation
    setTimeout(() => {
      setGeneratedCopy({
        title: `🔥 ${product.toUpperCase()}: O Segredo Que as Farmácias Não Querem Que Você Saiba`,
        subtitle: `Descubra como ${audience || 'milhares de pessoas'} estão transformando suas vidas com ${product}`,
        description: `Você já tentou de tudo e nada funcionou? 😔

Eu sei exatamente como você se sente. Por anos, eu também lutei contra ${product.toLowerCase().includes('emagre') ? 'o peso extra' : 'esse problema'}...

Até que descobri o ${product}! ✨

Em apenas 30 dias, você vai:
✅ Sentir mais energia e disposição
✅ Ver resultados reais no espelho
✅ Recuperar sua autoconfiança

⚠️ ATENÇÃO: Estoque LIMITADO!

Aproveite agora o desconto exclusivo de 50% OFF + Frete Grátis! 

👇 CLIQUE NO BOTÃO ABAIXO 👇`,
      });
      setIsGenerating(false);
    }, 2000);
  };

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopied(field);
    setTimeout(() => setCopied(''), 2000);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/20 text-primary mb-4">
          <Sparkles className="w-5 h-5" />
          <span className="font-semibold">IA de Copy</span>
        </div>
        <h2 className="text-2xl font-bold text-foreground mb-2">Gerador de Copy Inteligente</h2>
        <p className="text-muted-foreground">Crie copies persuasivas para seus anúncios em segundos</p>
      </div>

      {/* Form */}
      <div className="glass-card rounded-2xl p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Nome do Produto *
          </label>
          <input
            type="text"
            value={product}
            onChange={(e) => setProduct(e.target.value)}
            placeholder="Ex: Cápsula Detox Pro"
            className="w-full bg-secondary rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Público-alvo (opcional)
          </label>
          <input
            type="text"
            value={audience}
            onChange={(e) => setAudience(e.target.value)}
            placeholder="Ex: Mulheres 30-50 anos"
            className="w-full bg-secondary rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>

        <Button
          onClick={generateCopy}
          disabled={!product.trim() || isGenerating}
          variant="fire"
          className="w-full"
          size="lg"
        >
          {isGenerating ? (
            <>
              <RefreshCw className="w-5 h-5 animate-spin" />
              Gerando Copy...
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5" />
              Gerar Copy Completa
            </>
          )}
        </Button>
      </div>

      {/* Generated Copy */}
      {generatedCopy && (
        <div className="space-y-4 animate-slide-up">
          {/* Title */}
          <div className="glass-card rounded-2xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-primary">Título</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => copyToClipboard(generatedCopy.title, 'title')}
              >
                {copied === 'title' ? (
                  <CheckCircle className="w-4 h-4 text-green-500" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </Button>
            </div>
            <p className="text-foreground font-semibold">{generatedCopy.title}</p>
          </div>

          {/* Subtitle */}
          <div className="glass-card rounded-2xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-primary">Subtítulo</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => copyToClipboard(generatedCopy.subtitle, 'subtitle')}
              >
                {copied === 'subtitle' ? (
                  <CheckCircle className="w-4 h-4 text-green-500" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </Button>
            </div>
            <p className="text-foreground">{generatedCopy.subtitle}</p>
          </div>

          {/* Description */}
          <div className="glass-card rounded-2xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-primary">Descrição</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => copyToClipboard(generatedCopy.description, 'description')}
              >
                {copied === 'description' ? (
                  <CheckCircle className="w-4 h-4 text-green-500" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </Button>
            </div>
            <p className="text-foreground whitespace-pre-line text-sm">{generatedCopy.description}</p>
          </div>
        </div>
      )}
    </div>
  );
}
