-- =====================================================
-- VERIFICAR PIPELINES PADRÃO POR TENANT
-- =====================================================

-- 1. Verificar se cada tenant tem pipeline padrão
SELECT 
    'PIPELINES PADRÃO' as info,
    t.name as tenant_name,
    p.name as pipeline_name,
    p.is_default as is_default,
    p.id as pipeline_id
FROM tenants t
LEFT JOIN pipelines p ON t.id = p.tenant_id
WHERE p.is_default = true OR p.is_default IS NULL
ORDER BY t.name;

-- 2. Verificar stages de cada pipeline padrão
SELECT 
    'STAGES PIPELINE PADRÃO' as info,
    t.name as tenant_name,
    p.name as pipeline_name,
    s.name as stage_name,
    s."order" as stage_order,
    s.id as stage_id
FROM tenants t
JOIN pipelines p ON t.id = p.tenant_id
JOIN stages s ON p.id = s.pipeline_id
WHERE p.is_default = true
ORDER BY t.name, s."order";

-- 3. Verificar se há problemas de isolamento
SELECT 
    'VERIFICAÇÃO ISOLAMENTO' as info,
    'Cada tenant deve ter suas próprias pipelines e stages' as status;
