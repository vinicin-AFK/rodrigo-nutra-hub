import { useState } from 'react';
import { Sparkles, FileText, Wand2, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface AIFabButtonProps {
  onSelectAI: (type: 'ai-copy' | 'ai-creative') => void;
}

export function AIFabButton({ onSelectAI }: AIFabButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="fixed bottom-24 right-4 z-50">
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild>
          <button
            className={cn(
              "w-14 h-14 rounded-full bg-primary hover:bg-primary/90",
              "flex items-center justify-center",
              "shadow-lg hover:shadow-xl",
              "transition-all duration-300",
              "hover:scale-110 active:scale-95",
              "text-white",
              isOpen && "rotate-45"
            )}
            aria-label="Ferramentas de IA"
          >
            {isOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Sparkles className="w-6 h-6" />
            )}
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          side="top"
          className="mb-2 w-56 bg-popover border-border"
        >
          <DropdownMenuItem
            onClick={() => {
              onSelectAI('ai-copy');
              setIsOpen(false);
            }}
            className="cursor-pointer"
          >
            <FileText className="mr-2 h-4 w-4" />
            <span>IA Copy</span>
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => {
              onSelectAI('ai-creative');
              setIsOpen(false);
            }}
            className="cursor-pointer"
          >
            <Wand2 className="mr-2 h-4 w-4" />
            <span>IA Criativo</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

