-- =====================================================
-- CORREÇÃO DO USUÁRIO JULIO
-- =====================================================
-- Este script verifica e corrige problemas com o usuário julio

-- 1. VERIFICAR SE O USUÁRIO EXISTE NA TABELA USERS
SELECT 
  id, 
  email, 
  name, 
  role, 
  tenant_id, 
  active,
  created_at
FROM public.users 
WHERE email = 'julio@varejo.com' OR id = 'c8d2f0ba-e4f4-4b3e-9f6d-ae4f5b2c3d4f';

-- 2. VERIFICAR SE O TENANT EXISTE
SELECT 
  id, 
  name, 
  plan,
  created_at
FROM public.tenants 
WHERE id = '8bd69047-7533-42f3-a2f7-e3a60477f68c';

-- 3. VERIFICAR SE O USUÁRIO EXISTE NA TABELA AUTH.USERS
SELECT 
  id, 
  email, 
  email_confirmed_at,
  created_at,
  raw_user_meta_data
FROM auth.users 
WHERE email = 'julio@varejo.com';

-- 4. CORRIGIR O USUÁRIO JULIO (se necessário)
-- Garantir que o tenant existe
INSERT INTO public.tenants (id, name, plan, created_at)
VALUES ('8bd69047-7533-42f3-a2f7-e3a60477f68c', 'Varejo', 'free', NOW())
ON CONFLICT (id) DO NOTHING;

-- Atualizar ou criar o usuário julio
-- NOTA: O ID do usuário deve corresponder ao ID em auth.users
-- Se o usuário não existir em auth.users, você precisa criá-lo primeiro via interface do Supabase

UPDATE public.users
SET 
  active = true,
  tenant_id = '8bd69047-7533-42f3-a2f7-e3a60477f68c',
  role = 'supervisor',
  updated_at = NOW()
WHERE email = 'julio@varejo.com' OR id = 'c8d2f0ba-e4f4-4b3e-9f6d-ae4f5b2c3d4f';

-- Se o usuário não existir, criar (mas precisa existir em auth.users primeiro)
INSERT INTO public.users (id, email, name, role, tenant_id, active, created_at)
VALUES (
  'c8d2f0ba-e4f4-4b3e-9f6d-ae4f5b2c3d4f',
  'julio@varejo.com',
  'Julio Supervisor',
  'supervisor',
  '8bd69047-7533-42f3-a2f7-e3a60477f68c',
  true,
  NOW()
)
ON CONFLICT (id) DO UPDATE SET
  active = true,
  tenant_id = '8bd69047-7533-42f3-a2f7-e3a60477f68c',
  role = 'supervisor',
  updated_at = NOW();

-- 5. VERIFICAR SE O RELACIONAMENTO ESTÁ CORRETO
SELECT 
  u.id,
  u.email,
  u.name,
  u.role,
  u.active,
  u.tenant_id,
  t.name as tenant_name,
  t.plan as tenant_plan
FROM public.users u
LEFT JOIN public.tenants t ON u.tenant_id = t.id
WHERE u.email = 'julio@varejo.com';

-- 6. VERIFICAR POLÍTICAS RLS (Row Level Security)
-- Verificar se há políticas que podem estar bloqueando o acesso
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE tablename IN ('users', 'tenants')
ORDER BY tablename, policyname;

