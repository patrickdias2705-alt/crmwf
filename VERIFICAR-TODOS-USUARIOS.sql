-- =====================================================
-- VERIFICAR TODOS OS USUÁRIOS E SUAS TENANTS
-- =====================================================

-- Consulta completa de usuários com suas tenants
SELECT 
  u.id as user_id,
  u.email,
  u.name as user_name,
  u.role,
  u.active,
  u.tenant_id,
  t.id as tenant_table_id,
  t.name as tenant_name,
  t.plan as tenant_plan,
  u.created_at as user_created_at,
  u.updated_at as user_updated_at
FROM public.users u
LEFT JOIN public.tenants t ON u.tenant_id = t.id
ORDER BY 
  t.name NULLS LAST,
  u.role,
  u.name;

-- Resumo por tenant
SELECT 
  COALESCE(t.name, 'SEM TENANT') as tenant_name,
  t.id as tenant_id,
  COUNT(u.id) as total_usuarios,
  COUNT(CASE WHEN u.role = 'admin' THEN 1 END) as admins,
  COUNT(CASE WHEN u.role = 'supervisor' THEN 1 END) as supervisors,
  COUNT(CASE WHEN u.role = 'agent' THEN 1 END) as agents,
  COUNT(CASE WHEN u.role = 'viewer' THEN 1 END) as viewers,
  COUNT(CASE WHEN u.active = true THEN 1 END) as usuarios_ativos,
  COUNT(CASE WHEN u.active = false THEN 1 END) as usuarios_inativos
FROM public.tenants t
LEFT JOIN public.users u ON t.id = u.tenant_id
GROUP BY t.id, t.name
ORDER BY t.name;

-- Resumo por role
SELECT 
  u.role,
  COUNT(u.id) as total,
  COUNT(CASE WHEN u.active = true THEN 1 END) as ativos,
  COUNT(CASE WHEN u.active = false THEN 1 END) as inativos,
  COUNT(CASE WHEN u.tenant_id IS NULL THEN 1 END) as sem_tenant
FROM public.users u
GROUP BY u.role
ORDER BY u.role;

-- Lista de tenants disponíveis
SELECT 
  t.id,
  t.name,
  t.plan,
  t.created_at,
  t.updated_at,
  COUNT(u.id) as total_usuarios
FROM public.tenants t
LEFT JOIN public.users u ON t.id = u.tenant_id
GROUP BY t.id, t.name, t.plan, t.created_at, t.updated_at
ORDER BY t.name;

