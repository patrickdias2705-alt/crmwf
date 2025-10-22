-- =====================================================
-- CRIAR ELAINE - SEM CAMPO ROLE INICIAL
-- =====================================================

-- 1. Verificar tenant "Porta a Porta"
SELECT id, name FROM tenants WHERE name = 'Porta a Porta';

-- 2. Criar usuário Elaine SEM o campo role (para evitar trigger)
INSERT INTO users (
    tenant_id,
    name,
    email,
    active
) VALUES (
    (SELECT id FROM tenants WHERE name = 'Porta a Porta'),
    'Elaine',
    'elaine@portaporta.com',
    true
);

-- 3. Verificar se foi criada
SELECT 
    'ELAINE CRIADA!' as info,
    u.id,
    u.name,
    u.email,
    u.role,
    t.name as tenant
FROM users u
JOIN tenants t ON u.tenant_id = t.id
WHERE u.name = 'Elaine';

-- 4. Atualizar o role depois
UPDATE users 
SET role = 'agent'
WHERE name = 'Elaine' AND email = 'elaine@portaporta.com';

-- 5. Criar user_role manualmente
INSERT INTO user_roles (
    user_id,
    tenant_id,
    role
) VALUES (
    (SELECT id FROM users WHERE name = 'Elaine'),
    (SELECT id FROM tenants WHERE name = 'Porta a Porta'),
    'agent'
);

-- 6. Verificar resultado final
SELECT 
    'SUCESSO!' as info,
    u.name,
    u.email,
    u.role,
    t.name as tenant
FROM users u
JOIN tenants t ON u.tenant_id = t.id
WHERE u.name = 'Elaine';
