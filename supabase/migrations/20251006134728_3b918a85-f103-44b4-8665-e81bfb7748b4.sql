-- ============================================
-- FASE 1: Schema Base (Tenants + Roles)
-- ============================================

-- Criar tabela de tenants
CREATE TABLE IF NOT EXISTS tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  plan TEXT NOT NULL DEFAULT 'free',
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Criar enum de roles
DO $$ BEGIN
  CREATE TYPE app_role AS ENUM ('admin', 'client_owner', 'manager', 'agent', 'viewer');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Criar tabela de roles de usuários (segurança)
CREATE TABLE IF NOT EXISTS user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, tenant_id)
);

-- Atualizar tabela users
ALTER TABLE users 
  ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id),
  ADD COLUMN IF NOT EXISTS role app_role DEFAULT 'agent',
  ADD COLUMN IF NOT EXISTS active BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Remover colunas antigas
ALTER TABLE users DROP COLUMN IF EXISTS access_expires_at;
ALTER TABLE users DROP COLUMN IF EXISTS is_active;

-- ============================================
-- FASE 2: Pipelines (Funil de Vendas)
-- ============================================

CREATE TABLE IF NOT EXISTS pipelines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS stages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  pipeline_id UUID REFERENCES pipelines(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  "order" INTEGER NOT NULL,
  color TEXT DEFAULT '#3B82F6',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Atualizar tabela leads
ALTER TABLE leads
  ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id),
  ADD COLUMN IF NOT EXISTS pipeline_id UUID REFERENCES pipelines(id),
  ADD COLUMN IF NOT EXISTS stage_id UUID REFERENCES stages(id),
  ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'manual',
  ADD COLUMN IF NOT EXISTS external_id TEXT,
  ADD COLUMN IF NOT EXISTS owner_user_id UUID REFERENCES users(id),
  ADD COLUMN IF NOT EXISTS tags JSONB DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS fields JSONB DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- ============================================
-- FASE 3: WhatsApp (Evolution API)
-- ============================================

CREATE TABLE IF NOT EXISTS whatsapp_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  api_url TEXT NOT NULL,
  api_token_encrypted TEXT NOT NULL,
  instance_name TEXT NOT NULL,
  provider TEXT DEFAULT 'evolution',
  status TEXT DEFAULT 'initializing',
  phone TEXT,
  qr_code_url TEXT,
  webhook_url TEXT,
  is_active BOOLEAN DEFAULT true,
  last_sync_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tenant_id, instance_name)
);

CREATE TABLE IF NOT EXISTS conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
  channel TEXT NOT NULL DEFAULT 'whatsapp',
  status TEXT DEFAULT 'open',
  last_message_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Atualizar tabela messages
ALTER TABLE messages
  ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id),
  ADD COLUMN IF NOT EXISTS conversation_id UUID REFERENCES conversations(id),
  ADD COLUMN IF NOT EXISTS text TEXT,
  ADD COLUMN IF NOT EXISTS media_url TEXT,
  ADD COLUMN IF NOT EXISTS wa_message_id TEXT,
  ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';

-- ============================================
-- FASE 4: Eventos e Métricas (n8n)
-- ============================================

CREATE TABLE IF NOT EXISTS lead_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  data JSONB DEFAULT '{}',
  actor TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS metrics_daily (
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  leads_in INTEGER DEFAULT 0,
  leads_attended INTEGER DEFAULT 0,
  booked INTEGER DEFAULT 0,
  closed INTEGER DEFAULT 0,
  refused INTEGER DEFAULT 0,
  lost INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (tenant_id, date)
);

CREATE TABLE IF NOT EXISTS webhooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  secret TEXT NOT NULL,
  events TEXT[] DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- FASE 5: Migração de Dados Existentes
-- ============================================

-- Criar tenant padrão (com cast explícito para UUID)
INSERT INTO tenants (id, name, plan)
VALUES ('550e8400-e29b-41d4-a716-446655440000'::uuid, 'DentecChia', 'professional')
ON CONFLICT (id) DO NOTHING;

-- Atualizar users com tenant_id (com cast explícito)
UPDATE users SET tenant_id = '550e8400-e29b-41d4-a716-446655440000'::uuid
WHERE tenant_id IS NULL;

-- Criar roles para users existentes
INSERT INTO user_roles (user_id, tenant_id, role)
SELECT id, tenant_id, COALESCE(role, 'admin'::app_role)
FROM users
WHERE tenant_id IS NOT NULL
ON CONFLICT (user_id, tenant_id) DO NOTHING;

