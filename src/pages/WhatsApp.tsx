import React, { useState, useEffect } from 'react';
import { Layout } from '@/components/Layout';
import { WhatsAppInterface } from '@/components/WhatsAppInterface';
import { WhatsAppConnector } from '@/components/WhatsAppConnector';
import { RealWPPConnect } from '@/components/RealWPPConnect';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  MessageSquare,
  Smartphone,
  CheckCircle,
  XCircle,
  QrCode
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { EvolutionApiService } from '@/services/evolutionApi';

export default function WhatsApp() {
  const { user } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const [instanceId, setInstanceId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showWPPConnect, setShowWPPConnect] = useState(false);

  // Verificar status da conexão de forma mais simples
  useEffect(() => {
    console.log('🔍 WhatsApp useEffect executando...');
    
    // Simular verificação simples sem API
    setTimeout(() => {
      console.log('✅ Verificação simulada concluída');
      setIsConnected(false); // Começar como desconectado
    }, 1000);
  }, []);

  const handleConnectionChange = (connected: boolean, newInstanceId?: string) => {
    console.log('🔄 Mudança de conexão detectada:', { connected, newInstanceId });
    setIsConnected(connected);
    if (newInstanceId) {
      setInstanceId(newInstanceId);
    }
  };

  const getStatusBadge = () => {
    if (isConnected) {
      return (
        <Badge variant="default" className="flex items-center gap-1">
          <CheckCircle className="h-3 w-3" />
          Conectado
        </Badge>
      );
    } else {
      return (
        <Badge variant="destructive" className="flex items-center gap-1">
          <XCircle className="h-3 w-3" />
          Desconectado
        </Badge>
      );
    }
  };

  return (
    <Layout>
      <div className="flex-1 space-y-6 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight flex items-center gap-3">
              <MessageSquare className="h-8 w-8" />
              WhatsApp Business
            </h2>
            <p className="text-muted-foreground">
              Gerencie suas conversas e mensagens do WhatsApp
            </p>
          </div>
              <div className="flex items-center gap-3">
                <Button
                  onClick={() => setShowWPPConnect(true)}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <QrCode className="h-4 w-4" />
                  WPPConnect
                </Button>
                {getStatusBadge()}
              </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <WhatsAppConnector onConnectionChange={handleConnectionChange} />
          
          {isConnected && instanceId && (
            <Card>
              <CardHeader>
                <CardTitle>WhatsApp Interface</CardTitle>
              </CardHeader>
              <CardContent>
                <WhatsAppInterface instanceId={instanceId} isConnected={isConnected} />
              </CardContent>
            </Card>
          )}
        </div>

            {/* Modal do WPPConnect (para integração antiga) */}
            <RealWPPConnect
              isOpen={showWPPConnect} 
              onClose={() => setShowWPPConnect(false)} 
            />
      </div>
    </Layout>
  );
}