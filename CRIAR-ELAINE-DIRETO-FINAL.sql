-- =====================================================
-- CRIAR ELAINE DIRETO - VERSÃO FINAL
-- =====================================================

-- 1. Verificar tenant "Porta a Porta"
SELECT id, name FROM tenants WHERE name = 'Porta a Porta';

-- 2. Criar Elaine diretamente na tabela users
INSERT INTO users (
    tenant_id,
    name,
    email,
    role,
    active
) VALUES (
    (SELECT id FROM tenants WHERE name = 'Porta a Porta'),
    'Elaine',
    'elaineportaporta@gmail.com',
    'agent',
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
WHERE u.email = 'elaineportaporta@gmail.com';

-- 4. Criar user_role
INSERT INTO user_roles (
    user_id,
    tenant_id,
    role
) VALUES (
    (SELECT id FROM users WHERE email = 'elaineportaporta@gmail.com'),
    (SELECT id FROM tenants WHERE name = 'Porta a Porta'),
    'agent'
);

-- 5. Verificar resultado final
SELECT 
    'SUCESSO!' as info,
    u.name,
    u.email,
    u.role,
    t.name as tenant
FROM users u
JOIN tenants t ON u.tenant_id = t.id
WHERE u.email = 'elaineportaporta@gmail.com';
