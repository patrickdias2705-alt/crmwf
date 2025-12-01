-- =====================================================
-- CRIAR ELAINE - ULTRA SIMPLES (SEM TRIGGERS)
-- =====================================================

-- 1. Desabilitar TODOS os triggers da tabela users
ALTER TABLE users DISABLE TRIGGER ALL;

-- 2. Criar usuário Elaine diretamente
INSERT INTO users (
    tenant_id,
    name,
    email,
    role,
    active
) VALUES (
    (SELECT id FROM tenants WHERE name = 'Porta a Porta'),
    'Elaine',
    'elaine@portaporta.com',
    'agent',
    true
);

-- 3. Criar user_role manualmente
INSERT INTO user_roles (
    user_id,
    tenant_id,
    role
) VALUES (
    (SELECT id FROM users WHERE name = 'Elaine'),
    (SELECT id FROM tenants WHERE name = 'Porta a Porta'),
    'agent'
);

-- 4. Verificar se funcionou
SELECT 
    'SUCESSO!' as info,
    u.name as usuario,
    u.email,
    t.name as tenant,
    ur.role as role
FROM users u
JOIN tenants t ON u.tenant_id = t.id
JOIN user_roles ur ON u.id = ur.user_id
WHERE u.name = 'Elaine';
