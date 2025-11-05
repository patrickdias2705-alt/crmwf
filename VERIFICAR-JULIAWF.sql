-- =====================================================
-- VERIFICAR SE juliawf@gmail.com FOI CRIADO
-- =====================================================
-- Execute este SQL para verificar se o novo usuário existe
-- =====================================================

-- PASSO 1: Verificar se existe em auth.users
SELECT 
  'AUTH.USERS' as tabela,
  id as auth_user_id,
  email as auth_email,
  email_confirmed_at,
  created_at,
  last_sign_in_at,
  CASE 
    WHEN id IS NULL THEN '❌ Não existe em auth.users - Precisa criar via Dashboard'
    WHEN email_confirmed_at IS NULL THEN '⚠️ Existe mas email não confirmado'
    ELSE '✅ Existe e email confirmado'
  END as status
FROM auth.users
WHERE email = 'juliawf@gmail.com';

-- PASSO 2: Verificar se existe em public.users
SELECT 
  'PUBLIC.USERS' as tabela,
  id as public_user_id,
  email as public_email,
  name,
  active,
  role,
  tenant_id,
  created_at,
  CASE 
    WHEN id IS NULL THEN '❌ Não existe em public.users - Precisa criar'
    WHEN active = false THEN '⚠️ Existe mas está inativo'
    WHEN tenant_id IS NULL THEN '⚠️ Existe mas sem tenant'
    ELSE '✅ Existe e está OK'
  END as status
FROM public.users
WHERE email = 'juliawf@gmail.com';

-- PASSO 3: Verificar se os IDs coincidem
SELECT 
  'COMPARACAO_IDS' as passo,
  au.id as auth_user_id,
  au.email as auth_email,
  au.email_confirmed_at,
  pu.id as public_user_id,
  pu.email as public_email,
  pu.active,
  pu.role,
  pu.tenant_id,
  t.name as tenant_name,
  CASE 
    WHEN au.id IS NULL THEN '❌ Não existe em auth.users - CRIE VIA DASHBOARD'
    WHEN pu.id IS NULL THEN '❌ Não existe em public.users - Execute SQL do PASSO 4'
    WHEN au.id != pu.id THEN '❌ IDs diferentes - PROBLEMA!'
    WHEN au.email_confirmed_at IS NULL THEN '⚠️ Email não confirmado'
    WHEN pu.active = false THEN '❌ Usuário inativo'
    WHEN pu.tenant_id IS NULL THEN '❌ Sem tenant - Execute SQL do PASSO 5'
    ELSE '✅ TUDO OK - Login deve funcionar!'
  END as status_final
FROM auth.users au
FULL OUTER JOIN public.users pu ON au.id = pu.id
LEFT JOIN public.tenants t ON pu.tenant_id = t.id
WHERE au.email = 'juliawf@gmail.com' 
   OR pu.email = 'juliawf@gmail.com';

-- =====================================================
-- PASSO 4: Se não existe em public.users, criar
-- =====================================================
-- Execute este SQL se o PASSO 2 mostrar que não existe em public.users
-- =====================================================

INSERT INTO public.users (
  id,
  email,
  name,
  role,
  active,
  tenant_id,
  created_at,
  updated_at
)
SELECT 
  au.id,
  au.email,
  'Julia',
  'agent',
  true,
  (SELECT id FROM public.tenants WHERE name = 'Distribuidor' LIMIT 1),
  COALESCE(au.created_at, NOW()),
  NOW()
FROM auth.users au
WHERE au.email = 'juliawf@gmail.com'
  AND NOT EXISTS (
    SELECT 1 FROM public.users pu 
    WHERE pu.id = au.id
  )
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  role = EXCLUDED.role,
  active = EXCLUDED.active,
  updated_at = NOW();

-- =====================================================
-- PASSO 5: Associar ao tenant e criar user_role
-- =====================================================
-- Execute este SQL se o PASSO 3 mostrar que não tem tenant
-- =====================================================

-- Garantir que o tenant existe
INSERT INTO public.tenants (id, name, plan, created_at, updated_at)
SELECT 
  'a961a599-65ab-408c-b39e-bc2109a07bff'::UUID,
  'Distribuidor',
  'free',
  NOW(),
  NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM public.tenants WHERE name = 'Distribuidor'
);

-- Associar usuário ao tenant
UPDATE public.users
SET 
  tenant_id = (SELECT id FROM public.tenants WHERE name = 'Distribuidor' LIMIT 1),
  name = 'Julia',
  role = 'agent',
  active = true,
  updated_at = NOW()
WHERE email = 'juliawf@gmail.com';

-- Criar user_role
INSERT INTO user_roles (user_id, tenant_id, role)
SELECT 
  u.id,
  u.tenant_id,
  'agent'
FROM public.users u
WHERE u.email = 'juliawf@gmail.com'
  AND u.tenant_id IS NOT NULL
ON CONFLICT (user_id, tenant_id) DO UPDATE SET
  role = EXCLUDED.role;

-- =====================================================
-- PASSO 6: Verificação final
-- =====================================================
SELECT 
  'VERIFICACAO_FINAL' as passo,
  au.id as auth_user_id,
  au.email as auth_email,
  au.email_confirmed_at,
  au.last_sign_in_at,
  pu.id as public_user_id,
  pu.email as public_email,
  pu.name,
  pu.active,
  pu.role,
  pu.tenant_id,
  t.name as tenant_name,
  CASE 
    WHEN au.id IS NULL THEN '❌ PROBLEMA: Não existe em auth.users'
    WHEN pu.id IS NULL THEN '❌ PROBLEMA: Não existe em public.users'
    WHEN au.id != pu.id THEN '❌ PROBLEMA: IDs diferentes'
    WHEN au.email_confirmed_at IS NULL THEN '⚠️ AVISO: Email não confirmado'
    WHEN pu.active = false THEN '❌ PROBLEMA: Usuário inativo'
    WHEN pu.tenant_id IS NULL THEN '❌ PROBLEMA: Sem tenant'
    WHEN au.last_sign_in_at IS NULL THEN '⚠️ Nunca fez login - Pode ser senha incorreta'
    ELSE '✅ TUDO OK - Login deve funcionar!'
  END as status_final
FROM auth.users au
JOIN public.users pu ON au.id = pu.id
LEFT JOIN public.tenants t ON pu.tenant_id = t.id
WHERE au.email = 'juliawf@gmail.com';

