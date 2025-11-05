-- =====================================================
-- DIAGNOSTICAR PROBLEMA DE LOGIN - julia@wfcirurgicos.com.br
-- =====================================================

-- 1. Verificar se o usuário existe em auth.users (Supabase Auth)
SELECT 
  'AUTH.USERS' as tabela,
  id,
  email,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_user_meta_data,
  app_metadata,
  CASE 
    WHEN email_confirmed_at IS NULL THEN '❌ Email NÃO confirmado'
    ELSE '✅ Email confirmado'
  END as status_email
FROM auth.users
WHERE email = 'julia@wfcirurgicos.com.br';

-- 2. Verificar se o usuário existe em public.users (tabela do CRM)
SELECT 
  'PUBLIC.USERS' as tabela,
  id,
  email,
  name,
  role,
  active,
  tenant_id,
  created_at,
  updated_at,
  CASE 
    WHEN active = false THEN '❌ Usuário INATIVO'
    WHEN tenant_id IS NULL THEN '❌ Sem tenant associado'
    ELSE '✅ Usuário OK'
  END as status
FROM public.users
WHERE email = 'julia@wfcirurgicos.com.br';

-- 3. Verificar se o ID coincide entre auth.users e public.users
SELECT 
  au.id as auth_user_id,
  au.email as auth_email,
  au.email_confirmed_at,
  pu.id as public_user_id,
  pu.email as public_email,
  pu.active,
  pu.tenant_id,
  pu.role,
  CASE 
    WHEN au.id IS NULL THEN '❌ Usuário NÃO existe em auth.users'
    WHEN pu.id IS NULL THEN '❌ Usuário NÃO existe em public.users'
    WHEN au.id != pu.id THEN '❌ IDs DIFERENTES - Problema crítico!'
    WHEN au.email_confirmed_at IS NULL THEN '❌ Email não confirmado'
    WHEN pu.active = false THEN '❌ Usuário inativo'
    WHEN pu.tenant_id IS NULL THEN '❌ Sem tenant'
    ELSE '✅ Tudo OK'
  END as diagnostico
FROM auth.users au
FULL OUTER JOIN public.users pu ON au.id = pu.id
WHERE au.email = 'julia@wfcirurgicos.com.br' 
   OR pu.email = 'julia@wfcirurgicos.com.br';

-- 4. Verificar tenant associado
SELECT 
  t.id as tenant_id,
  t.name as tenant_name,
  t.plan as tenant_plan,
  u.id as user_id,
  u.email,
  u.name,
  u.role,
  u.active
FROM public.tenants t
RIGHT JOIN public.users u ON t.id = u.tenant_id
WHERE u.email = 'julia@wfcirurgicos.com.br';

-- 5. Verificar se há múltiplos registros com o mesmo email
SELECT 
  'MULTIPLOS_REGISTROS' as tipo,
  COUNT(*) as total,
  STRING_AGG(id::text, ', ') as ids
FROM public.users
WHERE email = 'julia@wfcirurgicos.com.br'
GROUP BY email
HAVING COUNT(*) > 1;

