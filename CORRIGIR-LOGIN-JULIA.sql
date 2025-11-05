-- =====================================================
-- CORRIGIR PROBLEMA DE LOGIN - julia@wfcirurgicos.com.br
-- =====================================================
-- Execute este script no Supabase SQL Editor
-- ATENÇÃO: Execute primeiro o DIAGNOSTICAR-LOGIN-JULIA.sql para ver o problema

-- PASSO 1: Verificar situação atual
SELECT 
  'SITUACAO_ATUAL' as passo,
  au.id as auth_user_id,
  au.email as auth_email,
  au.email_confirmed_at,
  pu.id as public_user_id,
  pu.email as public_email,
  pu.active,
  pu.tenant_id,
  pu.role,
  CASE 
    WHEN au.id IS NULL THEN '❌ NÃO existe em auth.users'
    WHEN pu.id IS NULL THEN '❌ NÃO existe em public.users'
    WHEN au.id != pu.id THEN '❌ IDs DIFERENTES'
    WHEN au.email_confirmed_at IS NULL THEN '❌ Email não confirmado'
    WHEN pu.active = false THEN '❌ Usuário inativo'
    WHEN pu.tenant_id IS NULL THEN '❌ Sem tenant'
    ELSE '✅ Tudo OK'
  END as diagnostico
FROM auth.users au
FULL OUTER JOIN public.users pu ON au.id = pu.id
WHERE au.email = 'julia@wfcirurgicos.com.br' 
   OR pu.email = 'julia@wfcirurgicos.com.br';

-- PASSO 2: Se o usuário existe em auth.users mas não em public.users
-- Criar registro em public.users com o mesmo ID do auth.users
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
  COALESCE(au.raw_user_meta_data->>'name', 'Julia'),
  COALESCE((au.raw_user_meta_data->>'role')::app_role, 'agent'),
  true,
  (SELECT id FROM public.tenants WHERE name = 'Distribuidor' LIMIT 1),
  COALESCE(au.created_at, NOW()),
  NOW()
FROM auth.users au
WHERE au.email = 'julia@wfcirurgicos.com.br'
  AND NOT EXISTS (
    SELECT 1 FROM public.users pu 
    WHERE pu.id = au.id
  );

-- PASSO 3: Se o usuário existe em public.users mas está inativo
-- Ativar o usuário
UPDATE public.users
SET 
  active = true,
  updated_at = NOW()
WHERE email = 'julia@wfcirurgicos.com.br'
  AND active = false;

-- PASSO 4: Se o usuário não tem tenant associado
-- Associar ao tenant "Distribuidor" (ou criar se não existir)
-- Primeiro, garantir que o tenant existe
INSERT INTO public.tenants (id, name, plan, created_at, updated_at)
SELECT 
  gen_random_uuid(),
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
  updated_at = NOW()
WHERE email = 'julia@wfcirurgicos.com.br'
  AND tenant_id IS NULL;

-- PASSO 5: Se os IDs são diferentes, corrigir
-- (Caso mais complexo - precisa verificar qual ID usar)
-- ATENÇÃO: Este passo requer análise manual!

-- PASSO 6: Confirmar email no Supabase Auth (se necessário)
-- Nota: Isso geralmente precisa ser feito manualmente no Supabase Dashboard
-- ou via API, mas vamos atualizar o metadata
UPDATE auth.users
SET 
  email_confirmed_at = COALESCE(email_confirmed_at, NOW()),
  updated_at = NOW()
WHERE email = 'julia@wfcirurgicos.com.br'
  AND email_confirmed_at IS NULL;

-- PASSO 7: Criar/atualizar user_roles
INSERT INTO user_roles (
  user_id,
  tenant_id,
  role
)
SELECT 
  u.id,
  u.tenant_id,
  COALESCE(u.role, 'agent')
FROM public.users u
WHERE u.email = 'julia@wfcirurgicos.com.br'
  AND u.tenant_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM user_roles ur 
    WHERE ur.user_id = u.id 
    AND ur.tenant_id = u.tenant_id
  )
ON CONFLICT (user_id, tenant_id) DO UPDATE SET
  role = EXCLUDED.role;

-- PASSO 8: Verificar resultado final
SELECT 
  'RESULTADO_FINAL' as passo,
  au.id as auth_user_id,
  au.email as auth_email,
  au.email_confirmed_at,
  pu.id as public_user_id,
  pu.email as public_email,
  pu.name,
  pu.active,
  pu.role,
  pu.tenant_id,
  t.name as tenant_name,
  CASE 
    WHEN au.id IS NULL THEN '❌ PROBLEMA: Usuário não existe em auth.users'
    WHEN pu.id IS NULL THEN '❌ PROBLEMA: Usuário não existe em public.users'
    WHEN au.id != pu.id THEN '❌ PROBLEMA: IDs diferentes'
    WHEN au.email_confirmed_at IS NULL THEN '⚠️ AVISO: Email não confirmado (verificar manualmente)'
    WHEN pu.active = false THEN '❌ PROBLEMA: Usuário inativo'
    WHEN pu.tenant_id IS NULL THEN '❌ PROBLEMA: Sem tenant'
    ELSE '✅ TUDO OK - Login deve funcionar!'
  END as status_final
FROM auth.users au
FULL OUTER JOIN public.users pu ON au.id = pu.id
LEFT JOIN public.tenants t ON pu.tenant_id = t.id
WHERE au.email = 'julia@wfcirurgicos.com.br' 
   OR pu.email = 'julia@wfcirurgicos.com.br';

