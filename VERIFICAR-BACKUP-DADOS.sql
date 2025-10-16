-- =====================================================
-- VERIFICAR SE HAVIA DADOS REAIS ANTES
-- =====================================================
-- Script para verificar se existiam dados reais antes

-- 1. Verificar se existem leads com emails reais (não de exemplo)
SELECT 
    'LEADS COM EMAILS REAIS' as tipo,
    COUNT(*) as total_leads
FROM leads 
WHERE email NOT LIKE '%@email.com'
    AND email NOT LIKE '%@example.com'
    AND email IS NOT NULL
    AND email != '';

-- 2. Verificar se existem leads com nomes reais (não de exemplo)
SELECT 
    'LEADS COM NOMES REAIS' as tipo,
    COUNT(*) as total_leads
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
    AND name != '';

-- 3. Verificar se existem leads com vendas reais
SELECT 
    'LEADS COM VENDAS REAIS' as tipo,
    COUNT(*) as total_leads,
    SUM(CAST(fields->>'sold_amount' AS NUMERIC)) as total_vendas
FROM leads 
WHERE fields->>'sold' = 'true'
    AND fields->>'sold_amount' IS NOT NULL
    AND CAST(fields->>'sold_amount' AS NUMERIC) > 0;

-- 4. Verificar se existem leads com telefones reais (não de exemplo)
SELECT 
    'LEADS COM TELEFONES REAIS' as tipo,
    COUNT(*) as total_leads
FROM leads 
WHERE phone NOT LIKE '119999999%'
    AND phone IS NOT NULL
    AND phone != '';

-- 5. Verificar se existem leads com datas muito antigas (antes de hoje)
SELECT 
    'LEADS ANTIGOS' as tipo,
    COUNT(*) as total_leads,
    MIN(created_at) as lead_mais_antigo
FROM leads 
WHERE created_at < NOW() - INTERVAL '1 day';

-- 6. Verificar se existem leads com origens reais (não as que inserimos)
SELECT 
    'LEADS COM ORIGENS REAIS' as tipo,
    origin,
    COUNT(*) as total_leads
FROM leads 
WHERE origin NOT IN ('meta_ads', 'instagram', 'site', 'facebook')
GROUP BY origin
ORDER BY total_leads DESC;
