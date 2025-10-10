-- =====================================================
-- LIMPEZA COMPLETA DE DADOS E GARANTIA DE ISOLAMENTO
-- =====================================================

-- 1. LIMPAR TODOS OS DADOS EXISTENTES
DELETE FROM public.metrics_daily;
DELETE FROM public.messages;
DELETE FROM public.conversations;
DELETE FROM public.lead_events;
DELETE FROM public.leads;
DELETE FROM public.stages;
DELETE FROM public.pipelines;
DELETE FROM public.whatsapp_connections;
DELETE FROM public.users;
DELETE FROM public.tenants;

-- 2. CRIAR TENANTS DE TESTE
INSERT INTO public.tenants (id, name, slug, settings) VALUES
  ('8bd69047-7533-42f3-a2f7-e3a60477f68c', 'Varejo', 'varejo', '{"theme": "light"}'),
  ('a961a599-65ab-408c-b39e-bc2109a07bff', 'Distribuidores', 'distribuidores', '{"theme": "light"}');

-- 3. CRIAR USUÁRIOS COM ISOLAMENTO PERFEITO
-- Maria (Agente Varejo)
INSERT INTO public.users (id, email, name, role, tenant_id, created_at) VALUES
  ('2810efa0-748c-46da-bea0-b7c1efafbe3', 'maria@varejo.com', 'Maria Vitória', 'agent', '8bd69047-7533-42f3-a2f7-e3a60477f68c', NOW());

-- Julia (Agente Distribuidores)  
INSERT INTO public.users (id, email, name, role, tenant_id, created_at) VALUES
  ('b7c1efaf-be3f-4a2d-8e5c-9d3f4a1b2c3e', 'julia@distribuidores.com', 'Julia Santos', 'agent', 'a961a599-65ab-408c-b39e-bc2109a07bff', NOW());

-- Julio (Supervisor - Varejo)
INSERT INTO public.users (id, email, name, role, tenant_id, created_at) VALUES
  ('c8d2f0ba-e4f4-4b3e-9f6d-ae4f5b2c3d4f', 'julio@varejo.com', 'Julio Supervisor', 'supervisor', '8bd69047-7533-42f3-a2f7-e3a60477f68c', NOW());

-- Taiguara (Supervisor - Distribuidores)
INSERT INTO public.users (id, email, name, role, tenant_id, created_at) VALUES
  ('d9e3f1cb-f5f5-4c4f-af7e-bf5f6c3d4e5g', 'taiguara@distribuidores.com', 'Taiguara Supervisor', 'supervisor', 'a961a599-65ab-408c-b39e-bc2109a07bff', NOW());

-- Patrick (Admin - sem tenant específico)
INSERT INTO public.users (id, email, name, role, tenant_id, created_at) VALUES
  ('e0f4g2dc-g6g6-4d5g-bg8f-cg6g7d4e5f6h', 'patrick@admin.com', 'Patrick Admin', 'admin', NULL, NOW());

-- 4. CRIAR PIPELINES E STAGES
-- Pipeline Varejo
INSERT INTO public.pipelines (id, name, tenant_id, created_at) VALUES
  ('p1-varejo-001', 'Pipeline Varejo', '8bd69047-7533-42f3-a2f7-e3a60477f68c', NOW());

-- Pipeline Distribuidores
INSERT INTO public.pipelines (id, name, tenant_id, created_at) VALUES
  ('p2-dist-001', 'Pipeline Distribuidores', 'a961a599-65ab-408c-b39e-bc2109a07bff', NOW());

-- Stages para Varejo
INSERT INTO public.stages (id, name, color, pipeline_id, tenant_id, position, created_at) VALUES
  ('s1-varejo-001', 'Novo', '#3b82f6', 'p1-varejo-001', '8bd69047-7533-42f3-a2f7-e3a60477f68c', 0, NOW()),
  ('s1-varejo-002', 'Contato', '#f59e0b', 'p1-varejo-001', '8bd69047-7533-42f3-a2f7-e3a60477f68c', 1, NOW()),
  ('s1-varejo-003', 'Proposta', '#8b5cf6', 'p1-varejo-001', '8bd69047-7533-42f3-a2f7-e3a60477f68c', 2, NOW()),
  ('s1-varejo-004', 'Fechado', '#10b981', 'p1-varejo-001', '8bd69047-7533-42f3-a2f7-e3a60477f68c', 3, NOW());

