-- =====================================================
-- APAGAR JULIA ATUAL E CRIAR juliawf@gmail.com
-- =====================================================
-- Execute este SQL completo para apagar e criar novo usuário
-- =====================================================

-- PASSO 1: Verificar usuário atual antes de apagar
SELECT 
  'ANTES_DE_APAGAR' as passo,
  au.id as auth_user_id,
  au.email as auth_email,
  pu.id as public_user_id,
  pu.email as public_email,
  pu.name,
  pu.active,
  pu.role,
  pu.tenant_id
FROM auth.users au
FULL OUTER JOIN public.users pu ON au.id = pu.id
WHERE au.email = 'julia@wfcirurgicos.com.br' 
   OR pu.email = 'julia@wfcirurgicos.com.br';

-- =====================================================
-- PASSO 2: APAGAR USUÁRIO ATUAL (em ordem de dependências)
-- =====================================================

-- 2.1: Apagar user_roles primeiro
DELETE FROM user_roles
WHERE user_id IN (
  SELECT id FROM auth.users WHERE email = 'julia@wfcirurgicos.com.br'
);

-- 2.2: Apagar de public.users
DELETE FROM public.users
WHERE email = 'julia@wfcirurgicos.com.br';

-- 2.3: Apagar de auth.users
-- NOTA: Se não funcionar via SQL, apague via Dashboard:
-- Authentication > Users > julia@wfcirurgicos.com.br > Delete user
DELETE FROM auth.users
WHERE email = 'julia@wfcirurgicos.com.br';

-- =====================================================
-- PASSO 3: Verificar se foi apagado
-- =====================================================
SELECT 
  'VERIFICACAO_DELECAO' as passo,
  CASE 
    WHEN EXISTS (SELECT 1 FROM auth.users WHERE email = 'julia@wfcirurgicos.com.br') 
    THEN '⚠️ Ainda existe em auth.users - Apague via Dashboard'
    ELSE '✅ Apagado de auth.users'
  END as status_auth,
  CASE 
    WHEN EXISTS (SELECT 1 FROM public.users WHERE email = 'julia@wfcirurgicos.com.br') 
    THEN '⚠️ Ainda existe em public.users'
    ELSE '✅ Apagado de public.users'
  END as status_public;

-- =====================================================
-- PASSO 4: CRIAR NOVO USUÁRIO - juliawf@gmail.com
-- =====================================================

DO $$
DECLARE
  v_novo_email TEXT := 'juliawf@gmail.com';
  v_novo_nome TEXT := 'Julia';
  v_nova_senha TEXT := 'Test@1234';
  v_tenant_id UUID := 'a961a599-65ab-408c-b39e-bc2109a07bff'::UUID;  -- Distribuidor
  v_service_role_key TEXT := 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhxZXFhYWdubmtpbGlobGZqYnJtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTUyNTAwMCwiZXhwIjoyMDc1MTAxMDAwfQ.VXBa4ZMXa-p4UHWENitLVJdRKvUoZmCdrOdBKVGrPwI';
  v_request_id BIGINT;
BEGIN
  -- Verificar se o tenant existe
  IF NOT EXISTS (SELECT 1 FROM public.tenants WHERE id = v_tenant_id) THEN
    -- Criar tenant se não existir
    INSERT INTO public.tenants (id, name, plan, created_at, updated_at)
    VALUES (v_tenant_id, 'Distribuidor', 'free', NOW(), NOW())
    ON CONFLICT (id) DO NOTHING;
  END IF;

  -- Criar usuário no Supabase Auth via Edge Function
  SELECT net.http_post(
    url := 'https://xqeqaagnnkilihlfjbrm.supabase.co/functions/v1/admin-manage-user',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || v_service_role_key
    ),
    body := jsonb_build_object(
      'action', 'create',
      'email', v_novo_email,
      'password', v_nova_senha,
      'name', v_novo_nome,
      'role', 'agent',
      'tenantId', v_tenant_id::TEXT
    )
  ) INTO v_request_id;

  RAISE NOTICE '✅ Requisição enviada para criar novo usuário!';
  RAISE NOTICE 'Request ID: %', v_request_id;
  RAISE NOTICE 'Email: %', v_novo_email;
  RAISE NOTICE 'Senha: %', v_nova_senha;
  RAISE NOTICE 'Aguarde alguns segundos e verifique se o usuário foi criado!';
END $$;

-- =====================================================
-- PASSO 5: Verificar se o novo usuário foi criado
-- =====================================================
SELECT 
  'VERIFICACAO_NOVO_USUARIO' as passo,
  au.id as auth_user_id,
  au.email as auth_email,
  au.email_confirmed_at,
  au.created_at as auth_created_at,
  pu.id as public_user_id,
  pu.email as public_email,
  pu.name,
  pu.active,
  pu.role,
  pu.tenant_id,
  t.name as tenant_name,
  CASE 
    WHEN au.id IS NULL THEN '❌ Não foi criado em auth.users'
    WHEN pu.id IS NULL THEN '❌ Não foi criado em public.users'
    WHEN au.id != pu.id THEN '❌ IDs diferentes'
    WHEN au.email_confirmed_at IS NULL THEN '⚠️ Email não confirmado'
    WHEN pu.active = false THEN '❌ Usuário inativo'
    WHEN pu.tenant_id IS NULL THEN '❌ Sem tenant'
    ELSE '✅ TUDO OK - Login deve funcionar!'
  END as status
FROM auth.users au
FULL OUTER JOIN public.users pu ON au.id = pu.id
LEFT JOIN public.tenants t ON pu.tenant_id = t.id
WHERE au.email = 'juliawf@gmail.com' 
   OR pu.email = 'juliawf@gmail.com';

-- =====================================================
-- PASSO 6: Se não foi criado via SQL, criar manualmente
-- =====================================================
-- Se o usuário não aparecer no PASSO 5, crie manualmente via Dashboard:
--
-- 1. Acesse: https://app.supabase.com
-- 2. Vá em: Authentication > Users > Add user
-- 3. Preencha:
--    - Email: juliawf@gmail.com
--    - Password: Test@1234
--    - Email confirm: ✅ (marcar)
-- 4. Clique em: Create user
--
-- Depois execute este SQL para associar ao tenant:
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
-- INSTRUÇÕES FINAIS
-- =====================================================
-- 1. Execute este SQL completo
-- 2. Se o usuário não foi criado automaticamente, crie via Dashboard (veja PASSO 6)
-- 3. Teste o login com:
--    - Email: juliawf@gmail.com
--    - Senha: Test@1234
-- 4. Verifique se funcionou executando o PASSO 5 novamente
-- =====================================================

