-- Adicionar índices para performance nas consultas de tenant
CREATE INDEX IF NOT EXISTS idx_leads_tenant_id ON public.leads(tenant_id);
CREATE INDEX IF NOT EXISTS idx_conversations_tenant_id ON public.conversations(tenant_id);
CREATE INDEX IF NOT EXISTS idx_messages_tenant_id ON public.messages(tenant_id);
CREATE INDEX IF NOT EXISTS idx_lead_events_tenant_id ON public.lead_events(tenant_id);
CREATE INDEX IF NOT EXISTS idx_metrics_daily_tenant_id ON public.metrics_daily(tenant_id);
CREATE INDEX IF NOT EXISTS idx_pipelines_tenant_id ON public.pipelines(tenant_id);
CREATE INDEX IF NOT EXISTS idx_stages_tenant_id ON public.stages(tenant_id);
CREATE INDEX IF NOT EXISTS idx_budgets_lead_id ON public.budgets(lead_id);
CREATE INDEX IF NOT EXISTS idx_activities_lead_id ON public.activities(lead_id);

-- Garantir que tenant_id não seja nullable em tabelas críticas
-- (isso previne registros órfãos sem tenant)
ALTER TABLE public.leads ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE public.conversations ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE public.messages ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE public.lead_events ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE public.pipelines ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE public.stages ALTER COLUMN tenant_id SET NOT NULL;