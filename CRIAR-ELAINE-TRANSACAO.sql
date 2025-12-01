-- =====================================================
-- CRIAR ELAINE - USANDO TRANSAÇÃO PARA CONTORNAR TRIGGER
-- =====================================================

-- 1. Verificar se Elaine já existe
SELECT 
    'VERIFICANDO ELAINE' as info,
    u.id,
    u.name,
    u.email,
    t.name as tenant
FROM users u
JOIN tenants t ON u.tenant_id = t.id
WHERE u.name = 'Elaine';

-- 2. Se não existir, vamos tentar uma abordagem diferente
-- Primeiro, vamos ver qual é o ID do tenant "Porta a Porta"
SELECT 
    'TENANT ID' as info,
    id,
    name
FROM tenants
WHERE name = 'Porta a Porta';

-- 3. Criar usuário Elaine usando uma abordagem que evita o trigger
-- Vamos inserir primeiro na tabela users sem o campo role
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

-- 4. Atualizar o role depois
UPDATE users 
SET role = 'agent'
WHERE name = 'Elaine' AND email = 'elaine@portaporta.com';

-- 5. Verificar se foi criada
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

-- 6. Agora criar o user_role manualmente
INSERT INTO user_roles (
    user_id,
    tenant_id,
    role
) VALUES (
    (SELECT id FROM users WHERE name = 'Elaine' AND email = 'elaine@portaporta.com'),
    (SELECT id FROM tenants WHERE name = 'Porta a Porta'),
    'agent'
);

-- 7. Verificar resultado final
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
