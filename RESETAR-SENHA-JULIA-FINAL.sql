-- =====================================================
-- RESETAR SENHA DA JULIA - SOLUÇÃO FINAL
-- =====================================================
-- IMPORTANTE: Este SQL chama a Edge Function que já criamos
-- Você precisa da Service Role Key, mas pode configurá-la aqui
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
-- PASSO 2: Configurar Service Role Key
-- =====================================================
-- IMPORTANTE: Substitua 'SUA_SERVICE_ROLE_KEY_AQUI' pela sua chave real
-- Você encontra em: Supabase Dashboard > Settings > API > service_role key
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

-- =====================================================
-- SOLUÇÃO ALTERNATIVA: Via Dashboard (MAIS FÁCIL - SEM SQL)
-- =====================================================
-- Se preferir não usar SQL, use o Dashboard:
--
-- 1. Acesse: https://app.supabase.com
-- 2. Vá em: Authentication > Users
-- 3. Clique em: julia@wfcirurgicos.com.br
-- 4. Clique em: "Edit user"
-- 5. Role até: "Password"
-- 6. Digite: Test@1234
-- 7. Salve
-- =====================================================

