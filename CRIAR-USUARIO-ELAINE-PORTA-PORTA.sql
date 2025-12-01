-- =====================================================
-- CRIAR USUÁRIO ELAINE NO TENANT "PORTA A PORTA"
-- =====================================================
-- Usuário completamente isolado da Maria, com dados próprios

-- 1. Primeiro, vamos verificar o ID do tenant "Porta a Porta"
SELECT 
    'TENANT PORTA A PORTA' as info,
    id,
    name,
    plan
FROM tenants
WHERE name = 'Porta a Porta';

-- 2. Criar usuário Elaine no tenant "Porta a Porta"
-- (Substitua 'TENANT_ID_PORTA_PORTA' pelo ID real do tenant)
INSERT INTO users (
    id,
    tenant_id,
    name,
    email,
    role,
    active,
    created_at,
    updated_at
) VALUES (
    gen_random_uuid(),
    (SELECT id FROM tenants WHERE name = 'Porta a Porta'),
    'Elaine',
    'elaine@portaporta.com',
    'agent',
    true,
    NOW(),
    NOW()
);

-- 3. Verificar se o usuário foi criado
SELECT 
    'USUÁRIO ELAINE CRIADO' as info,
    u.id,
    u.name,
    u.email,
    u.role,
    u.active,
    t.name as tenant_name
FROM users u
JOIN tenants t ON u.tenant_id = t.id
WHERE u.name = 'Elaine';

-- 4. Verificar isolamento - Elaine deve ver apenas dados do seu tenant
SELECT 
    'VERIFICAÇÃO DE ISOLAMENTO' as info,
    'Leads da Elaine' as tipo_dado,
    COUNT(*) as total
FROM leads l
JOIN users u ON l.tenant_id = u.tenant_id
WHERE u.name = 'Elaine';

SELECT 
    'VERIFICAÇÃO DE ISOLAMENTO' as info,
    'Sales da Elaine' as tipo_dado,
    COUNT(*) as total
FROM sales s
JOIN users u ON s.tenant_id = u.tenant_id
WHERE u.name = 'Elaine';

-- 5. Verificar que Elaine NÃO vê dados da Maria
SELECT 
    'VERIFICAÇÃO DE ISOLAMENTO' as info,
    'Leads da Maria (Elaine NÃO deve ver)' as tipo_dado,
    COUNT(*) as total
FROM leads l
JOIN users u ON l.tenant_id = u.tenant_id
WHERE u.name = 'Maria Vitória Brebal Romero Furtado';
