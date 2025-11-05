-- =====================================================
-- VERIFICAR SE LOGIN DA JULIA FUNCIONOU
-- =====================================================
-- Execute este SQL após tentar fazer login
-- =====================================================

-- Verificar status do login
SELECT 
  'VERIFICACAO_LOGIN' as passo,
  id as user_id,
  email,
  email_confirmed_at,
  updated_at,
  last_sign_in_at,
  CASE 
    WHEN last_sign_in_at IS NULL THEN '⚠️ Ainda não fez login'
    WHEN last_sign_in_at < updated_at THEN '⚠️ Fez login, mas com senha antiga'
    ELSE '✅ Login realizado com sucesso com nova senha!'
  END as status_login,
  CASE 
    WHEN last_sign_in_at IS NOT NULL THEN 
      'Último login: ' || to_char(last_sign_in_at, 'DD/MM/YYYY HH24:MI:SS')
    ELSE 'Nunca fez login'
  END as ultimo_login
FROM auth.users
WHERE email = 'julia@wfcirurgicos.com.br';

-- Verificar se usuário está ativo no sistema
SELECT 
  'VERIFICACAO_USUARIO' as passo,
  u.id as user_id,
  u.email,
  u.name,
  u.active,
  u.role,
  u.tenant_id,
  t.name as tenant_name,
  CASE 
    WHEN u.active = false THEN '❌ Usuário INATIVO - Precisa ativar!'
    WHEN u.tenant_id IS NULL THEN '❌ Sem tenant associado'
    ELSE '✅ Usuário OK'
  END as status_usuario
FROM public.users u
LEFT JOIN public.tenants t ON u.tenant_id = t.id
WHERE u.email = 'julia@wfcirurgicos.com.br';

-- Se o usuário estiver inativo, ativar:
-- UPDATE public.users
-- SET active = true
-- WHERE email = 'julia@wfcirurgicos.com.br';

