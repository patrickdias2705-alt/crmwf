-- =====================================================
-- COMO DEFINIR/RESETAR SENHA PARA julia@wfcirurgicos.com.br
-- =====================================================

-- 1. Verificar se o usuário existe em auth.users
SELECT 
  'VERIFICACAO' as passo,
  id,
  email,
  email_confirmed_at,
  created_at,
  last_sign_in_at,
  CASE 
    WHEN email_confirmed_at IS NULL THEN '❌ Email NÃO confirmado - Precisa confirmar'
    ELSE '✅ Email confirmado'
  END as status_email,
  CASE 
    WHEN last_sign_in_at IS NULL THEN '⚠️ NUNCA fez login - Sem senha definida'
    ELSE '✅ Já fez login antes'
  END as status_login
FROM auth.users
WHERE email = 'julia@wfcirurgicos.com.br';

-- =====================================================
-- INSTRUÇÕES PARA DEFINIR/RESETAR SENHA
-- =====================================================
--
-- O Supabase Auth gerencia senhas de forma segura
-- Não é possível ver a senha atual, apenas resetá-la
--
-- OPÇÃO 1: Via Supabase Dashboard (RECOMENDADO)
-- =====================================================
-- 1. Acesse: https://app.supabase.com
-- 2. Selecione seu projeto
-- 3. Vá em: Authentication > Users
-- 4. Procure pelo email: julia@wfcirurgicos.com.br
-- 5. Clique no email do usuário
-- 6. Você verá opções:
--    - "Send magic link" - Envia link por email
--    - "Reset password" - Gera link de reset
--    - "Edit user" - Editar dados do usuário
-- 7. Para definir senha manualmente:
--    - Clique em "Edit user"
--    - Role até "Password"
--    - Digite a nova senha
--    - Salve
--
-- OPÇÃO 2: Enviar Magic Link (Mais fácil)
-- =====================================================
-- 1. No Dashboard do Supabase
-- 2. Authentication > Users
-- 3. Clique no email: julia@wfcirurgicos.com.br
-- 4. Clique em "Send magic link"
-- 5. O usuário receberá um email com link de acesso
-- 6. Ao clicar no link, poderá definir a senha
--
-- OPÇÃO 3: Reset Password
-- =====================================================
-- 1. No Dashboard do Supabase
-- 2. Authentication > Users
-- 3. Clique no email: julia@wfcirurgicos.com.br
-- 4. Clique em "Reset password"
-- 5. O usuário receberá um email para resetar
--
-- OPÇÃO 4: Via API (Programaticamente)
-- =====================================================
-- Use a API do Supabase Auth para resetar senha
-- Exemplo com curl:
--
-- curl -X POST 'https://SEU_PROJETO.supabase.co/auth/v1/admin/users/USER_ID' \
--   -H "apikey: SEU_SERVICE_ROLE_KEY" \
--   -H "Authorization: Bearer SEU_SERVICE_ROLE_KEY" \
--   -H "Content-Type: application/json" \
--   -d '{"password": "nova_senha_aqui"}'
--
-- =====================================================
-- SENHAS SUGERIDAS PARA TESTE
-- =====================================================
-- Se você vai definir uma senha para teste, use:
-- - Senha forte: Test@1234
-- - Senha simples: senha123
-- - Senha complexa: Julia@2024!
--
-- IMPORTANTE: Mude a senha após o primeiro login!
--
-- =====================================================
-- VERIFICAR SE O USUÁRIO ESTÁ PRONTO PARA LOGIN
-- =====================================================
-- Execute a query abaixo para ver o status completo:
SELECT 
  'STATUS_COMPLETO' as tipo,
  au.id as auth_user_id,
  au.email as auth_email,
  au.email_confirmed_at,
  au.last_sign_in_at,
  pu.id as public_user_id,
  pu.email as public_email,
  pu.active as public_active,
  pu.tenant_id,
  pu.role,
  CASE 
    WHEN au.id IS NULL THEN '❌ PROBLEMA: Usuário não existe em auth.users'
    WHEN pu.id IS NULL THEN '❌ PROBLEMA: Usuário não existe em public.users'
    WHEN au.id != pu.id THEN '❌ PROBLEMA: IDs diferentes'
    WHEN au.email_confirmed_at IS NULL THEN '⚠️ AVISO: Email não confirmado'
    WHEN pu.active = false THEN '❌ PROBLEMA: Usuário inativo'
    WHEN pu.tenant_id IS NULL THEN '❌ PROBLEMA: Sem tenant'
    WHEN au.last_sign_in_at IS NULL THEN '⚠️ AVISO: NUNCA fez login (senha pode não estar definida)'
    ELSE '✅ TUDO OK - Pronto para login!'
  END as status_final
FROM auth.users au
FULL OUTER JOIN public.users pu ON au.id = pu.id
WHERE au.email = 'julia@wfcirurgicos.com.br' 
   OR pu.email = 'julia@wfcirurgicos.com.br';

