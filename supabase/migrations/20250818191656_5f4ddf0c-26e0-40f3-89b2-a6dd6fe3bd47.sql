-- Enable RLS on all tables
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pipelines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.metrics_daily ENABLE ROW LEVEL SECURITY;

-- Create helper function to get user's tenant_id
CREATE OR REPLACE FUNCTION public.get_user_tenant_id()
RETURNS UUID AS $$
BEGIN
  RETURN (auth.jwt() ->> 'tenant_id')::UUID;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Create helper function to check if user has role
CREATE OR REPLACE FUNCTION public.has_role(required_role app_role)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() 
    AND role = required_role 
    AND active = true
  );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Tenants RLS policies
CREATE POLICY "Users can only see their own tenant" ON public.tenants
  FOR ALL USING (id = public.get_user_tenant_id());

-- Users RLS policies  
CREATE POLICY "Users can see users in their tenant" ON public.users
  FOR SELECT USING (tenant_id = public.get_user_tenant_id());

CREATE POLICY "Users can update themselves" ON public.users
  FOR UPDATE USING (id = auth.uid() AND tenant_id = public.get_user_tenant_id());

CREATE POLICY "Admins can manage users in their tenant" ON public.users
  FOR ALL USING (
    tenant_id = public.get_user_tenant_id() 
    AND (public.has_role('admin'::app_role) OR public.has_role('client_owner'::app_role))
  );

-- WhatsApp connections RLS policies
CREATE POLICY "Users can see whatsapp connections in their tenant" ON public.whatsapp_connections
  FOR SELECT USING (tenant_id = public.get_user_tenant_id());

CREATE POLICY "Managers can manage whatsapp connections" ON public.whatsapp_connections
  FOR ALL USING (
    tenant_id = public.get_user_tenant_id() 
    AND (public.has_role('admin'::app_role) OR public.has_role('client_owner'::app_role) OR public.has_role('manager'::app_role))
  );

-- Pipelines RLS policies
CREATE POLICY "Users can see pipelines in their tenant" ON public.pipelines
  FOR SELECT USING (tenant_id = public.get_user_tenant_id());

CREATE POLICY "Managers can manage pipelines" ON public.pipelines
  FOR ALL USING (
    tenant_id = public.get_user_tenant_id() 
    AND (public.has_role('admin'::app_role) OR public.has_role('client_owner'::app_role) OR public.has_role('manager'::app_role))
  );

-- Stages RLS policies
CREATE POLICY "Users can see stages in their tenant" ON public.stages
  FOR SELECT USING (tenant_id = public.get_user_tenant_id());

CREATE POLICY "Managers can manage stages" ON public.stages
  FOR ALL USING (
    tenant_id = public.get_user_tenant_id() 
    AND (public.has_role('admin'::app_role) OR public.has_role('client_owner'::app_role) OR public.has_role('manager'::app_role))
  );

-- Leads RLS policies
CREATE POLICY "Users can see leads in their tenant" ON public.leads
  FOR SELECT USING (tenant_id = public.get_user_tenant_id());

CREATE POLICY "Users can create leads in their tenant" ON public.leads
  FOR INSERT WITH CHECK (tenant_id = public.get_user_tenant_id());

CREATE POLICY "Users can update their own leads or managers can update all" ON public.leads
  FOR UPDATE USING (
    tenant_id = public.get_user_tenant_id() 
    AND (
      owner_user_id = auth.uid() 
      OR public.has_role('admin'::app_role) 
      OR public.has_role('client_owner'::app_role) 
      OR public.has_role('manager'::app_role)
    )
  );

CREATE POLICY "Managers can delete leads" ON public.leads
  FOR DELETE USING (
    tenant_id = public.get_user_tenant_id() 
    AND (public.has_role('admin'::app_role) OR public.has_role('client_owner'::app_role) OR public.has_role('manager'::app_role))
  );

-- Lead events RLS policies
CREATE POLICY "Users can see lead events in their tenant" ON public.lead_events
  FOR SELECT USING (tenant_id = public.get_user_tenant_id());

CREATE POLICY "Users can create lead events in their tenant" ON public.lead_events
  FOR INSERT WITH CHECK (tenant_id = public.get_user_tenant_id());

-- Conversations RLS policies
CREATE POLICY "Users can see conversations in their tenant" ON public.conversations
  FOR SELECT USING (tenant_id = public.get_user_tenant_id());

CREATE POLICY "Users can create conversations in their tenant" ON public.conversations
  FOR INSERT WITH CHECK (tenant_id = public.get_user_tenant_id());

CREATE POLICY "Users can update conversations in their tenant" ON public.conversations
  FOR UPDATE USING (tenant_id = public.get_user_tenant_id());

-- Messages RLS policies
CREATE POLICY "Users can see messages in their tenant" ON public.messages
  FOR SELECT USING (tenant_id = public.get_user_tenant_id());

CREATE POLICY "Users can create messages in their tenant" ON public.messages
  FOR INSERT WITH CHECK (tenant_id = public.get_user_tenant_id());

-- Metrics daily RLS policies
CREATE POLICY "Users can see metrics in their tenant" ON public.metrics_daily
  FOR SELECT USING (tenant_id = public.get_user_tenant_id());

CREATE POLICY "Managers can manage metrics" ON public.metrics_daily
  FOR ALL USING (
    tenant_id = public.get_user_tenant_id() 
    AND (public.has_role('admin'::app_role) OR public.has_role('client_owner'::app_role) OR public.has_role('manager'::app_role))
  );