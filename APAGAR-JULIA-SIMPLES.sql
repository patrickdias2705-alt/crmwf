-- =====================================================
-- APAGAR JULIA - VERSÃO SIMPLES
-- =====================================================
-- Execute este SQL para apagar o usuário atual
-- Depois crie um novo via Dashboard ou SQL
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
-- PASSO 2: APAGAR (em ordem de dependências)
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
  END as status_public,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM user_roles ur 
      JOIN auth.users au ON ur.user_id = au.id 
      WHERE au.email = 'julia@wfcirurgicos.com.br'
    ) 
    THEN '⚠️ Ainda existe em user_roles'
    ELSE '✅ Apagado de user_roles'
  END as status_roles;

-- =====================================================
-- PRÓXIMOS PASSOS
-- =====================================================
-- 1. Se ainda existir em auth.users, apague via Dashboard:
--    Authentication > Users > julia@wfcirurgicos.com.br > Delete user
--
-- 2. Crie novo usuário via Dashboard:
--    Authentication > Users > Add user
--    Email: (seu novo email)
--    Password: Test@1234
--    Email confirm: ✅
--
-- 3. Ou use o SQL para criar novo usuário:
--    Execute APAGAR-JULIA-E-CRIAR-NOVO-USUARIO.sql
-- =====================================================

