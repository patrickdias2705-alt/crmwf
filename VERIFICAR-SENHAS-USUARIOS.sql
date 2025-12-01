-- =====================================================
-- VERIFICAR USUÁRIOS E COMO DEFINIR/RESETAR SENHAS
-- =====================================================

-- 1. Ver TODOS os usuários cadastrados em auth.users (Supabase Auth)
SELECT 
  'AUTH.USERS' as tabela,
  id,
  email,
  email_confirmed_at,
  created_at,
  last_sign_in_at,
  CASE 
    WHEN email_confirmed_at IS NULL THEN '❌ Email NÃO confirmado'
    ELSE '✅ Email confirmado'
  END as status_email,
  CASE 
    WHEN last_sign_in_at IS NULL THEN '⚠️ NUNCA fez login'
    ELSE '✅ Já fez login'
  END as status_login
FROM auth.users
ORDER BY created_at DESC;

-- 2. Ver usuários específicos (julia@wfcirurgicos.com.br e outros)
SELECT 
  'USUARIO_ESPECIFICO' as tipo,
  id,
  email,
  email_confirmed_at,
  created_at,
  last_sign_in_at,
  raw_user_meta_data->>'name' as name,
  raw_user_meta_data->>'role' as role,
  raw_user_meta_data->>'tenant_id' as tenant_id
FROM auth.users
WHERE email IN (
  'julia@wfcirurgicos.com.br',
  'mariabrebal26@gmail.com',
  'elaineportaporta@gmail.com'
)
ORDER BY email;

-- 3. Ver usuários em public.users e comparar com auth.users
SELECT 
  'COMPARACAO' as tipo,
  pu.id as public_user_id,
  pu.email as public_email,
  pu.name as public_name,
  pu.active as public_active,
  au.id as auth_user_id,
  au.email as auth_email,
  au.email_confirmed_at,
  au.last_sign_in_at,
  CASE 
    WHEN au.id IS NULL THEN '❌ NÃO existe em auth.users'
    WHEN pu.id IS NULL THEN '❌ NÃO existe em public.users'
    WHEN au.id != pu.id THEN '❌ IDs DIFERENTES'
    WHEN au.email_confirmed_at IS NULL THEN '⚠️ Email não confirmado'
    WHEN pu.active = false THEN '❌ Usuário inativo'
    ELSE '✅ OK'
  END as status
FROM public.users pu
FULL OUTER JOIN auth.users au ON pu.id = au.id
WHERE pu.email IN (
  'julia@wfcirurgicos.com.br',
  'mariabrebal26@gmail.com',
  'elaineportaporta@gmail.com'
)
OR au.email IN (
  'julia@wfcirurgicos.com.br',
  'mariabrebal26@gmail.com',
  'elaineportaporta@gmail.com'
)
ORDER BY COALESCE(pu.email, au.email);

-- 4. INSTRUÇÕES: Como definir/resetar senha no Supabase
-- =====================================================
-- Para resetar/definir senha de um usuário:
--
-- OPÇÃO 1: Via Supabase Dashboard (RECOMENDADO)
-- 1. Acesse: https://app.supabase.com
-- 2. Vá em: Authentication > Users
-- 3. Encontre o usuário pelo email
-- 4. Clique no email do usuário
-- 5. Clique em "Send magic link" ou "Reset password"
-- 6. Ou defina senha manualmente editando o usuário
--
-- OPÇÃO 2: Via SQL (requer permissões de admin)
-- Para resetar senha via SQL, você precisa usar a API do Supabase
-- ou configurar uma senha temporária via dashboard
--
-- OPÇÃO 3: Via Edge Function (se disponível)
-- Use a função de reset de senha do Supabase Auth
--
-- =====================================================
-- NOTA: Senhas não são armazenadas em texto plano
-- O Supabase Auth usa hash bcrypt para segurança
-- =====================================================

