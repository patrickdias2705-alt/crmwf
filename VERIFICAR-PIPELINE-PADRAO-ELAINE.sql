-- =====================================================
-- VERIFICAR PIPELINE PADRÃO DA ELAINE
-- =====================================================

-- 1. Verificar pipeline padrão da Elaine
SELECT 
    'PIPELINE PADRÃO ELAINE' as info,
    t.name as tenant_name,
    p.name as pipeline_name,
    p.is_default as is_default,
    p.id as pipeline_id
FROM tenants t
JOIN pipelines p ON t.id = p.tenant_id
WHERE t.name = 'Porta a Porta'
ORDER BY p.is_default DESC, p.name;

-- 2. Verificar stages da pipeline padrão da Elaine
SELECT 
    'STAGES PIPELINE PADRÃO ELAINE' as info,
    t.name as tenant_name,
    p.name as pipeline_name,
    p.is_default as is_default,
    s.name as stage_name,
    s."order" as stage_order,
    s.id as stage_id
FROM tenants t
JOIN pipelines p ON t.id = p.tenant_id
LEFT JOIN stages s ON p.id = s.pipeline_id
WHERE t.name = 'Porta a Porta' 
AND p.is_default = true
ORDER BY s."order";

-- 3. Verificar se há pipeline padrão definida
SELECT 
    'VERIFICAÇÃO PIPELINE PADRÃO' as info,
    t.name as tenant_name,
    COUNT(CASE WHEN p.is_default = true THEN 1 END) as pipelines_padrao,
    COUNT(p.id) as total_pipelines
FROM tenants t
LEFT JOIN pipelines p ON t.id = p.tenant_id
WHERE t.name = 'Porta a Porta'
GROUP BY t.id, t.name;
