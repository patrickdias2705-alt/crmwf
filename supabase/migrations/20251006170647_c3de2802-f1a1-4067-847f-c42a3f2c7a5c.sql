-- Parte 2: Criar funções e políticas para supervisor

-- Criar função para verificar se usuário é admin ou supervisor
CREATE OR REPLACE FUNCTION public.is_admin_or_supervisor()
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid()
    AND role IN ('admin', 'supervisor')
  );
$$;

-- Ajustar políticas de leads para supervisor
DROP POLICY IF EXISTS "Supervisors can view all leads" ON leads;
CREATE POLICY "Supervisors can view all leads"
ON leads FOR SELECT
TO authenticated
USING (is_admin_or_supervisor());

-- Ajustar políticas de metrics_daily para supervisor
DROP POLICY IF EXISTS "Supervisors can view all metrics" ON metrics_daily;
CREATE POLICY "Supervisors can view all metrics"
ON metrics_daily FOR SELECT
TO authenticated
USING (is_admin_or_supervisor());

-- Ajustar políticas de conversations para supervisor
DROP POLICY IF EXISTS "Supervisors can view all conversations" ON conversations;
CREATE POLICY "Supervisors can view all conversations"
ON conversations FOR SELECT
TO authenticated
USING (is_admin_or_supervisor());

-- Ajustar políticas de messages para supervisor
DROP POLICY IF EXISTS "Supervisors can view all messages" ON messages;
CREATE POLICY "Supervisors can view all messages"
ON messages FOR SELECT
TO authenticated
USING (is_admin_or_supervisor());

-- Ajustar políticas de tenants para admin/supervisor
DROP POLICY IF EXISTS "Admins and supervisors can view all tenants" ON tenants;
CREATE POLICY "Admins and supervisors can view all tenants"
ON tenants FOR SELECT
TO authenticated
USING (is_admin_or_supervisor() OR id = get_user_tenant_id());

-- Ajustar políticas de users para admin/supervisor
DROP POLICY IF EXISTS "Admins and supervisors can view all users" ON users;
CREATE POLICY "Admins and supervisors can view all users"
ON users FOR SELECT
TO authenticated
USING (is_admin_or_supervisor() OR tenant_id = get_user_tenant_id());