-- =====================================================
-- VERIFICAR DADOS DA MARIA - LEADS E ORCAMENTOS
-- =====================================================

-- 1. Verificar TODOS os leads da Maria
SELECT 
    'LEADS DA MARIA' as info,
    l.id,
    l.name,
    l.phone,
    l.email,
    l.origin,
    l.status,
    l.created_at,
    l.fields
FROM users u
JOIN tenants t ON u.tenant_id = t.id
JOIN leads l ON l.tenant_id = t.id
WHERE u.email = 'maria@wfcirurgicos.com.br'
ORDER BY l.created_at DESC;

-- 2. Verificar TODOS os orçamentos da Maria
SELECT 
    'ORCAMENTOS DA MARIA' as info,
    b.id,
    b.lead_id,
    b.value as amount,
    b.status,
    b.created_at,
    l.name as lead_name,
    l.phone as lead_phone
FROM users u
JOIN tenants t ON u.tenant_id = t.id
JOIN leads l ON l.tenant_id = t.id
JOIN budgets b ON b.lead_id = l.id
WHERE u.email = 'maria@wfcirurgicos.com.br'
ORDER BY b.created_at DESC;

-- 3. Contar total de dados
SELECT 
    'CONTAGEM TOTAL' as info,
    COUNT(DISTINCT l.id) as total_leads,
    COUNT(DISTINCT b.id) as total_orcamentos
FROM users u
JOIN tenants t ON u.tenant_id = t.id
LEFT JOIN leads l ON l.tenant_id = t.id
LEFT JOIN budgets b ON b.lead_id = l.id
WHERE u.email = 'maria@wfcirurgicos.com.br';
