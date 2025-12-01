-- =====================================================
-- REMOVER DADOS FALSOS DA MARIA
-- =====================================================

-- 1. Remover orçamentos falsos da Maria
DELETE FROM budgets 
WHERE lead_id IN (
    SELECT l.id 
    FROM users u
    JOIN tenants t ON u.tenant_id = t.id
    JOIN leads l ON l.tenant_id = t.id
    WHERE u.email = 'maria@wfcirurgicos.com.br'
    AND (
        l.name ILIKE '%teste%' OR
        l.name ILIKE '%fake%' OR
        l.name ILIKE '%dummy%' OR
        l.name ILIKE '%exemplo%' OR
        l.phone LIKE '1199999%' OR
        l.phone LIKE '1198888%' OR
        l.phone LIKE '1197777%' OR
        l.email ILIKE '%teste%' OR
        l.email ILIKE '%fake%' OR
        l.email ILIKE '%dummy%' OR
        l.email ILIKE '%exemplo%'
    )
);

-- 2. Remover leads falsos da Maria
DELETE FROM leads 
WHERE tenant_id = (
    SELECT t.id 
    FROM users u
    JOIN tenants t ON u.tenant_id = t.id
    WHERE u.email = 'maria@wfcirurgicos.com.br'
)
AND (
    name ILIKE '%teste%' OR
    name ILIKE '%fake%' OR
    name ILIKE '%dummy%' OR
    name ILIKE '%exemplo%' OR
    phone LIKE '1199999%' OR
    phone LIKE '1198888%' OR
    phone LIKE '1197777%' OR
    email ILIKE '%teste%' OR
    email ILIKE '%fake%' OR
    email ILIKE '%dummy%' OR
    email ILIKE '%exemplo%'
);

-- 3. Verificar se foram removidos
SELECT 
    'DADOS RESTANTES DA MARIA' as info,
    COUNT(l.id) as total_leads,
    COUNT(b.id) as total_orcamentos
FROM users u
JOIN tenants t ON u.tenant_id = t.id
LEFT JOIN leads l ON l.tenant_id = t.id
LEFT JOIN budgets b ON b.lead_id = l.id
WHERE u.email = 'maria@wfcirurgicos.com.br';
