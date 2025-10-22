-- =====================================================
-- TESTAR ISOLAMENTO DE TENANTS - CRIAÇÃO DE LEADS
-- =====================================================

-- 1. Verificar pipelines disponíveis para cada tenant
SELECT 
    'PIPELINES DISPONÍVEIS' as info,
    t.name as tenant_name,
    COUNT(p.id) as total_pipelines,
    STRING_AGG(p.name, ', ') as nomes_pipelines
FROM tenants t
LEFT JOIN pipelines p ON t.id = p.tenant_id
GROUP BY t.id, t.name
ORDER BY t.name;

-- 2. Verificar stages disponíveis para cada tenant
SELECT 
    'STAGES DISPONÍVEIS' as info,
    t.name as tenant_name,
    p.name as pipeline_name,
    COUNT(s.id) as total_stages,
    STRING_AGG(s.name, ', ') as nomes_stages
FROM tenants t
LEFT JOIN pipelines p ON t.id = p.tenant_id
LEFT JOIN stages s ON p.id = s.pipeline_id
GROUP BY t.id, t.name, p.id, p.name
ORDER BY t.name, p.name;

-- 3. Verificar leads existentes por tenant (deve estar isolado)
SELECT 
    'LEADS EXISTENTES' as info,
    t.name as tenant_name,
    COUNT(l.id) as total_leads,
    COUNT(CASE WHEN l.status = 'open' THEN 1 END) as leads_abertos,
    COUNT(CASE WHEN l.status = 'closed' THEN 1 END) as leads_fechados
FROM tenants t
LEFT JOIN leads l ON t.id = l.tenant_id
GROUP BY t.id, t.name
ORDER BY total_leads DESC;
