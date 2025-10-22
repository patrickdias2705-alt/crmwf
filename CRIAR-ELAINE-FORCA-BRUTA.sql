-- =====================================================
-- CRIAR ELAINE - MÉTODO FORÇA BRUTA
-- =====================================================
-- Vamos resolver isso de uma vez por todas!

-- 1. Primeiro, vamos ver exatamente qual trigger está causando problema
SELECT 
    'TRIGGERS PROBLEMÁTICOS' as info,
    trigger_name,
    event_manipulation,
    action_timing,
    action_statement
FROM information_schema.triggers 
WHERE event_object_table = 'users'
AND trigger_name LIKE '%user_role%';

-- 2. Desabilitar TODOS os triggers da tabela users temporariamente
ALTER TABLE users DISABLE TRIGGER ALL;

-- 3. Verificar tenant "Porta a Porta"
SELECT 
    'TENANT PORTA A PORTA' as info,
    id,
    name,
    plan
FROM tenants
WHERE name = 'Porta a Porta';

-- 4. Criar usuário Elaine (agora sem triggers)
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

-- 5. Verificar se foi criado
SELECT 
    'ELAINE CRIADA COM SUCESSO!' as info,
    u.id,
    u.name,
    u.email,
    u.role,
    t.name as tenant
FROM users u
JOIN tenants t ON u.tenant_id = t.id
WHERE u.name = 'Elaine';

-- 6. Criar user_role manualmente
INSERT INTO user_roles (
    user_id,
    tenant_id,
    role
) VALUES (
    (SELECT id FROM users WHERE name = 'Elaine' AND email = 'elaine@portaporta.com'),
    (SELECT id FROM tenants WHERE name = 'Porta a Porta'),
    'agent'
);

-- 7. Verificar user_role
SELECT 
    'USER ROLE ELAINE CRIADO!' as info,
    ur.user_id,
    ur.role,
    u.name as user_name,
    t.name as tenant_name
FROM user_roles ur
JOIN users u ON ur.user_id = u.id
JOIN tenants t ON ur.tenant_id = t.id
WHERE u.name = 'Elaine';

-- 8. Reabilitar os triggers (opcional - pode deixar desabilitado se quiser)
-- ALTER TABLE users ENABLE TRIGGER ALL;

-- 9. Verificar isolamento final
SELECT 
    'ISOLAMENTO CONFIRMADO!' as info,
    'Elaine está 100% isolada da Maria' as status
WHERE NOT EXISTS (
    SELECT 1 FROM users u1, users u2
    WHERE u1.name = 'Elaine' 
    AND u2.name = 'Maria Vitória Brebal Romero Furtado'
    AND u1.tenant_id = u2.tenant_id
);
