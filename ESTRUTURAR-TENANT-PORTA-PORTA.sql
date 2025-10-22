-- =====================================================
-- ESTRUTURAR TENANT "PORTA A PORTA" COMPLETAMENTE ISOLADO
-- =====================================================

-- 1. Verificar tenant "Porta a Porta"
SELECT 
    'TENANT PORTA A PORTA' as info,
    id,
    name,
    plan
FROM tenants
WHERE name = 'Porta a Porta';

-- 2. Criar pipeline padrão para "Porta a Porta"
INSERT INTO pipelines (
    id,
    tenant_id,
    name,
    is_default,
    created_at,
    updated_at
) VALUES (
    gen_random_uuid(),
    (SELECT id FROM tenants WHERE name = 'Porta a Porta'),
    'Funil Porta a Porta',
    true,
    NOW(),
    NOW()
);

-- 3. Criar estágios padrão para o pipeline
INSERT INTO stages (
    id,
    tenant_id,
    pipeline_id,
    name,
    "order",
    color,
    created_at,
    updated_at
) VALUES 
(
    gen_random_uuid(),
    (SELECT id FROM tenants WHERE name = 'Porta a Porta'),
    (SELECT id FROM pipelines WHERE tenant_id = (SELECT id FROM tenants WHERE name = 'Porta a Porta') AND is_default = true),
    'Novo Lead',
    1,
    '#3B82F6',
    NOW(),
    NOW()
),
(
    gen_random_uuid(),
    (SELECT id FROM tenants WHERE name = 'Porta a Porta'),
    (SELECT id FROM pipelines WHERE tenant_id = (SELECT id FROM tenants WHERE name = 'Porta a Porta') AND is_default = true),
    'Contato Iniciado',
    2,
    '#8B5CF6',
    NOW(),
    NOW()
),
(
    gen_random_uuid(),
    (SELECT id FROM tenants WHERE name = 'Porta a Porta'),
    (SELECT id FROM pipelines WHERE tenant_id = (SELECT id FROM tenants WHERE name = 'Porta a Porta') AND is_default = true),
    'Proposta Enviada',
    3,
    '#F59E0B',
    NOW(),
    NOW()
),
(
    gen_random_uuid(),
    (SELECT id FROM tenants WHERE name = 'Porta a Porta'),
    (SELECT id FROM pipelines WHERE tenant_id = (SELECT id FROM tenants WHERE name = 'Porta a Porta') AND is_default = true),
    'Negociação',
    4,
    '#EF4444',
    NOW(),
    NOW()
),
(
    gen_random_uuid(),
    (SELECT id FROM tenants WHERE name = 'Porta a Porta'),
    (SELECT id FROM pipelines WHERE tenant_id = (SELECT id FROM tenants WHERE name = 'Porta a Porta') AND is_default = true),
    'Fechado',
    5,
    '#10B981',
    NOW(),
    NOW()
);

-- 4. Verificar estrutura criada
SELECT 
    'ESTRUTURA CRIADA' as info,
    'Pipeline' as tipo,
    p.name as nome,
    p.is_default as padrao
FROM pipelines p
JOIN tenants t ON p.tenant_id = t.id
WHERE t.name = 'Porta a Porta';

SELECT 
    'ESTRUTURA CRIADA' as info,
    'Estágios' as tipo,
    s.name as nome,
    s."order" as ordem,
    s.color as cor
FROM stages s
JOIN tenants t ON s.tenant_id = t.id
WHERE t.name = 'Porta a Porta'
ORDER BY s."order";

-- 5. Verificar que Elaine tem acesso apenas ao seu tenant
SELECT 
    'ACESSO ELAINE' as info,
    u.name as usuario,
    t.name as tenant,
    COUNT(p.id) as pipelines,
    COUNT(s.id) as estagios
FROM users u
JOIN tenants t ON u.tenant_id = t.id
LEFT JOIN pipelines p ON t.id = p.tenant_id
LEFT JOIN stages s ON t.id = s.tenant_id
WHERE u.name = 'Elaine'
GROUP BY u.name, t.name;
