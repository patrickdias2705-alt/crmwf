-- ========================================
-- DIAGNOSTICAR E CORRIGIR PROBLEMA DE VENDAS
-- ========================================
-- Execute este script no Supabase SQL Editor
-- Este script diagnostica e corrige o problema de vendas não sendo criadas

-- ========================================
-- PASSO 1: VERIFICAR FUNÇÃO get_user_tenant_id
-- ========================================
SELECT 
  'FUNCAO_GET_USER_TENANT_ID' as tipo,
  proname as nome_funcao,
  prosrc as codigo_funcao
FROM pg_proc 
WHERE proname = 'get_user_tenant_id';

-- ========================================
-- PASSO 2: RECRIAR FUNÇÃO get_user_tenant_id (ROBUSTA)
-- ========================================
CREATE OR REPLACE FUNCTION public.get_user_tenant_id()
RETURNS uuid
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  tid uuid;
BEGIN
  -- Tentar buscar tenant_id do usuário autenticado na tabela public.users
  SELECT tenant_id INTO tid
  FROM public.users
  WHERE id = auth.uid() 
    AND active = true
  LIMIT 1;

  -- Se não encontrou, tentar buscar sem verificar active
  IF tid IS NULL THEN
    SELECT tenant_id INTO tid
    FROM public.users
    WHERE id = auth.uid()
    LIMIT 1;
  END IF;

  -- Se ainda não encontrou, tentar buscar de auth.users (fallback)
  IF tid IS NULL THEN
    SELECT (raw_user_meta_data->>'tenant_id')::uuid INTO tid
    FROM auth.users
    WHERE id = auth.uid()
    LIMIT 1;
  END IF;

  RETURN tid;
END;
$$;

-- ========================================
-- PASSO 3: VERIFICAR POLÍTICAS RLS ATUAIS
-- ========================================
SELECT 
  'POLITICAS_ATUAIS' as tipo,
  policyname,
  cmd,
  roles,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'sales' 
AND schemaname = 'public'
ORDER BY policyname;

-- ========================================
-- PASSO 4: REMOVER TODAS AS POLÍTICAS CONFLITANTES
-- ========================================
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

-- ========================================
-- PASSO 5: CRIAR POLÍTICAS RLS UNIFORMES E PERMISSIVAS
-- ========================================
-- Política de SELECT: Todos os usuários autenticados podem ver vendas do seu tenant
CREATE POLICY "uniform_sales_select_policy" 
ON public.sales 
FOR SELECT 
TO authenticated
USING (
  tenant_id = public.get_user_tenant_id()
);

-- Política de INSERT: Todos os usuários autenticados podem inserir vendas no seu tenant
-- SEM restrições de role - funciona para TODOS os tenants igualmente
CREATE POLICY "uniform_sales_insert_policy" 
ON public.sales 
FOR INSERT 
TO authenticated
WITH CHECK (
  tenant_id = public.get_user_tenant_id()
);

-- Política de UPDATE: Todos os usuários autenticados podem atualizar vendas do seu tenant
CREATE POLICY "uniform_sales_update_policy" 
ON public.sales 
FOR UPDATE 
TO authenticated
USING (
  tenant_id = public.get_user_tenant_id()
)
WITH CHECK (
  tenant_id = public.get_user_tenant_id()
);

-- Política de DELETE: Todos os usuários autenticados podem deletar vendas do seu tenant
CREATE POLICY "uniform_sales_delete_policy" 
ON public.sales 
FOR DELETE 
TO authenticated
USING (
  tenant_id = public.get_user_tenant_id()
);

-- ========================================
-- PASSO 6: VERIFICAR SE AS POLÍTICAS FORAM CRIADAS
-- ========================================
SELECT 
  'POLITICAS_CRIADAS' as tipo,
  policyname,
  cmd,
  roles,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'sales' 
AND schemaname = 'public'
ORDER BY policyname;

-- ========================================
-- PASSO 7: VERIFICAR SE A TABELA SALES EXISTE E TEM ESTRUTURA CORRETA
-- ========================================
SELECT 
  'ESTRUTURA_TABELA' as tipo,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'sales'
ORDER BY ordinal_position;

-- ========================================
-- PASSO 8: VERIFICAR SE RLS ESTÁ HABILITADO
-- ========================================
SELECT 
  'RLS_STATUS' as tipo,
  tablename,
  rowsecurity as rls_habilitado
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename = 'sales';

-- ========================================
-- PASSO 9: TESTE MANUAL (Execute como usuário autenticado)
-- ========================================
-- Descomente e execute como usuário autenticado para testar:
/*
SELECT 
  auth.uid() as user_id,
  public.get_user_tenant_id() as tenant_id_func,
  (SELECT tenant_id FROM public.users WHERE id = auth.uid() LIMIT 1) as tenant_id_direct,
  CASE 
    WHEN public.get_user_tenant_id() = (SELECT tenant_id FROM public.users WHERE id = auth.uid() LIMIT 1) 
    THEN 'OK' 
    ELSE 'ERRO' 
  END as status;
*/

-- ========================================
-- PASSO 10: VERIFICAR VENDAS EXISTENTES
-- ========================================
SELECT 
  'VENDAS_EXISTENTES' as tipo,
  COUNT(*) as total_vendas,
  COUNT(DISTINCT tenant_id) as total_tenants,
  COUNT(DISTINCT lead_id) as total_leads,
  SUM(amount) as valor_total
FROM public.sales;

-- ========================================
-- PASSO 11: VERIFICAR SE HÁ LEADS VENDIDOS SEM VENDA NA TABELA SALES
-- ========================================
SELECT 
  'LEADS_SEM_VENDA' as tipo,
  l.id as lead_id,
  l.name as lead_name,
  l.tenant_id,
  s.name as stage_name,
  u.email as user_email,
  u.tenant_id as user_tenant_id
FROM public.leads l
LEFT JOIN public.stages s ON l.stage_id = s.id
LEFT JOIN public.users u ON l.tenant_id = u.tenant_id
LEFT JOIN public.sales sa ON l.id = sa.lead_id
WHERE (
  s.name ILIKE '%fechado%' 
  OR s.name ILIKE '%vendido%' 
  OR s.name ILIKE '%ganho%' 
  OR s.name ILIKE '%bolso%'
)
AND sa.id IS NULL
LIMIT 10;

-- ========================================
-- COMENTÁRIOS FINAIS
-- ========================================
-- Este script:
-- 1. Recria a função get_user_tenant_id() de forma robusta
-- 2. Remove todas as políticas RLS conflitantes
-- 3. Cria políticas RLS uniformes e permissivas
-- 4. Verifica a estrutura da tabela sales
-- 5. Verifica se RLS está habilitado
-- 6. Mostra estatísticas de vendas existentes
-- 7. Identifica leads vendidos sem venda na tabela sales

-- Após executar este script:
-- 1. Teste marcar um lead como vendido
-- 2. Verifique se a venda foi criada na tabela sales
-- 3. Verifique os logs no console do navegador
-- 4. Se ainda não funcionar, verifique se o tenant_id do usuário está correto na tabela users

