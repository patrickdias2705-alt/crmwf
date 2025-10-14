-- Garantir isolamento completo de dados por tenant

-- 1. Limpar TODAS as policies antigas de budgets
DO $$ 
DECLARE
  r RECORD;
BEGIN
  FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'budgets' AND schemaname = 'public') 
  LOOP
    EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON public.budgets';
  END LOOP;
END $$;

-- Criar novas policies para budgets com isolamento por tenant
CREATE POLICY "budgets_select_tenant_isolated"
ON public.budgets
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.leads 
    WHERE leads.id = budgets.lead_id 
    AND leads.tenant_id = get_user_tenant_id()
  )
);

CREATE POLICY "budgets_insert_tenant_isolated"
ON public.budgets
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.leads 
    WHERE leads.id = budgets.lead_id 
    AND leads.tenant_id = get_user_tenant_id()
  )
);

CREATE POLICY "budgets_update_tenant_isolated"
ON public.budgets
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.leads 
    WHERE leads.id = budgets.lead_id 
    AND leads.tenant_id = get_user_tenant_id()
  )
);

CREATE POLICY "budgets_delete_tenant_isolated"
ON public.budgets
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.leads 
    WHERE leads.id = budgets.lead_id 
    AND leads.tenant_id = get_user_tenant_id()
  )
);

-- 2. Limpar TODAS as policies antigas de activities
DO $$ 
DECLARE
  r RECORD;
BEGIN
  FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'activities' AND schemaname = 'public') 
  LOOP
    EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON public.activities';
  END LOOP;
END $$;

-- Criar novas policies para activities com isolamento por tenant
CREATE POLICY "activities_select_tenant_isolated"
ON public.activities
FOR SELECT
USING (
  lead_id IS NULL OR EXISTS (
    SELECT 1 FROM public.leads 
    WHERE leads.id = activities.lead_id 
    AND leads.tenant_id = get_user_tenant_id()
  )
);

CREATE POLICY "activities_insert_tenant_isolated"
ON public.activities
FOR INSERT
WITH CHECK (
  lead_id IS NULL OR EXISTS (
    SELECT 1 FROM public.leads 
    WHERE leads.id = activities.lead_id 
    AND leads.tenant_id = get_user_tenant_id()
  )
);

CREATE POLICY "activities_update_tenant_isolated"
ON public.activities
FOR UPDATE
USING (
  lead_id IS NULL OR EXISTS (
    SELECT 1 FROM public.leads 
    WHERE leads.id = activities.lead_id 
    AND leads.tenant_id = get_user_tenant_id()
  )
);

CREATE POLICY "activities_delete_tenant_isolated"
ON public.activities
FOR DELETE
USING (
  lead_id IS NULL OR EXISTS (
    SELECT 1 FROM public.leads 
    WHERE leads.id = activities.lead_id 
    AND leads.tenant_id = get_user_tenant_id()
  )
);

-- 3. Adicionar índices para performance
CREATE INDEX IF NOT EXISTS idx_leads_tenant_id ON public.leads(tenant_id);
CREATE INDEX IF NOT EXISTS idx_conversations_tenant_id ON public.conversations(tenant_id);
CREATE INDEX IF NOT EXISTS idx_messages_tenant_id ON public.messages(tenant_id);
CREATE INDEX IF NOT EXISTS idx_lead_events_tenant_id ON public.lead_events(tenant_id);
CREATE INDEX IF NOT EXISTS idx_metrics_daily_tenant_id ON public.metrics_daily(tenant_id);
CREATE INDEX IF NOT EXISTS idx_pipelines_tenant_id ON public.pipelines(tenant_id);
CREATE INDEX IF NOT EXISTS idx_stages_tenant_id ON public.stages(tenant_id);
CREATE INDEX IF NOT EXISTS idx_budgets_lead_id ON public.budgets(lead_id);
CREATE INDEX IF NOT EXISTS idx_activities_lead_id ON public.activities(lead_id);