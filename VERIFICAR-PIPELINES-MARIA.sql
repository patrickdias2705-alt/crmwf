-- =====================================================
-- COPIAR PIPELINES DA MARIA PARA OUTRAS CONTAS
-- =====================================================

-- 1. Verificar pipelines da Maria (Varejo)
SELECT 
    'PIPELINES DA MARIA (VAREJO)' as info,
    p.id as pipeline_id,
    p.name as pipeline_name,
    p.created_at as pipeline_created
FROM tenants t
JOIN pipelines p ON t.id = p.tenant_id
WHERE t.name = 'Varejo'
ORDER BY p.created_at;

-- 2. Verificar stages da Maria (Varejo)
SELECT 
    'STAGES DA MARIA (VAREJO)' as info,
    p.name as pipeline_name,
    s.id as stage_id,
    s.name as stage_name,
    s.color as stage_color
FROM tenants t
JOIN pipelines p ON t.id = p.tenant_id
JOIN stages s ON p.id = s.pipeline_id
WHERE t.name = 'Varejo'
ORDER BY p.name, s.name;
