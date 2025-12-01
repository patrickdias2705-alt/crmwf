-- =====================================================
-- DEFINIR PIPELINES PADRÃO PARA CADA TENANT
-- =====================================================

-- 1. Definir pipeline padrão para Varejo (Maria)
UPDATE pipelines 
SET is_default = true 
WHERE tenant_id = (SELECT id FROM tenants WHERE name = 'Varejo')
AND name = 'Pipeline Padrão';

-- 2. Definir pipeline padrão para Porta a Porta (Elaine)
UPDATE pipelines 
SET is_default = true 
WHERE tenant_id = (SELECT id FROM tenants WHERE name = 'Porta a Porta')
AND name = 'Pipeline Padrão';

-- 3. Definir pipeline padrão para Distribuidor (Julia)
UPDATE pipelines 
SET is_default = true 
WHERE tenant_id = (SELECT id FROM tenants WHERE name = 'Distribuidor')
AND name = 'Pipeline Padrão';

-- 4. Verificar se foi aplicado corretamente
SELECT 
    'PIPELINES PADRÃO APÓS UPDATE' as info,
    t.name as tenant_name,
    p.name as pipeline_name,
    p.is_default as is_default,
    p.id as pipeline_id
FROM tenants t
JOIN pipelines p ON t.id = p.tenant_id
WHERE p.is_default = true
ORDER BY t.name;
