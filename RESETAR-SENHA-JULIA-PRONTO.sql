-- =====================================================
-- RESETAR SENHA DA JULIA - PRONTO PARA EXECUTAR
-- =====================================================
-- Execute este SQL no Supabase SQL Editor
-- =====================================================

-- PASSO 1: Verificar usuário
SELECT 
  id as user_id,
  email,
  email_confirmed_at,
  created_at
FROM auth.users
WHERE email = 'julia@wfcirurgicos.com.br';

-- =====================================================
-- PASSO 2: Resetar senha via Edge Function
-- =====================================================

-- Criar variável temporária com a Service Role Key
DO $$
DECLARE
  v_service_role_key TEXT := 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhxZXFhYWdubmtpbGlobGZqYnJtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTUyNTAwMCwiZXhwIjoyMDc1MTAxMDAwfQ.VXBa4ZMXa-p4UHWENitLVJdRKvUoZmCdrOdBKVGrPwI';
  v_nova_senha TEXT := 'Test@1234';
  v_request_id BIGINT;
BEGIN
  -- Chamar Edge Function admin-manage-user para resetar senha
  SELECT net.http_post(
    url := 'https://xqeqaagnnkilihlfjbrm.supabase.co/functions/v1/admin-manage-user',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || v_service_role_key
    ),
    body := jsonb_build_object(
      'action', 'resetPasswordByEmail',
      'email', 'julia@wfcirurgicos.com.br',
      'password', v_nova_senha
    )
  ) INTO v_request_id;

  -- Mostrar resultado
  RAISE NOTICE '✅ Requisição enviada para resetar senha!';
  RAISE NOTICE 'Request ID: %', v_request_id;
  RAISE NOTICE 'Email: julia@wfcirurgicos.com.br';
  RAISE NOTICE 'Nova senha: %', v_nova_senha;
  RAISE NOTICE '';
  RAISE NOTICE '⚠️  Aguarde alguns segundos e verifique se funcionou!';
END $$;

-- =====================================================
-- PASSO 3: Verificar resultado
-- =====================================================
SELECT 
  'VERIFICACAO' as passo,
  id as user_id,
  email,
  email_confirmed_at,
  updated_at,
  last_sign_in_at,
  CASE 
    WHEN last_sign_in_at IS NULL THEN '⚠️ Ainda não fez login com nova senha'
    ELSE '✅ Já fez login com nova senha'
  END as status_login
FROM auth.users
WHERE email = 'julia@wfcirurgicos.com.br';

