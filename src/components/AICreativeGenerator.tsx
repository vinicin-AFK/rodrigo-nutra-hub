import { useState } from 'react';
import { Zap, Copy, RefreshCw, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function AICreativeGenerator() {
  const [product, setProduct] = useState('');
  const [platform, setPlatform] = useState('instagram');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedCreative, setGeneratedCreative] = useState<{
    hook: string;
    retainLead: string;
    middle: string;
    cta: string;
  } | null>(null);
  const [copied, setCopied] = useState('');

  const generateCreative = () => {
    if (!product.trim()) return;
    
    setIsGenerating(true);
    
    // Simulate AI generation
    setTimeout(() => {
      setGeneratedCreative({
        hook: `[PAUSA O VÍDEO] 🛑

Você sabia que 9 em cada 10 pessoas cometem esse ERRO grave ao tentar ${product.toLowerCase().includes('emagre') ? 'emagrecer' : 'melhorar a saúde'}?

E o pior: as farmácias LUCRAM com isso! 💰`,
        retainLead: `Eu sei que você já tentou de tudo:
❌ Dietas malucas
❌ Exercícios exaustivos
❌ Remédios caros

E nada funcionou de verdade, certo?

Isso acontece porque você ainda não conhecia o ${product}...`,
        middle: `O ${product} foi desenvolvido com uma fórmula exclusiva que:

🔬 Age diretamente na causa do problema
⚡ Resultados visíveis em 15 dias
🌿 100% natural, sem efeitos colaterais
✅ Aprovado pela ANVISA

Milhares de pessoas já transformaram suas vidas! 

[MOSTRAR DEPOIMENTOS]`,
        cta: `🎁 OFERTA ESPECIAL por tempo LIMITADO!

De R$ 297 por apenas R$ 147
+ FRETE GRÁTIS para todo Brasil!
+ BÔNUS: E-book exclusivo

⚠️ Restam apenas 23 unidades!

👇 TOQUE NO LINK DA BIO AGORA 👇

[Garantia de 30 dias ou seu dinheiro de volta]`,
      });
      setIsGenerating(false);
    }, 2000);
  };

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopied(field);
    setTimeout(() => setCopied(''), 2000);
  };

  const copyAll = () => {
    if (!generatedCreative) return;
    const fullScript = `GANCHO:\n${generatedCreative.hook}\n\nPRENDER LEAD:\n${generatedCreative.retainLead}\n\nMEIO (GERAR VALOR):\n${generatedCreative.middle}\n\nCHAMADA PARA AÇÃO:\n${generatedCreative.cta}`;
    navigator.clipboard.writeText(fullScript);
    setCopied('all');
    setTimeout(() => setCopied(''), 2000);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/20 text-accent mb-4">
          <Zap className="w-5 h-5" />
          <span className="font-semibold">IA de Criativo</span>
        </div>
        <h2 className="text-2xl font-bold text-foreground mb-2">Gerador de Scripts de Vídeo</h2>
        <p className="text-muted-foreground">Crie roteiros completos para seus criativos</p>
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
            className="w-full bg-secondary rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-accent/50"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Plataforma
          </label>
          <div className="grid grid-cols-3 gap-2">
            {['instagram', 'facebook', 'tiktok'].map((p) => (
              <button
                key={p}
                onClick={() => setPlatform(p)}
                className={`py-2 px-4 rounded-xl text-sm font-medium transition-all ${
                  platform === p
                    ? 'bg-accent text-accent-foreground'
                    : 'bg-secondary text-muted-foreground hover:text-foreground'
                }`}
              >
                {p.charAt(0).toUpperCase() + p.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <Button
          onClick={generateCreative}
          disabled={!product.trim() || isGenerating}
          variant="gold"
          className="w-full"
          size="lg"
        >
          {isGenerating ? (
            <>
              <RefreshCw className="w-5 h-5 animate-spin" />
              Gerando Criativo...
            </>
          ) : (
            <>
              <Zap className="w-5 h-5" />
              Gerar Script Completo
            </>
          )}
        </Button>
      </div>

      {/* Generated Creative */}
      {generatedCreative && (
        <div className="space-y-4 animate-slide-up">
          {/* Copy All Button */}
          <Button
            onClick={copyAll}
            variant="outline"
            className="w-full"
          >
            {copied === 'all' ? (
              <>
                <CheckCircle className="w-4 h-4 text-green-500" />
                Copiado!
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                Copiar Script Completo
              </>
            )}
          </Button>

          {/* Hook */}
          <div className="glass-card rounded-2xl p-4 border-l-4 border-red-500">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-red-500">🎣 GANCHO</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => copyToClipboard(generatedCreative.hook, 'hook')}
              >
                {copied === 'hook' ? (
                  <CheckCircle className="w-4 h-4 text-green-500" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </Button>
            </div>
            <p className="text-foreground whitespace-pre-line text-sm">{generatedCreative.hook}</p>
          </div>

          {/* Retain Lead */}
          <div className="glass-card rounded-2xl p-4 border-l-4 border-yellow-500">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-yellow-500">🔒 PRENDER LEAD</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => copyToClipboard(generatedCreative.retainLead, 'retainLead')}
              >
                {copied === 'retainLead' ? (
                  <CheckCircle className="w-4 h-4 text-green-500" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </Button>
            </div>
            <p className="text-foreground whitespace-pre-line text-sm">{generatedCreative.retainLead}</p>
          </div>

          {/* Middle */}
          <div className="glass-card rounded-2xl p-4 border-l-4 border-blue-500">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-blue-500">💎 GERAR VALOR</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => copyToClipboard(generatedCreative.middle, 'middle')}
              >
                {copied === 'middle' ? (
                  <CheckCircle className="w-4 h-4 text-green-500" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </Button>
            </div>
            <p className="text-foreground whitespace-pre-line text-sm">{generatedCreative.middle}</p>
          </div>

          {/* CTA */}
          <div className="glass-card rounded-2xl p-4 border-l-4 border-green-500">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-green-500">🚀 CHAMADA PARA AÇÃO</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => copyToClipboard(generatedCreative.cta, 'cta')}
              >
                {copied === 'cta' ? (
                  <CheckCircle className="w-4 h-4 text-green-500" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </Button>
            </div>
            <p className="text-foreground whitespace-pre-line text-sm">{generatedCreative.cta}</p>
          </div>
        </div>
      )}
    </div>
  );
}
