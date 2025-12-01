-- Fix: Restrict leads table access to authenticated users only
-- Drop existing SELECT policies and recreate with explicit role restrictions

DROP POLICY IF EXISTS "Supervisors can view all leads" ON public.leads;
DROP POLICY IF EXISTS "Users can view leads in their tenant" ON public.leads;

-- Recreate SELECT policies with explicit authentication requirement
CREATE POLICY "Supervisors can view all leads"
ON public.leads
FOR SELECT
TO authenticated
USING (is_admin_or_supervisor());

CREATE POLICY "Users can view leads in their tenant"
ON public.leads
FOR SELECT
TO authenticated
USING (tenant_id = get_user_tenant_id());

-- Ensure all other policies also explicitly require authentication
DROP POLICY IF EXISTS "Users can create leads" ON public.leads;
DROP POLICY IF EXISTS "Users can update leads" ON public.leads;
DROP POLICY IF EXISTS "Users can delete leads" ON public.leads;

CREATE POLICY "Users can create leads"
ON public.leads
FOR INSERT
TO authenticated
WITH CHECK (tenant_id = get_user_tenant_id());

CREATE POLICY "Users can update leads"
ON public.leads
FOR UPDATE
TO authenticated
USING (tenant_id = get_user_tenant_id());

CREATE POLICY "Users can delete leads"
ON public.leads
FOR DELETE
TO authenticated
USING (tenant_id = get_user_tenant_id());

-- Add comment explaining the security approach
COMMENT ON TABLE public.leads IS 'Contains customer contact information. All access requires authentication and tenant isolation through RLS policies.';