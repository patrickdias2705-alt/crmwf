-- =====================================================
-- VERIFICAR STAGES POR TENANT - DIAGNÓSTICO
-- =====================================================

-- 1. Verificar stages da Elaine (Porta a Porta)
SELECT 
    'STAGES ELAINE (PORTA A PORTA)' as info,
    t.name as tenant_name,
    p.name as pipeline_name,
    s.name as stage_name,
    s."order" as stage_order,
    s.id as stage_id
FROM tenants t
JOIN pipelines p ON t.id = p.tenant_id
LEFT JOIN stages s ON p.id = s.pipeline_id
WHERE t.name = 'Porta a Porta'
ORDER BY p.name, s."order";

-- 2. Verificar stages da Julia (Distribuidor)
SELECT 
    'STAGES JULIA (DISTRIBUIDOR)' as info,
    t.name as tenant_name,
    p.name as pipeline_name,
    s.name as stage_name,
    s."order" as stage_order,
    s.id as stage_id
FROM tenants t
JOIN pipelines p ON t.id = p.tenant_id
LEFT JOIN stages s ON p.id = s.pipeline_id
WHERE t.name = 'Distribuidor'
ORDER BY p.name, s."order";

-- 3. Verificar stages da Maria (Varejo) para comparação
SELECT 
    'STAGES MARIA (VAREJO)' as info,
    t.name as tenant_name,
    p.name as pipeline_name,
    s.name as stage_name,
    s."order" as stage_order,
    s.id as stage_id
FROM tenants t
JOIN pipelines p ON t.id = p.tenant_id
LEFT JOIN stages s ON p.id = s.pipeline_id
WHERE t.name = 'Varejo'
ORDER BY p.name, s."order";
