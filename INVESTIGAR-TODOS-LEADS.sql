-- =====================================================
-- INVESTIGAR TODOS OS LEADS - ENCONTRAR DADOS REAIS
-- =====================================================
-- Script para investigar onde estão os dados reais

-- 1. Verificar TODOS os leads (todos os tenant_ids)
SELECT 
    'TODOS OS LEADS' as tipo,
    COUNT(*) as total_leads,
    COUNT(DISTINCT tenant_id) as total_tenants
FROM leads;

-- 2. Verificar leads por tenant_id
SELECT 
    tenant_id,
    COUNT(*) as total_leads,
    MIN(created_at) as lead_mais_antigo,
    MAX(created_at) as lead_mais_recente
FROM leads 
GROUP BY tenant_id
ORDER BY total_leads DESC;

-- 3. Verificar leads com emails reais (todos os tenant_ids)
SELECT 
    tenant_id,
    COUNT(*) as leads_com_emails_reais
FROM leads 
WHERE email NOT LIKE '%@email.com'
    AND email NOT LIKE '%@example.com'
    AND email IS NOT NULL
    AND email != ''
GROUP BY tenant_id
ORDER BY leads_com_emails_reais DESC;

-- 4. Verificar leads com nomes reais (todos os tenant_ids)
SELECT 
    tenant_id,
    COUNT(*) as leads_com_nomes_reais
FROM leads 
WHERE name NOT LIKE 'João Silva'
    AND name NOT LIKE 'Maria Santos'
    AND name NOT LIKE 'Pedro Costa'
    AND name NOT LIKE 'Ana Oliveira'
    AND name NOT LIKE 'Carlos Lima'
    AND name NOT LIKE 'Lucia Ferreira'
    AND name NOT LIKE 'Roberto Alves'
    AND name NOT LIKE 'Fernanda Rocha'
    AND name NOT LIKE 'Marcos Pereira'
    AND name NOT LIKE 'Juliana Souza'
    AND name NOT LIKE 'Rafael Mendes'
    AND name NOT LIKE 'Patricia Gomes'
    AND name NOT LIKE 'Diego Santos'
    AND name NOT LIKE 'Camila Lima'
    AND name NOT LIKE 'Bruno Costa'
    AND name NOT LIKE 'Larissa Silva'
    AND name NOT LIKE 'Thiago Oliveira'
    AND name NOT LIKE 'Vanessa Rocha'
    AND name IS NOT NULL
    AND name != ''
GROUP BY tenant_id
ORDER BY leads_com_nomes_reais DESC;

-- 5. Verificar leads com vendas reais (todos os tenant_ids)
SELECT 
    tenant_id,
    COUNT(*) as leads_vendidos,
    SUM(CAST(fields->>'sold_amount' AS NUMERIC)) as total_vendas
FROM leads 
WHERE fields->>'sold' = 'true'
    AND fields->>'sold_amount' IS NOT NULL
    AND CAST(fields->>'sold_amount' AS NUMERIC) > 0
GROUP BY tenant_id
ORDER BY total_vendas DESC;

-- 6. Verificar se existem leads com tenant_id NULL
SELECT 
    'LEADS COM TENANT_ID NULL' as tipo,
    COUNT(*) as total_leads
FROM leads 
WHERE tenant_id IS NULL;

-- 7. Verificar leads mais antigos (últimos 30 dias)
SELECT 
    tenant_id,
    DATE(created_at) as data,
    COUNT(*) as leads_por_dia
FROM leads 
WHERE created_at >= NOW() - INTERVAL '30 days'
GROUP BY tenant_id, DATE(created_at)
ORDER BY data DESC, leads_por_dia DESC;
