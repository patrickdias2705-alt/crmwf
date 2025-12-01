-- Fix security issue: Restrict users table access to prevent data leakage

-- Drop the overly permissive policy that allows viewing users across tenants
DROP POLICY IF EXISTS "Users can view users in their tenant or message senders" ON public.users;

-- Create a secure view that exposes only safe user fields for display purposes
CREATE OR REPLACE VIEW public.users_safe_view AS
SELECT 
  id,
  name,
  tenant_id,
  role,
  active,
  created_at
FROM public.users;

-- Enable RLS on the safe view
ALTER VIEW public.users_safe_view SET (security_invoker = on);

-- Create a more restrictive policy for users table
-- Only allow viewing users in the same tenant (full access within tenant)
CREATE POLICY "Users can view users in their tenant only"
ON public.users
FOR SELECT
USING (tenant_id = get_user_tenant_id());

-- Create a security definer function to get safe user info for message contexts
CREATE OR REPLACE FUNCTION public.get_user_display_info(user_ids uuid[])
RETURNS TABLE (
  id uuid,
  name text,
  tenant_id uuid
)
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT id, name, tenant_id
  FROM users
  WHERE id = ANY(user_ids)
  AND active = true;
$$;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION public.get_user_display_info(uuid[]) TO authenticated;

-- Add comment explaining the security approach
COMMENT ON POLICY "Users can view users in their tenant only" ON public.users IS 
'Restricts user data access to same-tenant only. For cross-tenant user display (e.g., message senders), use get_user_display_info() function which only exposes safe fields (id, name, tenant_id) without email or password_hash.';