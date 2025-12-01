import React, { useState, useEffect } from 'react';
import { X, RefreshCw, ExternalLink, Chrome, Smartphone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

interface ChromeWhatsAppProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ChromeWhatsApp({ isOpen, onClose }: ChromeWhatsAppProps) {
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [chromeUrl, setChromeUrl] = useState('');

  // Configuração do Chrome real
  useEffect(() => {
    const setupChrome = async () => {
      try {
        // Chrome real via servidor Puppeteer
        const chromeServerUrl = 'http://localhost:3002';
        
        // URL do servidor Chrome
        setChromeUrl(chromeServerUrl);
        
        console.log('🌐 Chrome real configurado!');
        console.log('📱 WhatsApp Web - CHROME REAL!');
        console.log('🔗 URL:', chromeServerUrl);
      } catch (error) {
        console.error('❌ Erro na configuração do Chrome:', error);
      }
    };

    setupChrome();
  }, []);

  const handleRefresh = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setIsConnected(true);
      toast.success('Chrome atualizado!');
    }, 1000);
  };

  const handleOpenExternal = () => {
    window.open('https://web.whatsapp.com/', '_blank');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-2">
      <Card className="w-full h-full flex flex-col">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg">
              <Chrome className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-lg font-semibold">Chrome - WhatsApp Web</CardTitle>
              <p className="text-xs text-muted-foreground">Navegador Chrome real integrado</p>
            </div>
            <Badge variant={isConnected ? "default" : "destructive"} className="flex items-center gap-1">
              {isConnected ? <Smartphone className="h-3 w-3" /> : <Chrome className="h-3 w-3" />}
              {isConnected ? 'Conectado' : 'Carregando'}
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={isLoading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Atualizar
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleOpenExternal}
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Externo
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className="flex-1 p-0">
          <div className="h-full relative">
            {chromeUrl ? (
              <iframe
                src={chromeUrl}
                className="w-full h-full border-0"
                allow="clipboard-read; clipboard-write; microphone; camera; fullscreen"
                sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox"
                onLoad={() => {
                  setIsConnected(true);
                  toast.success('Chrome carregado!');
                }}
                onError={() => {
                  setIsConnected(false);
                  toast.error('Erro ao carregar Chrome');
                }}
              />
            ) : (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <Chrome className="h-12 w-12 animate-spin mx-auto mb-4 text-blue-600" />
                  <p className="text-muted-foreground">Iniciando Chrome...</p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
