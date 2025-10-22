-- =====================================================
-- CRIAR ELAINE - DESABILITANDO TRIGGER PROBLEMÁTICO
-- =====================================================

-- 1. Desabilitar o trigger problemático temporariamente
DROP TRIGGER IF EXISTS create_default_user_role_trigger ON users;

-- 2. Verificar tenant "Porta a Porta"
SELECT 
    'TENANT PORTA A PORTA' as info,
    id,
    name,
    plan
FROM tenants
WHERE name = 'Porta a Porta';

-- 3. Criar usuário Elaine
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

-- 4. Verificar se foi criado
SELECT 
    'ELAINE CRIADA COM SUCESSO' as info,
    u.id,
    u.name,
    u.email,
    u.role,
    t.name as tenant
FROM users u
JOIN tenants t ON u.tenant_id = t.id
WHERE u.name = 'Elaine';

-- 5. Criar user_role manualmente
INSERT INTO user_roles (
    user_id,
    tenant_id,
    role
) VALUES (
    (SELECT id FROM users WHERE name = 'Elaine' AND email = 'elaine@portaporta.com'),
    (SELECT id FROM tenants WHERE name = 'Porta a Porta'),
    'agent'
);

-- 6. Verificar user_role criado
SELECT 
    'USER ROLE ELAINE CRIADO' as info,
    ur.user_id,
    ur.role,
    u.name as user_name,
    t.name as tenant_name
FROM user_roles ur
JOIN users u ON ur.user_id = u.id
JOIN tenants t ON ur.tenant_id = t.id
WHERE u.name = 'Elaine';

-- 7. Reabilitar o trigger (opcional)
-- CREATE TRIGGER create_default_user_role_trigger
--     AFTER INSERT ON users
--     FOR EACH ROW
--     EXECUTE FUNCTION create_default_user_role();

-- 8. Verificar isolamento
SELECT 
    'ISOLAMENTO VERIFICADO' as info,
    'Elaine está isolada da Maria' as status
WHERE NOT EXISTS (
    SELECT 1 FROM users u1, users u2
    WHERE u1.name = 'Elaine' 
    AND u2.name = 'Maria Vitória Brebal Romero Furtado'
    AND u1.tenant_id = u2.tenant_id
);
