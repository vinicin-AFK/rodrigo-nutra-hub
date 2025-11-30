import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// ⚠️ CRÍTICO: Importar supabaseClient no início para garantir que os logs de validação apareçam
// Isso garante que a validação do Supabase seja executada antes de qualquer outro código
import '@/lib/supabaseClient';
import { envValidation } from '@/lib/supabaseClient';
import EnvErrorScreen from '@/components/EnvErrorScreen';

const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error("Root element not found. Make sure there's a <div id='root'></div> in your HTML.");
}

// Adicionar estilos inline como fallback
rootElement.style.minHeight = "100vh";
rootElement.style.backgroundColor = "hsl(220, 20%, 8%)";

try {
  // ⚠️ BLOQUEAR APP SE SUPABASE ESTIVER CONFIGURADO INCORRETAMENTE
  if (envValidation.hasError) {
    console.error('🚫 APP BLOQUEADO: Configuração do Supabase incorreta');
    createRoot(rootElement).render(<EnvErrorScreen error={envValidation} />);
  } else {
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
