-- ============================================
-- CORREÇÃO DE SEGURANÇA: Adicionar Políticas RLS Faltantes
-- ============================================

-- Políticas para user_roles
DROP POLICY IF EXISTS "Users can view their roles" ON user_roles;
CREATE POLICY "Users can view their roles"
  ON user_roles FOR SELECT
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Admins can manage roles" ON user_roles;
CREATE POLICY "Admins can manage roles"
  ON user_roles FOR ALL
  USING (public.has_role('admin'::app_role));

-- Políticas para lead_events
DROP POLICY IF EXISTS "Users can view lead events" ON lead_events;
CREATE POLICY "Users can view lead events"
  ON lead_events FOR SELECT
  USING (tenant_id = public.get_user_tenant_id());

DROP POLICY IF EXISTS "Users can create lead events" ON lead_events;
CREATE POLICY "Users can create lead events"
  ON lead_events FOR INSERT
  WITH CHECK (tenant_id = public.get_user_tenant_id());

-- Políticas para metrics_daily
DROP POLICY IF EXISTS "Users can view metrics" ON metrics_daily;
CREATE POLICY "Users can view metrics"
  ON metrics_daily FOR SELECT
  USING (tenant_id = public.get_user_tenant_id());

DROP POLICY IF EXISTS "Admins can manage metrics" ON metrics_daily;
CREATE POLICY "Admins can manage metrics"
  ON metrics_daily FOR ALL
  USING (public.has_role('admin'::app_role));

-- Políticas para webhooks
DROP POLICY IF EXISTS "Users can view webhooks" ON webhooks;
CREATE POLICY "Users can view webhooks"
  ON webhooks FOR SELECT
  USING (tenant_id = public.get_user_tenant_id());

DROP POLICY IF EXISTS "Admins can manage webhooks" ON webhooks;
CREATE POLICY "Admins can manage webhooks"
  ON webhooks FOR ALL
  USING (public.has_role('admin'::app_role));