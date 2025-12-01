-- Permitir que admins criem e gerenciem tenants
DROP POLICY IF EXISTS "Admins can manage tenants" ON public.tenants;

CREATE POLICY "Admins can manage tenants"
ON public.tenants
FOR ALL
USING (has_role('admin'::app_role))
WITH CHECK (has_role('admin'::app_role));