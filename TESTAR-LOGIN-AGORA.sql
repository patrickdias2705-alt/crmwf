-- =====================================================
-- TESTAR LOGIN DA JULIA - APÓS RESETAR SENHA
-- =====================================================
-- Execute este SQL após resetar a senha e tentar fazer login
-- =====================================================

-- PASSO 1: Verificar status completo do login
SELECT 
  'VERIFICACAO_LOGIN' as passo,
  au.id as auth_user_id,
  au.email as auth_email,
  au.email_confirmed_at,
  au.created_at as auth_created_at,
  au.updated_at as auth_updated_at,
  au.last_sign_in_at,
  pu.id as public_user_id,
  pu.email as public_email,
  pu.name,
  pu.active,
  pu.role,
  pu.tenant_id,
  t.name as tenant_name,
  CASE 
    WHEN au.last_sign_in_at IS NULL THEN '⚠️ Nunca fez login'
    WHEN au.last_sign_in_at < au.updated_at THEN '⚠️ Fez login, mas com senha antiga'
    ELSE '✅ Login realizado com sucesso com nova senha!'
  END as status_login,
  CASE 
    WHEN au.last_sign_in_at IS NOT NULL THEN 
      'Último login: ' || to_char(au.last_sign_in_at, 'DD/MM/YYYY HH24:MI:SS')
    ELSE 'Nunca fez login'
  END as ultimo_login
FROM auth.users au
JOIN public.users pu ON au.id = pu.id
LEFT JOIN public.tenants t ON pu.tenant_id = t.id
WHERE au.email = 'julia@wfcirurgicos.com.br';

-- PASSO 2: Verificar se todos os requisitos estão atendidos
SELECT 
  'CHECKLIST_REQUISITOS' as passo,
  CASE 
    WHEN au.id IS NOT NULL THEN '✅ Existe em auth.users'
    ELSE '❌ Não existe em auth.users'
  END as auth_users,
  CASE 
    WHEN pu.id IS NOT NULL THEN '✅ Existe em public.users'
    ELSE '❌ Não existe em public.users'
  END as public_users,
  CASE 
    WHEN au.id = pu.id THEN '✅ IDs coincidem'
    ELSE '❌ IDs diferentes'
  END as ids_coincidem,
  CASE 
    WHEN au.email_confirmed_at IS NOT NULL THEN '✅ Email confirmado'
    ELSE '❌ Email não confirmado'
  END as email_confirmado,
  CASE 
    WHEN pu.active = true THEN '✅ Usuário ativo'
    ELSE '❌ Usuário inativo'
  END as usuario_ativo,
  CASE 
    WHEN pu.tenant_id IS NOT NULL THEN '✅ Tenant associado'
    ELSE '❌ Sem tenant'
  END as tenant_associado,
  CASE 
    WHEN au.last_sign_in_at IS NOT NULL THEN '✅ Já fez login'
    ELSE '⚠️ Nunca fez login'
  END as ja_fez_login
FROM auth.users au
JOIN public.users pu ON au.id = pu.id
WHERE au.email = 'julia@wfcirurgicos.com.br';

-- PASSO 3: Verificar se há problemas conhecidos
SELECT 
  'PROBLEMAS_CONHECIDOS' as passo,
  CASE 
    WHEN au.email_confirmed_at IS NULL THEN '❌ Email não confirmado - Pode impedir login'
    ELSE '✅ Email confirmado'
  END as problema_email,
  CASE 
    WHEN pu.active = false THEN '❌ Usuário inativo - Impede login'
    ELSE '✅ Usuário ativo'
  END as problema_ativo,
  CASE 
    WHEN pu.tenant_id IS NULL THEN '❌ Sem tenant - Pode impedir login'
    ELSE '✅ Tenant OK'
  END as problema_tenant,
  CASE 
    WHEN au.id != pu.id THEN '❌ IDs diferentes - PROBLEMA CRÍTICO!'
    ELSE '✅ IDs OK'
  END as problema_ids,
  CASE 
    WHEN au.last_sign_in_at IS NULL THEN '⚠️ Nunca fez login - Pode ser senha incorreta'
    ELSE '✅ Já fez login'
  END as problema_senha
FROM auth.users au
JOIN public.users pu ON au.id = pu.id
WHERE au.email = 'julia@wfcirurgicos.com.br';

