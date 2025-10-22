-- =====================================================
-- VERIFICAR DADOS FALSOS DA MARIA
-- =====================================================

-- 1. Verificar leads da Maria (Varejo)
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

-- 2. Verificar orçamentos da Maria
SELECT 
    'ORCAMENTOS DA MARIA' as info,
    b.id,
    b.lead_id,
    b.amount,
    b.status,
    b.created_at,
    l.name as lead_name
FROM users u
JOIN tenants t ON u.tenant_id = t.id
JOIN leads l ON l.tenant_id = t.id
JOIN budgets b ON b.lead_id = l.id
WHERE u.email = 'maria@wfcirurgicos.com.br'
ORDER BY b.created_at DESC;
