-- ========================================
-- CORRIGIR RLS PARA DIFERENCIAR ORÇAMENTOS POR VENDEDOR
-- ========================================
-- Execute no SQL Editor do Supabase
-- Este script garante que cada vendedor veja apenas seus próprios orçamentos
-- (exceto supervisores/managers que veem todos do tenant)

-- 1. REMOVER POLÍTICAS ANTIGAS
DROP POLICY IF EXISTS "budget_documents_select_policy" ON public.budget_documents;
DROP POLICY IF EXISTS "budget_documents_insert_policy" ON public.budget_documents;
DROP POLICY IF EXISTS "budget_documents_update_policy" ON public.budget_documents;
DROP POLICY IF EXISTS "budget_documents_delete_policy" ON public.budget_documents;

-- 2. CRIAR NOVA POLÍTICA SELECT: Vendedores veem apenas seus orçamentos
-- Supervisores/Managers/Admins veem todos do tenant
CREATE POLICY "budget_documents_select_policy" ON public.budget_documents
  FOR SELECT
  USING (
    tenant_id = public.get_user_tenant_id()
    AND (
      -- Admin/Supervisor/Manager veem tudo do tenant
      public.is_admin_or_supervisor()
      -- Vendedores (agents) veem apenas orçamentos que eles enviaram
      OR uploaded_by = auth.uid()
      -- Ou orçamentos de leads atribuídos a eles
      OR lead_id IN (
        SELECT id FROM public.leads 
        WHERE assigned_to = auth.uid() 
        AND tenant_id = public.get_user_tenant_id()
      )
    )
  );

-- 3. CRIAR NOVA POLÍTICA INSERT: Vendedores podem criar orçamentos
-- Mas o uploaded_by DEVE ser o próprio usuário
CREATE POLICY "budget_documents_insert_policy" ON public.budget_documents
  FOR INSERT
  WITH CHECK (
    tenant_id = public.get_user_tenant_id()
    AND (
      -- O uploaded_by DEVE ser o usuário atual
      uploaded_by = auth.uid()
      -- E o lead deve pertencer ao tenant
      AND lead_id IN (
        SELECT id FROM public.leads 
        WHERE tenant_id = public.get_user_tenant_id()
      )
    )
  );

-- 4. CRIAR NOVA POLÍTICA UPDATE: Apenas quem enviou pode editar
-- Ou supervisores/managers
CREATE POLICY "budget_documents_update_policy" ON public.budget_documents
  FOR UPDATE
  USING (
    tenant_id = public.get_user_tenant_id()
    AND (
      public.is_admin_or_supervisor()
      OR uploaded_by = auth.uid()
    )
  )
  WITH CHECK (
    tenant_id = public.get_user_tenant_id()
  );

-- 5. CRIAR NOVA POLÍTICA DELETE: Apenas quem enviou pode deletar
-- Ou supervisores/managers
CREATE POLICY "budget_documents_delete_policy" ON public.budget_documents
  FOR DELETE
  USING (
    tenant_id = public.get_user_tenant_id()
    AND (
      public.is_admin_or_supervisor()
      OR uploaded_by = auth.uid()
    )
  );

-- 6. VERIFICAR RESULTADO
SELECT 
  'Políticas RLS criadas com sucesso!' as status,
  COUNT(*) as total_policies
FROM pg_policies
WHERE tablename = 'budget_documents';

-- ✅ Agora cada vendedor vê apenas seus próprios orçamentos!
-- Supervisores/Managers/Admins veem todos do tenant

