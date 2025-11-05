-- =====================================================
-- DIAGNOSTICAR PROBLEMA DE LOGIN - julia@wfcirurgicos.com.br
-- =====================================================
-- Execute este SQL para identificar o problema exato
-- =====================================================

-- PASSO 1: Verificar se existe em auth.users (Supabase Auth)
SELECT 
  'AUTH.USERS' as tabela,
  id as auth_user_id,
  email,
  email_confirmed_at,
  created_at,
  updated_at,
  last_sign_in_at,
  CASE 
    WHEN id IS NULL THEN '❌ PROBLEMA: Usuário NÃO existe em auth.users'
    WHEN email_confirmed_at IS NULL THEN '⚠️ Email NÃO confirmado'
    ELSE '✅ OK'
  END as status
FROM auth.users
WHERE email = 'julia@wfcirurgicos.com.br';

-- PASSO 2: Verificar se existe em public.users (tabela do CRM)
SELECT 
  'PUBLIC.USERS' as tabela,
  id as public_user_id,
  email,
  name,
  role,
  active,
  tenant_id,
  created_at,
  updated_at,
  CASE 
    WHEN id IS NULL THEN '❌ PROBLEMA: Usuário NÃO existe em public.users'
    WHEN active = false THEN '❌ PROBLEMA: Usuário INATIVO'
    WHEN tenant_id IS NULL THEN '❌ PROBLEMA: Sem tenant associado'
    ELSE '✅ OK'
  END as status
FROM public.users
WHERE email = 'julia@wfcirurgicos.com.br';

-- PASSO 3: Verificar se os IDs coincidem (PROBLEMA CRÍTICO!)
SELECT 
  'COMPARACAO_IDS' as passo,
  au.id as auth_user_id,
  au.email as auth_email,
  au.email_confirmed_at,
  pu.id as public_user_id,
  pu.email as public_email,
  pu.active,
  pu.tenant_id,
  pu.role,
  CASE 
    WHEN au.id IS NULL THEN '❌ PROBLEMA CRÍTICO: Usuário NÃO existe em auth.users'
    WHEN pu.id IS NULL THEN '❌ PROBLEMA CRÍTICO: Usuário NÃO existe em public.users'
    WHEN au.id != pu.id THEN '❌ PROBLEMA CRÍTICO: IDs DIFERENTES - Isso impede o login!'
    WHEN au.email_confirmed_at IS NULL THEN '⚠️ Email não confirmado'
    WHEN pu.active = false THEN '❌ Usuário inativo'
    WHEN pu.tenant_id IS NULL THEN '❌ Sem tenant'
    ELSE '✅ IDs coincidem - OK'
  END as diagnostico
FROM auth.users au
FULL OUTER JOIN public.users pu ON au.id = pu.id
WHERE au.email = 'julia@wfcirurgicos.com.br' 
   OR pu.email = 'julia@wfcirurgicos.com.br';

-- PASSO 4: Verificar tenant associado
SELECT 
  'TENANT' as passo,
  t.id as tenant_id,
  t.name as tenant_name,
  t.plan as tenant_plan,
  u.id as user_id,
  u.email,
  u.name,
  u.role,
  u.active,
  CASE 
    WHEN t.id IS NULL THEN '❌ PROBLEMA: Tenant não encontrado'
    ELSE '✅ Tenant OK'
  END as status_tenant
FROM public.users u
LEFT JOIN public.tenants t ON u.tenant_id = t.id
WHERE u.email = 'julia@wfcirurgicos.com.br';

-- PASSO 5: Verificar user_roles
SELECT 
  'USER_ROLES' as passo,
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
LEFT JOIN public.user_roles ur ON u.id = ur.user_id
LEFT JOIN public.tenants t ON ur.tenant_id = t.id
WHERE u.email = 'julia@wfcirurgicos.com.br';

