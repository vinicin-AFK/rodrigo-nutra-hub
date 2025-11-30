import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Register from "./pages/Register";
import NotFound from "./pages/NotFound";
import DebugSupabase from "./pages/DebugSupabase";
import Status from "./pages/Status";

// ⚠️ CRÍTICO: Importar supabaseClient no início para garantir que os logs de validação apareçam
import '@/lib/supabaseClient';
import { sendInstanceLog } from '@/lib/instanceLogger';
import { useEffect } from 'react';

const queryClient = new QueryClient();

const App = () => {
  // Enviar log de instância após app carregar (não crítico)
  useEffect(() => {
    sendInstanceLog().catch(err => console.warn('Erro ao enviar log de instância:', err));
  }, []);

  return (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <Index />
                  </ProtectedRoute>
                }
              />
              <Route path="/debug/supabase" element={<DebugSupabase />} />
              <Route path="/status" element={<Status />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  </ErrorBoundary>
  );
};

export default App;
