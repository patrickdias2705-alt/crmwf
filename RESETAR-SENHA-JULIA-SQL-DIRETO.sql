-- =====================================================
-- RESETAR SENHA DA JULIA - SQL DIRETO
-- =====================================================
-- IMPORTANTE: Senhas no Supabase Auth NÃO podem ser 
-- modificadas diretamente via SQL por segurança.
-- Mas podemos usar pg_net para chamar a API!
-- =====================================================

-- PASSO 1: Verificar informações do usuário
SELECT 
  id as user_id,
  email,
  email_confirmed_at,
  created_at,
  last_sign_in_at
FROM auth.users
WHERE email = 'julia@wfcirurgicos.com.br';

-- =====================================================
-- PASSO 2: Criar função para resetar senha via API
-- =====================================================
-- Esta função usa pg_net para fazer chamada HTTP à API do Supabase Auth
-- =====================================================

CREATE OR REPLACE FUNCTION resetar_senha_julia(
  p_nova_senha TEXT DEFAULT 'Test@1234',
  p_service_role_key TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
  v_supabase_url TEXT;
  v_service_key TEXT;
  v_response JSONB;
  v_request_id BIGINT;
BEGIN
  -- Obter ID do usuário
  SELECT id INTO v_user_id
  FROM auth.users
  WHERE email = 'julia@wfcirurgicos.com.br'
  LIMIT 1;
  
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Usuário não encontrado'
    );
  END IF;
  
  -- URL do Supabase
  v_supabase_url := 'https://xqeqaagnnkilihlfjbrm.supabase.co';
  
  -- Service Role Key (se não fornecida, usar uma variável de ambiente ou config)
  -- IMPORTANTE: Substitua pela sua Service Role Key real!
  v_service_key := COALESCE(p_service_role_key, 'SUA_SERVICE_ROLE_KEY_AQUI');
  
  IF v_service_key = 'SUA_SERVICE_ROLE_KEY_AQUI' THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Service Role Key não configurada! Configure a chave no parâmetro p_service_role_key'
    );
  END IF;
  
    -- Fazer chamada HTTP para API do Supabase Auth
  -- Usar net.http_post para PUT (mais compatível com pg_net)
  SELECT net.http_post(
    url := v_supabase_url || '/auth/v1/admin/users/' || v_user_id::TEXT,
    headers := jsonb_build_object(
      'apikey', v_service_key,
      'Authorization', 'Bearer ' || v_service_key,
      'Content-Type', 'application/json',
      'X-HTTP-Method-Override', 'PUT'
    ),
    body := jsonb_build_object(
      'password', p_nova_senha,
      'email_confirm', true
    )
  ) INTO v_request_id;
  
  -- Retornar resultado
  RETURN jsonb_build_object(
    'success', true,
    'message', 'Requisição enviada para resetar senha',
    'request_id', v_request_id,
    'user_id', v_user_id,
    'email', 'julia@wfcirurgicos.com.br'
  );
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$$;

-- =====================================================
-- PASSO 3: USAR A FUNÇÃO (EXECUTAR ESTE COMANDO!)
-- =====================================================
-- IMPORTANTE: Substitua 'SUA_SERVICE_ROLE_KEY' pela sua chave real!
-- Você encontra em: Supabase Dashboard > Settings > API > service_role key
-- =====================================================

-- Exemplo de uso (DESCOMENTE E EXECUTE):
/*
SELECT resetar_senha_julia(
  'Test@1234',                    -- Nova senha
  'SUA_SERVICE_ROLE_KEY_AQUI'     -- SERVICE ROLE KEY (OBRIGATÓRIO!)
);
*/

-- =====================================================
-- SOLUÇÃO MAIS SIMPLES: Via Edge Function (RECOMENDADO)
-- =====================================================
-- Use a Edge Function que já criamos: admin-manage-user
-- Execute via JavaScript/TypeScript ou via curl:
--
-- curl -X POST 'https://xqeqaagnnkilihlfjbrm.supabase.co/functions/v1/admin-manage-user' \
--   -H "Authorization: Bearer SEU_TOKEN" \
--   -H "Content-Type: application/json" \
--   -d '{
--     "action": "resetPasswordByEmail",
--     "email": "julia@wfcirurgicos.com.br",
--     "password": "Test@1234"
--   }'
-- =====================================================

-- =====================================================
-- SOLUÇÃO MAIS FÁCIL: Via Dashboard
-- =====================================================
-- 1. Acesse: https://app.supabase.com
-- 2. Vá em: Authentication > Users
-- 3. Clique em: julia@wfcirurgicos.com.br
-- 4. Clique em: "Edit user"
-- 5. Role até: "Password"
-- 6. Digite: Test@1234
-- 7. Salve
-- =====================================================

-- =====================================================
-- PASSO 4: Verificar se foi resetada com sucesso
-- =====================================================
SELECT 
  'VERIFICACAO_POS_RESET' as passo,
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

