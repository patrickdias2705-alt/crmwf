import React, { useState, useEffect } from 'react';
import { X, RefreshCw, ExternalLink, Smartphone, QrCode } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

interface WPPConnectWhatsAppProps {
  isOpen: boolean;
  onClose: () => void;
}

export function WPPConnectWhatsApp({ isOpen, onClose }: WPPConnectWhatsAppProps) {
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [qrCode, setQrCode] = useState('');
  const [sessionId] = useState(`crm_${Date.now()}`);

  // Configuração do WPPConnect
  useEffect(() => {
    const setupWPPConnect = async () => {
      try {
        setIsLoading(true);
        
        // Criar sessão no WPPConnect REAL
        const response = await fetch('http://localhost:21465/api/crm_session/start-session', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            session: sessionId,
            headless: true,
            webhook: 'http://localhost:8081/webhook'
          })
        });

        if (response.ok) {
          const data = await response.json();
          console.log('✅ Sessão WPPConnect criada:', data);
          
          // Buscar QR Code REAL
          const qrResponse = await fetch(`http://localhost:21465/api/${sessionId}/qrcode-session`);
          if (qrResponse.ok) {
            const qrData = await qrResponse.json();
            setQrCode(qrData.qrcode);
            console.log('📱 QR Code gerado!');
          }
        } else {
          console.error('❌ Erro ao criar sessão:', response.statusText);
        }
      } catch (error) {
        console.error('❌ Erro na configuração do WPPConnect:', error);
        toast.error('Erro ao conectar com WPPConnect');
      } finally {
        setIsLoading(false);
      }
    };

    if (isOpen) {
      setupWPPConnect();
    }
  }, [isOpen, sessionId]);

  const handleRefresh = async () => {
    setIsLoading(true);
    try {
      // Verificar status da sessão REAL
      const response = await fetch(`http://localhost:21465/api/${sessionId}/check-connection-session`);
      if (response.ok) {
        const data = await response.json();
        setIsConnected(data.status === 'connected');
        if (data.status === 'connected') {
          toast.success('WhatsApp conectado!');
        }
      }
    } catch (error) {
      console.error('Erro ao verificar status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenExternal = () => {
    window.open('https://web.whatsapp.com/', '_blank');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <Card className="w-full max-w-4xl h-[90vh] flex flex-col">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-green-500 to-green-600 shadow-lg">
              <Smartphone className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-xl font-semibold">WPPConnect WhatsApp</CardTitle>
              <p className="text-sm text-muted-foreground">Conecte seu WhatsApp via QR Code</p>
            </div>
            <Badge variant={isConnected ? "default" : "destructive"} className="flex items-center gap-1">
              {isConnected ? <Smartphone className="h-3 w-3" /> : <QrCode className="h-3 w-3" />}
              {isConnected ? 'Conectado' : 'Aguardando QR'}
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
              Verificar
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
        
        <CardContent className="flex-1 p-6">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-green-600" />
                <p className="text-muted-foreground">Conectando ao WPPConnect...</p>
              </div>
            </div>
          ) : qrCode ? (
            <div className="flex flex-col items-center justify-center h-full">
              <div className="text-center mb-6">
                <h3 className="text-lg font-semibold mb-2">Escaneie o QR Code</h3>
                <p className="text-muted-foreground">
                  Abra o WhatsApp no seu celular e escaneie o código abaixo
                </p>
              </div>
              <div className="bg-white p-4 rounded-lg shadow-lg">
                <img 
                  src={`data:image/png;base64,${qrCode}`} 
                  alt="QR Code WhatsApp" 
                  className="w-64 h-64"
                />
              </div>
              <div className="mt-6 text-center">
                <p className="text-sm text-muted-foreground">
                  Sessão: <code className="bg-gray-100 px-2 py-1 rounded">{sessionId}</code>
                </p>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <QrCode className="h-12 w-12 mx-auto mb-4 text-green-600" />
                <p className="text-muted-foreground">Gerando QR Code...</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
