-- Associar juliawf@gmail.com ao tenant Distribuidor

-- Passo 1: Garantir que o tenant Distribuidor existe
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

-- Passo 2: Associar usuário ao tenant Distribuidor
UPDATE public.users
SET 
  tenant_id = (SELECT id FROM public.tenants WHERE name = 'Distribuidor' LIMIT 1),
  name = 'Julia',
  role = 'agent',
  active = true,
  updated_at = NOW()
WHERE email = 'juliawf@gmail.com';

-- Passo 3: Criar user_role
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

-- Passo 4: Verificar resultado
SELECT 
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
    WHEN au.id IS NULL THEN 'Nao existe em auth.users'
    WHEN pu.id IS NULL THEN 'Nao existe em public.users'
    WHEN au.id != pu.id THEN 'IDs diferentes'
    WHEN au.email_confirmed_at IS NULL THEN 'Email nao confirmado'
    WHEN pu.active = false THEN 'Usuario inativo'
    WHEN pu.tenant_id IS NULL THEN 'Sem tenant'
    WHEN t.name != 'Distribuidor' THEN 'Tenant incorreto'
    ELSE 'TUDO OK - Usuario associado ao tenant Distribuidor!'
  END as status
FROM auth.users au
JOIN public.users pu ON au.id = pu.id
LEFT JOIN public.tenants t ON pu.tenant_id = t.id
WHERE au.email = 'juliawf@gmail.com';

