-- =====================================================
-- RESETAR SENHA DA JULIA - SQL SIMPLES
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
-- PASSO 2: Resetar senha via Edge Function (RECOMENDADO)
-- =====================================================
-- Use a Edge Function admin-manage-user que já criamos
-- Esta função chama a API do Supabase Auth para resetar a senha
-- =====================================================

-- Criar função SQL que chama a Edge Function
CREATE OR REPLACE FUNCTION resetar_senha_julia_via_edge_function(
  p_nova_senha TEXT DEFAULT 'Test@1234',
  p_service_role_key TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_service_key TEXT;
  v_request_id BIGINT;
  v_response JSONB;
BEGIN
  -- Service Role Key (OBRIGATÓRIO!)
  -- IMPORTANTE: Substitua pela sua Service Role Key real!
  -- Você encontra em: Supabase Dashboard > Settings > API > service_role key
  v_service_key := COALESCE(p_service_role_key, 'SUA_SERVICE_ROLE_KEY_AQUI');
  
  IF v_service_key = 'SUA_SERVICE_ROLE_KEY_AQUI' THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Service Role Key não configurada! Configure no parâmetro p_service_role_key'
    );
  END IF;
  
  -- Chamar Edge Function admin-manage-user
  SELECT net.http_post(
    url := 'https://xqeqaagnnkilihlfjbrm.supabase.co/functions/v1/admin-manage-user',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || v_service_key
    ),
    body := jsonb_build_object(
      'action', 'resetPasswordByEmail',
      'email', 'julia@wfcirurgicos.com.br',
      'password', p_nova_senha
    )
  ) INTO v_request_id;
  
  -- Retornar resultado
  RETURN jsonb_build_object(
    'success', true,
    'message', 'Requisição enviada para resetar senha',
    'request_id', v_request_id,
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
-- PASSO 3: EXECUTAR PARA RESETAR SENHA
-- =====================================================
-- IMPORTANTE: Substitua 'SUA_SERVICE_ROLE_KEY' pela sua chave real!
-- Você encontra em: Supabase Dashboard > Settings > API > service_role key
-- =====================================================

-- Descomente e execute este comando:
/*
SELECT resetar_senha_julia_via_edge_function(
  'Test@1234',                    -- Nova senha
  'SUA_SERVICE_ROLE_KEY_AQUI'     -- SERVICE ROLE KEY (OBRIGATÓRIO!)
);
*/

-- =====================================================
-- SOLUÇÃO MAIS FÁCIL: Via Dashboard (SEM SQL)
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
-- PASSO 4: Verificar resultado
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

