-- ========================================
-- DIAGNOSTICAR PROBLEMA DE VENDAS EM MÚLTIPLAS CONTAS
-- ========================================
-- Execute este script no Supabase SQL Editor

-- PASSO 1: Verificar quantas vendas existem no total
SELECT 
    'TOTAL_VENDAS_GERAL' as tipo,
    COUNT(*) as total_vendas,
    SUM(amount) as valor_total,
    MIN(created_at) as primeira_venda,
    MAX(created_at) as ultima_venda
FROM sales;

-- PASSO 2: Verificar vendas por tenant_id
SELECT 
    'VENDAS_POR_TENANT' as tipo,
    tenant_id,
    COUNT(*) as total_vendas,
    SUM(amount) as valor_total
FROM sales
GROUP BY tenant_id
ORDER BY total_vendas DESC;

-- PASSO 3: Verificar vendas por vendedor
SELECT 
    'VENDAS_POR_VENDEDOR' as tipo,
    sold_by_name,
    COUNT(*) as total_vendas,
    SUM(amount) as valor_total
FROM sales
GROUP BY sold_by_name
ORDER BY total_vendas DESC;

-- PASSO 4: Verificar leads vendidos que NÃO estão na tabela sales
SELECT 
    'LEADS_VENDIDOS_SEM_SALES' as tipo,
    l.id,
    l.name,
    l.email,
    l.phone,
    l.fields->>'sold' as sold_field,
    l.fields->>'sold_amount' as sold_amount_field,
    l.fields->>'budget_amount' as budget_amount_field,
    l.assigned_to,
    l.created_at,
    s.id as sales_id
FROM leads l
LEFT JOIN sales s ON s.lead_id = l.id
WHERE l.tenant_id = '8bd69047-7533-42f3-a2f7-e3a60477f68c'
AND (l.fields->>'sold' = 'true' OR l.fields->>'sold_amount' IS NOT NULL)
AND s.id IS NULL
ORDER BY l.created_at DESC;

-- PASSO 5: Verificar quantos leads vendidos existem no total
SELECT 
    'TOTAL_LEADS_VENDIDOS' as tipo,
    COUNT(*) as total_leads_vendidos,
    SUM(CAST(l.fields->>'sold_amount' AS NUMERIC)) as valor_total_sold_amount,
    SUM(CAST(l.fields->>'budget_amount' AS NUMERIC)) as valor_total_budget_amount
FROM leads l
WHERE l.tenant_id = '8bd69047-7533-42f3-a2f7-e3a60477f68c'
AND (l.fields->>'sold' = 'true' OR l.fields->>'sold_amount' IS NOT NULL);

-- PASSO 6: Verificar leads vendidos por agente
SELECT 
    'LEADS_VENDIDOS_POR_AGENTE' as tipo,
    l.assigned_to,
    COUNT(*) as total_leads_vendidos,
    SUM(CAST(l.fields->>'sold_amount' AS NUMERIC)) as valor_total
FROM leads l
WHERE l.tenant_id = '8bd69047-7533-42f3-a2f7-e3a60477f68c'
AND (l.fields->>'sold' = 'true' OR l.fields->>'sold_amount' IS NOT NULL)
GROUP BY l.assigned_to
ORDER BY total_leads_vendidos DESC;

-- PASSO 7: Verificar se há leads vendidos de outras contas
SELECT 
    'LEADS_VENDIDOS_OUTRAS_CONTAS' as tipo,
    l.tenant_id,
    COUNT(*) as total_leads_vendidos,
    SUM(CAST(l.fields->>'sold_amount' AS NUMERIC)) as valor_total
FROM leads l
WHERE l.fields->>'sold' = 'true' OR l.fields->>'sold_amount' IS NOT NULL
GROUP BY l.tenant_id
ORDER BY total_leads_vendidos DESC;

-- PASSO 8: Verificar se há vendas órfãs (sem lead correspondente)
SELECT 
    'VENDAS_ORFAS' as tipo,
    s.id,
    s.lead_id,
    s.amount,
    s.sold_by_name,
    s.created_at,
    l.id as lead_exists
FROM sales s
LEFT JOIN leads l ON l.id = s.lead_id
WHERE l.id IS NULL
ORDER BY s.created_at DESC;

-- PASSO 9: Verificar se há problemas de RLS na tabela sales
SELECT 
    'RLS_SALES_DEBUG' as tipo,
    schemaname,
    tablename,
    rowsecurity,
    hasrules
FROM pg_tables 
WHERE tablename = 'sales' 
AND schemaname = 'public';

-- PASSO 10: Verificar políticas RLS na tabela sales
SELECT 
    'POLITICAS_RLS_SALES' as tipo,
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'sales' 
AND schemaname = 'public';
