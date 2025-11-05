-- =====================================================
-- SOLUÇÃO DEFINITIVA PARA LOGIN DA JULIA
-- =====================================================
-- Execute este SQL completo para corrigir todos os problemas
-- =====================================================

-- PASSO 1: Verificar situação atual
SELECT 
  'DIAGNOSTICO' as passo,
  au.id as auth_user_id,
  au.email as auth_email,
  au.email_confirmed_at,
  au.last_sign_in_at,
  pu.id as public_user_id,
  pu.email as public_email,
  pu.active,
  pu.role,
  pu.tenant_id,
  CASE 
    WHEN au.email_confirmed_at IS NULL THEN '❌ Email não confirmado'
    WHEN pu.active = false THEN '❌ Usuário inativo'
    WHEN pu.tenant_id IS NULL THEN '❌ Sem tenant'
    WHEN au.id != pu.id THEN '❌ IDs diferentes'
    ELSE '✅ Configuração OK'
  END as status
FROM auth.users au
JOIN public.users pu ON au.id = pu.id
WHERE au.email = 'julia@wfcirurgicos.com.br';

-- =====================================================
-- PASSO 2: CORRIGIR TODOS OS PROBLEMAS
-- =====================================================

-- 2.1: Confirmar email no Supabase Auth
UPDATE auth.users
SET 
  email_confirmed_at = COALESCE(email_confirmed_at, NOW()),
  updated_at = NOW()
WHERE email = 'julia@wfcirurgicos.com.br'
  AND email_confirmed_at IS NULL;

-- 2.2: Ativar usuário (garantir que está ativo)
UPDATE public.users
SET 
  active = true,
  updated_at = NOW()
WHERE email = 'julia@wfcirurgicos.com.br';

-- 2.3: Garantir que o tenant existe
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

-- 2.4: Associar usuário ao tenant
UPDATE public.users
SET 
  tenant_id = (SELECT id FROM public.tenants WHERE name = 'Distribuidor' LIMIT 1),
  updated_at = NOW()
WHERE email = 'julia@wfcirurgicos.com.br';

-- 2.5: Criar/atualizar user_roles
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
ON CONFLICT (user_id, tenant_id) DO UPDATE SET
  role = EXCLUDED.role;

-- =====================================================
-- PASSO 3: RESETAR SENHA NOVAMENTE
-- =====================================================
-- IMPORTANTE: Execute o RESETAR-SENHA-JULIA-PRONTO.sql novamente
-- OU use o Dashboard: Authentication > Users > julia@wfcirurgicos.com.br > Edit user > Password
-- =====================================================

-- =====================================================
-- PASSO 4: Verificar resultado final
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
    WHEN au.email_confirmed_at IS NULL THEN '❌ Email não confirmado'
    WHEN pu.active = false THEN '❌ Usuário inativo'
    WHEN pu.tenant_id IS NULL THEN '❌ Sem tenant'
    WHEN au.id != pu.id THEN '❌ IDs diferentes'
    WHEN au.last_sign_in_at IS NULL THEN '⚠️ Nunca fez login - Pode ser senha incorreta'
    ELSE '✅ TUDO OK - Login deve funcionar!'
  END as status_final,
  CASE 
    WHEN au.email_confirmed_at IS NOT NULL 
      AND pu.active = true 
      AND pu.tenant_id IS NOT NULL 
      AND au.id = pu.id 
    THEN '✅ Todos os requisitos atendidos!'
    ELSE '⚠️ Alguns requisitos não atendidos'
  END as requisitos
FROM auth.users au
JOIN public.users pu ON au.id = pu.id
LEFT JOIN public.tenants t ON pu.tenant_id = t.id
WHERE au.email = 'julia@wfcirurgicos.com.br';

-- =====================================================
-- INSTRUÇÕES FINAIS
-- =====================================================
-- 1. Execute este SQL completo
-- 2. Execute o RESETAR-SENHA-JULIA-PRONTO.sql novamente para garantir que a senha foi resetada
-- 3. OU use o Dashboard: Authentication > Users > julia@wfcirurgicos.com.br > Edit user > Password
-- 4. Teste o login com:
--    - Email: julia@wfcirurgicos.com.br
--    - Senha: Test@1234
-- 5. Se ainda não funcionar, verifique:
--    - Se está usando a senha correta (Test@1234)
--    - Se não há espaços extras no email
--    - Se o sistema está funcionando corretamente
-- =====================================================

