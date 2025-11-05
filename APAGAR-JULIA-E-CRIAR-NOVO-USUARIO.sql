-- =====================================================
-- APAGAR JULIA E CRIAR NOVO USUÁRIO
-- =====================================================
-- Execute este SQL para remover o usuário atual e criar um novo
-- =====================================================

-- PASSO 1: Verificar usuário atual
SELECT 
  'USUARIO_ATUAL' as passo,
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
-- PASSO 2: APAGAR USUÁRIO ATUAL (em ordem)
-- =====================================================

-- 2.1: Apagar user_roles primeiro (dependência)
DELETE FROM user_roles
WHERE user_id IN (
  SELECT id FROM auth.users WHERE email = 'julia@wfcirurgicos.com.br'
);

-- 2.2: Apagar de public.users
DELETE FROM public.users
WHERE email = 'julia@wfcirurgicos.com.br';

-- 2.3: Apagar de auth.users (Supabase Auth)
-- NOTA: Isso pode precisar ser feito via Dashboard ou API
-- Mas vamos tentar via SQL:
DELETE FROM auth.users
WHERE email = 'julia@wfcirurgicos.com.br';

-- =====================================================
-- PASSO 3: VERIFICAR SE FOI APAGADO
-- =====================================================
SELECT 
  'VERIFICACAO_DELECAO' as passo,
  CASE 
    WHEN EXISTS (SELECT 1 FROM auth.users WHERE email = 'julia@wfcirurgicos.com.br') 
    THEN '⚠️ Ainda existe em auth.users - Precisa apagar via Dashboard'
    ELSE '✅ Não existe mais em auth.users'
  END as status_auth,
  CASE 
    WHEN EXISTS (SELECT 1 FROM public.users WHERE email = 'julia@wfcirurgicos.com.br') 
    THEN '⚠️ Ainda existe em public.users'
    ELSE '✅ Não existe mais em public.users'
  END as status_public,
  CASE 
    WHEN EXISTS (SELECT 1 FROM user_roles ur JOIN auth.users au ON ur.user_id = au.id WHERE au.email = 'julia@wfcirurgicos.com.br') 
    THEN '⚠️ Ainda existe em user_roles'
    ELSE '✅ Não existe mais em user_roles'
  END as status_roles
FROM auth.users
WHERE email = 'julia@wfcirurgicos.com.br'
LIMIT 1;

-- =====================================================
-- PASSO 4: CRIAR NOVO USUÁRIO
-- =====================================================
-- IMPORTANTE: Substitua 'NOVO_EMAIL@exemplo.com' pelo email que você quer
-- =====================================================

-- Variáveis para o novo usuário
DO $$
DECLARE
  v_novo_email TEXT := 'NOVO_EMAIL@exemplo.com';  -- SUBSTITUA AQUI!
  v_novo_nome TEXT := 'Julia';
  v_nova_senha TEXT := 'Test@1234';
  v_tenant_id UUID := 'a961a599-65ab-408c-b39e-bc2109a07bff'::UUID;  -- Distribuidor
  v_service_role_key TEXT := 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhxZXFhYWdubmtpbGlobGZqYnJtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTUyNTAwMCwiZXhwIjoyMDc1MTAxMDAwfQ.VXBa4ZMXa-p4UHWENitLVJdRKvUoZmCdrOdBKVGrPwI';
  v_request_id BIGINT;
  v_user_id UUID;
BEGIN
  -- Verificar se o email foi configurado
  IF v_novo_email = 'NOVO_EMAIL@exemplo.com' THEN
    RAISE EXCEPTION 'Configure o novo email! Substitua "NOVO_EMAIL@exemplo.com" pelo email que você quer usar';
  END IF;

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
-- PASSO 5: VERIFICAR NOVO USUÁRIO
-- =====================================================
-- IMPORTANTE: Substitua 'NOVO_EMAIL@exemplo.com' pelo email que você configurou
-- =====================================================

-- Substitua 'NOVO_EMAIL@exemplo.com' pelo email que você configurou acima
SELECT 
  'VERIFICACAO_NOVO_USUARIO' as passo,
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
WHERE au.email = 'NOVO_EMAIL@exemplo.com'  -- SUBSTITUA AQUI!
   OR pu.email = 'NOVO_EMAIL@exemplo.com';  -- SUBSTITUA AQUI!

-- =====================================================
-- INSTRUÇÕES FINAIS
-- =====================================================
-- 1. Configure o novo email na linha que tem: v_novo_email TEXT := 'NOVO_EMAIL@exemplo.com';
-- 2. Execute o SQL completo
-- 3. Se o usuário não foi criado em auth.users, crie manualmente via Dashboard:
--    - Authentication > Users > Add user
--    - Email: (seu novo email)
--    - Password: Test@1234
--    - Email confirm: ✅
-- 4. Depois execute novamente o PASSO 5 para verificar
-- 5. Teste o login com o novo email e senha Test@1234
-- =====================================================