-- Criar pipeline padrão (com casts explícitos)
INSERT INTO pipelines (id, tenant_id, name, is_default)
VALUES (
  '550e8400-e29b-41d4-a716-446655440001'::uuid, 
  '550e8400-e29b-41d4-a716-446655440000'::uuid, 
  'Pipeline Principal', 
  true
)
ON CONFLICT (id) DO NOTHING;

-- Criar stages padrão (com casts explícitos)
INSERT INTO stages (tenant_id, pipeline_id, name, "order", color)
VALUES
  ('550e8400-e29b-41d4-a716-446655440000'::uuid, '550e8400-e29b-41d4-a716-446655440001'::uuid, 'Lead novo', 1, '#3B82F6'),
  ('550e8400-e29b-41d4-a716-446655440000'::uuid, '550e8400-e29b-41d4-a716-446655440001'::uuid, 'Atendido', 2, '#10B981'),
  ('550e8400-e29b-41d4-a716-446655440000'::uuid, '550e8400-e29b-41d4-a716-446655440001'::uuid, 'Agendado', 3, '#F59E0B'),
  ('550e8400-e29b-41d4-a716-446655440000'::uuid, '550e8400-e29b-41d4-a716-446655440001'::uuid, 'Fechado', 4, '#8B5CF6'),
  ('550e8400-e29b-41d4-a716-446655440000'::uuid, '550e8400-e29b-41d4-a716-446655440001'::uuid, 'Recusado', 5, '#EF4444'),
  ('550e8400-e29b-41d4-a716-446655440000'::uuid, '550e8400-e29b-41d4-a716-446655440001'::uuid, 'Perdido', 6, '#6B7280')
ON CONFLICT DO NOTHING;

-- Atualizar leads com tenant_id, pipeline_id e stage_id (com casts)
UPDATE leads SET
  tenant_id = '550e8400-e29b-41d4-a716-446655440000'::uuid,
  pipeline_id = '550e8400-e29b-41d4-a716-446655440001'::uuid,
  stage_id = (SELECT id FROM stages WHERE name = 'Lead novo' LIMIT 1)
WHERE tenant_id IS NULL;

-- Criar conversas para leads com mensagens (com cast)
INSERT INTO conversations (tenant_id, lead_id, channel, last_message_at)
SELECT DISTINCT 
  '550e8400-e29b-41d4-a716-446655440000'::uuid, 
  lead_id, 
  'whatsapp', 
  MAX(created_at)
FROM messages
WHERE lead_id IS NOT NULL
GROUP BY lead_id
ON CONFLICT DO NOTHING;

-- Atualizar messages (com cast)
UPDATE messages m SET
  tenant_id = '550e8400-e29b-41d4-a716-446655440000'::uuid,
  conversation_id = c.id,
  text = COALESCE(m.content, '')
FROM conversations c
WHERE c.lead_id = m.lead_id AND m.tenant_id IS NULL;

-- ============================================
-- FASE 6: RLS Helper Functions (NO SCHEMA PUBLIC)
-- ============================================

-- Função helper para pegar tenant do usuário
CREATE OR REPLACE FUNCTION public.get_user_tenant_id()
RETURNS UUID
LANGUAGE SQL
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT tenant_id FROM users WHERE id = auth.uid() LIMIT 1;
$$;

-- Função helper para verificar role
CREATE OR REPLACE FUNCTION public.has_role(_role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid()
      AND role = _role
  );
$$;

-- ============================================
-- FASE 7: RLS Policies
-- ============================================

-- Habilitar RLS em todas as tabelas
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE pipelines ENABLE ROW LEVEL SECURITY;
ALTER TABLE stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE metrics_daily ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;

-- Políticas para tenants
DROP POLICY IF EXISTS "Users can view their tenant" ON tenants;
CREATE POLICY "Users can view their tenant"
  ON tenants FOR SELECT
  USING (id = public.get_user_tenant_id());

-- Políticas para users
DROP POLICY IF EXISTS "Users can view users in their tenant" ON users;
CREATE POLICY "Users can view users in their tenant"
  ON users FOR SELECT
  USING (tenant_id = public.get_user_tenant_id());

DROP POLICY IF EXISTS "Admins can manage users" ON users;
CREATE POLICY "Admins can manage users"
  ON users FOR ALL
  USING (public.has_role('admin'::app_role));

-- Políticas para leads
DROP POLICY IF EXISTS "Users can view leads in their tenant" ON leads;
CREATE POLICY "Users can view leads in their tenant"
  ON leads FOR SELECT
  USING (tenant_id = public.get_user_tenant_id());

