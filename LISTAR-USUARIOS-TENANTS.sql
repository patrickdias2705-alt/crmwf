-- =====================================================
-- LISTAR TODOS OS USUÁRIOS DO CRM E SEUS TENANTS
-- =====================================================

SELECT 
  u.id as user_id,
  u.email,
  u.name as nome_usuario,
  u.role as perfil,
  u.active as ativo,
  u.tenant_id,
  t.name as nome_tenant,
  t.plan as plano_tenant,
  u.created_at as data_criacao,
  u.updated_at as ultima_atualizacao
FROM public.users u
LEFT JOIN public.tenants t ON u.tenant_id = t.id
ORDER BY 
  COALESCE(t.name, 'SEM TENANT'),
  u.name;

