-- =====================================================
-- VER DADOS REAIS - MOSTRAR OS DADOS ORIGINAIS
-- =====================================================
-- Script para mostrar os dados reais que existem

-- 1. Ver leads com nomes reais (não de exemplo)
SELECT 
    'DADOS REAIS ENCONTRADOS' as status,
    name,
    email,
    phone,
    origin,
    created_at,
    fields->>'sold' as vendido,
    fields->>'sold_amount' as valor_venda
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
ORDER BY created_at DESC;

-- 2. Ver leads com vendas reais
SELECT 
    'VENDAS REAIS ENCONTRADAS' as status,
    name,
    email,
    fields->>'sold_amount' as valor_venda,
    created_at
FROM leads 
WHERE fields->>'sold' = 'true'
    AND fields->>'sold_amount' IS NOT NULL
    AND CAST(fields->>'sold_amount' AS NUMERIC) > 0
ORDER BY CAST(fields->>'sold_amount' AS NUMERIC) DESC;

-- 3. Resumo dos dados reais
SELECT 
    'RESUMO DOS DADOS REAIS' as status,
    COUNT(*) as total_leads_reais,
    COUNT(CASE WHEN fields->>'sold' = 'true' THEN 1 END) as vendas_reais,
    SUM(CAST(fields->>'sold_amount' AS NUMERIC)) as total_vendas_reais,
    MIN(created_at) as lead_mais_antigo,
    MAX(created_at) as lead_mais_recente
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
