-- Garantir isolamento completo de dados por tenant

-- 1. Corrigir policies da tabela budgets (atualmente sem isolamento!)
DROP POLICY IF EXISTS "Users can view budgets" ON public.budgets;
DROP POLICY IF EXISTS "Users can create budgets" ON public.budgets;
DROP POLICY IF EXISTS "Users can update budgets" ON public.budgets;
DROP POLICY IF EXISTS "Users can delete budgets" ON public.budgets;

-- Budgets devem respeitar o tenant através do lead
CREATE POLICY "Users can view budgets in their tenant"
ON public.budgets
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.leads 
    WHERE leads.id = budgets.lead_id 
    AND leads.tenant_id = get_user_tenant_id()
  )
);

CREATE POLICY "Users can create budgets in their tenant"
ON public.budgets
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.leads 
    WHERE leads.id = budgets.lead_id 
    AND leads.tenant_id = get_user_tenant_id()
  )
);

CREATE POLICY "Users can update budgets in their tenant"
ON public.budgets
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.leads 
    WHERE leads.id = budgets.lead_id 
    AND leads.tenant_id = get_user_tenant_id()
  )
);

CREATE POLICY "Users can delete budgets in their tenant"
ON public.budgets
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.leads 
    WHERE leads.id = budgets.lead_id 
    AND leads.tenant_id = get_user_tenant_id()
  )
);

-- 2. Corrigir policies da tabela activities (atualmente sem isolamento!)
DROP POLICY IF EXISTS "Users can view activities" ON public.activities;
DROP POLICY IF EXISTS "Users can create activities" ON public.activities;
DROP POLICY IF EXISTS "Users can update activities" ON public.activities;
DROP POLICY IF EXISTS "Users can delete activities" ON public.activities;

-- Activities devem respeitar o tenant através do lead
CREATE POLICY "Users can view activities in their tenant"
ON public.activities
FOR SELECT
USING (
  lead_id IS NULL OR EXISTS (
    SELECT 1 FROM public.leads 
    WHERE leads.id = activities.lead_id 
    AND leads.tenant_id = get_user_tenant_id()
  )
);

CREATE POLICY "Users can create activities in their tenant"
ON public.activities
FOR INSERT
WITH CHECK (
  lead_id IS NULL OR EXISTS (
    SELECT 1 FROM public.leads 
    WHERE leads.id = activities.lead_id 
    AND leads.tenant_id = get_user_tenant_id()
  )
);

CREATE POLICY "Users can update activities in their tenant"
ON public.activities
FOR UPDATE
USING (
  lead_id IS NULL OR EXISTS (
    SELECT 1 FROM public.leads 
    WHERE leads.id = activities.lead_id 
    AND leads.tenant_id = get_user_tenant_id()
  )
);

CREATE POLICY "Users can delete activities in their tenant"
ON public.activities
FOR DELETE
USING (
  lead_id IS NULL OR EXISTS (
    SELECT 1 FROM public.leads 
    WHERE leads.id = activities.lead_id 
    AND leads.tenant_id = get_user_tenant_id()
  )
);

-- 3. Adicionar índices para performance nas consultas de tenant
CREATE INDEX IF NOT EXISTS idx_leads_tenant_id ON public.leads(tenant_id);
CREATE INDEX IF NOT EXISTS idx_conversations_tenant_id ON public.conversations(tenant_id);
CREATE INDEX IF NOT EXISTS idx_messages_tenant_id ON public.messages(tenant_id);
CREATE INDEX IF NOT EXISTS idx_lead_events_tenant_id ON public.lead_events(tenant_id);
CREATE INDEX IF NOT EXISTS idx_metrics_daily_tenant_id ON public.metrics_daily(tenant_id);
CREATE INDEX IF NOT EXISTS idx_pipelines_tenant_id ON public.pipelines(tenant_id);
CREATE INDEX IF NOT EXISTS idx_stages_tenant_id ON public.stages(tenant_id);
CREATE INDEX IF NOT EXISTS idx_budgets_lead_id ON public.budgets(lead_id);
CREATE INDEX IF NOT EXISTS idx_activities_lead_id ON public.activities(lead_id);

-- 4. Garantir que tenant_id não seja nullable em tabelas críticas
-- (isso previne registros órfãos sem tenant)
ALTER TABLE public.leads ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE public.conversations ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE public.messages ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE public.lead_events ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE public.pipelines ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE public.stages ALTER COLUMN tenant_id SET NOT NULL;