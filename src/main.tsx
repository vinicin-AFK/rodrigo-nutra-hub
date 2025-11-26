import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error("Root element not found. Make sure there's a <div id='root'></div> in your HTML.");
}

// Adicionar estilos inline como fallback
rootElement.style.minHeight = "100vh";
rootElement.style.backgroundColor = "hsl(220, 20%, 8%)";

try {
  createRoot(rootElement).render(<App />);
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
