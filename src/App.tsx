import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/ThemeProvider";
import { setDefaultTheme } from "@/utils/themeUtils";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { logDebugInfo, checkThinkPadIssues } from "@/utils/debugUtils";

import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import { RealtimeProvider } from "@/contexts/RealtimeProvider";
import { TenantViewProvider } from "@/contexts/TenantViewContext";
import { ValuesVisibilityProvider } from "@/contexts/ValuesVisibilityContext";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Leads from "./pages/Leads";
import Conversations from "./pages/Conversations";
import Pipelines from "./pages/Pipelines";
import Metrics from "./pages/Metrics";
// import WhatsApp from "./pages/WhatsApp";
import WhatsAppTest from "./pages/WhatsAppTest";
import ChatwootChat from "./pages/ChatwootChat";
import Journey from "./pages/Journey";
import Inbox from "./pages/Inbox";
import Settings from "./pages/Settings";
import Database from "./pages/Database";
import Admin from "./pages/Admin";
import Supervisor from "./pages/Supervisor";
import ListaGeral from "./pages/ListaGeral";
import NotFound from "./pages/NotFound";



function ProtectedRoute({ children }: { children: React.ReactNode }) {
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

const App = () => {
  // Garantir que o tema padrão seja sempre light
  React.useEffect(() => {
    setDefaultTheme();
    
    // Debug para identificar problemas
    console.log('🚀 Inicializando aplicação...');
    logDebugInfo();
    checkThinkPadIssues();
  }, []);

  return (
    <ErrorBoundary>
      <ThemeProvider>
        <AuthProvider>
          <TenantViewProvider>
            <ValuesVisibilityProvider>
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
            {/* <Route 
              path="/whatsapp" 
              element={
                <ProtectedRoute>
                  <WhatsApp />
                </ProtectedRoute>
              } 
            /> */}
            <Route 
              path="/whatsapp-test" 
              element={
                <ProtectedRoute>
                  <WhatsAppTest />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/chatwoot" 
              element={
                <ProtectedRoute>
                  <ChatwootChat />
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
    </ValuesVisibilityProvider>
        </TenantViewProvider>
        </AuthProvider>
        </ThemeProvider>
      </ErrorBoundary>
  );
};

export default App;
