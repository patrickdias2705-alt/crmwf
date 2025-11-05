-- =====================================================
-- VERIFICAR SENHA E EMAIL - julia@wfcirurgicos.com.br
-- =====================================================
-- Como os IDs coincidem, vamos verificar outros problemas
-- =====================================================

-- PASSO 1: Verificar status completo do usuário
SELECT 
  'VERIFICACAO_COMPLETA' as passo,
  au.id as auth_user_id,
  au.email as auth_email,
  au.email_confirmed_at,
  au.created_at as auth_created_at,
  au.updated_at as auth_updated_at,
  au.last_sign_in_at,
  pu.id as public_user_id,
  pu.email as public_email,
  pu.name,
  pu.active,
  pu.role,
  pu.tenant_id,
  t.name as tenant_name,
  CASE 
    WHEN au.email_confirmed_at IS NULL THEN '❌ Email NÃO confirmado - Pode impedir login'
    WHEN pu.active = false THEN '❌ Usuário INATIVO - Impede login'
    WHEN pu.tenant_id IS NULL THEN '❌ Sem tenant - Pode impedir login'
    WHEN au.last_sign_in_at IS NULL THEN '⚠️ Nunca fez login - Pode ser senha incorreta'
    ELSE '✅ Configuração OK'
  END as status
FROM auth.users au
JOIN public.users pu ON au.id = pu.id
LEFT JOIN public.tenants t ON pu.tenant_id = t.id
WHERE au.email = 'julia@wfcirurgicos.com.br';

-- PASSO 2: Verificar se email está confirmado
SELECT 
  'VERIFICAR_EMAIL' as passo,
  id,
  email,
  email_confirmed_at,
  CASE 
    WHEN email_confirmed_at IS NULL THEN '❌ Email NÃO confirmado - Precisa confirmar'
    ELSE '✅ Email confirmado'
  END as status_email
FROM auth.users
WHERE email = 'julia@wfcirurgicos.com.br';

-- PASSO 3: Verificar se usuário está ativo
SELECT 
  'VERIFICAR_ATIVO' as passo,
  id,
  email,
  active,
  CASE 
    WHEN active = false THEN '❌ Usuário INATIVO - Precisa ativar'
    ELSE '✅ Usuário ativo'
  END as status_ativo
FROM public.users
WHERE email = 'julia@wfcirurgicos.com.br';

-- PASSO 4: Verificar tenant
SELECT 
  'VERIFICAR_TENANT' as passo,
  u.id as user_id,
  u.email,
  u.tenant_id,
  t.id as tenant_id_real,
  t.name as tenant_name,
  CASE 
    WHEN u.tenant_id IS NULL THEN '❌ Sem tenant - Precisa associar'
    WHEN t.id IS NULL THEN '❌ Tenant não encontrado'
    ELSE '✅ Tenant OK'
  END as status_tenant
FROM public.users u
LEFT JOIN public.tenants t ON u.tenant_id = t.id
WHERE u.email = 'julia@wfcirurgicos.com.br';

-- PASSO 5: Verificar user_roles
SELECT 
  'VERIFICAR_ROLES' as passo,
  ur.id as user_role_id,
  ur.user_id,
  ur.tenant_id,
  ur.role,
  u.email,
  t.name as tenant_name,
  CASE 
    WHEN ur.id IS NULL THEN '⚠️ Sem role na tabela user_roles'
    ELSE '✅ Role OK'
  END as status_role
FROM public.users u
LEFT JOIN user_roles ur ON u.id = ur.user_id
LEFT JOIN public.tenants t ON ur.tenant_id = t.id
WHERE u.email = 'julia@wfcirurgicos.com.br';

