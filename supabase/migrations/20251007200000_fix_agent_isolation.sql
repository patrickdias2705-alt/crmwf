-- ============================================================================
-- FIX: Isolamento de dados por agente
-- ============================================================================
-- Este arquivo corrige as políticas RLS para garantir que:
-- 1. Agentes vejam APENAS seus próprios leads (assigned_to)
-- 2. Supervisores/Managers/Admins vejam todos os leads do tenant
-- 3. Dados não misturam entre tenants
-- 4. Dados não misturam entre agentes
-- ============================================================================

-- Função helper para verificar se é admin/supervisor/manager
CREATE OR REPLACE FUNCTION public.is_admin_or_supervisor()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() 
    AND role IN ('admin', 'supervisor', 'client_owner', 'manager')
    AND active = true
    AND tenant_id = (SELECT tenant_id FROM public.users WHERE id = auth.uid())
  );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- ============================================================================
-- LEADS: Política mais restritiva para agentes
-- ============================================================================

-- Remover políticas antigas de leads
DROP POLICY IF EXISTS "Users can see leads in their tenant" ON public.leads;
DROP POLICY IF EXISTS "Users can create leads in their tenant" ON public.leads;
DROP POLICY IF EXISTS "Users can update their own leads or managers can update all" ON public.leads;
DROP POLICY IF EXISTS "Managers can delete leads" ON public.leads;
DROP POLICY IF EXISTS "Supervisors can view all leads" ON public.leads;

-- Nova política: SELECT
-- Agentes veem apenas seus leads (assigned_to)
-- Supervisores/Managers/Admins veem todos do tenant
CREATE POLICY "leads_select_policy" ON public.leads
  FOR SELECT
  USING (
    tenant_id = public.get_user_tenant_id()
    AND (
      -- Admin/Supervisor/Manager veem tudo do tenant
      public.is_admin_or_supervisor()
      -- Agentes veem apenas leads atribuídos a eles
      OR assigned_to = auth.uid()
      -- Ou leads que eles criaram
      OR owner_user_id = auth.uid()
    )
  );

-- Nova política: INSERT
-- Qualquer usuário autenticado pode criar leads no seu tenant
CREATE POLICY "leads_insert_policy" ON public.leads
  FOR INSERT
  WITH CHECK (
    tenant_id = public.get_user_tenant_id()
  );

-- Nova política: UPDATE
-- Agentes podem atualizar apenas seus leads
-- Supervisores/Managers podem atualizar todos
CREATE POLICY "leads_update_policy" ON public.leads
  FOR UPDATE
  USING (
    tenant_id = public.get_user_tenant_id()
    AND (
      public.is_admin_or_supervisor()
      OR assigned_to = auth.uid()
      OR owner_user_id = auth.uid()
    )
  );

-- Nova política: DELETE
-- Apenas Supervisores/Managers podem deletar
CREATE POLICY "leads_delete_policy" ON public.leads
  FOR DELETE
  USING (
    tenant_id = public.get_user_tenant_id()
    AND public.is_admin_or_supervisor()
  );

-- ============================================================================
-- CONVERSATIONS: Filtrar por leads do agente
-- ============================================================================

DROP POLICY IF EXISTS "Users can see conversations in their tenant" ON public.conversations;
DROP POLICY IF EXISTS "Users can create conversations in their tenant" ON public.conversations;
DROP POLICY IF EXISTS "Users can update conversations in their tenant" ON public.conversations;
DROP POLICY IF EXISTS "Supervisors can view all conversations" ON public.conversations;

-- Conversas visíveis apenas se o lead pertence ao usuário
CREATE POLICY "conversations_select_policy" ON public.conversations
  FOR SELECT
  USING (
    tenant_id = public.get_user_tenant_id()
    AND (
      public.is_admin_or_supervisor()
      OR lead_id IN (
        SELECT id FROM public.leads 
        WHERE tenant_id = public.get_user_tenant_id()
        AND (assigned_to = auth.uid() OR owner_user_id = auth.uid())
      )
    )
  );

CREATE POLICY "conversations_insert_policy" ON public.conversations
  FOR INSERT
  WITH CHECK (tenant_id = public.get_user_tenant_id());

CREATE POLICY "conversations_update_policy" ON public.conversations
  FOR UPDATE
  USING (
    tenant_id = public.get_user_tenant_id()
    AND (
      public.is_admin_or_supervisor()
      OR lead_id IN (
        SELECT id FROM public.leads 
        WHERE assigned_to = auth.uid() OR owner_user_id = auth.uid()
      )
    )
  );

-- ============================================================================
-- MESSAGES: Filtrar por conversas do agente
-- ============================================================================

DROP POLICY IF EXISTS "Users can see messages in their tenant" ON public.messages;
DROP POLICY IF EXISTS "Users can create messages in their tenant" ON public.messages;
DROP POLICY IF EXISTS "Supervisors can view all messages" ON public.messages;

-- Mensagens visíveis apenas se a conversa pertence ao usuário
CREATE POLICY "messages_select_policy" ON public.messages
  FOR SELECT
  USING (
    tenant_id = public.get_user_tenant_id()
    AND (
      public.is_admin_or_supervisor()
      OR conversation_id IN (
        SELECT c.id FROM public.conversations c
        INNER JOIN public.leads l ON c.lead_id = l.id
        WHERE c.tenant_id = public.get_user_tenant_id()
        AND (l.assigned_to = auth.uid() OR l.owner_user_id = auth.uid())
      )
    )
  );

CREATE POLICY "messages_insert_policy" ON public.messages
  FOR INSERT
  WITH CHECK (tenant_id = public.get_user_tenant_id());

-- ============================================================================
-- LEAD EVENTS: Filtrar por leads do agente
-- ============================================================================

