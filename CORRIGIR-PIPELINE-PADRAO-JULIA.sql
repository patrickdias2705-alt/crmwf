-- =====================================================
-- CORRIGIR PIPELINE PADRÃO DA JULIA
-- =====================================================

-- 1. Remover pipeline padrão de todas as pipelines da Julia
UPDATE pipelines 
SET is_default = false 
WHERE tenant_id = (SELECT id FROM tenants WHERE name = 'Distribuidor');

-- 2. Definir "Pipeline Padrão" como padrão para Julia
UPDATE pipelines 
SET is_default = true 
WHERE tenant_id = (SELECT id FROM tenants WHERE name = 'Distribuidor')
AND name = 'Pipeline Padrão';

-- 3. Verificar se foi aplicado corretamente
SELECT 
    'PIPELINE PADRÃO JULIA APÓS CORREÇÃO' as info,
    t.name as tenant_name,
    p.name as pipeline_name,
    p.is_default as is_default,
    p.id as pipeline_id,
    COUNT(s.id) as total_stages
FROM tenants t
JOIN pipelines p ON t.id = p.tenant_id
LEFT JOIN stages s ON p.id = s.pipeline_id
WHERE t.name = 'Distribuidor'
GROUP BY t.id, t.name, p.id, p.name, p.is_default
ORDER BY p.is_default DESC, p.name;

-- 4. Verificar stages da pipeline padrão da Julia
SELECT 
    'STAGES PIPELINE PADRÃO JULIA' as info,
    t.name as tenant_name,
    p.name as pipeline_name,
    s.name as stage_name,
    s."order" as stage_order,
    s.id as stage_id
FROM tenants t
JOIN pipelines p ON t.id = p.tenant_id
JOIN stages s ON p.id = s.pipeline_id
WHERE t.name = 'Distribuidor' 
AND p.is_default = true
ORDER BY s."order";
