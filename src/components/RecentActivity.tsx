import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';

interface Activity {
  id: string;
  type: string;
  actor?: string;
  data: any;
  created_at: string;
  lead_id: string;
}

interface RecentActivityProps {
  limit?: number;
}

export function RecentActivity({ limit = 10 }: RecentActivityProps) {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadActivities();
    
    // Subscribe to realtime changes
    const channel = supabase
      .channel('activity-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'lead_events'
        },
        () => {
          loadActivities();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [limit]);

  const loadActivities = async () => {
    try {
      const { data, error } = await supabase
        .from('lead_events')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      setActivities(data || []);
    } catch (error) {
      console.error('Error loading activities:', error);
    } finally {
      setLoading(false);
    }
  };

  const getActivityDescription = (activity: Activity) => {
    switch (activity.type) {
      case 'lead_created':
        return 'Novo lead criado';
      case 'stage_changed':
        return `Movido para estágio: ${activity.data?.new_stage || 'N/A'}`;
      case 'message_sent':
        return 'Mensagem enviada';
      case 'message_received':
        return 'Mensagem recebida';
      case 'scheduled':
        return 'Lead qualificado';
      case 'closed':
        return 'Lead fechado';
      case 'lost':
        return 'Lead perdido';
      default:
        return activity.type;
    }
  };

  const getActivityBadgeVariant = (type: string) => {
    switch (type) {
      case 'lead_created':
        return 'default';
      case 'stage_changed':
        return 'secondary';
      case 'message_sent':
      case 'message_received':
        return 'outline';
      case 'scheduled':
        return 'secondary';
      case 'closed':
        return 'default';
      case 'lost':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  if (loading) {
    return (
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle>Atividade Recente</CardTitle>
          <CardDescription>Últimas ações no sistema</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-6">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border/50">
      <CardHeader>
        <CardTitle>Atividade Recente</CardTitle>
        <CardDescription>Últimas ações no sistema</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities.length === 0 ? (
            <p className="text-center text-muted-foreground py-4">
              Nenhuma atividade recente
            </p>
          ) : (
            activities.map((activity) => (
              <div key={activity.id} className="flex items-start gap-3">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="text-xs">
                    {activity.type.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-sm font-medium">
                      {getActivityDescription(activity)}
                    </p>
                    <Badge 
                      variant={getActivityBadgeVariant(activity.type)}
                      className="text-xs"
                    >
                      {activity.type.replace('_', ' ')}
                    </Badge>
                  </div>
                  
                  {activity.actor && (
                    <p className="text-xs text-muted-foreground mb-1">
                      por {activity.actor}
                    </p>
                  )}
                  
                  <p className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(activity.created_at), {
                      addSuffix: true,
                      locale: ptBR
                    })}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}