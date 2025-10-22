-- =====================================================
-- REMOVER DADOS DE TESTE DA MARIA
-- =====================================================

-- 1. Primeiro, verificar quais leads parecem ser de teste
SELECT 
    'LEADS SUSPEITOS' as info,
    l.id,
    l.name,
    l.phone,
    l.email,
    l.origin,
    l.status,
    l.created_at
FROM users u
JOIN tenants t ON u.tenant_id = t.id
JOIN leads l ON l.tenant_id = t.id
WHERE u.email = 'maria@wfcirurgicos.com.br'
AND (
    l.name IN ('João Silva', 'Maria Santos', 'Pedro Costa', 'Ana Oliveira', 'Carlos Lima') OR
    l.phone IN ('11999999999', '11888888888', '11777777777', '11666666666', '11555555555') OR
    l.email IN ('joao@teste.com', 'maria@teste.com', 'pedro@teste.com', 'ana@teste.com', 'carlos@teste.com') OR
    l.name ILIKE '%teste%' OR
    l.name ILIKE '%exemplo%' OR
    l.name ILIKE '%demo%'
)
ORDER BY l.created_at DESC;

-- 2. Remover orçamentos dos leads de teste
DELETE FROM budgets 
WHERE lead_id IN (
    SELECT l.id 
    FROM users u
    JOIN tenants t ON u.tenant_id = t.id
    JOIN leads l ON l.tenant_id = t.id
    WHERE u.email = 'maria@wfcirurgicos.com.br'
    AND (
        l.name IN ('João Silva', 'Maria Santos', 'Pedro Costa', 'Ana Oliveira', 'Carlos Lima') OR
        l.phone IN ('11999999999', '11888888888', '11777777777', '11666666666', '11555555555') OR
        l.email IN ('joao@teste.com', 'maria@teste.com', 'pedro@teste.com', 'ana@teste.com', 'carlos@teste.com') OR
        l.name ILIKE '%teste%' OR
        l.name ILIKE '%exemplo%' OR
        l.name ILIKE '%demo%'
    )
);

-- 3. Remover leads de teste
DELETE FROM leads 
WHERE tenant_id = (
    SELECT t.id 
    FROM users u
    JOIN tenants t ON u.tenant_id = t.id
    WHERE u.email = 'maria@wfcirurgicos.com.br'
)
AND (
    name IN ('João Silva', 'Maria Santos', 'Pedro Costa', 'Ana Oliveira', 'Carlos Lima') OR
    phone IN ('11999999999', '11888888888', '11777777777', '11666666666', '11555555555') OR
    email IN ('joao@teste.com', 'maria@teste.com', 'pedro@teste.com', 'ana@teste.com', 'carlos@teste.com') OR
    name ILIKE '%teste%' OR
    name ILIKE '%exemplo%' OR
    name ILIKE '%demo%'
);

-- 4. Verificar dados restantes da Maria
SELECT 
    'DADOS REAIS DA MARIA' as info,
    l.id,
    l.name,
    l.phone,
    l.email,
    l.origin,
    l.status,
    l.created_at
FROM users u
JOIN tenants t ON u.tenant_id = t.id
JOIN leads l ON l.tenant_id = t.id
WHERE u.email = 'maria@wfcirurgicos.com.br'
ORDER BY l.created_at DESC;
