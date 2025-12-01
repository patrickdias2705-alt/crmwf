-- =====================================================
-- CRIAR ELAINE - MÉTODO BÁSICO E SEGURO
-- =====================================================

-- 1. Verificar tenant "Porta a Porta"
SELECT id, name FROM tenants WHERE name = 'Porta a Porta';

-- 2. Criar usuário Elaine (método mais simples possível)
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

-- 3. Verificar se foi criada
SELECT 
    u.name,
    u.email,
    u.role,
    t.name as tenant
FROM users u
JOIN tenants t ON u.tenant_id = t.id
WHERE u.name = 'Elaine';

-- 4. Se deu erro, vamos tentar criar o user_role manualmente
-- (Execute apenas se o passo 2 funcionou)
INSERT INTO user_roles (
    user_id,
    tenant_id,
    role
) VALUES (
    (SELECT id FROM users WHERE name = 'Elaine'),
    (SELECT id FROM tenants WHERE name = 'Porta a Porta'),
    'agent'
);

-- 5. Verificar resultado
SELECT 
    'ELAINE CRIADA COM SUCESSO!' as status,
    u.name,
    t.name as tenant
FROM users u
JOIN tenants t ON u.tenant_id = t.id
WHERE u.name = 'Elaine';
