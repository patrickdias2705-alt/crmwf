-- ========================================
-- VERIFICAR DADOS QUE O USUÁRIO MENCIONOU
-- ========================================
-- Execute este script no Supabase SQL Editor
-- Usuário mencionou:
-- 07/10: 1 lead sem venda
-- 10/10: 13 leads, 7 vendas
-- 13/10: 9 leads, 8 vendas
-- 14/10: 2 leads, 2 vendas
-- 15/10: 11 leads, 11 vendas

-- Verificar TODOS os leads de outubro de 2024
SELECT 
    'OUTUBRO_2024' as tipo,
    DATE(created_at) as data,
    COUNT(*) as total_leads,
    COUNT(CASE WHEN status = 'closed' THEN 1 END) as leads_fechados,
    COUNT(CASE WHEN fields->>'sold' = 'true' THEN 1 END) as leads_vendidos,
    STRING_AGG(name, ', ') as nomes_leads
FROM leads
WHERE tenant_id = '8bd69047-7533-42f3-a2f7-e3a60477f68c'
AND created_at >= '2024-10-01'
AND created_at < '2024-11-01'
GROUP BY DATE(created_at)
ORDER BY data;

-- Verificar se os dados são de 2025
SELECT 
    'DADOS_2025' as tipo,
    DATE(created_at) as data,
    COUNT(*) as total_leads,
    COUNT(CASE WHEN status = 'closed' THEN 1 END) as leads_fechados,
    COUNT(CASE WHEN fields->>'sold' = 'true' THEN 1 END) as leads_vendidos
FROM leads
WHERE tenant_id = '8bd69047-7533-42f3-a2f7-e3a60477f68c'
AND created_at >= '2025-01-01'
GROUP BY DATE(created_at)
ORDER BY data;

-- Verificar o total de leads no banco
SELECT 
    'TOTAL_GERAL' as tipo,
    COUNT(*) as total_leads,
    MIN(DATE(created_at)) as primeira_data,
    MAX(DATE(created_at)) as ultima_data
FROM leads
WHERE tenant_id = '8bd69047-7533-42f3-a2f7-e3a60477f68c';

-- Listar TODOS os leads para entender a distribuição
SELECT 
    'DISTRIBUICAO_POR_DIA' as tipo,
    DATE(created_at) as data,
    COUNT(*) as quantidade
FROM leads
WHERE tenant_id = '8bd69047-7533-42f3-a2f7-e3a60477f68c'
GROUP BY DATE(created_at)
ORDER BY data DESC;

