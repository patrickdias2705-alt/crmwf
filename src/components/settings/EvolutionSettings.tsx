import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, QrCode, Phone, AlertCircle, CheckCircle, XCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";

const evolutionSchema = z.object({
  api_url: z.string().url("URL da API deve ser válida"),
  api_token: z.string().min(1, "Token da API é obrigatório").optional(),
  instance_name: z.string().min(1, "Nome da instância é obrigatório"),
});

type EvolutionForm = z.infer<typeof evolutionSchema>;

interface WhatsAppConnection {
  id: string;
  api_url: string | null;
  api_token_encrypted: string | null;
  instance_name: string | null;
  status: string;
  phone: string | null;
  qr_code_url: string | null;
  pairing_code: string | null;
  last_sync_at: string | null;
  is_active: boolean;
  provider: string;
  tenant_id: string;
  created_at: string;
  updated_at: string;
}

export function EvolutionSettings() {
  const [connection, setConnection] = useState<WhatsAppConnection | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingStatus, setIsLoadingStatus] = useState(true);
  const { toast } = useToast();

  const form = useForm<EvolutionForm>({
    resolver: zodResolver(evolutionSchema),
    defaultValues: {
      api_url: "https://evolutionapi.dentechia.shop",
      api_token: "",
      instance_name: "",
    },
  });

  const loadConnection = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { data, error } = await supabase
        .from('whatsapp_connections')
        .select('*')
        .eq('user_id', user?.id)
        .eq('is_active', true)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        setConnection({
          ...data,
          pairing_code: null
        });
        form.setValue('api_url', data.api_url || '');
        form.setValue('instance_name', data.instance_name || '');
      }
    } catch (error) {
      console.error('Erro ao carregar conexão:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar configurações do WhatsApp",
        variant: "destructive",
      });
    } finally {
      setIsLoadingStatus(false);
    }
  };

  const checkStatus = async () => {
    if (!connection) return;

    try {
      setIsLoadingStatus(true);
      const { data, error } = await supabase.functions.invoke('whatsapp-status');
      
      if (error) throw error;
      
      if (data) {
        setConnection(prev => {
          const updated = prev ? {
            ...prev,
            status: data.status,
            phone: data.phone,
            last_sync_at: data.last_sync_at,
            qr_code_url: data.qr_code_url
          } : null;
          
          // Show success toast when connected
          if (prev?.status !== 'connected' && data.status === 'connected') {
            toast({
              title: "Conectado!",
              description: "WhatsApp conectado com sucesso!",
            });
          }
          
          return updated;
        });
      }
    } catch (error: any) {
      console.error('Erro ao verificar status:', error);
    } finally {
      setIsLoadingStatus(false);
    }
  };

  const onSubmit = async (data: EvolutionForm) => {
    setIsLoading(true);
    try {
      const { data: result, error: fnError } = await supabase.functions.invoke('whatsapp-init', {
        body: {
          base_url: data.api_url,
          instance_name: data.instance_name,
          ...(data.api_token?.trim() ? { api_token: data.api_token.trim() } : {}),
        },
      });

      if (fnError) {
        console.error('Function error:', fnError);
        throw new Error(fnError.message || 'Erro ao configurar WhatsApp');
      }

      toast({
        title: "Sucesso",
        description: "WhatsApp configurado com sucesso! Escaneie o QR Code para conectar.",
      });

      await loadConnection();
    } catch (error: any) {
      console.error('Erro completo:', error);
      
      let errorMessage = "Erro ao configurar WhatsApp";
      
      if (error.message) {
        errorMessage = error.message;
      }
      
      toast({
        title: "Erro na Configuração",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRestart = async () => {
    setIsLoading(true);
    try {
      const { error } = await supabase.functions.invoke('whatsapp-restart', {
        body: {}
      });
      
      if (error) {
        throw error;
      }

      toast({
        title: "Sucesso",
        description: "WhatsApp reiniciado com sucesso.",
      });

      loadConnection();
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Erro ao reiniciar WhatsApp",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleConnect = async () => {
    setIsLoading(true);
    try {
      const { error } = await supabase.functions.invoke('whatsapp-connect', {
        body: {}
      });
      
      if (error) {
        throw error;
      }

      toast({
        title: "Sucesso",
        description: "Conectando ao WhatsApp. Escaneie o QR code.",
      });

      loadConnection();
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Erro ao conectar WhatsApp",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisconnect = async () => {
    setIsLoading(true);
    try {
      const { error } = await supabase.functions.invoke('whatsapp-disconnect', {
        body: {}
      });
      
      if (error) {
        throw error;
      }

      toast({
        title: "Sucesso",
        description: "WhatsApp desconectado com sucesso.",
      });

      loadConnection();
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Erro ao desconectar WhatsApp",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadConnection();
  }, []);

  useEffect(() => {
    if (connection && connection.status !== 'connected') {
      const interval = setInterval(checkStatus, 5000);
      return () => clearInterval(interval);
    }
  }, [connection]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'connected':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'connecting':
      case 'initializing':
        return <Loader2 className="h-4 w-4 animate-spin text-[hsl(167_100%_45%)]" />;
      case 'disconnected':
      default:
        return <XCircle className="h-4 w-4 text-red-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected':
        return 'bg-green-500';
      case 'connecting':
      case 'initializing':
        return 'bg-[hsl(167_100%_45%)]';
      case 'disconnected':
      default:
        return 'bg-red-500';
    }
  };

  if (isLoadingStatus) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Configurações da Evolution API</h3>
        <p className="text-sm text-muted-foreground">
          Configure sua instância do WhatsApp para receber e enviar mensagens automaticamente.
        </p>
      </div>

      {connection && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {getStatusIcon(connection.status)}
              Status da Conexão
            </CardTitle>
            <CardDescription>
              Instância: {connection.instance_name || 'Não configurado'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2">
              <Badge className={getStatusColor(connection.status)}>
                {connection.status === 'connected' ? 'Conectado' :
                 connection.status === 'connecting' ? 'Conectando...' :
                 connection.status === 'initializing' ? 'Inicializando...' : 'Desconectado'}
              </Badge>
              {connection.phone && (
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Phone className="h-4 w-4" />
                  {connection.phone}
                </div>
              )}
            </div>

            {connection.status !== 'connected' && connection.qr_code_url && (
              <div className="space-y-4">
                <div className="flex flex-col items-center space-y-2">
                  <p className="text-sm text-muted-foreground">
                    Escaneie o QR Code abaixo com o WhatsApp:
                  </p>
                  <div className="relative p-4 bg-white rounded-lg">
                    {isLoadingStatus && (
                      <div className="absolute inset-0 flex items-center justify-center bg-white/80 rounded-lg z-10">
                        <Loader2 className="w-8 h-8 animate-spin text-primary" />
                      </div>
                    )}
                    <img 
                      src={connection.qr_code_url} 
                      alt="QR Code" 
                      className="w-64 h-64"
                      onError={(e) => {
                        console.error('Error loading QR code image');
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground text-center">
                    Abra o WhatsApp → Configurações → Aparelhos conectados → Conectar um aparelho
                  </p>
                  <Alert className="bg-amber-50 border-amber-200">
                    <AlertCircle className="h-4 w-4 text-amber-600" />
                    <AlertDescription className="text-amber-800">
                      O QR code expira após alguns minutos. Se expirar, clique em "Verificar Status" para gerar um novo.
                    </AlertDescription>
                  </Alert>
                </div>
              </div>
            )}

            {connection.status !== 'connected' && connection.pairing_code && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  <span className="text-sm font-medium">Código de Pareamento</span>
                </div>
                <div className="flex justify-center p-4 bg-muted rounded-lg">
                  <div className="text-center">
                    <div className="text-2xl font-mono font-bold tracking-widest bg-background px-4 py-2 rounded border">
                      {connection.pairing_code}
                    </div>
                    <p className="text-sm text-muted-foreground mt-2">
                      Digite este código no WhatsApp
                    </p>
                  </div>
                </div>
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    No WhatsApp, vá em <strong>Dispositivos conectados</strong> → <strong>Conectar dispositivo</strong> 
                    → <strong>Conectar com código</strong> e digite o código acima.
                  </AlertDescription>
                </Alert>
              </div>
            )}

            <div className="flex gap-2">
              <Button onClick={checkStatus} variant="outline" size="sm">
                Verificar Status
              </Button>
              {connection.status === 'disconnected' && (
                <Button
                  onClick={handleConnect}
                  disabled={isLoading}
                  variant="default"
                  size="sm"
                >
                  {isLoading ? "Conectando..." : "Conectar"}
                </Button>
              )}
              {connection.status === 'connected' && (
                <>
                  <Button
                    onClick={handleRestart}
                    disabled={isLoading}
                    variant="outline"
                    size="sm"
                  >
                    {isLoading ? "Carregando..." : "Reiniciar"}
                  </Button>
                  <Button
                    onClick={handleDisconnect}
                    disabled={isLoading}
                    variant="destructive"
                    size="sm"
                  >
                    {isLoading ? "Carregando..." : "Desconectar"}
                  </Button>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>
            {connection ? 'Reconfigurar WhatsApp' : 'Configurar WhatsApp'}
          </CardTitle>
          <CardDescription>
            {connection 
              ? 'Atualize as configurações da sua instância WhatsApp'
              : 'Configure uma nova instância WhatsApp para este tenant'
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="api_url">URL da Evolution API</Label>
              <Input
                id="api_url"
                placeholder="https://evolutionapi.dentechia.shop"
                defaultValue="https://evolutionapi.dentechia.shop"
                {...form.register("api_url")}
              />
              {form.formState.errors.api_url && (
                <p className="text-sm text-red-500">
                  {form.formState.errors.api_url.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="api_token">Token da API</Label>
              <Input
                id="api_token"
                type="password"
                placeholder="Cole aqui seu token da Evolution API"
                {...form.register("api_token")}
              />
              {form.formState.errors.api_token && (
                <p className="text-sm text-red-500">
                  {form.formState.errors.api_token.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="instance_name">Nome da Instância</Label>
              <Input
                id="instance_name"
                placeholder="minha-instancia"
                {...form.register("instance_name")}
              />
              {form.formState.errors.instance_name && (
                <p className="text-sm text-red-500">
                  {form.formState.errors.instance_name.message}
                </p>
              )}
            </div>

            <Button type="submit" disabled={isLoading} className="w-full">
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {connection ? 'Atualizar Configuração' : 'Configurar WhatsApp'}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          <strong>Importante:</strong> Cada tenant pode ter sua própria instância WhatsApp. 
          Configure o webhook da Evolution API para: <code>https://jcqsczbodsrfjthxjjxq.supabase.co/functions/v1/whatsapp-webhook</code>
        </AlertDescription>
      </Alert>
    </div>
  );
}