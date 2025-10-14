// Database helper functions and types for the CRM system
import { supabase } from "@/integrations/supabase/client";

// Database Types
export type AppRole = 'admin' | 'client_owner' | 'manager' | 'agent' | 'viewer' | 'supervisor';
export type LeadSource = 'whatsapp' | 'manual' | 'import' | 'n8n' | 'api';
export type ConversationStatus = 'open' | 'closed' | 'paused';
export type MessageDirection = 'inbound' | 'outbound';

export interface Tenant {
  id: string;
  name: string;
  plan: string;
  created_at: string;
  updated_at: string;
}

export interface User {
  id: string;
  tenant_id: string;
  name: string;
  email: string;
  role: AppRole;
  password_hash?: string;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface WhatsAppConnection {
  id: string;
  tenant_id: string;
  provider: string;
  status: string;
  phone?: string;
  qr_code_url?: string;
  base_url?: string;
  token?: string;
  last_sync_at?: string;
  created_at: string;
  updated_at: string;
}

export interface Pipeline {
  id: string;
  tenant_id: string;
  name: string;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export interface Stage {
  id: string;
  tenant_id: string;
  pipeline_id: string;
  name: string;
  order: number;
  created_at: string;
  updated_at: string;
}

export interface Lead {
  id: string;
  tenant_id: string;
  external_id?: string;
  name: string;
  phone?: string;
  email?: string;
  source: LeadSource;
  owner_user_id?: string;
  pipeline_id: string;
  stage_id: string;
  tags: any;
  fields: any;
  created_at: string;
  updated_at: string;
}

export interface LeadEvent {
  id: string;
  tenant_id: string;
  lead_id: string;
  type: string;
  data: any;
  actor?: string;
  created_at: string;
}

export interface Conversation {
  id: string;
  tenant_id: string;
  lead_id: string;
  channel: string;
  last_message_at?: string;
  status: ConversationStatus;
  created_at: string;
  updated_at: string;
}

export interface Message {
  id: string;
  tenant_id: string;
  conversation_id: string;
  direction: MessageDirection;
  text?: string;
  media_url?: string;
  wa_message_id?: string;
  created_at: string;
}

export interface MetricsDaily {
  tenant_id: string;
  date: string;
  leads_in: number;
  leads_attended: number;
  booked: number;
  closed: number;
  refused: number;
  lost: number;
}

// Helper functions for tenant security
export const assertTenant = async (): Promise<string> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error('User not authenticated');
  }
  
  // In a real app, this would be stored in JWT or user metadata
  // For now, using the demo tenant ID
  return '550e8400-e29b-41d4-a716-446655440000';
};

export const requireRole = async (roles: AppRole[]): Promise<boolean> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error('User not authenticated');
  }

  const tenantId = await assertTenant();
  
  const { data: userData, error } = await supabase
    .from('users')
    .select('role, active')
    .eq('id', user.id)
    .eq('tenant_id', tenantId)
    .single();

  if (error || !userData || !userData.active) {
    throw new Error('User not found or inactive');
  }

  if (!roles.includes(userData.role as AppRole)) {
    throw new Error('Insufficient permissions');
  }

  return true;
};

// Database query helpers with automatic tenant filtering
export const dbHelpers = {
  // Get current user's tenant
  getTenant: async (): Promise<Tenant | null> => {
    const tenantId = await assertTenant();
    const { data, error } = await supabase
      .from('tenants')
      .select('*')
      .eq('id', tenantId)
      .single();
    
    if (error) throw error;
    return data;
  },

  // Get users in current tenant
  getUsers: async (): Promise<User[]> => {
    const tenantId = await assertTenant();
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  },

  // Get pipelines in current tenant
  getPipelines: async (): Promise<Pipeline[]> => {
    const tenantId = await assertTenant();
    const { data, error } = await supabase
      .from('pipelines')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  },

  // Get stages for a pipeline
  getStages: async (pipelineId: string): Promise<Stage[]> => {
    const tenantId = await assertTenant();
    const { data, error } = await supabase
      .from('stages')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('pipeline_id', pipelineId)
      .order('order', { ascending: true });
    
    if (error) throw error;
    return data || [];
  },

  // Get leads in current tenant
  getLeads: async (): Promise<Lead[]> => {
    const tenantId = await assertTenant();
    const { data, error } = await supabase
      .from('leads')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return (data || []) as Lead[];
  },

  // Get conversations for current tenant
  getConversations: async (): Promise<Conversation[]> => {
    const tenantId = await assertTenant();
    const { data, error } = await supabase
      .from('conversations')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('last_message_at', { ascending: false });
    
    if (error) throw error;
    return (data || []) as Conversation[];
  },

  // Get messages for a conversation
  getMessages: async (conversationId: string): Promise<Message[]> => {
    const tenantId = await assertTenant();
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });
    
    if (error) throw error;
    return (data || []) as Message[];
  },

  // Get WhatsApp connections
  getWhatsAppConnections: async (): Promise<WhatsAppConnection[]> => {
    const tenantId = await assertTenant();
    const { data, error } = await supabase
      .from('whatsapp_connections')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  },

  // Get daily metrics
  getMetricsDaily: async (startDate: string, endDate: string): Promise<MetricsDaily[]> => {
    const tenantId = await assertTenant();
    const { data, error } = await supabase
      .from('metrics_daily')
      .select('*')
      .eq('tenant_id', tenantId)
      .gte('date', startDate)
      .lte('date', endDate)
      .order('date', { ascending: true });
    
    if (error) throw error;
    return data || [];
  }
};

// Realtime subscription helpers
export const subscribeToTable = (
  table: string,
  callback: (payload: any) => void,
  event: 'INSERT' | 'UPDATE' | 'DELETE' | '*' = '*'
) => {
  return supabase
    .channel(`${table}-changes`)
    .on(
      'postgres_changes' as any,
      {
        event,
        schema: 'public',
        table
      },
      callback
    )
    .subscribe();
};