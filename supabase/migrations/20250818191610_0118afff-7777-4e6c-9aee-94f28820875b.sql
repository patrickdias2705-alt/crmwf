-- Multi-tenant CRM Schema with RLS
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create app_role enum
CREATE TYPE app_role AS ENUM ('admin', 'client_owner', 'manager', 'agent', 'viewer');

-- Create lead_source enum
CREATE TYPE lead_source AS ENUM ('whatsapp', 'manual', 'import', 'n8n', 'api');

-- Create conversation_status enum
CREATE TYPE conversation_status AS ENUM ('open', 'closed', 'paused');

-- Create message_direction enum
CREATE TYPE message_direction AS ENUM ('inbound', 'outbound');

-- Tenants table
CREATE TABLE public.tenants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    plan TEXT NOT NULL DEFAULT 'starter',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Users table
CREATE TABLE public.users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    role app_role NOT NULL DEFAULT 'viewer',
    password_hash TEXT,
    active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(tenant_id, email)
);

-- WhatsApp connections table
CREATE TABLE public.whatsapp_connections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    provider TEXT NOT NULL DEFAULT 'evolution',
    status TEXT NOT NULL DEFAULT 'disconnected',
    phone TEXT,
    qr_code_url TEXT,
    base_url TEXT,
    token TEXT,
    last_sync_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Pipelines table
CREATE TABLE public.pipelines (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    is_default BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Stages table
CREATE TABLE public.stages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    pipeline_id UUID NOT NULL REFERENCES public.pipelines(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(tenant_id, pipeline_id, "order")
);

-- Leads table
CREATE TABLE public.leads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    external_id TEXT,
    name TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    source lead_source NOT NULL DEFAULT 'manual',
    owner_user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    pipeline_id UUID NOT NULL REFERENCES public.pipelines(id) ON DELETE RESTRICT,
    stage_id UUID NOT NULL REFERENCES public.stages(id) ON DELETE RESTRICT,
    tags JSONB DEFAULT '[]'::jsonb,
    fields JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Lead events table
CREATE TABLE public.lead_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    data JSONB DEFAULT '{}'::jsonb,
    actor TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Conversations table
CREATE TABLE public.conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
    channel TEXT NOT NULL DEFAULT 'whatsapp',
    last_message_at TIMESTAMPTZ,
    status conversation_status NOT NULL DEFAULT 'open',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Messages table
CREATE TABLE public.messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
    direction message_direction NOT NULL,
    text TEXT,
    media_url TEXT,
    wa_message_id TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Metrics daily table
CREATE TABLE public.metrics_daily (
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    leads_in INTEGER NOT NULL DEFAULT 0,
    leads_attended INTEGER NOT NULL DEFAULT 0,
    booked INTEGER NOT NULL DEFAULT 0,
    closed INTEGER NOT NULL DEFAULT 0,
    refused INTEGER NOT NULL DEFAULT 0,
    lost INTEGER NOT NULL DEFAULT 0,
    PRIMARY KEY (tenant_id, date)
);

-- Create indexes for performance
CREATE INDEX idx_users_tenant_id_email ON public.users(tenant_id, email);
CREATE INDEX idx_whatsapp_connections_tenant_id ON public.whatsapp_connections(tenant_id);
CREATE INDEX idx_pipelines_tenant_id_default ON public.pipelines(tenant_id, is_default);
CREATE INDEX idx_stages_tenant_id_pipeline_order ON public.stages(tenant_id, pipeline_id, "order");
CREATE INDEX idx_leads_tenant_id_created_at ON public.leads(tenant_id, created_at);
CREATE INDEX idx_leads_tenant_id_stage_id ON public.leads(tenant_id, stage_id);
CREATE INDEX idx_lead_events_tenant_id_created_at ON public.lead_events(tenant_id, created_at);
CREATE INDEX idx_lead_events_lead_id ON public.lead_events(lead_id);
CREATE INDEX idx_conversations_tenant_id_lead_id ON public.conversations(tenant_id, lead_id);
CREATE INDEX idx_messages_tenant_id_created_at ON public.messages(tenant_id, created_at);
CREATE INDEX idx_messages_conversation_id ON public.messages(conversation_id);

-- Trigger function for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add updated_at triggers
CREATE TRIGGER update_tenants_updated_at BEFORE UPDATE ON public.tenants FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_whatsapp_connections_updated_at BEFORE UPDATE ON public.whatsapp_connections FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_pipelines_updated_at BEFORE UPDATE ON public.pipelines FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_stages_updated_at BEFORE UPDATE ON public.stages FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_leads_updated_at BEFORE UPDATE ON public.leads FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_conversations_updated_at BEFORE UPDATE ON public.conversations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();