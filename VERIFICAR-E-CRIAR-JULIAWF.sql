-- Verificar se juliawf@gmail.com existe

-- Passo 1: Verificar se existe em auth.users
SELECT 
  'VERIFICAR_AUTH_USERS' as passo,
  id,
  email,
  email_confirmed_at,
  created_at
FROM auth.users
WHERE email = 'juliawf@gmail.com';

-- Passo 2: Verificar se existe em public.users
SELECT 
  'VERIFICAR_PUBLIC_USERS' as passo,
  id,
  email,
  name,
  active,
  role,
  tenant_id
FROM public.users
WHERE email = 'juliawf@gmail.com';

-- Passo 3: Se existe em auth.users mas NAO em public.users, criar em public.users
INSERT INTO public.users (
  id,
  email,
  name,
  role,
  active,
  tenant_id,
  created_at,
  updated_at
)
SELECT 
  au.id,
  au.email,
  'Julia',
  'agent',
  true,
  (SELECT id FROM public.tenants WHERE name = 'Distribuidor' LIMIT 1),
  COALESCE(au.created_at, NOW()),
  NOW()
FROM auth.users au
WHERE au.email = 'juliawf@gmail.com'
  AND NOT EXISTS (
    SELECT 1 FROM public.users pu 
    WHERE pu.id = au.id
  )
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  role = EXCLUDED.role,
  active = EXCLUDED.active,
  updated_at = NOW();

-- Passo 4: Garantir que o tenant Distribuidor existe
INSERT INTO public.tenants (id, name, plan, created_at, updated_at)
SELECT 
  'a961a599-65ab-408c-b39e-bc2109a07bff'::UUID,
  'Distribuidor',
  'free',
  NOW(),
  NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM public.tenants WHERE name = 'Distribuidor'
);

-- Passo 5: Associar ao tenant Distribuidor
UPDATE public.users
SET 
  tenant_id = (SELECT id FROM public.tenants WHERE name = 'Distribuidor' LIMIT 1),
  name = 'Julia',
  role = 'agent',
  active = true,
  updated_at = NOW()
WHERE email = 'juliawf@gmail.com';

-- Passo 6: Criar user_role
INSERT INTO user_roles (user_id, tenant_id, role)
SELECT 
  u.id,
  u.tenant_id,
  'agent'
FROM public.users u
WHERE u.email = 'juliawf@gmail.com'
  AND u.tenant_id IS NOT NULL
ON CONFLICT (user_id, tenant_id) DO UPDATE SET
  role = EXCLUDED.role;

-- Passo 7: Verificar resultado final
SELECT 
  'RESULTADO_FINAL' as passo,
  au.id as auth_user_id,
  au.email as auth_email,
  au.email_confirmed_at,
  pu.id as public_user_id,
  pu.email as public_email,
  pu.name,
  pu.active,
  pu.role,
  pu.tenant_id,
  t.name as tenant_name,
  CASE 
    WHEN au.id IS NULL THEN 'PROBLEMA: Nao existe em auth.users - Crie via Dashboard'
    WHEN pu.id IS NULL THEN 'PROBLEMA: Nao existe em public.users'
    WHEN au.id != pu.id THEN 'PROBLEMA: IDs diferentes'
    WHEN au.email_confirmed_at IS NULL THEN 'AVISO: Email nao confirmado'
    WHEN pu.active = false THEN 'PROBLEMA: Usuario inativo'
    WHEN pu.tenant_id IS NULL THEN 'PROBLEMA: Sem tenant'
    WHEN t.name != 'Distribuidor' THEN 'PROBLEMA: Tenant incorreto'
    ELSE 'TUDO OK - Login deve funcionar!'
  END as status
FROM auth.users au
FULL OUTER JOIN public.users pu ON au.id = pu.id
LEFT JOIN public.tenants t ON pu.tenant_id = t.id
WHERE au.email = 'juliawf@gmail.com' 
   OR pu.email = 'juliawf@gmail.com';

