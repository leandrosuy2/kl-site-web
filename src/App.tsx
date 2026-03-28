import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { TokenRefreshManager } from "@/components/TokenRefreshManager";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import Frota from "./pages/Frota";
import FrotaDetalhes from "./pages/FrotaDetalhes";
import Painel from "./pages/Painel";
import Cadastro from "./pages/Cadastro";
import CadastroPF from "./pages/CadastroPF";
import CadastroPJ from "./pages/CadastroPJ";
import NotFound from "./pages/NotFound";
import { RedirectAfterLogin } from "@/components/RedirectAfterLogin";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <TokenRefreshManager />
      <BrowserRouter>
        <RedirectAfterLogin />
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/frota" element={<Frota />} />
          <Route path="/frota/:id" element={<FrotaDetalhes />} />
          <Route path="/cadastro" element={<Cadastro />} />
          <Route path="/cadastro/pf" element={<CadastroPF />} />
          <Route path="/cadastro/pj" element={<CadastroPJ />} />
          <Route path="/painel" element={<Navigate to="/painel/dashboard" replace />} />
          <Route
            path="/painel/:section"
            element={
              <ProtectedRoute>
                <Painel />
              </ProtectedRoute>
            }
          />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
