import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Phone, CheckCircle2, XCircle, Clock, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface WhatsAppConnectionWithUser {
  id: string;
  user_id: string;
  user_name: string;
  user_email: string;
  instance_name: string;
  status: string;
  phone: string | null;
  is_active: boolean;
  last_sync_at: string | null;
}

export function SupervisorWhatsAppView() {
  const [connections, setConnections] = useState<WhatsAppConnectionWithUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const loadConnections = async () => {
    try {
      const { data, error } = await supabase
        .from('whatsapp_connections_with_users')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setConnections(data || []);
    } catch (error: any) {
      toast({
        title: 'Erro ao carregar conexões',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadConnections();
    
    // Poll for updates every 10 seconds
    const interval = setInterval(loadConnections, 10000);
    return () => clearInterval(interval);
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'connected':
        return <CheckCircle2 className="h-4 w-4 text-success" />;
      case 'connecting':
        return <Loader2 className="h-4 w-4 animate-spin text-warning" />;
      case 'disconnected':
        return <XCircle className="h-4 w-4 text-destructive" />;
      default:
        return <AlertCircle className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'connected':
        return <Badge variant="default" className="bg-success/10 text-success border-success/20">Conectado</Badge>;
      case 'connecting':
        return <Badge variant="default" className="bg-warning/10 text-warning border-warning/20">Conectando</Badge>;
      case 'disconnected':
        return <Badge variant="destructive">Desconectado</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  if (connections.length === 0) {
    return (
      <Card className="p-6">
        <p className="text-center text-muted-foreground">
          Nenhuma conexão WhatsApp configurada ainda.
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Conexões WhatsApp dos Agentes</h3>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {connections.map((connection) => (
          <Card key={connection.id} className="p-4 space-y-3">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <p className="font-medium">{connection.user_name || 'Sem nome'}</p>
                <p className="text-sm text-muted-foreground">{connection.user_email}</p>
              </div>
              {getStatusIcon(connection.status)}
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Status:</span>
                {getStatusBadge(connection.status)}
              </div>
              
              {connection.phone && (
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="h-3 w-3 text-muted-foreground" />
                  <span>{connection.phone}</span>
                </div>
              )}
              
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="h-3 w-3" />
                <span className="text-xs">
                  Instância: {connection.instance_name}
                </span>
              </div>
              
              {connection.last_sync_at && (
                <p className="text-xs text-muted-foreground">
                  Última sincronização: {new Date(connection.last_sync_at).toLocaleString('pt-BR')}
                </p>
              )}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
