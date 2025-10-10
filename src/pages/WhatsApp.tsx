import { useState, useEffect } from 'react';
import { Layout } from '@/components/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MessageCircle, QrCode, Phone, Clock, RefreshCw, Settings, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { EvolutionSettings } from '@/components/settings/EvolutionSettings';
import { Link } from 'react-router-dom';

interface WhatsAppConnection {
  id: string;
  status: string;
  phone?: string;
  qr_code_url?: string;
  last_sync_at?: string;
  provider: string;
  api_url?: string;
  instance_name?: string;
  is_active: boolean;
}

export default function WhatsApp() {
  const [connection, setConnection] = useState<WhatsAppConnection | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('status');

  useEffect(() => {
    loadConnection();
    
    // Poll status every 5 seconds
    const interval = setInterval(loadConnection, 5000);
    return () => clearInterval(interval);
  }, []);

  const loadConnection = async () => {
    try {
      const { data, error } = await supabase
        .from('whatsapp_connections')
        .select('*')
        .eq('is_active', true)
        .maybeSingle();
      
      if (error && error.code !== 'PGRST116') {
        console.error('Error loading WhatsApp connection:', error);
        return;
      }
      
      setConnection(data);
    } catch (error) {
      console.error('Error loading WhatsApp connection:', error);
    }
  };

  const handleConnect = async () => {
    setLoading(true);
    try {
      if (!connection || !connection.api_url || !connection.instance_name) {
        // Redirect user to config tab if missing settings
        setActiveTab('config');
        return;
      }

      const { error } = await supabase.functions.invoke('whatsapp-init', {
        body: {
          base_url: connection.api_url,
          instance_name: connection.instance_name,
        }
      });

      if (error) throw error;

      await loadConnection();
    } catch (error) {
      console.error('Error connecting WhatsApp:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRestart = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.functions.invoke('whatsapp-restart', {
        body: {}
      });
      
      if (error) throw error;
      
      await loadConnection();
    } catch (error) {
      console.error('Error restarting WhatsApp:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.functions.invoke('whatsapp-disconnect', {
        body: {}
      });
      
      if (error) throw error;
      
      await loadConnection();
    } catch (error) {
      console.error('Error disconnecting WhatsApp:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'connected': return <CheckCircle className="h-5 w-5 text-green-400" />;
      case 'connecting':
      case 'initializing': return <RefreshCw className="h-5 w-5 animate-spin text-primary" />;
      default: return <XCircle className="h-5 w-5 text-red-400" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'connected': 
        return (
          <Badge className="bg-gradient-to-r from-green-500 to-emerald-500 text-white border-0 shadow-lg animate-pulse">
            Conectado
          </Badge>
        );
      case 'connecting':
      case 'initializing': 
        return (
          <Badge className="bg-gradient-to-r from-[hsl(174_100%_50%)] to-[hsl(167_100%_45%)] text-white border-0 shadow-lg">
            {status === 'connecting' ? 'Conectando...' : 'Inicializando...'}
          </Badge>
        );
      default: 
        return (
          <Badge variant="destructive" className="bg-gradient-to-r from-red-500 to-rose-500 border-0 shadow-lg">
            Desconectado
          </Badge>
        );
    }
  };

  return (
    <Layout>
      <div className="relative flex-1 space-y-6 p-6">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-green-500/5 pointer-events-none" />
        
        <div className="relative">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-gradient-to-r from-green-500 to-emerald-500 shadow-lg">
              <MessageCircle className="h-6 w-6 text-white" />
            </div>
            <h2 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
              WhatsApp Business
            </h2>
          </div>
          <p className="text-muted-foreground">
            Configure e gerencie sua conexão WhatsApp Business com estilo
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="relative space-y-6">
          <TabsList className="grid w-full grid-cols-2 bg-gradient-to-r from-muted/50 to-muted backdrop-blur-sm border border-border/50 shadow-lg">
            <TabsTrigger 
              value="status" 
              className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-500 data-[state=active]:to-emerald-500 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-300"
            >
              <MessageCircle className="h-4 w-4" />
              Status da Conexão
            </TabsTrigger>
            <TabsTrigger 
              value="config" 
              className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-primary/80 data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg transition-all duration-300"
            >
              <Settings className="h-4 w-4" />
              Configuração
            </TabsTrigger>
          </TabsList>

          <TabsContent value="status" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <Card className="relative border-0 shadow-2xl overflow-hidden bg-gradient-to-br from-card via-card to-muted/30 backdrop-blur-sm">
                <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 via-transparent to-emerald-500/5" />
                <CardHeader className="relative">
                  <CardTitle className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-gradient-to-r from-green-500 to-emerald-500 shadow-lg">
                      <MessageCircle className="h-5 w-5 text-white" />
                    </div>
                    <span className="bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text">
                      Status da Conexão
                    </span>
                  </CardTitle>
                  <CardDescription className="text-muted-foreground/80">
                    Estado atual da sua instância WhatsApp
                  </CardDescription>
                </CardHeader>
                <CardContent className="relative space-y-4">
                  {connection ? (
                    <>
                      <div className="flex items-center gap-3 p-4 rounded-xl bg-gradient-to-r from-muted/50 to-muted/30 border border-border/50 shadow-inner">
                        {getStatusIcon(connection.status)}
                        {getStatusBadge(connection.status)}
                      </div>

                      {connection.phone && (
                        <div className="flex items-center gap-3 p-3 rounded-lg bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/20">
                          <div className="p-1.5 rounded-md bg-green-500/20">
                            <Phone className="h-4 w-4 text-green-600" />
                          </div>
                          <span className="font-medium">{connection.phone}</span>
                        </div>
                      )}

                      {connection.instance_name && (
                        <div className="flex items-center gap-3 p-3 rounded-lg bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20">
                          <div className="p-1.5 rounded-md bg-primary/20">
                            <Settings className="h-4 w-4 text-primary" />
                          </div>
                          <span className="text-sm text-muted-foreground">Instância: <span className="font-medium text-foreground">{connection.instance_name}</span></span>
                        </div>
                      )}

                      {connection.last_sync_at && (
                        <div className="flex items-center gap-3 p-3 rounded-lg bg-gradient-to-r from-muted/30 to-muted/10 border border-border/30">
                          <div className="p-1.5 rounded-md bg-muted/50">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                          </div>
                          <span className="text-sm text-muted-foreground">Última sincronização: <span className="font-medium">{new Date(connection.last_sync_at).toLocaleString()}</span></span>
                        </div>
                      )}

                      {connection.status !== 'connected' && connection.qr_code_url && (
                        <div className="space-y-4">
                          <div className="flex items-center gap-3 p-3 rounded-lg bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/20">
                            <div className="p-2 rounded-md bg-green-500/20">
                              <QrCode className="h-5 w-5 text-green-600" />
                            </div>
                            <span className="font-medium">Escaneie o QR Code no WhatsApp</span>
                          </div>
                          
                          <div className="relative flex justify-center p-6 bg-gradient-to-br from-white via-green-50 to-emerald-50 dark:from-background dark:via-green-950/20 dark:to-emerald-950/20 rounded-xl border-2 border-gradient-to-r border-green-200 dark:border-green-800/30 shadow-2xl">
                            <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-emerald-500/10 rounded-xl" />
                            <div className="relative p-4 bg-white dark:bg-background rounded-lg shadow-lg ring-1 ring-green-500/20">
                              <img
                                src={connection.qr_code_url}
                                alt="QR Code WhatsApp"
                                className="max-w-64 max-h-64 rounded-md"
                              />
                            </div>
                            {/* Animated glow effect */}
                            <div className="absolute -inset-2 bg-gradient-to-r from-green-400 to-emerald-400 rounded-xl blur-xl opacity-20 animate-pulse" />
                          </div>
                          
                          <div className="flex items-start gap-3 p-4 bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border border-blue-500/20 rounded-xl">
                            <div className="p-2 rounded-md bg-blue-500/20 mt-0.5">
                              <AlertCircle className="h-4 w-4 text-blue-600" />
                            </div>
                            <div className="flex-1">
                              <p className="text-sm text-muted-foreground leading-relaxed">
                                Abra o WhatsApp, vá em <strong className="text-foreground">Dispositivos conectados</strong> e escaneie este código.
                              </p>
                            </div>
                          </div>
                        </div>
                      )}

                      <div className="flex gap-3 pt-4">
                        {connection.status === 'connected' && (
                          <>
                            <Link to="/conversations">
                              <Button 
                                className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 shadow-lg transition-all duration-300"
                              >
                                <MessageCircle className="mr-2 h-4 w-4" />
                                Ver Conversas
                              </Button>
                            </Link>
                            <Button 
                              variant="outline" 
                              onClick={handleRestart} 
                              disabled={loading}
                              className="bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border-blue-500/20 hover:from-blue-500/20 hover:to-cyan-500/20 transition-all duration-300"
                            >
                              <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                              Reiniciar
                            </Button>
                            <Button 
                              variant="destructive" 
                              onClick={handleDisconnect} 
                              disabled={loading}
                              className="bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600 shadow-lg transition-all duration-300"
                            >
                              <XCircle className="mr-2 h-4 w-4" />
                              Desconectar
                            </Button>
                          </>
                        )}
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-12">
                      <div className="relative inline-block mb-6">
                        <div className="p-4 rounded-2xl bg-gradient-to-br from-green-500/20 to-emerald-500/20 shadow-xl">
                          <MessageCircle className="h-12 w-12 text-green-500 mx-auto" />
                        </div>
                        <div className="absolute -inset-2 bg-gradient-to-r from-green-400 to-emerald-400 rounded-2xl blur-lg opacity-20 animate-pulse" />
                      </div>
                      <h3 className="text-lg font-semibold mb-2">Nenhuma conexão configurada</h3>
                      <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
                        Configure sua Evolution API na aba "Configuração" para começar a usar o WhatsApp Business
                      </p>
                      <Button 
                        onClick={() => setActiveTab('config')}
                        className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 shadow-lg transition-all duration-300"
                      >
                        <Settings className="mr-2 h-4 w-4" />
                        Configurar Agora
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="relative border-0 shadow-2xl overflow-hidden bg-gradient-to-br from-card via-card to-muted/20 backdrop-blur-sm">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-blue-500/5" />
                <CardHeader className="relative">
                  <CardTitle className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-gradient-to-r from-primary to-primary/80 shadow-lg">
                      <Settings className="h-5 w-5 text-primary-foreground" />
                    </div>
                    <span className="bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text">
                      Como Funciona
                    </span>
                  </CardTitle>
                  <CardDescription className="text-muted-foreground/80">
                    Guia completo da conexão WhatsApp Business
                  </CardDescription>
                </CardHeader>
                <CardContent className="relative space-y-4">
                  <div className="space-y-4">
                    <div className="flex items-start gap-4 p-4 rounded-xl bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border border-blue-500/20">
                      <div className="p-2 rounded-lg bg-gradient-to-r from-blue-500 to-cyan-500 shadow-lg mt-0.5">
                        <Settings className="h-4 w-4 text-white" />
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-foreground">Configuração</p>
                        <p className="text-sm text-muted-foreground mt-1">Configure sua Evolution API com URL e token de acesso</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-4 p-4 rounded-xl bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/20">
                      <div className="p-2 rounded-lg bg-gradient-to-r from-green-500 to-emerald-500 shadow-lg mt-0.5">
                        <QrCode className="h-4 w-4 text-white" />
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-foreground">QR Code</p>
                        <p className="text-sm text-muted-foreground mt-1">Escaneie o QR code com seu WhatsApp para conectar</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-4 p-4 rounded-xl bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20">
                      <div className="p-2 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 shadow-lg mt-0.5">
                        <RefreshCw className="h-4 w-4 text-white" />
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-foreground">Status em Tempo Real</p>
                        <p className="text-sm text-muted-foreground mt-1">Status atualizado automaticamente a cada 5 segundos</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-4 p-4 rounded-xl bg-gradient-to-r from-[hsl(174_100%_50%/0.10)] to-[hsl(162_100%_40%/0.10)] border border-[hsl(174_100%_50%/0.20)]">
                      <div className="p-2 rounded-lg bg-gradient-to-r from-[hsl(174_100%_50%)] to-[hsl(167_100%_45%)] shadow-lg mt-0.5">
                        <MessageCircle className="h-4 w-4 text-white" />
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-foreground">Gerenciamento</p>
                        <p className="text-sm text-muted-foreground mt-1">Reinicie ou desconecte a sessão conforme necessário</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="config" className="space-y-6">
            <EvolutionSettings />
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}