-- Stages para Distribuidores
INSERT INTO public.stages (id, name, color, pipeline_id, tenant_id, position, created_at) VALUES
  ('s2-dist-001', 'Novo', '#3b82f6', 'p2-dist-001', 'a961a599-65ab-408c-b39e-bc2109a07bff', 0, NOW()),
  ('s2-dist-002', 'Contato', '#f59e0b', 'p2-dist-001', 'a961a599-65ab-408c-b39e-bc2109a07bff', 1, NOW()),
  ('s2-dist-003', 'Proposta', '#8b5cf6', 'p2-dist-001', 'a961a599-65ab-408c-b39e-bc2109a07bff', 2, NOW()),
  ('s2-dist-004', 'Fechado', '#10b981', 'p2-dist-001', 'a961a599-65ab-408c-b39e-bc2109a07bff', 3, NOW());

-- 5. GARANTIR RLS PERFEITO - VERIFICAR POLÍTICAS
-- Verificar se RLS está habilitado
SELECT tablename, rowsecurity FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('leads', 'conversations', 'messages', 'lead_events', 'users', 'tenants');

-- 6. CRIAR FUNÇÃO HELPER PARA VERIFICAR TENANT
CREATE OR REPLACE FUNCTION public.get_user_tenant_id()
RETURNS UUID AS $$
BEGIN
  RETURN (
    SELECT tenant_id 
    FROM public.users 
    WHERE id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. FUNÇÃO PARA VERIFICAR SE É ADMIN OU SUPERVISOR
CREATE OR REPLACE FUNCTION public.is_admin_or_supervisor()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() 
    AND role IN ('admin', 'supervisor', 'client_owner', 'manager')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. RECRIAR POLÍTICAS RLS PERFEITAS
-- Políticas para leads
DROP POLICY IF EXISTS "leads_select_policy" ON public.leads;
DROP POLICY IF EXISTS "leads_insert_policy" ON public.leads;
DROP POLICY IF EXISTS "leads_update_policy" ON public.leads;
DROP POLICY IF EXISTS "leads_delete_policy" ON public.leads;

CREATE POLICY "leads_select_policy" ON public.leads
  FOR SELECT
  USING (
    CASE 
      WHEN public.is_admin_or_supervisor() THEN tenant_id = public.get_user_tenant_id()
      ELSE (
        tenant_id = public.get_user_tenant_id() 
        AND assigned_to = auth.uid()
      )
    END
  );

CREATE POLICY "leads_insert_policy" ON public.leads
  FOR INSERT
  WITH CHECK (
    tenant_id = public.get_user_tenant_id()
    AND assigned_to = auth.uid()
    AND owner_user_id = auth.uid()
  );

CREATE POLICY "leads_update_policy" ON public.leads
  FOR UPDATE
  USING (
    tenant_id = public.get_user_tenant_id()
    AND (
      assigned_to = auth.uid() 
      OR public.is_admin_or_supervisor()
    )
  )
  WITH CHECK (
    tenant_id = public.get_user_tenant_id()
  );

CREATE POLICY "leads_delete_policy" ON public.leads
  FOR DELETE
  USING (
    tenant_id = public.get_user_tenant_id()
    AND (
      assigned_to = auth.uid() 
      OR public.is_admin_or_supervisor()
    )
  );

-- 9. VERIFICAR RESULTADO
SELECT 
  'TENANTS' as tabela,
  COUNT(*) as total
FROM public.tenants
UNION ALL
SELECT 
  'USERS' as tabela,
  COUNT(*) as total
FROM public.users
UNION ALL
SELECT 
  'PIPELINES' as tabela,
  COUNT(*) as total
FROM public.pipelines
UNION ALL
SELECT 
  'STAGES' as tabela,
  COUNT(*) as total
FROM public.stages;

-- 10. VERIFICAR ISOLAMENTO
SELECT 
  u.name,
  u.role,
  u.tenant_id,
  t.name as tenant_name
FROM public.users u
LEFT JOIN public.tenants t ON u.tenant_id = t.id
ORDER BY u.role, u.name;




