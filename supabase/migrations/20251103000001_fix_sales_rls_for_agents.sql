-- Fix RLS policy for sales table to allow agents and viewers to read and insert sales
-- This is needed for the useDailySales hook to work properly and to allow agents to create sales

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view sales from their tenant" ON public.sales;
DROP POLICY IF EXISTS "Users can insert sales for their tenant" ON public.sales;

-- Create new policy that allows all authenticated users to read their tenant's sales
CREATE POLICY "Users can view sales from their tenant" 
ON public.sales 
FOR SELECT 
TO authenticated
USING (
  tenant_id = get_user_tenant_id()
);

-- Create new policy that allows all authenticated users to insert sales for their tenant
CREATE POLICY "Users can insert sales for their tenant" 
ON public.sales 
FOR INSERT 
TO authenticated
WITH CHECK (
  tenant_id = get_user_tenant_id()
);

-- Verify the policies were created
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

