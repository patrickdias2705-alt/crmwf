-- =====================================================
-- CRIAR DASHBOARD COMPLETO PARA JULIA (DISTRIBUIDOR)
-- =====================================================
-- Este SQL cria a mesma estrutura de dashboard que Maria e Elaine têm
-- =====================================================

-- PASSO 1: Verificar estrutura atual do tenant Distribuidor
SELECT 
  'VERIFICACAO_ATUAL' as passo,
  t.id as tenant_id,
  t.name as tenant_name,
  COUNT(DISTINCT p.id) as total_pipelines,
  COUNT(DISTINCT s.id) as total_stages,
  COUNT(DISTINCT u.id) as total_usuarios
FROM public.tenants t
LEFT JOIN public.pipelines p ON t.id = p.tenant_id
LEFT JOIN public.stages s ON p.id = s.pipeline_id
LEFT JOIN public.users u ON t.id = u.tenant_id
WHERE t.name = 'Distribuidor'
GROUP BY t.id, t.name;

-- PASSO 2: Verificar o que Maria (Varejo) tem
SELECT 
  'ESTRUTURA_MARIA' as passo,
  t.name as tenant_name,
  p.name as pipeline_name,
  p.is_default as pipeline_padrao,
  s.name as stage_name,
  s."order" as stage_order,
  s.color as stage_color
FROM public.tenants t
JOIN public.pipelines p ON t.id = p.tenant_id
LEFT JOIN public.stages s ON p.id = s.pipeline_id
WHERE t.name = 'Varejo'
ORDER BY p.is_default DESC, p.name, s."order";

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

-- PASSO 4: Criar pipelines para Julia (copiar da Maria)
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
ON CONFLICT DO NOTHING;

-- PASSO 5: Criar stages para Julia (copiar da Maria)
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
ON CONFLICT DO NOTHING;

-- PASSO 6: Garantir que há uma pipeline padrão
UPDATE public.pipelines
SET is_default = true
WHERE tenant_id = (SELECT id FROM public.tenants WHERE name = 'Distribuidor' LIMIT 1)
  AND name = 'Pipeline Padrão'
  AND NOT EXISTS (
    SELECT 1 FROM public.pipelines p2
    WHERE p2.tenant_id = (SELECT id FROM public.tenants WHERE name = 'Distribuidor' LIMIT 1)
      AND p2.is_default = true
  );

-- Se não existe Pipeline Padrão, criar uma
INSERT INTO public.pipelines (id, name, tenant_id, is_default, created_at, updated_at)
SELECT 
  gen_random_uuid(),
  'Pipeline Padrão',
  (SELECT id FROM public.tenants WHERE name = 'Distribuidor' LIMIT 1),
  true,
  NOW(),
  NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM public.pipelines
  WHERE tenant_id = (SELECT id FROM public.tenants WHERE name = 'Distribuidor' LIMIT 1)
    AND is_default = true
);

-- Criar stages padrão se não existir
INSERT INTO public.stages (id, name, color, "order", pipeline_id, tenant_id, created_at, updated_at)
SELECT 
  gen_random_uuid(),
  stage_name,
  stage_color,
  stage_order,
  (SELECT id FROM public.pipelines WHERE tenant_id = (SELECT id FROM public.tenants WHERE name = 'Distribuidor' LIMIT 1) AND is_default = true LIMIT 1),
  (SELECT id FROM public.tenants WHERE name = 'Distribuidor' LIMIT 1),
  NOW(),
  NOW()
FROM (VALUES
  ('Novo Lead', '#3B82F6', 0),
  ('Contato Realizado', '#8B5CF6', 1),
  ('Qualificado', '#06B6D4', 2),
  ('Proposta Enviada', '#F59E0B', 3),
  ('Negociação', '#EAB308', 4),
  ('Fechado/Ganho', '#22C55E', 5),
  ('Perdido', '#EF4444', 6),
  ('Recusado', '#64748B', 7)
) AS stages_data(stage_name, stage_color, stage_order)
WHERE NOT EXISTS (
  SELECT 1 FROM public.stages s
  JOIN public.pipelines p ON s.pipeline_id = p.id
  WHERE p.tenant_id = (SELECT id FROM public.tenants WHERE name = 'Distribuidor' LIMIT 1)
    AND p.is_default = true
    AND s.name = stages_data.stage_name
);

-- PASSO 7: Verificar estrutura final criada
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

-- PASSO 8: Verificar usuário Julia
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

-- PASSO 9: Resumo final
SELECT 
  'RESUMO_FINAL' as passo,
  'Julia (Distribuidor)' as usuario,
  COUNT(DISTINCT p.id) as total_pipelines,
  COUNT(DISTINCT s.id) as total_stages,
  STRING_AGG(DISTINCT p.name, ', ') as pipelines_criadas,
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



