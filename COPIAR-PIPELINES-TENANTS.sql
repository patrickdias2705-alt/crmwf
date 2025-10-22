-- =====================================================
-- COPIAR PIPELINES DA MARIA PARA ELAINE E JULIA
-- =====================================================

-- 1. Criar pipelines para Elaine (Porta a Porta)
INSERT INTO pipelines (id, name, tenant_id, created_at, updated_at)
SELECT 
    gen_random_uuid() as id,
    p.name as name,
    (SELECT id FROM tenants WHERE name = 'Porta a Porta') as tenant_id,
    NOW() as created_at,
    NOW() as updated_at
FROM tenants t
JOIN pipelines p ON t.id = p.tenant_id
WHERE t.name = 'Varejo'
ON CONFLICT DO NOTHING;

-- 2. Criar pipelines para Julia (Distribuidor)
INSERT INTO pipelines (id, name, tenant_id, created_at, updated_at)
SELECT 
    gen_random_uuid() as id,
    p.name as name,
    (SELECT id FROM tenants WHERE name = 'Distribuidor') as tenant_id,
    NOW() as created_at,
    NOW() as updated_at
FROM tenants t
JOIN pipelines p ON t.id = p.tenant_id
WHERE t.name = 'Varejo'
ON CONFLICT DO NOTHING;

-- 3. Criar stages para Elaine (Porta a Porta)
INSERT INTO stages (id, name, color, "order", pipeline_id, tenant_id, created_at, updated_at)
SELECT 
    gen_random_uuid() as id,
    s.name as name,
    s.color as color,
    ROW_NUMBER() OVER (PARTITION BY p.name ORDER BY s.name) as "order",
    p2.id as pipeline_id,
    t2.id as tenant_id,
    NOW() as created_at,
    NOW() as updated_at
FROM tenants t
JOIN pipelines p ON t.id = p.tenant_id
JOIN stages s ON p.id = s.pipeline_id
JOIN tenants t2 ON t2.name = 'Porta a Porta'
JOIN pipelines p2 ON p2.tenant_id = t2.id AND p2.name = p.name
WHERE t.name = 'Varejo'
ON CONFLICT DO NOTHING;

-- 4. Criar stages para Julia (Distribuidor)
INSERT INTO stages (id, name, color, "order", pipeline_id, tenant_id, created_at, updated_at)
SELECT 
    gen_random_uuid() as id,
    s.name as name,
    s.color as color,
    ROW_NUMBER() OVER (PARTITION BY p.name ORDER BY s.name) as "order",
    p2.id as pipeline_id,
    t2.id as tenant_id,
    NOW() as created_at,
    NOW() as updated_at
FROM tenants t
JOIN pipelines p ON t.id = p.tenant_id
JOIN stages s ON p.id = s.pipeline_id
JOIN tenants t2 ON t2.name = 'Distribuidor'
JOIN pipelines p2 ON p2.tenant_id = t2.id AND p2.name = p.name
WHERE t.name = 'Varejo'
ON CONFLICT DO NOTHING;
