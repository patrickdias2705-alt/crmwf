-- Script para corrigir RLS de budget_documents no Vercel
-- Execute este script no Supabase SQL Editor

-- 1. Verificar políticas atuais
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE tablename = 'budget_documents';

-- 2. Remover políticas antigas (se existirem)
DROP POLICY IF EXISTS "budget_documents_select_policy" ON public.budget_documents;
DROP POLICY IF EXISTS "budget_documents_insert_policy" ON public.budget_documents;
DROP POLICY IF EXISTS "budget_documents_update_policy" ON public.budget_documents;
DROP POLICY IF EXISTS "budget_documents_delete_policy" ON public.budget_documents;

-- 3. Criar política de SELECT mais robusta
-- Permite ver orçamentos de leads do mesmo tenant
CREATE POLICY "budget_documents_select_policy" ON public.budget_documents
  FOR SELECT
  USING (
    -- Verificar se o tenant_id do documento corresponde ao tenant do usuário
    tenant_id IN (
      SELECT tenant_id 
      FROM public.users 
      WHERE id = auth.uid() 
      AND active = true
    )
    OR
    -- Fallback: verificar através do lead
    lead_id IN (
      SELECT id 
      FROM public.leads 
      WHERE tenant_id IN (
        SELECT tenant_id 
        FROM public.users 
        WHERE id = auth.uid() 
        AND active = true
      )
    )
  );

-- 4. Criar política de INSERT
CREATE POLICY "budget_documents_insert_policy" ON public.budget_documents
  FOR INSERT
  WITH CHECK (
    -- Verificar se o tenant_id corresponde ao tenant do usuário
    tenant_id IN (
      SELECT tenant_id 
      FROM public.users 
      WHERE id = auth.uid() 
      AND active = true
    )
    AND uploaded_by = auth.uid()
    AND lead_id IN (
      SELECT id 
      FROM public.leads 
      WHERE tenant_id IN (
        SELECT tenant_id 
        FROM public.users 
        WHERE id = auth.uid() 
        AND active = true
      )
    )
  );

-- 5. Criar política de UPDATE
CREATE POLICY "budget_documents_update_policy" ON public.budget_documents
  FOR UPDATE
  USING (
    tenant_id IN (
      SELECT tenant_id 
      FROM public.users 
      WHERE id = auth.uid() 
      AND active = true
    )
  )
  WITH CHECK (
    tenant_id IN (
      SELECT tenant_id 
      FROM public.users 
      WHERE id = auth.uid() 
      AND active = true
    )
  );

-- 6. Criar política de DELETE
CREATE POLICY "budget_documents_delete_policy" ON public.budget_documents
  FOR DELETE
  USING (
    tenant_id IN (
      SELECT tenant_id 
      FROM public.users 
      WHERE id = auth.uid() 
      AND active = true
    )
    AND (
      uploaded_by = auth.uid()
      OR EXISTS (
        SELECT 1 FROM public.users 
        WHERE id = auth.uid() 
        AND role IN ('admin', 'client_owner', 'supervisor')
        AND tenant_id = budget_documents.tenant_id
      )
    )
  );

-- 7. Verificar se a função get_user_tenant_id está funcionando
-- Teste manual (execute como usuário autenticado):
SELECT 
  auth.uid() as user_id,
  public.get_user_tenant_id() as tenant_id,
  (SELECT tenant_id FROM public.users WHERE id = auth.uid() LIMIT 1) as tenant_id_direct;

-- 8. Verificar se há orçamentos que não estão sendo retornados
-- Execute esta query como admin para ver todos os orçamentos
SELECT 
  bd.id,
  bd.lead_id,
  bd.tenant_id,
  bd.status,
  bd.amount,
  u.id as user_id,
  u.tenant_id as user_tenant_id,
  CASE 
    WHEN bd.tenant_id = u.tenant_id THEN 'MATCH'
    ELSE 'MISMATCH'
  END as tenant_match
FROM public.budget_documents bd
CROSS JOIN public.users u
WHERE u.id = auth.uid()
LIMIT 10;

-- 9. Atualizar função get_user_tenant_id para ser mais robusta
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
  -- Tentar buscar tenant_id do usuário autenticado
  SELECT tenant_id INTO tid
  FROM public.users
  WHERE id = auth.uid() 
    AND active = true
  LIMIT 1;

  -- Se não encontrou, retornar NULL (não 0)
  RETURN tid;
END;
$$;

-- 10. Comentário explicativo
COMMENT ON FUNCTION public.get_user_tenant_id() IS 
'Retorna o tenant_id do usuário autenticado. Usado em políticas RLS para isolamento de dados.';

-- 11. Verificar políticas criadas
SELECT 
  policyname,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'budget_documents'
ORDER BY policyname;

