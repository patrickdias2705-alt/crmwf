import React, { useState, useEffect } from 'react';
import { X, RefreshCw, ExternalLink, MessageSquare, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

interface WhatsAppEmbeddedProps {
  isOpen: boolean;
  onClose: () => void;
}

export function WhatsAppEmbedded({ isOpen, onClose }: WhatsAppEmbeddedProps) {
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showIframe, setShowIframe] = useState(false);

  // Função para conectar WhatsApp
  const connectWhatsApp = async () => {
    try {
      setIsLoading(true);
      console.log('🔗 Conectando WhatsApp...');
      
      // Simular conexão
      setTimeout(() => {
        setIsConnected(true);
        setShowIframe(true);
        setIsLoading(false);
        toast.success('WhatsApp conectado! Carregando conversas...');
      }, 2000);
      
    } catch (error) {
      console.error('Erro ao conectar:', error);
      toast.error('Erro ao conectar WhatsApp');
      setIsLoading(false);
    }
  };

  // Função para abrir WhatsApp Web em nova aba
  const openWhatsAppWeb = () => {
    window.open('https://web.whatsapp.com', '_blank');
    toast.info('WhatsApp Web aberto em nova aba');
  };

  // Função para recarregar iframe
  const reloadIframe = () => {
    setShowIframe(false);
    setTimeout(() => {
      setShowIframe(true);
      toast.success('WhatsApp recarregado!');
    }, 500);
  };

  useEffect(() => {
    if (isOpen && !isConnected) {
      connectWhatsApp();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-6xl mx-auto h-[90vh] flex flex-col">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="text-xl font-semibold flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            WhatsApp Business - Conversas
          </CardTitle>
          <div className="flex items-center gap-2">
            {isConnected && (
              <Badge variant="default" className="bg-green-600">
                Conectado
              </Badge>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className="flex-1 flex flex-col space-y-4">
          {!isConnected ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center space-y-4">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                  <MessageSquare className="h-10 w-10 text-green-600" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-semibold">Conectando WhatsApp...</h3>
                  <p className="text-muted-foreground">
                    Aguarde enquanto conectamos seu WhatsApp Business
                  </p>
                </div>
                {isLoading && (
                  <div className="flex items-center justify-center">
                    <RefreshCw className="h-6 w-6 animate-spin" />
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col space-y-4">
              {/* Controles */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Button
                    onClick={reloadIframe}
                    variant="outline"
                    size="sm"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Recarregar
                  </Button>
                  <Button
                    onClick={openWhatsAppWeb}
                    variant="outline"
                    size="sm"
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Abrir em Nova Aba
                  </Button>
                </div>
                <div className="text-sm text-muted-foreground">
                  WhatsApp Web integrado
                </div>
              </div>
              
              {/* Iframe do WhatsApp Web */}
              <div className="flex-1 border rounded-lg overflow-hidden">
                {showIframe ? (
                  <iframe
                    src="https://web.whatsapp.com"
                    className="w-full h-full"
                    title="WhatsApp Web"
                    sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox"
                    onLoad={() => {
                      console.log('WhatsApp Web carregado');
                      toast.success('WhatsApp Web carregado com sucesso!');
                    }}
                    onError={() => {
                      console.error('Erro ao carregar WhatsApp Web');
                      toast.error('Erro ao carregar WhatsApp Web');
                    }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gray-50">
                    <div className="text-center space-y-2">
                      <RefreshCw className="h-8 w-8 animate-spin mx-auto text-gray-400" />
                      <p className="text-gray-500">Carregando WhatsApp Web...</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}