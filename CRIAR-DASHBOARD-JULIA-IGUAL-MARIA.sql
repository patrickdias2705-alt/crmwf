-- =====================================================
-- CRIAR DASHBOARD PARA JULIA IGUAL AO DA MARIA
-- =====================================================
-- Copia toda estrutura de pipelines e stages da Maria (Varejo) 
-- para Julia (Distribuidor), mantendo dados separados por tenant
-- =====================================================

-- PASSO 1: Verificar o que Maria (Varejo) tem
SELECT 
  'ESTRUTURA_MARIA' as passo,
  t.name as tenant_name,
  p.name as pipeline_name,
  p.is_default as pipeline_padrao,
  COUNT(s.id) as total_stages,
  STRING_AGG(s.name || ' (' || s."order" || ')', ', ' ORDER BY s."order") as stages
FROM public.tenants t
JOIN public.pipelines p ON t.id = p.tenant_id
LEFT JOIN public.stages s ON p.id = s.pipeline_id
WHERE t.name = 'Varejo'
GROUP BY t.id, t.name, p.id, p.name, p.is_default
ORDER BY p.is_default DESC, p.name;

-- PASSO 2: Verificar estrutura atual da Julia (Distribuidor)
SELECT 
  'ESTRUTURA_ATUAL_JULIA' as passo,
  t.name as tenant_name,
  COUNT(DISTINCT p.id) as total_pipelines,
  COUNT(DISTINCT s.id) as total_stages
FROM public.tenants t
LEFT JOIN public.pipelines p ON t.id = p.tenant_id
LEFT JOIN public.stages s ON p.id = s.pipeline_id
WHERE t.name = 'Distribuidor'
GROUP BY t.id, t.name;

-- PASSO 3: Garantir que o tenant Distribuidor existe
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

-- PASSO 4: Copiar pipelines da Maria para Julia
INSERT INTO public.pipelines (id, name, tenant_id, is_default, created_at, updated_at)
SELECT 
  gen_random_uuid() as id,
  p.name as name,
  (SELECT id FROM public.tenants WHERE name = 'Distribuidor' LIMIT 1) as tenant_id,
  p.is_default as is_default,
  NOW() as created_at,
  NOW() as updated_at
FROM public.tenants t
JOIN public.pipelines p ON t.id = p.tenant_id
WHERE t.name = 'Varejo'
  AND NOT EXISTS (
    SELECT 1 FROM public.pipelines p2
    JOIN public.tenants t2 ON p2.tenant_id = t2.id
    WHERE t2.name = 'Distribuidor' AND p2.name = p.name
  );

-- PASSO 5: Copiar stages da Maria para Julia
INSERT INTO public.stages (id, name, color, "order", pipeline_id, tenant_id, created_at, updated_at)
SELECT 
  gen_random_uuid() as id,
  s.name as name,
  s.color as color,
  s."order" as "order",
  p2.id as pipeline_id,
  t2.id as tenant_id,
  NOW() as created_at,
  NOW() as updated_at
FROM public.tenants t1
JOIN public.pipelines p1 ON t1.id = p1.tenant_id
JOIN public.stages s ON p1.id = s.pipeline_id
JOIN public.tenants t2 ON t2.name = 'Distribuidor'
JOIN public.pipelines p2 ON p2.tenant_id = t2.id AND p2.name = p1.name
WHERE t1.name = 'Varejo'
  AND NOT EXISTS (
    SELECT 1 FROM public.stages s2
    WHERE s2.pipeline_id = p2.id AND s2.name = s.name
  );

-- PASSO 6: Garantir que Julia está associada ao tenant Distribuidor
UPDATE public.users
SET 
  tenant_id = (SELECT id FROM public.tenants WHERE name = 'Distribuidor' LIMIT 1),
  name = 'Julia',
  role = 'agent',
  active = true,
  updated_at = NOW()
WHERE email = 'juliawf@gmail.com';

-- PASSO 7: Criar/atualizar user_role
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

-- PASSO 8: Verificar estrutura final criada para Julia
SELECT 
  'ESTRUTURA_FINAL_JULIA' as passo,
  t.name as tenant_name,
  p.name as pipeline_name,
  p.is_default as pipeline_padrao,
  s.name as stage_name,
  s."order" as stage_order,
  s.color as stage_color
FROM public.tenants t
JOIN public.pipelines p ON t.id = p.tenant_id
LEFT JOIN public.stages s ON p.id = s.pipeline_id
WHERE t.name = 'Distribuidor'
ORDER BY p.is_default DESC, p.name, s."order";

-- PASSO 9: Comparar estruturas (Maria vs Julia)
SELECT 
  'COMPARACAO_MARIA_JULIA' as passo,
  t.name as tenant_name,
  COUNT(DISTINCT p.id) as total_pipelines,
  COUNT(DISTINCT s.id) as total_stages,
  STRING_AGG(DISTINCT p.name, ', ') as pipelines
FROM public.tenants t
LEFT JOIN public.pipelines p ON t.id = p.tenant_id
LEFT JOIN public.stages s ON p.id = s.pipeline_id
WHERE t.name IN ('Varejo', 'Distribuidor')
GROUP BY t.id, t.name
ORDER BY t.name;

-- PASSO 10: Verificar usuário Julia
SELECT 
  'VERIFICACAO_USUARIO_JULIA' as passo,
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
    WHEN au.id IS NULL THEN 'PROBLEMA: Nao existe em auth.users'
    WHEN pu.id IS NULL THEN 'PROBLEMA: Nao existe em public.users'
    WHEN au.id != pu.id THEN 'PROBLEMA: IDs diferentes'
    WHEN pu.tenant_id IS NULL THEN 'PROBLEMA: Sem tenant'
    WHEN t.name != 'Distribuidor' THEN 'PROBLEMA: Tenant incorreto'
    ELSE 'TUDO OK - Usuario configurado!'
  END as status
FROM auth.users au
FULL OUTER JOIN public.users pu ON au.id = pu.id
LEFT JOIN public.tenants t ON pu.tenant_id = t.id
WHERE au.email = 'juliawf@gmail.com' 
   OR pu.email = 'juliawf@gmail.com';

-- PASSO 11: Resumo final
SELECT 
  'RESUMO_FINAL' as passo,
  'Julia (Distribuidor)' as usuario,
  COUNT(DISTINCT p.id) as total_pipelines,
  COUNT(DISTINCT s.id) as total_stages,
  CASE 
    WHEN COUNT(DISTINCT p.id) > 0 AND COUNT(DISTINCT s.id) > 0 THEN 'Dashboard criado com sucesso!'
    WHEN COUNT(DISTINCT p.id) = 0 THEN 'PROBLEMA: Nenhuma pipeline criada'
    WHEN COUNT(DISTINCT s.id) = 0 THEN 'PROBLEMA: Nenhuma stage criada'
    ELSE 'Dashboard incompleto'
  END as status_dashboard
FROM public.tenants t
LEFT JOIN public.pipelines p ON t.id = p.tenant_id
LEFT JOIN public.stages s ON p.id = s.pipeline_id
WHERE t.name = 'Distribuidor'
GROUP BY t.id, t.name;



