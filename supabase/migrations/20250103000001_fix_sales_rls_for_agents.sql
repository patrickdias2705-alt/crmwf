-- Fix RLS policy for sales table to allow agents and viewers to read sales
-- This is needed for the useDailySales hook to work properly

-- Drop existing policy
DROP POLICY IF EXISTS "Users can view sales from their tenant" ON public.sales;

-- Create new policy that allows all authenticated users to read their tenant's sales
CREATE POLICY "Users can view sales from their tenant" 
ON public.sales 
FOR SELECT 
TO authenticated
USING (
  tenant_id = get_user_tenant_id()
);

-- Verify the policy was created
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'sales'
ORDER BY policyname;

