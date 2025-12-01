import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Smartphone,
  ExternalLink,
  RefreshCw,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Maximize2,
  Minimize2
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { EvolutionApiService } from '@/services/evolutionApi';

interface WhatsAppWebProps {
  instanceId?: string;
  isConnected?: boolean;
  onConnectionChange?: (connected: boolean, instanceId?: string) => void;
}

export function WhatsAppWeb({ instanceId, isConnected, onConnectionChange }: WhatsAppWebProps) {
  const { user } = useAuth();
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  // URL do WhatsApp Web
  const whatsappWebUrl = 'https://web.whatsapp.com/';

  // Verificar se o WhatsApp está conectado
  useEffect(() => {
    const checkConnection = async () => {
      if (instanceId) {
        try {
          const isConnected = await EvolutionApiService.isInstanceConnected(instanceId);
          console.log('🔍 Status da conexão WhatsApp:', isConnected);
        } catch (error) {
          console.error('❌ Erro ao verificar conexão:', error);
        }
      }
    };

    checkConnection();
    const interval = setInterval(checkConnection, 10000); // Verificar a cada 10 segundos
    return () => clearInterval(interval);
  }, [instanceId]);

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
    setIsLoading(true);
    setTimeout(() => setIsLoading(false), 2000);
  };

  const handleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const handleOpenExternal = () => {
    window.open(whatsappWebUrl, '_blank', 'noopener,noreferrer');
  };

  if (!isConnected) {
    return (
      <Card className="p-8 text-center">
        <div className="space-y-4">
          <XCircle className="h-16 w-16 mx-auto text-muted-foreground" />
          <h3 className="text-xl font-semibold">WhatsApp não conectado</h3>
          <p className="text-muted-foreground">
            Conecte seu WhatsApp primeiro para acessar o WhatsApp Web
          </p>
        </div>
      </Card>
    );
  }

  console.log('🔍 WhatsAppWeb renderizando com:', { isConnected, instanceId });

  return (
    <div className={`${isFullscreen ? 'fixed inset-0 z-50 bg-background' : 'h-[600px]'} flex flex-col`}>
      {/* Cabeçalho */}
      <div className="flex items-center justify-between p-4 border-b bg-muted/20">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Smartphone className="h-5 w-5" />
            <h3 className="font-semibold">WhatsApp Web</h3>
          </div>
          <Badge variant="default" className="flex items-center gap-1">
            <CheckCircle className="h-3 w-3" />
            Conectado
          </Badge>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={handleFullscreen}
          >
            {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={handleOpenExternal}
          >
            <ExternalLink className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Aviso sobre QR Code */}
      <Alert className="m-4">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          <strong>Importante:</strong> Se esta é a primeira vez acessando o WhatsApp Web neste navegador, 
          você precisará escanear o QR Code que aparece na tela com seu celular.
        </AlertDescription>
      </Alert>

      {/* Iframe do WhatsApp Web */}
      <div className="flex-1 relative">
        {isLoading && (
          <div className="absolute inset-0 bg-background/80 flex items-center justify-center z-10">
            <div className="text-center">
              <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">Carregando WhatsApp Web...</p>
            </div>
          </div>
        )}
        
        <iframe
          key={refreshKey}
          src={whatsappWebUrl}
          className="w-full h-full border-0"
          title="WhatsApp Web"
          sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox"
          onLoad={() => setIsLoading(false)}
          onError={() => {
            setError('Erro ao carregar WhatsApp Web. Verifique sua conexão.');
            setIsLoading(false);
          }}
        />
      </div>

      {/* Rodapé com instruções */}
      <div className="p-4 border-t bg-muted/20 text-sm text-muted-foreground">
        <div className="flex items-center justify-between">
          <div>
            <strong>Instruções:</strong> Use o WhatsApp Web normalmente. 
            Suas conversas serão sincronizadas automaticamente.
          </div>
          <div className="text-xs">
            Instância: {instanceId?.substring(0, 8)}...
          </div>
        </div>
      </div>

      {error && (
        <Alert variant="destructive" className="m-4">
          <XCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
    </div>
  );
}
