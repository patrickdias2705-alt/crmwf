-- =====================================================
-- RESETAR SENHA DA JULIA - Script Completo
-- =====================================================
-- IMPORTANTE: Senhas são armazenadas com hash no Supabase Auth
-- Não é possível "descobrir" a senha original
-- Mas podemos RESETAR para uma nova senha
-- =====================================================

-- PASSO 1: Verificar se o usuário existe e obter o ID
SELECT 
  'VERIFICACAO' as passo,
  id,
  email,
  email_confirmed_at,
  created_at,
  last_sign_in_at,
  CASE 
    WHEN email_confirmed_at IS NULL THEN '⚠️ Email não confirmado'
    ELSE '✅ Email confirmado'
  END as status_email
FROM auth.users
WHERE email = 'julia@wfcirurgicos.com.br';

-- =====================================================
-- OPÇÃO 1: RESETAR VIA API DO SUPABASE (RECOMENDADO)
-- =====================================================
-- Use este comando curl para resetar a senha
-- Substitua:
-- - SEU_PROJETO_URL: URL do seu projeto Supabase
-- - SEU_SERVICE_ROLE_KEY: Service Role Key do Supabase
-- - USER_ID: ID do usuário (obtido na query acima)
-- - NOVA_SENHA: Senha que você quer definir
--
-- Exemplo:
-- curl -X PUT 'https://SEU_PROJETO.supabase.co/auth/v1/admin/users/USER_ID' \
--   -H "apikey: SEU_SERVICE_ROLE_KEY" \
--   -H "Authorization: Bearer SEU_SERVICE_ROLE_KEY" \
--   -H "Content-Type: application/json" \
--   -d '{
--     "password": "NovaSenha123!",
--     "email_confirm": true
--   }'
--
-- =====================================================
-- OPÇÃO 2: VIA DASHBOARD DO SUPABASE (MAIS FÁCIL)
-- =====================================================
-- 1. Acesse: https://app.supabase.com
-- 2. Selecione seu projeto
-- 3. Vá em: Authentication > Users
-- 4. Procure: julia@wfcirurgicos.com.br
-- 5. Clique no email
-- 6. Clique em "Edit user"
-- 7. Role até "Password"
-- 8. Digite a nova senha: NovaSenha123!
-- 9. Salve
--
-- =====================================================
-- OPÇÃO 3: VIA EDGE FUNCTION (Programaticamente)
-- =====================================================
-- Veja o arquivo: RESETAR-SENHA-EDGE-FUNCTION.ts
-- Ou use a função admin-manage-user atualizada
--
-- =====================================================
-- SENHAS SUGERIDAS PARA RESET
-- =====================================================
-- Senha padrão: Test@1234
-- Senha forte: Julia@2024!
-- Senha simples: senha123
--
-- IMPORTANTE: Depois de resetar, avise o usuário para mudar!
--
-- =====================================================
-- VERIFICAR SE FOI RESETADA COM SUCESSO
-- =====================================================
-- Execute esta query após resetar para verificar:
SELECT 
  'VERIFICACAO_POS_RESET' as passo,
  id,
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

