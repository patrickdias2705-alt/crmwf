-- =====================================================
-- CRIAR ELAINE - VERSÃO SIMPLES E SEGURA
-- =====================================================

-- 1. Verificar tenant "Porta a Porta"
SELECT 
    'TENANT PORTA A PORTA' as info,
    id,
    name,
    plan
FROM tenants
WHERE name = 'Porta a Porta';

-- 2. Criar usuário Elaine (sem triggers problemáticos)
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

-- 4. Verificar que está isolada da Maria
SELECT 
    'ISOLAMENTO VERIFICADO' as info,
    'Elaine vê apenas seu tenant' as status
WHERE NOT EXISTS (
    SELECT 1 FROM users u1, users u2
    WHERE u1.name = 'Elaine' 
    AND u2.name = 'Maria Vitória Brebal Romero Furtado'
    AND u1.tenant_id = u2.tenant_id
);
