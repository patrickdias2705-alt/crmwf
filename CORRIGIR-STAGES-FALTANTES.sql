-- =====================================================
-- CORRIGIR STAGES FALTANTES PARA ELAINE E JULIA
-- =====================================================

-- 1. Criar stages faltantes para Elaine (Porta a Porta)
INSERT INTO stages (id, name, color, "order", pipeline_id, tenant_id, created_at, updated_at)
SELECT 
    gen_random_uuid() as id,
    'Novo Lead' as name,
    '#3B82F6' as color,
    1 as "order",
    p.id as pipeline_id,
    t.id as tenant_id,
    NOW() as created_at,
    NOW() as updated_at
FROM tenants t
JOIN pipelines p ON t.id = p.tenant_id
WHERE t.name = 'Porta a Porta' 
AND p.name = 'Pipeline Padrão'
AND NOT EXISTS (
    SELECT 1 FROM stages s 
    WHERE s.pipeline_id = p.id 
    AND s.name = 'Novo Lead'
)
ON CONFLICT DO NOTHING;

-- 2. Criar stages faltantes para Julia (Distribuidor)
INSERT INTO stages (id, name, color, "order", pipeline_id, tenant_id, created_at, updated_at)
SELECT 
    gen_random_uuid() as id,
    'Novo Lead' as name,
    '#3B82F6' as color,
    1 as "order",
    p.id as pipeline_id,
    t.id as tenant_id,
    NOW() as created_at,
    NOW() as updated_at
FROM tenants t
JOIN pipelines p ON t.id = p.tenant_id
WHERE t.name = 'Distribuidor' 
AND p.name = 'Pipeline Padrão'
AND NOT EXISTS (
    SELECT 1 FROM stages s 
    WHERE s.pipeline_id = p.id 
    AND s.name = 'Novo Lead'
)
ON CONFLICT DO NOTHING;

-- 3. Verificar se foi criado corretamente
SELECT 
    'STAGES APÓS CORREÇÃO' as info,
    t.name as tenant_name,
    p.name as pipeline_name,
    COUNT(s.id) as total_stages,
    STRING_AGG(s.name, ', ') as nomes_stages
FROM tenants t
JOIN pipelines p ON t.id = p.tenant_id
LEFT JOIN stages s ON p.id = s.pipeline_id
WHERE t.name IN ('Porta a Porta', 'Distribuidor')
GROUP BY t.id, t.name, p.id, p.name
ORDER BY t.name, p.name;
