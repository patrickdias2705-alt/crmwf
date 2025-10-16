-- =====================================================
-- VERIFICAR DADOS ORIGINAIS - CONFIRMAR QUE NÃO FORAM APAGADOS
-- =====================================================
-- Script para verificar se os dados originais ainda existem

-- 1. Verificar TODOS os leads (incluindo os originais)
SELECT 
    'TODOS OS LEADS' as tipo,
    COUNT(*) as total_leads,
    MIN(created_at) as lead_mais_antigo,
    MAX(created_at) as lead_mais_recente
FROM leads 
WHERE tenant_id = '8bd69047-7533-42f3-a2f7-e3a60477f68c';

-- 2. Verificar leads originais (antes de hoje)
SELECT 
    'LEADS ORIGINAIS' as tipo,
    COUNT(*) as total_leads,
    COUNT(CASE WHEN fields->>'sold' = 'true' THEN 1 END) as vendidos,
    SUM(CAST(fields->>'sold_amount' AS NUMERIC)) as total_vendas
FROM leads 
WHERE tenant_id = '8bd69047-7533-42f3-a2f7-e3a60477f68c'
    AND created_at < NOW() - INTERVAL '1 day';

-- 3. Verificar leads de hoje (que podem ser os novos)
SELECT 
    'LEADS DE HOJE' as tipo,
    COUNT(*) as total_leads,
    COUNT(CASE WHEN fields->>'sold' = 'true' THEN 1 END) as vendidos,
    SUM(CAST(fields->>'sold_amount' AS NUMERIC)) as total_vendas
FROM leads 
WHERE tenant_id = '8bd69047-7533-42f3-a2f7-e3a60477f68c'
    AND created_at >= NOW() - INTERVAL '1 day';

-- 4. Verificar leads por data (últimos 30 dias)
SELECT 
    DATE(created_at) as data,
    COUNT(*) as leads_por_dia,
    COUNT(CASE WHEN fields->>'sold' = 'true' THEN 1 END) as vendidos_por_dia,
    SUM(CAST(fields->>'sold_amount' AS NUMERIC)) as vendas_por_dia
FROM leads 
WHERE tenant_id = '8bd69047-7533-42f3-a2f7-e3a60477f68c'
    AND created_at >= NOW() - INTERVAL '30 days'
GROUP BY DATE(created_at)
ORDER BY data DESC;

-- 5. Verificar se existem leads com nomes reais (não os de exemplo)
SELECT 
    'LEADS COM NOMES REAIS' as tipo,
    COUNT(*) as total_leads
FROM leads 
WHERE tenant_id = '8bd69047-7533-42f3-a2f7-e3a60477f68c'
    AND name NOT LIKE 'João Silva'
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
    AND name NOT LIKE 'Vanessa Rocha';

-- 6. Verificar leads com emails reais (não os de exemplo)
SELECT 
    'LEADS COM EMAILS REAIS' as tipo,
    COUNT(*) as total_leads
FROM leads 
WHERE tenant_id = '8bd69047-7533-42f3-a2f7-e3a60477f68c'
    AND email NOT LIKE '%@email.com'
    AND email NOT LIKE '%@example.com';
