-- ============================================================================
-- TESTE: Verificar se o isolamento de dados está funcionando
-- ============================================================================

-- 1. Verificar se as novas políticas foram criadas
SELECT 
  tablename, 
  policyname, 
  cmd as operacao,
  permissive,
  roles
FROM pg_policies
WHERE schemaname = 'public'
AND tablename IN ('leads', 'conversations', 'messages', 'lead_events', 'budgets')
ORDER BY tablename, policyname;

-- 2. Verificar se a função helper existe
SELECT proname, prosrc 
FROM pg_proc 
WHERE proname = 'is_admin_or_supervisor';

-- 3. Verificar se RLS está ativo nas tabelas
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_ativo
FROM pg_tables 
WHERE schemaname = 'public'
AND tablename IN ('leads', 'conversations', 'messages', 'lead_events', 'budgets', 'activities', 'metrics_daily')
ORDER BY tablename;

-- 4. Verificar usuários existentes (para teste)
SELECT 
  id,
  email,
  name,
  role,
  active,
  tenant_id
FROM public.users
ORDER BY role, name;

-- 5. Verificar tenants existentes
SELECT 
  id,
  name,
  plan
FROM public.tenants
ORDER BY name;

-- 6. Verificar leads existentes (se houver)
SELECT 
  id,
  name,
  phone,
  assigned_to,
  owner_user_id,
  tenant_id,
  created_at
FROM public.leads
ORDER BY created_at DESC
LIMIT 10;




