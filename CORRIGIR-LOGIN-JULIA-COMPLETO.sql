-- =====================================================
-- CORRIGIR PROBLEMA DE LOGIN - julia@wfcirurgicos.com.br
-- =====================================================
-- Execute este SQL APÓS o diagnóstico para corrigir problemas
-- =====================================================

-- PASSO 1: Verificar situação atual completa
SELECT 
  'DIAGNOSTICO_COMPLETO' as passo,
  au.id as auth_user_id,
  au.email as auth_email,
  au.email_confirmed_at,
  pu.id as public_user_id,
  pu.email as public_email,
  pu.active,
  pu.tenant_id,
  pu.role,
  CASE 
    WHEN au.id IS NULL THEN '❌ PROBLEMA: Não existe em auth.users'
    WHEN pu.id IS NULL THEN '❌ PROBLEMA: Não existe em public.users'
    WHEN au.id != pu.id THEN '❌ PROBLEMA CRÍTICO: IDs diferentes'
    WHEN au.email_confirmed_at IS NULL THEN '⚠️ Email não confirmado'
    WHEN pu.active = false THEN '❌ Usuário inativo'
    WHEN pu.tenant_id IS NULL THEN '❌ Sem tenant'
    ELSE '✅ Tudo OK'
  END as diagnostico
FROM auth.users au
FULL OUTER JOIN public.users pu ON au.id = pu.id
WHERE au.email = 'julia@wfcirurgicos.com.br' 
   OR pu.email = 'julia@wfcirurgicos.com.br';

-- =====================================================
-- PASSO 2: CORRIGIR - Se o usuário existe em auth.users mas NÃO em public.users
-- =====================================================
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
  )
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- PASSO 3: CORRIGIR - Se os IDs são diferentes (PROBLEMA CRÍTICO!)
-- =====================================================
-- ATENÇÃO: Este é um problema grave. Precisamos sincronizar os IDs.
-- Primeiro, vamos ver qual ID usar (auth.users é a fonte de verdade)

-- Opção A: Se o usuário em auth.users é o correto, atualizar public.users
UPDATE public.users
SET 
  id = (SELECT id FROM auth.users WHERE email = 'julia@wfcirurgicos.com.br' LIMIT 1),
  updated_at = NOW()
WHERE email = 'julia@wfcirurgicos.com.br'
  AND id != (SELECT id FROM auth.users WHERE email = 'julia@wfcirurgicos.com.br' LIMIT 1);

-- Opção B: Se o usuário em public.users é o correto, criar novo em auth.users
-- (Isso requer chamada à API, não pode ser feito via SQL direto)

-- =====================================================
-- PASSO 4: CORRIGIR - Se o usuário está inativo
-- =====================================================
UPDATE public.users
SET 
  active = true,
  updated_at = NOW()
WHERE email = 'julia@wfcirurgicos.com.br'
  AND active = false;

-- =====================================================
-- PASSO 5: CORRIGIR - Se não tem tenant associado
-- =====================================================
-- Garantir que o tenant "Distribuidor" existe
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
  updated_at = NOW()
WHERE email = 'julia@wfcirurgicos.com.br'
  AND tenant_id IS NULL;

-- =====================================================
-- PASSO 6: CORRIGIR - Criar/atualizar user_roles
-- =====================================================
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

-- =====================================================
-- PASSO 7: Confirmar email no Supabase Auth (se necessário)
-- =====================================================
-- Nota: Isso geralmente precisa ser feito via API ou Dashboard
-- Mas vamos tentar atualizar diretamente:
UPDATE auth.users
SET 
  email_confirmed_at = COALESCE(email_confirmed_at, NOW()),
  updated_at = NOW()
WHERE email = 'julia@wfcirurgicos.com.br'
  AND email_confirmed_at IS NULL;

-- =====================================================
-- PASSO 8: Verificar resultado final
-- =====================================================
SELECT 
  'RESULTADO_FINAL' as passo,
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
    WHEN au.id IS NULL THEN '❌ PROBLEMA: Usuário não existe em auth.users'
    WHEN pu.id IS NULL THEN '❌ PROBLEMA: Usuário não existe em public.users'
    WHEN au.id != pu.id THEN '❌ PROBLEMA CRÍTICO: IDs diferentes'
    WHEN au.email_confirmed_at IS NULL THEN '⚠️ AVISO: Email não confirmado'
    WHEN pu.active = false THEN '❌ PROBLEMA: Usuário inativo'
    WHEN pu.tenant_id IS NULL THEN '❌ PROBLEMA: Sem tenant'
    ELSE '✅ TUDO OK - Login deve funcionar agora!'
  END as status_final
FROM auth.users au
FULL OUTER JOIN public.users pu ON au.id = pu.id
LEFT JOIN public.tenants t ON pu.tenant_id = t.id
WHERE au.email = 'julia@wfcirurgicos.com.br' 
   OR pu.email = 'julia@wfcirurgicos.com.br';

