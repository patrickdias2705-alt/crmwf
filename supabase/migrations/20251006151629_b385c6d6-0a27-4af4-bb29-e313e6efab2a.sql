-- ============================================
-- POLÍTICAS RLS: Permitir operações manuais pelos usuários
-- ============================================

-- LEADS: Adicionar política de DELETE
CREATE POLICY "Users can delete leads"
ON public.leads
FOR DELETE
USING (tenant_id = get_user_tenant_id());

-- PIPELINES: Adicionar políticas de INSERT, UPDATE, DELETE
CREATE POLICY "Users can create pipelines"
ON public.pipelines
FOR INSERT
WITH CHECK (tenant_id = get_user_tenant_id());

CREATE POLICY "Users can update pipelines"
ON public.pipelines
FOR UPDATE
USING (tenant_id = get_user_tenant_id());

CREATE POLICY "Users can delete pipelines"
ON public.pipelines
FOR DELETE
USING (tenant_id = get_user_tenant_id());

-- STAGES: Adicionar políticas de INSERT, UPDATE, DELETE
CREATE POLICY "Users can create stages"
ON public.stages
FOR INSERT
WITH CHECK (tenant_id = get_user_tenant_id());

CREATE POLICY "Users can update stages"
ON public.stages
FOR UPDATE
USING (tenant_id = get_user_tenant_id());

CREATE POLICY "Users can delete stages"
ON public.stages
FOR DELETE
USING (tenant_id = get_user_tenant_id());

-- CONVERSATIONS: Adicionar políticas de INSERT, UPDATE, DELETE
CREATE POLICY "Users can create conversations"
ON public.conversations
FOR INSERT
WITH CHECK (tenant_id = get_user_tenant_id());

CREATE POLICY "Users can update conversations"
ON public.conversations
FOR UPDATE
USING (tenant_id = get_user_tenant_id());

CREATE POLICY "Users can delete conversations"
ON public.conversations
FOR DELETE
USING (tenant_id = get_user_tenant_id());

-- ACTIVITIES: Adicionar políticas de INSERT, UPDATE, DELETE
CREATE POLICY "Users can create activities"
ON public.activities
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Users can update activities"
ON public.activities
FOR UPDATE
USING (true);

CREATE POLICY "Users can delete activities"
ON public.activities
FOR DELETE
USING (true);

-- BUDGETS: Adicionar políticas de INSERT, UPDATE, DELETE
CREATE POLICY "Users can create budgets"
ON public.budgets
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Users can update budgets"
ON public.budgets
FOR UPDATE
USING (true);

CREATE POLICY "Users can delete budgets"
ON public.budgets
FOR DELETE
USING (true);