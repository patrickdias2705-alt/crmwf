-- =====================================================
-- RESETAR SENHA DA JULIA - SOLUÇÃO SQL
-- =====================================================
-- IMPORTANTE: Senhas no Supabase Auth NÃO podem ser 
-- modificadas diretamente via SQL por questões de segurança.
-- Mas podemos criar uma função que chama a API do Supabase.
-- =====================================================

-- PASSO 1: Verificar se o usuário existe e obter informações
SELECT 
  'VERIFICACAO' as passo,
  id as user_id,
  email,
  email_confirmed_at,
  created_at,
  last_sign_in_at,
  CASE 
    WHEN email_confirmed_at IS NULL THEN '⚠️ Email não confirmado'
    ELSE '✅ Email confirmado'
  END as status_email,
  CASE 
    WHEN last_sign_in_at IS NULL THEN '⚠️ Nunca fez login'
    ELSE '✅ Já fez login'
  END as status_login
FROM auth.users
WHERE email = 'julia@wfcirurgicos.com.br';

-- =====================================================
-- PASSO 2: Criar função para resetar senha via API
-- =====================================================
-- Esta função usa pg_net para fazer chamada HTTP à API do Supabase
-- Requer: extensão pg_net habilitada
-- =====================================================

-- Verificar se pg_net está habilitado
SELECT 
  'VERIFICAR_PG_NET' as passo,
  EXISTS (
    SELECT 1 FROM pg_extension WHERE extname = 'pg_net'
  ) as pg_net_disponivel;

-- Criar função para resetar senha (requer pg_net)
CREATE OR REPLACE FUNCTION resetar_senha_usuario(
  p_user_id UUID,
  p_nova_senha TEXT,
  p_service_role_key TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_supabase_url TEXT;
  v_response JSONB;
BEGIN
  -- Obter URL do Supabase do ambiente
  -- Nota: Em produção, você deve obter isso de uma variável de ambiente
  -- Por enquanto, vamos usar a URL diretamente
  v_supabase_url := 'https://xqeqaagnnkilihlfjbrm.supabase.co';
  
  -- Fazer chamada HTTP para API do Supabase Auth
  -- IMPORTANTE: Substitua 'SUA_SERVICE_ROLE_KEY' pela sua chave real
  SELECT content INTO v_response
  FROM http((
    'PUT',
    v_supabase_url || '/auth/v1/admin/users/' || p_user_id::TEXT,
    ARRAY[
      http_header('apikey', p_service_role_key),
      http_header('Authorization', 'Bearer ' || p_service_role_key),
      http_header('Content-Type', 'application/json')
    ],
    'application/json',
    json_build_object(
      'password', p_nova_senha,
      'email_confirm', true
    )::TEXT
  )::http_request);
  
  RETURN v_response;
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object(
      'error', SQLERRM,
      'success', false
    );
END;
$$;

-- =====================================================
-- PASSO 3: USAR A FUNÇÃO (APÓS CONFIGURAR SERVICE_ROLE_KEY)
-- =====================================================
-- IMPORTANTE: Substitua 'SUA_SERVICE_ROLE_KEY' pela sua chave real
-- Você encontra em: Supabase Dashboard > Settings > API > service_role key
-- =====================================================

-- Exemplo de uso (DESCOMENTE E CONFIGURE):
/*
SELECT resetar_senha_usuario(
  'a0cc209f-4c08-49a9-ba14-7f0c5f3e850e'::UUID,  -- ID da Julia
  'Test@1234',                                   -- Nova senha
  'SUA_SERVICE_ROLE_KEY_AQUI'                   -- SERVICE ROLE KEY
);
*/

-- =====================================================
-- SOLUÇÃO ALTERNATIVA: Via Edge Function (RECOMENDADO)
-- =====================================================
-- Como resetar via SQL não é possível diretamente,
-- use a Edge Function que já criamos:
-- supabase/functions/admin-manage-user
-- =====================================================

-- =====================================================
-- SOLUÇÃO MAIS SIMPLES: Via Dashboard ou API
-- =====================================================
-- Opção 1: Dashboard (MAIS FÁCIL)
-- 1. Acesse: https://app.supabase.com
-- 2. Vá em: Authentication > Users
-- 3. Clique em: julia@wfcirurgicos.com.br
-- 4. Clique em: "Edit user"
-- 5. Role até: "Password"
-- 6. Digite: Test@1234
-- 7. Salve
--
-- Opção 2: API via curl (TERMINAL)
-- curl -X PUT 'https://xqeqaagnnkilihlfjbrm.supabase.co/auth/v1/admin/users/a0cc209f-4c08-49a9-ba14-7f0c5f3e850e' \
--   -H "apikey: SUA_SERVICE_ROLE_KEY" \
--   -H "Authorization: Bearer SUA_SERVICE_ROLE_KEY" \
--   -H "Content-Type: application/json" \
--   -d '{"password": "Test@1234", "email_confirm": true}'
-- =====================================================

-- =====================================================
-- PASSO 4: Verificar se foi resetada com sucesso
-- =====================================================
-- Execute esta query após resetar para verificar:
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

