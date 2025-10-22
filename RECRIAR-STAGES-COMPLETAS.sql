-- =====================================================
-- COPIAR TODAS AS STAGES DA MARIA PARA ELAINE E JULIA
-- =====================================================

-- 1. Deletar stages existentes de Elaine e Julia (para recriar do zero)
DELETE FROM stages 
WHERE tenant_id IN (
    SELECT id FROM tenants WHERE name IN ('Porta a Porta', 'Distribuidor')
);

-- 2. Recriar todas as stages da Maria para Elaine (Porta a Porta)
INSERT INTO stages (id, name, color, "order", pipeline_id, tenant_id, created_at, updated_at)
SELECT 
    gen_random_uuid() as id,
    s.name as name,
    s.color as color,
    s."order" as "order",
    p2.id as pipeline_id,
    t2.id as tenant_id,
    NOW() as created_at,
    NOW() as updated_at
FROM tenants t1
JOIN pipelines p1 ON t1.id = p1.tenant_id
JOIN stages s ON p1.id = s.pipeline_id
JOIN tenants t2 ON t2.name = 'Porta a Porta'
JOIN pipelines p2 ON p2.tenant_id = t2.id AND p2.name = p1.name
WHERE t1.name = 'Varejo'
ORDER BY s."order";

-- 3. Recriar todas as stages da Maria para Julia (Distribuidor)
INSERT INTO stages (id, name, color, "order", pipeline_id, tenant_id, created_at, updated_at)
SELECT 
    gen_random_uuid() as id,
    s.name as name,
    s.color as color,
    s."order" as "order",
    p2.id as pipeline_id,
    t2.id as tenant_id,
    NOW() as created_at,
    NOW() as updated_at
FROM tenants t1
JOIN pipelines p1 ON t1.id = p1.tenant_id
JOIN stages s ON p1.id = s.pipeline_id
JOIN tenants t2 ON t2.name = 'Distribuidor'
JOIN pipelines p2 ON p2.tenant_id = t2.id AND p2.name = p1.name
WHERE t1.name = 'Varejo'
ORDER BY s."order";

-- 4. Verificar resultado final
SELECT 
    'STAGES FINAIS' as info,
    t.name as tenant_name,
    p.name as pipeline_name,
    COUNT(s.id) as total_stages,
    STRING_AGG(s.name || ' (' || s."order" || ')', ', ') as stages_com_ordem
FROM tenants t
JOIN pipelines p ON t.id = p.tenant_id
LEFT JOIN stages s ON p.id = s.pipeline_id
WHERE t.name IN ('Varejo', 'Porta a Porta', 'Distribuidor')
GROUP BY t.id, t.name, p.id, p.name
ORDER BY t.name, p.name;
