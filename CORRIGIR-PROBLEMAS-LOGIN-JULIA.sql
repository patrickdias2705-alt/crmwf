-- =====================================================
-- CORRIGIR PROBLEMAS DE LOGIN - julia@wfcirurgicos.com.br
-- =====================================================
-- Execute este SQL para corrigir problemas comuns
-- =====================================================

-- PASSO 1: Confirmar email no Supabase Auth
UPDATE auth.users
SET 
  email_confirmed_at = COALESCE(email_confirmed_at, NOW()),
  updated_at = NOW()
WHERE email = 'julia@wfcirurgicos.com.br'
  AND email_confirmed_at IS NULL;

-- PASSO 2: Ativar usuário (se estiver inativo)
UPDATE public.users
SET 
  active = true,
  updated_at = NOW()
WHERE email = 'julia@wfcirurgicos.com.br'
  AND active = false;

-- PASSO 3: Garantir que o tenant existe e associar
-- Criar tenant "Distribuidor" se não existir
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

-- PASSO 4: Criar/atualizar user_roles
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

-- PASSO 5: Resetar senha novamente (via API)
-- Nota: Execute o RESETAR-SENHA-JULIA-PRONTO.sql novamente
-- Ou use o Dashboard: Authentication > Users > julia@wfcirurgicos.com.br > Edit user > Password

-- PASSO 6: Verificar resultado final
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
    WHEN au.email_confirmed_at IS NULL THEN '❌ Email não confirmado'
    WHEN pu.active = false THEN '❌ Usuário inativo'
    WHEN pu.tenant_id IS NULL THEN '❌ Sem tenant'
    WHEN au.last_sign_in_at IS NULL THEN '⚠️ Nunca fez login - Pode ser senha incorreta'
    ELSE '✅ TUDO OK - Login deve funcionar!'
  END as status_final
FROM auth.users au
JOIN public.users pu ON au.id = pu.id
LEFT JOIN public.tenants t ON pu.tenant_id = t.id
WHERE au.email = 'julia@wfcirurgicos.com.br';

