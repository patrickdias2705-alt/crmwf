import { supabase } from '@/integrations/supabase/client';

interface EmitEventOptions {
  type: string;
  payload: any;
  tenant_id?: string;
}

export class RealtimeEmitter {
  private static instance: RealtimeEmitter;
  private channels: Map<string, any> = new Map();

  private constructor() {}

  static getInstance(): RealtimeEmitter {
    if (!this.instance) {
      this.instance = new RealtimeEmitter();
    }
    return this.instance;
  }

  private getChannel(tenant_id: string) {
    const channelKey = `tenant_${tenant_id}`;
    
    if (!this.channels.has(channelKey)) {
      const channel = supabase.channel(channelKey);
      this.channels.set(channelKey, channel);
    }

    return this.channels.get(channelKey);
  }

  async emit({ type, payload, tenant_id }: EmitEventOptions) {
    if (!tenant_id) {
      console.error('❌ Cannot emit realtime event without tenant_id');
      return;
    }

    try {
      const channel = this.getChannel(tenant_id);
      
      const eventData = {
        data: payload,
        timestamp: new Date().toISOString(),
        tenant_id,
      };

      console.log('📤 Emitting realtime event:', type, eventData);

      await channel.send({
        type: 'broadcast',
        event: type,
        payload: eventData,
      });

      console.log('✅ Realtime event emitted successfully');
    } catch (error) {
      console.error('❌ Failed to emit realtime event:', error);
    }
  }

  // Convenience methods for common events
  async emitLeadCreated(lead: any, tenant_id: string) {
    await this.emit({
      type: 'lead.created',
      payload: lead,
      tenant_id,
    });
  }

  async emitLeadStageChanged(lead: any, fromStage: any, toStage: any, tenant_id: string) {
    await this.emit({
      type: 'lead.stage_changed',
      payload: {
        lead,
        from_stage: fromStage,
        to_stage: toStage,
      },
      tenant_id,
    });
  }

  async emitMessageReceived(message: any, conversation: any, lead: any, tenant_id: string) {
    await this.emit({
      type: 'message.received',
      payload: {
        message,
        conversation,
        lead,
        from: lead?.phone || lead?.name,
        text: message.text,
        lead_id: lead?.id,
      },
      tenant_id,
    });
  }

  async emitMessageSent(message: any, conversation: any, lead: any, tenant_id: string) {
    await this.emit({
      type: 'message.sent',
      payload: {
        message,
        conversation,
        lead,
        to: lead?.phone || lead?.name,
        text: message.text,
        lead_id: lead?.id,
      },
      tenant_id,
    });
  }

  async emitConversationStarted(conversation: any, lead: any, tenant_id: string) {
    await this.emit({
      type: 'conversation.started',
      payload: {
        conversation,
        lead,
        lead_id: lead?.id,
      },
      tenant_id,
    });
  }

  async emitLeadScheduled(lead: any, tenant_id: string) {
    await this.emit({
      type: 'lead.scheduled',
      payload: lead,
      tenant_id,
    });
  }

  async emitLeadClosed(lead: any, tenant_id: string) {
    await this.emit({
      type: 'lead.closed',
      payload: lead,
      tenant_id,
    });
  }

  async emitLeadLost(lead: any, reason: string, tenant_id: string) {
    await this.emit({
      type: 'lead.lost',
      payload: {
        lead,
        reason,
      },
      tenant_id,
    });
  }
}

// Export singleton instance
export const realtimeEmitter = RealtimeEmitter.getInstance();