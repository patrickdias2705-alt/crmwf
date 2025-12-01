import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Smartphone,
  ExternalLink,
  RefreshCw,
  CheckCircle,
  AlertTriangle,
  Loader2
} from 'lucide-react';

interface SimpleWhatsAppWebProps {
  isConnected?: boolean;
  instanceId?: string;
}

export function SimpleWhatsAppWeb({ isConnected = false, instanceId }: SimpleWhatsAppWebProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
    setIsLoading(true);
  };

  const handleOpenExternal = () => {
    window.open('https://web.whatsapp.com/', '_blank', 'noopener,noreferrer');
  };

  if (!isConnected) {
    return (
      <Card className="p-8 text-center">
        <div className="space-y-4">
          <AlertTriangle className="h-16 w-16 mx-auto text-muted-foreground" />
          <h3 className="text-xl font-semibold">WhatsApp não conectado</h3>
          <p className="text-muted-foreground">
            Conecte seu WhatsApp primeiro para acessar o WhatsApp Web
          </p>
        </div>
      </Card>
    );
  }

  return (
    <div className="h-[600px] border rounded-lg overflow-hidden">
      <div className="h-full flex flex-col">
        {/* Cabeçalho simples */}
        <div className="flex items-center justify-between p-4 border-b bg-muted/20">
          <div className="flex items-center gap-3">
            <Smartphone className="h-5 w-5" />
            <h3 className="font-semibold">WhatsApp Web</h3>
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
              onClick={handleOpenExternal}
            >
              <ExternalLink className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Aviso sobre compatibilidade */}
        <Alert className="m-4">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>Importante:</strong> O WhatsApp Web funciona melhor no Chrome, Firefox ou Edge. 
            Se não carregar, clique em "Abrir em nova aba".
          </AlertDescription>
        </Alert>

        {/* Iframe do WhatsApp Web */}
        <div className="flex-1 relative">
          {isLoading && (
            <div className="absolute inset-0 bg-background/80 flex items-center justify-center z-10">
              <div className="text-center">
                <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">Carregando WhatsApp Web...</p>
              </div>
            </div>
          )}
          
          <iframe
            key={refreshKey}
            src="https://web.whatsapp.com/"
            className="w-full h-full border-0"
            title="WhatsApp Web"
            sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox"
            onLoad={() => {
              console.log('✅ WhatsApp Web carregado');
              setIsLoading(false);
            }}
            onError={() => {
              console.error('❌ Erro ao carregar WhatsApp Web');
              setIsLoading(false);
            }}
          />
        </div>

        {/* Rodapé com informações */}
        <div className="p-3 border-t bg-muted/20 text-sm text-muted-foreground">
          <div className="flex items-center justify-between">
            <div>
              <strong>WhatsApp Web</strong> integrado ao CRM
            </div>
            {instanceId && (
              <div className="text-xs">
                Instância: {instanceId.substring(0, 8)}...
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
