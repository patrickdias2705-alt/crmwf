-- Fix critical security issue: Customer Contact Information Could Be Stolen
-- Replace the overly permissive RLS policy with role-based access control

-- First, drop the existing overly permissive policy
DROP POLICY IF EXISTS "Users can see leads in their tenant" ON public.leads;

-- Create role-based access policies for leads table

-- Agents can only see leads assigned to them
CREATE POLICY "Agents can see their assigned leads" 
ON public.leads 
FOR SELECT 
TO authenticated
USING (
  tenant_id = get_user_tenant_id() 
  AND (
    -- User is assigned as owner of the lead
    owner_user_id = auth.uid()
    -- OR user has manager/admin role (can see all)
    OR has_role('admin'::app_role) 
    OR has_role('client_owner'::app_role) 
    OR has_role('manager'::app_role)
  )
);

-- Create a secure view for viewers with masked sensitive data
CREATE OR REPLACE VIEW public.leads_public AS 
SELECT 
  id,
  tenant_id,
  external_id,
  name,
  -- Mask email and phone for viewers
  CASE 
    WHEN has_role('admin'::app_role) OR has_role('client_owner'::app_role) OR has_role('manager'::app_role) 
    THEN email 
    ELSE CASE 
      WHEN email IS NOT NULL THEN '***@' || split_part(email, '@', 2)
      ELSE NULL 
    END
  END as email,
  CASE 
    WHEN has_role('admin'::app_role) OR has_role('client_owner'::app_role) OR has_role('manager'::app_role) 
    THEN phone 
    ELSE CASE 
      WHEN phone IS NOT NULL THEN '***' || right(phone, 4)
      ELSE NULL 
    END
  END as phone,
  source,
  owner_user_id,
  pipeline_id,
  stage_id,
  tags,
  fields,
  created_at,
  updated_at
FROM public.leads
WHERE tenant_id = get_user_tenant_id();

-- Enable RLS on the view
ALTER VIEW public.leads_public SET (security_barrier = true);

-- Grant appropriate permissions
GRANT SELECT ON public.leads_public TO authenticated;

-- Also fix the user role escalation vulnerability
-- Drop and recreate the users update policy to prevent role self-modification
DROP POLICY IF EXISTS "Users can update themselves" ON public.users;

CREATE POLICY "Users can update their profile (not role)" 
ON public.users 
FOR UPDATE 
TO authenticated
USING (
  id = auth.uid() 
  AND tenant_id = get_user_tenant_id()
)
WITH CHECK (
  id = auth.uid() 
  AND tenant_id = get_user_tenant_id()
  -- Prevent users from changing their own role
  AND role = (SELECT role FROM public.users WHERE id = auth.uid())
);

-- Create separate policy for role updates (admin only)
CREATE POLICY "Admins can update user roles" 
ON public.users 
FOR UPDATE 
TO authenticated
USING (
  tenant_id = get_user_tenant_id() 
  AND (has_role('admin'::app_role) OR has_role('client_owner'::app_role))
)
WITH CHECK (
  tenant_id = get_user_tenant_id() 
  AND (has_role('admin'::app_role) OR has_role('client_owner'::app_role))
);