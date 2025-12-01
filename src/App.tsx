import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/ThemeProvider";
import { ErrorBoundary } from "@/components/ErrorBoundary";

import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import { RealtimeProvider } from "@/contexts/RealtimeProvider";
import { TenantViewProvider } from "@/contexts/TenantViewContext";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Leads from "./pages/Leads";
import Conversations from "./pages/Conversations";
import Pipelines from "./pages/Pipelines";
import Metrics from "./pages/Metrics";
import WhatsApp from "./pages/WhatsApp";
import Journey from "./pages/Journey";
import Inbox from "./pages/Inbox";
import Settings from "./pages/Settings";
import Database from "./pages/Database";
import Admin from "./pages/Admin";
import Supervisor from "./pages/Supervisor";
import ListaGeral from "./pages/ListaGeral";
import NotFound from "./pages/NotFound";



function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading, session } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }
  
  // Se há sessão mas não há usuário, pode ser um problema de dados
  if (session && !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center max-w-md p-6">
          <div className="text-red-500 text-4xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold mb-2">Erro ao carregar dados do usuário</h2>
          <p className="text-muted-foreground mb-4">
            Sua sessão está ativa, mas não foi possível carregar seus dados. 
            Isso pode acontecer se seu usuário não estiver ativo ou não tiver um tenant associado.
          </p>
          <p className="text-sm text-muted-foreground mb-6">
            Por favor, entre em contato com o administrador do sistema.
          </p>
          <button
            onClick={() => window.location.href = '/auth'}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
          >
            Voltar para Login
          </button>
        </div>
      </div>
    );
  }
  
  if (!user) {
    return <Navigate to="/auth" replace />;
  }
  
  return <>{children}</>;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }
  
  if (user) {
    return <Navigate to="/" replace />;
  }
  
  return <>{children}</>;
}

const App = () => (
  <ErrorBoundary>
    <ThemeProvider>
      <AuthProvider>
        <TenantViewProvider>
          <RealtimeProvider>
            <TooltipProvider>
              <div className="min-h-screen bg-background text-foreground">
                <Toaster />
                <Sonner />
                <BrowserRouter>
            <Routes>
              <Route 
                path="/auth" 
                element={
                  <PublicRoute>
                    <Auth />
                  </PublicRoute>
                } 
              />
              <Route 
                path="/" 
                element={
                  <ProtectedRoute>
                    <Index />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/leads" 
                element={
                  <ProtectedRoute>
                    <Leads />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/conversations" 
                element={
                  <ProtectedRoute>
                    <Conversations />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/pipelines" 
                element={
                  <ProtectedRoute>
                    <Pipelines />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/metrics" 
                element={
                  <ProtectedRoute>
                    <Metrics />
                  </ProtectedRoute>
                } 
              />
            <Route 
              path="/whatsapp" 
              element={
                <ProtectedRoute>
                  <WhatsApp />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/journey" 
              element={
                <ProtectedRoute>
                  <Journey />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/inbox" 
              element={
                <ProtectedRoute>
                  <Inbox />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin" 
              element={
                <ProtectedRoute>
                  <Admin />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/supervisor" 
              element={
                <ProtectedRoute>
                  <Supervisor />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/lista-geral" 
              element={
                <ProtectedRoute>
                  <ListaGeral />
                </ProtectedRoute>
              } 
            />
              <Route 
                path="/database" 
                element={
                  <ProtectedRoute>
                    <Database />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/settings" 
                element={
                  <ProtectedRoute>
                    <Settings />
                  </ProtectedRoute>
                }
              />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </div>
      </TooltipProvider>
    </RealtimeProvider>
  </TenantViewProvider>
  </AuthProvider>
  </ThemeProvider>
  </ErrorBoundary>
);

export default App;
