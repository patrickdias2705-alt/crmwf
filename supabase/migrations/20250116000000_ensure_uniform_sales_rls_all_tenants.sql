-- ========================================
-- GARANTIR POLÍTICAS RLS UNIFORMES PARA TODOS OS TENANTS
-- ========================================
-- Esta migration garante que TODOS os tenants tenham a mesma lógica de permissões
-- Sem diferenças entre Maria, Julia, Elaine ou qualquer outro tenant

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
-- Esta query pode ser executada manualmente para verificar
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

-- 4. Comentário: Estas políticas garantem que:
-- - TODOS os tenants têm a mesma lógica
-- - NÃO há diferenças entre Maria, Julia, Elaine ou outros
-- - A única verificação é: tenant_id = get_user_tenant_id()
-- - SEM restrições de role que possam causar diferenças
-- - Funciona para TODOS os usuários autenticados do tenant

