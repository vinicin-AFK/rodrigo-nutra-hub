import { useState, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Camera, Crown, TrendingUp, Award, Sparkles } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const PLANS = [
  { id: 'bronze', name: 'Bronze', minPoints: 0, color: 'text-amber-600', icon: '🥉' },
  { id: 'silver', name: 'Prata', minPoints: 100, color: 'text-gray-400', icon: '🥈' },
  { id: 'gold', name: 'Ouro', minPoints: 500, color: 'text-yellow-500', icon: '🥇' },
  { id: 'platinum', name: 'Platina', minPoints: 1000, color: 'text-cyan-400', icon: '💎' },
  { id: 'diamond', name: 'Diamante', minPoints: 5000, color: 'text-blue-500', icon: '💠' },
];

export function ProfileModal({ isOpen, onClose }: ProfileModalProps) {
  const { user, updateProfile, userPoints, userPlan, nextPlan } = useAuth();
  const [name, setName] = useState(user?.name || '');
  const [avatar, setAvatar] = useState(user?.avatar || '');
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setAvatar(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    if (!name.trim()) {
      toast({
        title: 'Nome obrigatório',
        description: 'Por favor, informe seu nome.',
        variant: 'destructive',
      });
      return;
    }

    setIsSaving(true);
    try {
      await updateProfile({ name: name.trim(), avatar });
      toast({
        title: 'Perfil atualizado!',
        description: 'Suas informações foram salvas com sucesso.',
      });
      onClose();
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível atualizar o perfil. Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const pointsToNextPlan = nextPlan ? nextPlan.minPoints - userPoints : 0;
  const progressPercentage = nextPlan 
    ? Math.min(100, (userPoints / nextPlan.minPoints) * 100)
    : 100;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Meu Perfil</DialogTitle>
          <DialogDescription>
            Gerencie suas informações pessoais e acompanhe seu progresso
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Avatar Section */}
          <div className="flex flex-col items-center space-y-4">
            <div className="relative">
              <img
                src={avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random`}
                alt={name}
                className="w-24 h-24 rounded-full object-cover ring-4 ring-primary"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-primary flex items-center justify-center hover:bg-primary/90 transition-colors"
              >
                <Camera className="w-4 h-4 text-white" />
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageSelect}
                className="hidden"
              />
            </div>
          </div>

          {/* Name Input */}
          <div className="space-y-2">
            <Label htmlFor="name">Nome</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Seu nome"
            />
          </div>

          {/* Current Plan */}
          <div className="p-4 rounded-lg bg-secondary/50 border border-border">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Crown className="w-5 h-5 text-primary" />
                <span className="font-semibold">Plano Atual</span>
              </div>
              <span className="text-2xl">{userPlan?.icon}</span>
            </div>
            <p className="text-lg font-bold text-primary mb-1">{userPlan?.name}</p>
            <p className="text-sm text-muted-foreground">
              {userPoints.toLocaleString()} pontos acumulados
            </p>
          </div>

          {/* Next Plan Progress */}
          {nextPlan && (
            <div className="p-4 rounded-lg bg-gradient-to-r from-primary/10 to-accent/10 border border-primary/20">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-primary" />
                  <span className="font-semibold">Próximo Plano</span>
                </div>
                <span className="text-2xl">{nextPlan.icon}</span>
              </div>
              <p className="text-lg font-bold mb-2">{nextPlan.name}</p>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Progresso</span>
                  <span className="font-semibold">{pointsToNextPlan} pontos restantes</span>
                </div>
                <div className="w-full bg-secondary rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-primary to-accent h-2 rounded-full transition-all duration-300"
                    style={{ width: `${progressPercentage}%` }}
                  />
                </div>
              </div>

              <div className="mt-3 p-3 rounded-lg bg-primary/5 border border-primary/20">
                <div className="flex items-center gap-2 text-sm">
                  <Sparkles className="w-4 h-4 text-primary" />
                  <span className="text-muted-foreground">
                    Continue postando e curtindo para evoluir!
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Stats */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-lg bg-secondary/50 text-center">
              <Award className="w-5 h-5 text-primary mx-auto mb-1" />
              <p className="text-lg font-bold">{userPoints.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">Pontos</p>
            </div>
            <div className="p-3 rounded-lg bg-secondary/50 text-center">
              <TrendingUp className="w-5 h-5 text-accent mx-auto mb-1" />
              <p className="text-lg font-bold">#{userPlan?.name}</p>
              <p className="text-xs text-muted-foreground">Nível</p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={isSaving} className="flex-1">
              {isSaving ? 'Salvando...' : 'Salvar Alterações'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

