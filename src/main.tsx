// ⚠️ LOGS IMEDIATOS - Antes de qualquer import
console.log('🚀 [MAIN.TSX] Iniciando aplicação...');
console.log('🚀 [MAIN.TSX] import.meta.env:', import.meta.env);
console.log('🚀 [MAIN.TSX] VITE_SUPABASE_URL:', import.meta.env.VITE_SUPABASE_URL || '❌ NÃO CONFIGURADO');
console.log('🚀 [MAIN.TSX] VITE_SUPABASE_ANON_KEY:', import.meta.env.VITE_SUPABASE_ANON_KEY ? import.meta.env.VITE_SUPABASE_ANON_KEY.slice(0, 10) + '...' : '❌ NÃO CONFIGURADO');

import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// ⚠️ CRÍTICO: Importar supabaseClient no início para garantir que os logs de validação apareçam
// Isso garante que a validação do Supabase seja executada antes de qualquer outro código
console.log('🚀 [MAIN.TSX] Importando supabaseClient...');
import '@/lib/supabaseClient';
import { envValidation, getSupabaseDebugInfo } from '@/lib/supabaseClient';
import EnvErrorScreen from '@/components/EnvErrorScreen';
console.log('🚀 [MAIN.TSX] supabaseClient importado');

const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error("Root element not found. Make sure there's a <div id='root'></div> in your HTML.");
}

// Adicionar estilos inline como fallback
rootElement.style.minHeight = "100vh";
rootElement.style.backgroundColor = "hsl(220, 20%, 8%)";

console.log('🚀 [MAIN.TSX] Verificando validação...');
console.log('🚀 [MAIN.TSX] envValidation:', envValidation);
console.log('🚀 [MAIN.TSX] envValidation.hasError:', envValidation.hasError);

try {
  // ⚠️ BLOQUEAR APP SE SUPABASE ESTIVER CONFIGURADO INCORRETAMENTE
  if (envValidation.hasError) {
    console.error('🚫 APP BLOQUEADO: Configuração do Supabase incorreta');
    console.error('🚫 Tipo de erro:', envValidation.type);
    console.error('🚫 Mensagem:', envValidation.message);
    const debugInfo = getSupabaseDebugInfo();
    console.log('🚫 Debug info:', debugInfo);
    createRoot(rootElement).render(
      <EnvErrorScreen 
        expectedUrl={debugInfo.expectedUrl} 
        keyPrefix={debugInfo.keyPrefix}
        onRetry={() => window.location.reload()}
      />
    );
  } else {
    console.log('✅ [MAIN.TSX] Validação OK, renderizando App...');
    createRoot(rootElement).render(<App />);
  }
} catch (error) {
  console.error("Error rendering app:", error);
  rootElement.innerHTML = `
    <div style="color: white; padding: 20px; text-align: center;">
      <h1>Erro ao carregar aplicação</h1>
      <p>${error instanceof Error ? error.message : "Erro desconhecido"}</p>
      <button onclick="window.location.reload()">Recarregar</button>
    </div>
  `;
}
