-- ========================================
-- CORRIGIR INSERÇÃO NA TABELA SALES
-- ========================================
-- Execute este script no Supabase SQL Editor

-- PASSO 1: Verificar se há leads vendidos que não estão na tabela sales
SELECT 
    'LEADS_VENDIDOS_SEM_SALES' as tipo,
    l.id,
    l.name,
    l.email,
    l.phone,
    l.fields->>'sold' as sold_field,
    l.fields->>'sold_amount' as sold_amount_field,
    l.fields->>'budget_amount' as budget_amount_field,
    s.id as sales_id
FROM leads l
LEFT JOIN sales s ON s.lead_id = l.id
WHERE l.tenant_id = '8bd69047-7533-42f3-a2f7-e3a60477f68c'
AND (l.fields->>'sold' = 'true' OR l.fields->>'sold_amount' IS NOT NULL)
AND s.id IS NULL;

-- PASSO 2: Buscar estágios de fechamento
SELECT 
    'ESTAGIOS_FECHAMENTO' as tipo,
    id,
    name
FROM stages
WHERE tenant_id = '8bd69047-7533-42f3-a2f7-e3a60477f68c'
AND (name ILIKE '%fechado%' OR name ILIKE '%vendido%' OR name ILIKE '%ganho%' OR name ILIKE '%bolso%');

-- PASSO 3: Inserir vendas faltantes na tabela sales
WITH leads_vendidos AS (
    SELECT 
        l.id as lead_id,
        l.name as lead_name,
        l.email as lead_email,
        l.phone as lead_phone,
        l.fields->>'sold_amount' as sold_amount,
        l.fields->>'budget_amount' as budget_amount,
        l.stage_id,
        s.name as stage_name,
        l.assigned_to,
        l.created_at
    FROM leads l
    LEFT JOIN stages s ON l.stage_id = s.id
    LEFT JOIN sales sa ON sa.lead_id = l.id
    WHERE l.tenant_id = '8bd69047-7533-42f3-a2f7-e3a60477f68c'
    AND (l.fields->>'sold' = 'true' OR l.fields->>'sold_amount' IS NOT NULL)
    AND sa.id IS NULL
),
estagio_fechamento AS (
    SELECT id, name
    FROM stages
    WHERE tenant_id = '8bd69047-7533-42f3-a2f7-e3a60477f68c'
    AND (name ILIKE '%fechado%' OR name ILIKE '%vendido%' OR name ILIKE '%ganho%' OR name ILIKE '%bolso%')
    LIMIT 1
)
INSERT INTO sales (
    tenant_id,
    lead_id,
    amount,
    stage_id,
    stage_name,
    sold_by,
    sold_by_name,
    budget_description,
    budget_file_name,
    created_at
)
SELECT 
    '8bd69047-7533-42f3-a2f7-e3a60477f68c' as tenant_id,
    lv.lead_id,
    COALESCE(
        CAST(lv.sold_amount AS NUMERIC), 
        CAST(lv.budget_amount AS NUMERIC), 
        0
    ) as amount,
    COALESCE(lv.stage_id, ef.id) as stage_id,
    COALESCE(lv.stage_name, ef.name) as stage_name,
    lv.assigned_to as sold_by,
    COALESCE(lv.lead_name, 'Lead') as sold_by_name,
    'Venda recuperada automaticamente' as budget_description,
    'Orçamento enviado' as budget_file_name,
    lv.created_at
FROM leads_vendidos lv
CROSS JOIN estagio_fechamento ef;

-- PASSO 4: Verificar quantas vendas foram inseridas
SELECT 
    'VENDAS_INSERIDAS' as tipo,
    COUNT(*) as total_vendas_inseridas
FROM sales
WHERE budget_description = 'Venda recuperada automaticamente';

-- PASSO 5: Verificar total de vendas após correção
SELECT 
    'TOTAL_VENDAS_APOS_CORRECAO' as tipo,
    COUNT(*) as total_vendas,
    SUM(amount) as valor_total,
    MIN(created_at) as primeira_venda,
    MAX(created_at) as ultima_venda
FROM sales
WHERE tenant_id = '8bd69047-7533-42f3-a2f7-e3a60477f68c';

-- PASSO 6: Verificar se ainda há leads vendidos sem sales
SELECT 
    'LEADS_VENDIDOS_SEM_SALES_APOS' as tipo,
    COUNT(*) as leads_sem_sales
FROM leads l
LEFT JOIN sales s ON s.lead_id = l.id
WHERE l.tenant_id = '8bd69047-7533-42f3-a2f7-e3a60477f68c'
AND (l.fields->>'sold' = 'true' OR l.fields->>'sold_amount' IS NOT NULL)
AND s.id IS NULL;

-- PASSO 7: Verificar vendas por estágio
SELECT 
    'VENDAS_POR_ESTAGIO' as tipo,
    stage_name,
    COUNT(*) as total_vendas,
    SUM(amount) as valor_total
FROM sales
WHERE tenant_id = '8bd69047-7533-42f3-a2f7-e3a60477f68c'
GROUP BY stage_name
ORDER BY total_vendas DESC;

-- PASSO 8: Verificar vendas por vendedor
SELECT 
    'VENDAS_POR_VENDEDOR' as tipo,
    sold_by_name,
    COUNT(*) as total_vendas,
    SUM(amount) as valor_total
FROM sales
WHERE tenant_id = '8bd69047-7533-42f3-a2f7-e3a60477f68c'
GROUP BY sold_by_name
ORDER BY total_vendas DESC;
