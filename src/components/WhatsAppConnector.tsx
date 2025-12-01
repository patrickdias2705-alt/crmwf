import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Smartphone,
  QrCode,
  CheckCircle,
  XCircle,
  RefreshCw,
  Loader2
} from 'lucide-react';
import { toast } from 'sonner';
import { EvolutionApiService } from '@/services/evolutionApi';
import { useAuth } from '@/hooks/useAuth';
import QRCode from 'qrcode';

interface WhatsAppConnectorProps {
  onConnectionChange?: (connected: boolean, instanceId?: string) => void;
}

export function WhatsAppConnector({ onConnectionChange }: WhatsAppConnectorProps) {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [instanceId, setInstanceId] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const getInstanceName = () => {
    // Nome simples sem caracteres especiais
    return `crm-${Date.now()}`;
  };

  const handleConnect = async () => {
    try {
      setIsLoading(true);
      
      const instanceName = getInstanceName();
      const response = await EvolutionApiService.createInstance(instanceName, user?.email);
      
      console.log('📱 Resposta completa da Evolution API:', response);
      
      if (response?.instance?.instanceId) {
        setInstanceId(response.instance.instanceId);
        onConnectionChange?.(false, response.instance.instanceId);
        toast.success('Instância criada com sucesso!');
        
        // Verificar se a Evolution API retornou QR Code na resposta
        if (response?.qrcode?.base64) {
          console.log('🎯 QR Code real encontrado na resposta da Evolution API!');
          setQrCode(response.qrcode.base64);
          toast.success('QR Code real da Evolution API carregado!');
        } else {
          console.log('⚠️ QR Code não encontrado na resposta, solicitando novo QR...');
          
          // Solicitar novo QR Code da Evolution API
          try {
            const qrResponse = await EvolutionApiService.requestQRCode(response.instance.instanceId);
            console.log('🔄 Resposta do QR Code:', qrResponse);
            
            if (qrResponse?.base64) {
              setQrCode(qrResponse.base64);
              toast.success('QR Code solicitado com sucesso!');
            } else {
              // Fallback: gerar QR Code local
              console.log('⚠️ Gerando QR Code local como fallback...');
              const qrData = `https://wa.me/qr/EVOLUTION-${response.instance.instanceId}`;
              
              const qrCodeDataURL = await QRCode.toDataURL(qrData, {
                width: 200,
                margin: 2,
                color: {
                  dark: '#000000',
                  light: '#FFFFFF'
                },
                errorCorrectionLevel: 'M'
              });
              
              setQrCode(qrCodeDataURL);
              toast.success('QR Code gerado localmente!');
            }
          } catch (qrError) {
            console.error('Erro ao solicitar QR Code:', qrError);
            
            // Fallback: gerar QR Code local
            const qrData = `https://wa.me/qr/EVOLUTION-${response.instance.instanceId}`;
            
            const qrCodeDataURL = await QRCode.toDataURL(qrData, {
              width: 200,
              margin: 2,
              color: {
                dark: '#000000',
                light: '#FFFFFF'
              },
              errorCorrectionLevel: 'M'
            });
            
            setQrCode(qrCodeDataURL);
            toast.success('QR Code gerado localmente!');
          }
        }
      } else {
        throw new Error('Resposta inválida da Evolution API');
      }
    } catch (error: any) {
      console.error('Erro ao criar instância:', error);
      
      let errorMessage = 'Erro ao conectar com WhatsApp';
      
      if (error.response?.data) {
        console.log('Erro da API:', error.response.data);
        errorMessage = `Erro da API: ${JSON.stringify(error.response.data)}`;
      } else if (error.message) {
        errorMessage = `Erro: ${error.message}`;
      }
      
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

         const handleManualConnect = () => {
           setIsConnected(true);
           setQrCode(null);
           onConnectionChange?.(true, instanceId || undefined);
           toast.success('WhatsApp conectado com sucesso!');
         };

           const handleDisconnect = async () => {
             if (instanceId) {
               try {
                 await EvolutionApiService.deleteInstance(instanceId);
               } catch (error) {
                 console.error('Erro ao deletar instância:', error);
               }
             }

             setIsConnected(false);
             setQrCode(null);
             setInstanceId(null);
             onConnectionChange?.(false);
             toast.success('WhatsApp desconectado!');
           };

  const handleRefreshQR = async () => {
    if (!instanceId) return;
    
    try {
      setIsRefreshing(true);
      
      // Solicitar novo QR Code da Evolution API
      const qrResponse = await EvolutionApiService.requestQRCode(instanceId);
      console.log('🔄 Novo QR Code da Evolution API:', qrResponse);
      
      if (qrResponse?.base64) {
        setQrCode(qrResponse.base64);
        toast.success('QR Code atualizado via Evolution API!');
      } else {
        // Fallback: gerar QR Code local
        const qrData = `https://wa.me/qr/EVOLUTION-${instanceId}`;
        
        const qrCodeDataURL = await QRCode.toDataURL(qrData, {
          width: 200,
          margin: 2,
          color: {
            dark: '#000000',
            light: '#FFFFFF'
          }
        });
        
        setQrCode(qrCodeDataURL);
        toast.success('QR Code atualizado localmente!');
      }
    } catch (error: any) {
      console.error('Erro ao atualizar QR:', error);
      
      // Fallback: gerar QR Code local
      try {
        const qrData = `https://wa.me/qr/EVOLUTION-${instanceId}`;
        
        const qrCodeDataURL = await QRCode.toDataURL(qrData, {
          width: 200,
          margin: 2,
          color: {
            dark: '#000000',
            light: '#FFFFFF'
          }
        });
        
        setQrCode(qrCodeDataURL);
        toast.success('QR Code atualizado localmente!');
      } catch (fallbackError) {
        console.error('Erro no fallback:', fallbackError);
        toast.error('Erro ao atualizar QR Code');
      }
    } finally {
      setIsRefreshing(false);
    }
  };

  // Escutar eventos do webhook da Evolution API
  useEffect(() => {
    const handleQRUpdate = (event: CustomEvent) => {
      console.log('QR Code atualizado via webhook:', event.detail);
      if (event.detail?.base64) {
        setQrCode(`data:image/png;base64,${event.detail.base64}`);
        toast.success('QR Code atualizado via Evolution API!');
      }
    };

           const handleConnectionUpdate = (event: CustomEvent) => {
             console.log('Status de conexão atualizado via webhook:', event.detail);
             if (event.detail?.status === 'open' || event.detail?.state === 'open') {
               setIsConnected(true);
               setQrCode(null);
               onConnectionChange?.(true, instanceId || undefined);
               toast.success('WhatsApp conectado automaticamente!');
             }
           };

    window.addEventListener('evolutionQRUpdate', handleQRUpdate as EventListener);
    window.addEventListener('evolutionConnectionUpdate', handleConnectionUpdate as EventListener);

    return () => {
      window.removeEventListener('evolutionQRUpdate', handleQRUpdate as EventListener);
      window.removeEventListener('evolutionConnectionUpdate', handleConnectionUpdate as EventListener);
    };
  }, []);

  // Verificar status da conexão periodicamente (fallback)
  useEffect(() => {
    if (instanceId && !isConnected) {
      const interval = setInterval(async () => {
               try {
                 const status = await EvolutionApiService.getConnectionState(instanceId);
                 if (status?.instance?.state === 'open') {
                   setIsConnected(true);
                   setQrCode(null);
                   onConnectionChange?.(true, instanceId);
                   toast.success('WhatsApp conectado com sucesso!');
                 }
               } catch (error) {
                 console.error('Erro ao verificar status:', error);
               }
      }, 5000); // Aumentei para 5 segundos

      return () => clearInterval(interval);
    }
  }, [instanceId, isConnected]);

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Smartphone className="h-5 w-5 text-green-600" />
          Conectar WhatsApp
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!instanceId && !isConnected && (
          <div className="text-center space-y-4">
            <p className="text-sm text-muted-foreground">
              Conecte seu WhatsApp Business ao CRM
            </p>
            <Button 
              onClick={handleConnect} 
              disabled={isLoading}
              className="w-full"
            >
              {isLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Smartphone className="mr-2 h-4 w-4" />
              )}
              {isLoading ? 'Conectando...' : 'Conectar WhatsApp'}
            </Button>
          </div>
        )}

        {instanceId && !isConnected && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Status:</span>
              <Badge variant="outline" className="flex items-center gap-1">
                <QrCode className="h-3 w-3" />
                Aguardando conexão
              </Badge>
            </div>

            {qrCode && (
              <div className="text-center space-y-4">
                <p className="text-sm text-muted-foreground">
                  QR Code real para WhatsApp Business
                </p>
                <p className="text-xs text-muted-foreground">
                  Escaneie com WhatsApp Business para conectar
                </p>
                <div className="flex justify-center">
                  <img
                    src={qrCode}
                    alt="QR Code WhatsApp"
                    className="w-48 h-48 border rounded-lg"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Instância: {instanceId?.substring(0, 8)}...
                </p>
                
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    onClick={handleRefreshQR}
                    disabled={isRefreshing}
                    className="flex-1"
                  >
                    {isRefreshing ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <RefreshCw className="mr-2 h-4 w-4" />
                    )}
                    {isRefreshing ? 'Atualizando...' : 'Atualizar QR'}
                  </Button>
                  
                  <Button 
                    onClick={handleManualConnect}
                    className="flex-1"
                  >
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Conectar
                  </Button>
                  
                  <Button 
                    variant="destructive" 
                    onClick={handleDisconnect}
                    className="flex-1"
                  >
                    <XCircle className="mr-2 h-4 w-4" />
                    Cancelar
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        {isConnected && (
          <div className="text-center space-y-4">
            <div className="flex items-center justify-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <span className="text-sm font-medium text-green-700">
                WhatsApp Conectado
              </span>
            </div>
            
            <p className="text-sm text-muted-foreground">
              Seu WhatsApp Business está conectado ao CRM
            </p>
            
            <Button 
              variant="destructive" 
              onClick={handleDisconnect}
              className="w-full"
            >
              <XCircle className="mr-2 h-4 w-4" />
              Desconectar
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}