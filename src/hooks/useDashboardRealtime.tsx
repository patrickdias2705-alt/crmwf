import { useCallback } from 'react';
import { useRealtimeSubscription } from './useRealtimeSubscription';

interface DashboardMetrics {
  leads_received: number;
  leads_attended: number;
  leads_scheduled: number;
  leads_closed: number;
  leads_refused: number;
  leads_lost: number;
  conversion_rate: number;
}

interface UseDashboardRealtimeOptions {
  onMetricsUpdate: (updater: (prev: DashboardMetrics) => DashboardMetrics) => void;
  onNewLead: (lead: any) => void;
  onNewActivity: (activity: any) => void;
}

export function useDashboardRealtime({ 
  onMetricsUpdate, 
  onNewLead, 
  onNewActivity 
}: UseDashboardRealtimeOptions) {
  
  const handleRealtimeEvent = useCallback((event: any) => {
    console.log('📊 Dashboard realtime event:', event.type, event.payload);

    switch (event.type) {
      case 'lead.created':
        // Increment leads received
        onMetricsUpdate(prev => ({
          ...prev,
          leads_received: prev.leads_received + 1,
          conversion_rate: prev.leads_received > 0 
            ? (prev.leads_closed / (prev.leads_received + 1)) * 100 
            : 0
        }));
        onNewLead(event.payload);
        onNewActivity({
          id: `activity_${Date.now()}`,
          type: 'lead_created',
          actor: event.payload.source || 'System',
          data: event.payload,
          created_at: event.timestamp,
          lead_id: event.payload.id
        });
        break;

      case 'lead.stage_changed':
        const { from_stage, to_stage, lead } = event.payload;
        
        // Update metrics based on stage changes
        onMetricsUpdate(prev => {
          console.log('🔄 Stage change:', from_stage?.name, '->', to_stage?.name);
          
          // Create a new metrics object based on previous
          const newMetrics = { ...prev };
          
          // Helper to check if stage is final
          const isFinalStage = (name: string) => {
            const lowerName = name?.toLowerCase() || '';
            return lowerName.includes('bolso') ||
                   lowerName.includes('mesa') ||
                   lowerName.includes('recusado');
          };
          
          // Helper to get stage type
          const getStageType = (name: string) => {
            const lowerName = name?.toLowerCase() || '';
            if (lowerName.includes('bolso')) return 'closed';
            if (lowerName.includes('mesa')) return 'lost';
            if (lowerName.includes('recusado')) return 'refused';
            return null;
          };
          
          // Decrement when leaving a final stage
          if (from_stage && isFinalStage(from_stage.name)) {
            const fromType = getStageType(from_stage.name);
            console.log('📉 Decrementar estágio final:', fromType);
            if (fromType === 'closed') {
              newMetrics.leads_closed = Math.max(0, (newMetrics.leads_closed || 0) - 1);
            } else if (fromType === 'refused') {
              newMetrics.leads_refused = Math.max(0, (newMetrics.leads_refused || 0) - 1);
            } else if (fromType === 'lost') {
              newMetrics.leads_lost = Math.max(0, (newMetrics.leads_lost || 0) - 1);
            }
          }
          
          // Increment when entering any stage (cumulative for non-final)
          if (to_stage) {
            const toName = to_stage.name.toLowerCase();
            
            // Cumulative metrics for intermediate stages
            if (toName.includes('contato') || toName.includes('atendido')) {
              console.log('📈 Incrementar atendidos');
              newMetrics.leads_attended = (newMetrics.leads_attended || 0) + 1;
            }
            if (toName.includes('qualificado')) {
              console.log('📈 Incrementar qualificados');
              newMetrics.leads_scheduled = (newMetrics.leads_scheduled || 0) + 1;
            }
            
            // Final stage metrics (only current count)
            if (isFinalStage(to_stage.name)) {
              const toType = getStageType(to_stage.name);
              console.log('📈 Incrementar estágio final:', toType);
              if (toType === 'closed') {
                newMetrics.leads_closed = (newMetrics.leads_closed || 0) + 1;
              } else if (toType === 'refused') {
                newMetrics.leads_refused = (newMetrics.leads_refused || 0) + 1;
              } else if (toType === 'lost') {
                newMetrics.leads_lost = (newMetrics.leads_lost || 0) + 1;
              }
            }
          }
          
          // Recalculate conversion rate
          if (newMetrics.leads_received > 0) {
            newMetrics.conversion_rate = (newMetrics.leads_closed / newMetrics.leads_received) * 100;
          }
          
          console.log('📊 Novas métricas:', newMetrics);
          return newMetrics;
        });

        onNewActivity({
          id: `activity_${Date.now()}`,
          type: 'stage_changed',
          actor: event.user_id ? 'User' : 'System',
          data: { from_stage: from_stage?.name, to_stage: to_stage?.name },
          created_at: event.timestamp,
          lead_id: lead?.id
        });
        break;

      case 'message.received':
        onNewActivity({
          id: `activity_${Date.now()}`,
          type: 'message_received',
          actor: 'WhatsApp',
          data: { 
            text: event.payload.text?.substring(0, 50) + '...',
            from: event.payload.from 
          },
          created_at: event.timestamp,
          lead_id: event.payload.lead_id
        });
        break;

      case 'message.sent':
        onNewActivity({
          id: `activity_${Date.now()}`,
          type: 'message_sent',
          actor: event.user_id ? 'User' : 'System',
          data: { 
            text: event.payload.text?.substring(0, 50) + '...',
            to: event.payload.to 
          },
          created_at: event.timestamp,
          lead_id: event.payload.lead_id
        });
        break;

      case 'conversation.started':
        onNewActivity({
          id: `activity_${Date.now()}`,
          type: 'conversation_started',
          actor: 'WhatsApp',
          data: event.payload,
          created_at: event.timestamp,
          lead_id: event.payload.lead_id
        });
        break;

      default:
        console.log('📊 Unhandled dashboard event:', event.type);
    }
  }, [onMetricsUpdate, onNewLead, onNewActivity]);

  const { isConnected } = useRealtimeSubscription({
    events: [
      'lead.created',
      'lead.stage_changed', 
      'message.received',
      'message.sent',
      'conversation.started',
      'lead.scheduled',
      'lead.closed',
      'lead.lost'
    ],
    onEvent: handleRealtimeEvent
  });

  return { isConnected };
}