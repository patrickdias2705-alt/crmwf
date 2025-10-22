-- =====================================================
-- VERIFICAR PIPELINES DA MARIA
-- =====================================================

-- 1. Verificar pipelines por tenant
SELECT 
    'PIPELINES POR TENANT' as info,
    t.name as tenant_name,
    COUNT(p.id) as total_pipelines,
    STRING_AGG(p.name, ', ') as nomes_pipelines
FROM tenants t
LEFT JOIN pipelines p ON t.id = p.tenant_id
GROUP BY t.id, t.name
ORDER BY total_pipelines DESC;

-- 2. Verificar stages por tenant
SELECT 
    'STAGES POR TENANT' as info,
    t.name as tenant_name,
    p.name as pipeline_name,
    COUNT(s.id) as total_stages,
    STRING_AGG(s.name, ', ') as nomes_stages
FROM tenants t
LEFT JOIN pipelines p ON t.id = p.tenant_id
LEFT JOIN stages s ON p.id = s.pipeline_id
GROUP BY t.id, t.name, p.id, p.name
ORDER BY t.name, p.name;