DROP POLICY IF EXISTS "Users can view lead events" ON public.lead_events;
DROP POLICY IF EXISTS "Users can create lead events" ON public.lead_events;
DROP POLICY IF EXISTS "Users can see lead events in their tenant" ON public.lead_events;

CREATE POLICY "lead_events_select_policy" ON public.lead_events
  FOR SELECT
  USING (
    tenant_id = public.get_user_tenant_id()
    AND (
      public.is_admin_or_supervisor()
      OR lead_id IN (
        SELECT id FROM public.leads 
        WHERE assigned_to = auth.uid() OR owner_user_id = auth.uid()
      )
    )
  );

CREATE POLICY "lead_events_insert_policy" ON public.lead_events
  FOR INSERT
  WITH CHECK (tenant_id = public.get_user_tenant_id());

-- ============================================================================
-- BUDGETS: Garantir isolamento
-- ============================================================================

DROP POLICY IF EXISTS "Users can view budgets" ON public.budgets;
DROP POLICY IF EXISTS "Users can manage budgets" ON public.budgets;

CREATE POLICY "budgets_select_policy" ON public.budgets
  FOR SELECT
  USING (
    lead_id IN (
      SELECT id FROM public.leads 
      WHERE tenant_id = public.get_user_tenant_id()
      AND (
        public.is_admin_or_supervisor()
        OR assigned_to = auth.uid()
        OR owner_user_id = auth.uid()
      )
    )
  );

CREATE POLICY "budgets_insert_policy" ON public.budgets
  FOR INSERT
  WITH CHECK (
    lead_id IN (
      SELECT id FROM public.leads 
      WHERE tenant_id = public.get_user_tenant_id()
    )
  );

CREATE POLICY "budgets_update_policy" ON public.budgets
  FOR UPDATE
  USING (
    lead_id IN (
      SELECT id FROM public.leads 
      WHERE tenant_id = public.get_user_tenant_id()
      AND (
        public.is_admin_or_supervisor()
        OR assigned_to = auth.uid()
        OR owner_user_id = auth.uid()
      )
    )
  );

CREATE POLICY "budgets_delete_policy" ON public.budgets
  FOR DELETE
  USING (
    lead_id IN (
      SELECT id FROM public.leads 
      WHERE tenant_id = public.get_user_tenant_id()
      AND public.is_admin_or_supervisor()
    )
  );

-- ============================================================================
-- ACTIVITIES: Garantir isolamento
-- ============================================================================

DROP POLICY IF EXISTS "Users can view activities" ON public.activities;
DROP POLICY IF EXISTS "Users can manage activities" ON public.activities;

CREATE POLICY "activities_select_policy" ON public.activities
  FOR SELECT
  USING (
    lead_id IN (
      SELECT id FROM public.leads 
      WHERE tenant_id = public.get_user_tenant_id()
      AND (
        public.is_admin_or_supervisor()
        OR assigned_to = auth.uid()
        OR owner_user_id = auth.uid()
      )
    )
  );

CREATE POLICY "activities_insert_policy" ON public.activities
  FOR INSERT
  WITH CHECK (
    lead_id IN (
      SELECT id FROM public.leads 
      WHERE tenant_id = public.get_user_tenant_id()
    )
  );

CREATE POLICY "activities_update_policy" ON public.activities
  FOR UPDATE
  USING (
    lead_id IN (
      SELECT id FROM public.leads 
      WHERE tenant_id = public.get_user_tenant_id()
      AND (
        public.is_admin_or_supervisor()
        OR assigned_to = auth.uid()
        OR owner_user_id = auth.uid()
      )
    )
  );

-- ============================================================================
-- METRICS_DAILY: Supervisores veem tudo, agentes veem resumo
-- ============================================================================

DROP POLICY IF EXISTS "Users can see metrics in their tenant" ON public.metrics_daily;
DROP POLICY IF EXISTS "Managers can manage metrics" ON public.metrics_daily;
DROP POLICY IF EXISTS "Supervisors can view all metrics" ON public.metrics_daily;

-- Apenas supervisores/managers podem ver métricas
CREATE POLICY "metrics_select_policy" ON public.metrics_daily
  FOR SELECT
  USING (
    tenant_id = public.get_user_tenant_id()
    AND public.is_admin_or_supervisor()
  );

CREATE POLICY "metrics_insert_policy" ON public.metrics_daily
  FOR INSERT
  WITH CHECK (
    tenant_id = public.get_user_tenant_id()
    AND public.is_admin_or_supervisor()
  );

CREATE POLICY "metrics_update_policy" ON public.metrics_daily
  FOR UPDATE
  USING (
    tenant_id = public.get_user_tenant_id()
    AND public.is_admin_or_supervisor()
  );

-- ============================================================================
-- GARANTIAS ADICIONAIS
-- ============================================================================

-- Índice para melhorar performance das queries com assigned_to
CREATE INDEX IF NOT EXISTS idx_leads_assigned_to ON public.leads(assigned_to);
CREATE INDEX IF NOT EXISTS idx_leads_owner_user_id ON public.leads(owner_user_id);
CREATE INDEX IF NOT EXISTS idx_leads_tenant_assigned ON public.leads(tenant_id, assigned_to);

-- Comentários para documentação
COMMENT ON POLICY "leads_select_policy" ON public.leads IS 
  'Agentes veem apenas leads atribuídos a eles (assigned_to). Supervisores/Managers veem todos do tenant.';

COMMENT ON POLICY "conversations_select_policy" ON public.conversations IS 
  'Conversas visíveis apenas se o lead pertence ao agente.';

COMMENT ON POLICY "messages_select_policy" ON public.messages IS 
  'Mensagens visíveis apenas se a conversa pertence a um lead do agente.';

