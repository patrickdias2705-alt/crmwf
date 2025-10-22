-- =====================================================
-- CRIAR USUÁRIO ELAINE - VERSÃO CORRIGIDA
-- =====================================================
-- Resolve o problema de foreign key constraint

-- 1. Verificar tenant "Porta a Porta"
SELECT 
    'TENANT PORTA A PORTA' as info,
    id,
    name,
    plan
FROM tenants
WHERE name = 'Porta a Porta';

-- 2. Criar usuário Elaine diretamente na tabela users
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

-- 4. Criar user_role manualmente (se necessário)
INSERT INTO user_roles (
    user_id,
    tenant_id,
    role
) VALUES (
    (SELECT id FROM users WHERE name = 'Elaine' AND email = 'elaine@portaporta.com'),
    (SELECT id FROM tenants WHERE name = 'Porta a Porta'),
    'agent'
);

-- 5. Verificar user_role criado
SELECT 
    'USER ROLE ELAINE' as info,
    ur.user_id,
    ur.tenant_id,
    ur.role,
    u.name as user_name,
    t.name as tenant_name
FROM user_roles ur
JOIN users u ON ur.user_id = u.id
JOIN tenants t ON ur.tenant_id = t.id
WHERE u.name = 'Elaine';

-- 6. Verificar isolamento - Elaine deve ver apenas dados do seu tenant
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
