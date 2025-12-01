-- Add is_public column to leads table
-- This column determines if a lead should be visible in the "Lista Geral" (General List)

ALTER TABLE public.leads 
ADD COLUMN IF NOT EXISTS is_public BOOLEAN NOT NULL DEFAULT false;

-- Add index for performance when filtering public leads
CREATE INDEX IF NOT EXISTS idx_leads_is_public ON public.leads(tenant_id, is_public) WHERE is_public = true;

-- Add comment
COMMENT ON COLUMN public.leads.is_public IS 'Indicates if the lead should be visible in the general list for all supervisors and managers';

-- Update RLS policy to allow reading public leads
-- This allows users with appropriate roles to see public leads from their tenant
DROP POLICY IF EXISTS "Users can see public leads from their tenant" ON public.leads;

CREATE POLICY "Users can see public leads from their tenant" 
ON public.leads 
FOR SELECT 
TO authenticated
USING (
  tenant_id = get_user_tenant_id() 
  AND is_public = true
  AND (
    has_role('admin'::app_role) 
    OR has_role('client_owner'::app_role) 
    OR has_role('manager'::app_role)
    OR has_role('supervisor'::app_role)
  )
);
