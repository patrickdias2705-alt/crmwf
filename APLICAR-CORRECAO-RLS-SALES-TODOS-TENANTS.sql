-- ========================================
-- APLICAR CORREÇÃO RLS SALES PARA TODOS OS TENANTS
-- ========================================
-- Execute este script no Supabase SQL Editor para corrigir imediatamente
-- Garante que TODOS os tenants (Maria, Julia, Elaine, etc.) tenham a mesma lógica

-- 1. Remover TODAS as políticas existentes (pode haver conflitos)
DROP POLICY IF EXISTS "Users can view sales from their tenant" ON public.sales;
DROP POLICY IF EXISTS "Users can insert sales for their tenant" ON public.sales;
DROP POLICY IF EXISTS "Users can update sales from their tenant" ON public.sales;
DROP POLICY IF EXISTS "Users can delete sales for their tenant" ON public.sales;
DROP POLICY IF EXISTS "Allow authenticated users to view sales from their tenant" ON public.sales;
DROP POLICY IF EXISTS "Allow authenticated users to insert sales" ON public.sales;
DROP POLICY IF EXISTS "Allow authenticated users to update sales from their tenant" ON public.sales;
DROP POLICY IF EXISTS "Allow authenticated users to delete sales from their tenant" ON public.sales;
DROP POLICY IF EXISTS "Agents can create sales for their leads" ON public.sales;
DROP POLICY IF EXISTS "Users can view their tenant sales" ON public.sales;
DROP POLICY IF EXISTS "uniform_sales_select_policy" ON public.sales;
DROP POLICY IF EXISTS "uniform_sales_insert_policy" ON public.sales;
DROP POLICY IF EXISTS "uniform_sales_update_policy" ON public.sales;
DROP POLICY IF EXISTS "uniform_sales_delete_policy" ON public.sales;

-- 2. Criar políticas UNIFORMES para TODOS os tenants
-- Política de SELECT: Todos os usuários autenticados podem ver vendas do seu tenant
CREATE POLICY "uniform_sales_select_policy" 
ON public.sales 
FOR SELECT 
TO authenticated
USING (
  tenant_id = get_user_tenant_id()
);

-- Política de INSERT: Todos os usuários autenticados podem inserir vendas no seu tenant
-- SEM restrições de role - funciona para TODOS os tenants igualmente
CREATE POLICY "uniform_sales_insert_policy" 
ON public.sales 
FOR INSERT 
TO authenticated
WITH CHECK (
  tenant_id = get_user_tenant_id()
);

-- Política de UPDATE: Todos os usuários autenticados podem atualizar vendas do seu tenant
CREATE POLICY "uniform_sales_update_policy" 
ON public.sales 
FOR UPDATE 
TO authenticated
USING (
  tenant_id = get_user_tenant_id()
)
WITH CHECK (
  tenant_id = get_user_tenant_id()
);

-- Política de DELETE: Todos os usuários autenticados podem deletar vendas do seu tenant
CREATE POLICY "uniform_sales_delete_policy" 
ON public.sales 
FOR DELETE 
TO authenticated
USING (
  tenant_id = get_user_tenant_id()
);

-- 3. Verificar se as políticas foram criadas corretamente
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
AND schemaname = 'public'
ORDER BY policyname;

-- 4. Verificar se get_user_tenant_id() está funcionando para todos os usuários
-- Execute esta query para verificar se a função retorna o tenant_id correto
SELECT 
  u.id as user_id,
  u.email,
  u.tenant_id as user_tenant_id,
  get_user_tenant_id() as function_tenant_id,
  CASE 
    WHEN u.tenant_id = get_user_tenant_id() THEN '✅ OK'
    ELSE '❌ ERRO'
  END as status
FROM public.users u
WHERE u.id = auth.uid()
LIMIT 1;

-- 5. Comentário: Estas políticas garantem que:
-- - TODOS os tenants têm a mesma lógica
-- - NÃO há diferenças entre Maria, Julia, Elaine ou outros
-- - A única verificação é: tenant_id = get_user_tenant_id()
-- - SEM restrições de role que possam causar diferenças
-- - Funciona para TODOS os usuários autenticados do tenant

