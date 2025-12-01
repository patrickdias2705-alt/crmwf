import React, { useState, useEffect } from 'react';
import { X, RefreshCw, ExternalLink, Smartphone, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

interface WhatsAppWebDirectProps {
  isOpen: boolean;
  onClose: () => void;
}

export function WhatsAppWebDirect({ isOpen, onClose }: WhatsAppWebDirectProps) {
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [qrCode, setQrCode] = useState('');
  const [sessionId] = useState(`whatsapp_${Date.now()}`);

  // Função para gerar QR code do WhatsApp Web
  const generateWhatsAppQR = async () => {
    try {
      // Gerar um QR code que redireciona para WhatsApp Web
      const qrData = `https://web.whatsapp.com/send?phone=&text=Conectar%20WhatsApp%20Business`;
      
      const QRCode = await import('qrcode');
      const qrCodeDataURL = await QRCode.toDataURL(qrData, {
        width: 256,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        },
        errorCorrectionLevel: 'M'
      });
      
      return qrCodeDataURL;
    } catch (error) {
      console.error('Erro ao gerar QR code:', error);
      return null;
    }
  };

  // Função para conectar WhatsApp
  const connectWhatsApp = async () => {
    try {
      setIsLoading(true);
      console.log('🔗 Conectando WhatsApp...');
      
      // Gerar QR code
      const qr = await generateWhatsAppQR();
      if (qr) {
        setQrCode(qr);
        toast.success('QR Code gerado! Escaneie com o WhatsApp');
      }
      
    } catch (error) {
      console.error('Erro ao conectar:', error);
      toast.error('Erro ao conectar WhatsApp');
    } finally {
      setIsLoading(false);
    }
  };

  // Função para abrir WhatsApp Web em nova aba
  const openWhatsAppWeb = () => {
    window.open('https://web.whatsapp.com', '_blank');
    toast.info('WhatsApp Web aberto em nova aba');
  };

  // Função para simular conexão (para demonstração)
  const simulateConnection = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsConnected(true);
      setIsLoading(false);
      toast.success('WhatsApp conectado com sucesso!');
    }, 2000);
  };

  useEffect(() => {
    if (isOpen) {
      connectWhatsApp();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="text-xl font-semibold flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            WhatsApp Business
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {!isConnected ? (
            <div className="text-center space-y-4">
              <div className="space-y-2">
                <h3 className="text-lg font-semibold">Conectar WhatsApp</h3>
                <p className="text-muted-foreground text-sm">
                  Escaneie o QR code com seu WhatsApp ou use o WhatsApp Web
                </p>
              </div>
              
              {qrCode && (
                <div className="bg-white p-4 rounded-lg shadow-lg">
                  <img 
                    src={qrCode} 
                    alt="QR Code WhatsApp" 
                    className="w-64 h-64 mx-auto"
                  />
                </div>
              )}
              
              <div className="space-y-3">
                <Button
                  onClick={openWhatsAppWeb}
                  className="w-full"
                  variant="default"
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Abrir WhatsApp Web
                </Button>
                
                <Button
                  onClick={simulateConnection}
                  className="w-full"
                  variant="outline"
                  disabled={isLoading}
                >
                  <Smartphone className="h-4 w-4 mr-2" />
                  {isLoading ? 'Conectando...' : 'Simular Conexão'}
                </Button>
                
                <Button
                  onClick={connectWhatsApp}
                  variant="ghost"
                  size="sm"
                  disabled={isLoading}
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Gerar Novo QR
                </Button>
              </div>
            </div>
          ) : (
            <div className="text-center space-y-4">
              <div className="space-y-2">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                  <MessageSquare className="h-8 w-8 text-green-600" />
                </div>
                <h3 className="text-lg font-semibold text-green-600">
                  WhatsApp Conectado!
                </h3>
                <p className="text-muted-foreground text-sm">
                  Suas conversas estão disponíveis na plataforma
                </p>
              </div>
              
              <div className="space-y-3">
                <Button
                  onClick={openWhatsAppWeb}
                  className="w-full"
                  variant="default"
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Abrir Conversas
                </Button>
                
                <Button
                  onClick={() => setIsConnected(false)}
                  variant="outline"
                  className="w-full"
                >
                  Desconectar
                </Button>
              </div>
            </div>
          )}
          
          <div className="text-center">
            <p className="text-xs text-muted-foreground">
              Sessão: <code className="bg-gray-100 px-2 py-1 rounded">{sessionId}</code>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
