-- =====================================================
-- ASSOCIAR juliawf@gmail.com AO TENANT DISTRIBUIDOR
-- =====================================================
-- Execute este SQL para associar o usuário ao tenant
-- =====================================================

-- PASSO 1: Verificar usuário atual
SELECT 
  'VERIFICACAO_USUARIO' as passo,
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
    WHEN au.id IS NULL THEN '❌ Não existe em auth.users'
    WHEN pu.id IS NULL THEN '❌ Não existe em public.users'
    WHEN pu.tenant_id IS NULL THEN '⚠️ Sem tenant associado'
    WHEN pu.tenant_id != (SELECT id FROM public.tenants WHERE name = 'Distribuidor' LIMIT 1) THEN '⚠️ Tenant incorreto'
    ELSE '✅ OK'
  END as status
FROM auth.users au
FULL OUTER JOIN public.users pu ON au.id = pu.id
LEFT JOIN public.tenants t ON pu.tenant_id = t.id
WHERE au.email = 'juliawf@gmail.com' 
   OR pu.email = 'juliawf@gmail.com';

-- =====================================================
-- PASSO 2: Garantir que o tenant "Distribuidor" existe
-- =====================================================

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

-- =====================================================
-- PASSO 3: Associar usuário ao tenant "Distribuidor"
-- =====================================================

-- Atualizar public.users para associar ao tenant
UPDATE public.users
SET 
  tenant_id = (SELECT id FROM public.tenants WHERE name = 'Distribuidor' LIMIT 1),
  name = 'Julia',
  role = 'agent',
  active = true,
  updated_at = NOW()
WHERE email = 'juliawf@gmail.com';

-- =====================================================
-- PASSO 4: Criar/atualizar user_roles
-- =====================================================

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
-- PASSO 5: Verificar resultado final
-- =====================================================

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
  t.id as tenant_id,
  t.name as tenant_name,
  t.plan as tenant_plan,
  ur.role as user_role_role,
  CASE 
    WHEN au.id IS NULL THEN '❌ Não existe em auth.users'
    WHEN pu.id IS NULL THEN '❌ Não existe em public.users'
    WHEN au.id != pu.id THEN '❌ IDs diferentes'
    WHEN au.email_confirmed_at IS NULL THEN '⚠️ Email não confirmado'
    WHEN pu.active = false THEN '❌ Usuário inativo'
    WHEN pu.tenant_id IS NULL THEN '❌ Sem tenant'
    WHEN t.name != 'Distribuidor' THEN '❌ Tenant incorreto'
    WHEN ur.id IS NULL THEN '⚠️ Sem role na tabela user_roles'
    ELSE '✅ TUDO OK - Usuário associado ao tenant Distribuidor!'
  END as status_final
FROM auth.users au
JOIN public.users pu ON au.id = pu.id
LEFT JOIN public.tenants t ON pu.tenant_id = t.id
LEFT JOIN user_roles ur ON ur.user_id = pu.id AND ur.tenant_id = pu.tenant_id
WHERE au.email = 'juliawf@gmail.com';

-- =====================================================
-- PASSO 6: Verificar isolamento (ela só vê dados do tenant Distribuidor)
-- =====================================================

SELECT 
  'VERIFICACAO_ISOLAMENTO' as passo,
  'Julia só terá acesso ao tenant Distribuidor' as descricao,
  COUNT(*) as total_usuarios_distribuidor,
  STRING_AGG(u.email, ', ') as emails_tenant_distribuidor
FROM public.users u
WHERE u.tenant_id = (SELECT id FROM public.tenants WHERE name = 'Distribuidor' LIMIT 1);

-- =====================================================
-- INSTRUÇÕES FINAIS
-- =====================================================
-- 1. Execute este SQL completo
-- 2. Verifique o resultado do PASSO 5 - deve mostrar "✅ TUDO OK"
-- 3. Teste o login com:
--    - Email: juliawf@gmail.com
--    - Senha: Julia@2025
-- 4. Após login, verifique se ela só vê dados do tenant "Distribuidor"
-- =====================================================

