-- Script SIMPLIFICADO para corrigir RLS de budget_documents
-- Execute este script no Supabase SQL Editor
-- Esta versão é mais simples e robusta para funcionar no Vercel

-- 1. Remover TODAS as políticas existentes
DROP POLICY IF EXISTS "budget_documents_select_policy" ON public.budget_documents;
DROP POLICY IF EXISTS "budget_documents_insert_policy" ON public.budget_documents;
DROP POLICY IF EXISTS "budget_documents_update_policy" ON public.budget_documents;
DROP POLICY IF EXISTS "budget_documents_delete_policy" ON public.budget_documents;

-- 2. Garantir que RLS está habilitado
ALTER TABLE public.budget_documents ENABLE ROW LEVEL SECURITY;

-- 3. Política de SELECT - SIMPLIFICADA
-- Permite ver orçamentos de leads do mesmo tenant do usuário
CREATE POLICY "budget_documents_select_policy" 
ON public.budget_documents
FOR SELECT
USING (
  EXISTS (
    SELECT 1 
    FROM public.users u
    WHERE u.id = auth.uid()
      AND u.active = true
      AND u.tenant_id = budget_documents.tenant_id
  )
);

-- 4. Política de INSERT - SIMPLIFICADA
CREATE POLICY "budget_documents_insert_policy" 
ON public.budget_documents
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 
    FROM public.users u
    WHERE u.id = auth.uid()
      AND u.active = true
      AND u.tenant_id = budget_documents.tenant_id
  )
  AND uploaded_by = auth.uid()
  AND EXISTS (
    SELECT 1 
    FROM public.leads l
    WHERE l.id = budget_documents.lead_id
      AND l.tenant_id = budget_documents.tenant_id
  )
);

-- 5. Política de UPDATE - SIMPLIFICADA
CREATE POLICY "budget_documents_update_policy" 
ON public.budget_documents
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 
    FROM public.users u
    WHERE u.id = auth.uid()
      AND u.active = true
      AND u.tenant_id = budget_documents.tenant_id
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 
    FROM public.users u
    WHERE u.id = auth.uid()
      AND u.active = true
      AND u.tenant_id = budget_documents.tenant_id
  )
);

-- 6. Política de DELETE - SIMPLIFICADA
CREATE POLICY "budget_documents_delete_policy" 
ON public.budget_documents
FOR DELETE
USING (
  EXISTS (
    SELECT 1 
    FROM public.users u
    WHERE u.id = auth.uid()
      AND u.active = true
      AND u.tenant_id = budget_documents.tenant_id
  )
  AND (
    uploaded_by = auth.uid()
    OR EXISTS (
      SELECT 1 
      FROM public.users u
      WHERE u.id = auth.uid()
        AND u.active = true
        AND u.role IN ('admin', 'client_owner', 'supervisor')
        AND u.tenant_id = budget_documents.tenant_id
    )
  )
);

-- 7. Verificar políticas criadas
SELECT 
  policyname,
  cmd,
  CASE 
    WHEN qual IS NULL THEN 'NULL'
    WHEN length(qual::text) > 100 THEN left(qual::text, 100) || '...'
    ELSE qual::text
  END as qual_preview,
  CASE 
    WHEN with_check IS NULL THEN 'NULL'
    WHEN length(with_check::text) > 100 THEN left(with_check::text, 100) || '...'
    ELSE with_check::text
  END as with_check_preview
FROM pg_policies 
WHERE tablename = 'budget_documents'
ORDER BY policyname;

-- 8. Testar a política de SELECT manualmente
-- Esta query deve retornar os orçamentos do tenant do usuário autenticado
SELECT 
  COUNT(*) as total_orcamentos,
  COUNT(CASE WHEN status = 'aberto' THEN 1 END) as orcamentos_abertos
FROM public.budget_documents;

-- 9. Verificar se a função get_user_tenant_id está funcionando
-- Execute esta query enquanto estiver autenticado
SELECT 
  auth.uid() as user_id,
  public.get_user_tenant_id() as tenant_id_from_function,
  (SELECT tenant_id FROM public.users WHERE id = auth.uid() LIMIT 1) as tenant_id_direct;

-- 10. Comentário final
COMMENT ON TABLE public.budget_documents IS 
'Tabela de orçamentos. RLS garante que usuários só vejam orçamentos do seu tenant.';