DROP POLICY IF EXISTS "Users can create leads" ON leads;
CREATE POLICY "Users can create leads"
  ON leads FOR INSERT
  WITH CHECK (tenant_id = public.get_user_tenant_id());

DROP POLICY IF EXISTS "Users can update leads" ON leads;
CREATE POLICY "Users can update leads"
  ON leads FOR UPDATE
  USING (tenant_id = public.get_user_tenant_id());

-- Políticas para pipelines
DROP POLICY IF EXISTS "Users can view pipelines" ON pipelines;
CREATE POLICY "Users can view pipelines"
  ON pipelines FOR SELECT
  USING (tenant_id = public.get_user_tenant_id());

-- Políticas para stages
DROP POLICY IF EXISTS "Users can view stages" ON stages;
CREATE POLICY "Users can view stages"
  ON stages FOR SELECT
  USING (tenant_id = public.get_user_tenant_id());

-- Políticas para conversations
DROP POLICY IF EXISTS "Users can view conversations" ON conversations;
CREATE POLICY "Users can view conversations"
  ON conversations FOR SELECT
  USING (tenant_id = public.get_user_tenant_id());

-- Políticas para messages
DROP POLICY IF EXISTS "Users can view messages" ON messages;
CREATE POLICY "Users can view messages"
  ON messages FOR SELECT
  USING (tenant_id = public.get_user_tenant_id());

DROP POLICY IF EXISTS "Users can create messages" ON messages;
CREATE POLICY "Users can create messages"
  ON messages FOR INSERT
  WITH CHECK (tenant_id = public.get_user_tenant_id());

-- Políticas para whatsapp_connections
DROP POLICY IF EXISTS "Users can view whatsapp connections" ON whatsapp_connections;
CREATE POLICY "Users can view whatsapp connections"
  ON whatsapp_connections FOR SELECT
  USING (tenant_id = public.get_user_tenant_id());

DROP POLICY IF EXISTS "Admins can manage whatsapp" ON whatsapp_connections;
CREATE POLICY "Admins can manage whatsapp"
  ON whatsapp_connections FOR ALL
  USING (public.has_role('admin'::app_role));

-- Políticas para activities
DROP POLICY IF EXISTS "Users can view activities" ON activities;
CREATE POLICY "Users can view activities"
  ON activities FOR SELECT
  USING (true);

-- Políticas para budgets
DROP POLICY IF EXISTS "Users can view budgets" ON budgets;
CREATE POLICY "Users can view budgets"
  ON budgets FOR SELECT
  USING (true);

-- ============================================
-- FASE 8: Triggers
-- ============================================

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar triggers
DROP TRIGGER IF EXISTS update_tenants_updated_at ON tenants;
CREATE TRIGGER update_tenants_updated_at
  BEFORE UPDATE ON tenants
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_pipelines_updated_at ON pipelines;
CREATE TRIGGER update_pipelines_updated_at
  BEFORE UPDATE ON pipelines
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_stages_updated_at ON stages;
CREATE TRIGGER update_stages_updated_at
  BEFORE UPDATE ON stages
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_leads_updated_at ON leads;
CREATE TRIGGER update_leads_updated_at
  BEFORE UPDATE ON leads
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_whatsapp_connections_updated_at ON whatsapp_connections;
CREATE TRIGGER update_whatsapp_connections_updated_at
  BEFORE UPDATE ON whatsapp_connections
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger para criar user role automaticamente
CREATE OR REPLACE FUNCTION create_default_user_role()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.tenant_id IS NOT NULL THEN
    INSERT INTO user_roles (user_id, tenant_id, role)
    VALUES (NEW.id, NEW.tenant_id, COALESCE(NEW.role, 'agent'::app_role))
    ON CONFLICT (user_id, tenant_id) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS create_user_role_on_user_insert ON users;
CREATE TRIGGER create_user_role_on_user_insert
  AFTER INSERT ON users
  FOR EACH ROW
  EXECUTE FUNCTION create_default_user_role();

-- ============================================
-- FASE 9: Índices para Performance
-- ============================================

CREATE INDEX IF NOT EXISTS idx_users_tenant_id ON users(tenant_id);
CREATE INDEX IF NOT EXISTS idx_leads_tenant_id ON leads(tenant_id);
CREATE INDEX IF NOT EXISTS idx_leads_stage_id ON leads(stage_id);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_conversations_lead_id ON conversations(lead_id);
CREATE INDEX IF NOT EXISTS idx_lead_events_lead_id ON lead_events(lead_id);
CREATE INDEX IF NOT EXISTS idx_stages_pipeline_id ON stages(pipeline_id);
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON leads(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_conversations_last_message_at ON conversations(last_message_at DESC);