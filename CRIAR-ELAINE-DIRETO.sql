-- =====================================================
-- CRIAR ELAINE - MÉTODO DIRETO E SIMPLES
-- =====================================================

-- 1. Verificar tenant "Porta a Porta"
SELECT 
    'TENANT PORTA A PORTA' as info,
    id,
    name,
    plan
FROM tenants
WHERE name = 'Porta a Porta';

-- 2. Inserir diretamente na tabela users (sem triggers)
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

-- 3. Verificar se foi criado
SELECT 
    'ELAINE CRIADA' as info,
    u.id,
    u.name,
    u.email,
    u.role,
    t.name as tenant
FROM users u
JOIN tenants t ON u.tenant_id = t.id
WHERE u.name = 'Elaine';

-- 4. Inserir user_role diretamente
INSERT INTO user_roles (
    id,
    user_id,
    tenant_id,
    role,
    created_at
) VALUES (
    gen_random_uuid(),
    (SELECT id FROM users WHERE name = 'Elaine' AND email = 'elaine@portaporta.com'),
    (SELECT id FROM tenants WHERE name = 'Porta a Porta'),
    'agent',
    NOW()
);

-- 5. Verificar resultado final
SELECT 
    'RESULTADO FINAL' as info,
    u.name as usuario,
    u.email,
    u.role as user_role,
    ur.role as tenant_role,
    t.name as tenant
FROM users u
JOIN user_roles ur ON u.id = ur.user_id
JOIN tenants t ON u.tenant_id = t.id
WHERE u.name = 'Elaine';
