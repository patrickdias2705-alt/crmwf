-- ========================================
-- SINCRONIZAÇÃO SIMPLES DOS DADOS
-- ========================================
-- Execute este script no Supabase SQL Editor

-- PASSO 1: Verificar diferença atual
SELECT 
    'DIFERENCA_ATUAL' as tipo,
    'Tabela Sales' as fonte,
    SUM(amount) as valor_total
FROM sales
WHERE tenant_id = '8bd69047-7533-42f3-a2f7-e3a60477f68c'

UNION ALL

SELECT 
    'DIFERENCA_ATUAL' as tipo,
    'Fields Leads' as fonte,
    SUM(CAST(fields->>'sold_amount' AS NUMERIC)) as valor_total
FROM leads
WHERE tenant_id = '8bd69047-7533-42f3-a2f7-e3a60477f68c'
AND (fields->>'sold' = 'true' OR fields->>'sold_amount' IS NOT NULL);

-- PASSO 2: Sincronizar fields dos leads com a tabela sales
-- Atualizar todos os leads que têm vendas na tabela sales
UPDATE leads 
SET fields = jsonb_set(
    COALESCE(fields, '{}'::jsonb),
    '{sold_amount}',
    to_jsonb(s.amount)
)
FROM sales s
WHERE leads.id = s.lead_id
AND leads.tenant_id = '8bd69047-7533-42f3-a2f7-e3a60477f68c'
AND s.tenant_id = '8bd69047-7533-42f3-a2f7-e3a60477f68c';

-- PASSO 3: Marcar leads como vendidos se estão na tabela sales
UPDATE leads 
SET fields = jsonb_set(
    COALESCE(fields, '{}'::jsonb),
    '{sold}',
    'true'::jsonb
)
FROM sales s
WHERE leads.id = s.lead_id
AND leads.tenant_id = '8bd69047-7533-42f3-a2f7-e3a60477f68c'
AND s.tenant_id = '8bd69047-7533-42f3-a2f7-e3a60477f68c';

-- PASSO 4: Verificar se a sincronização funcionou
SELECT 
    'APOS_SINCRONIZACAO' as tipo,
    'Tabela Sales' as fonte,
    SUM(amount) as valor_total
FROM sales
WHERE tenant_id = '8bd69047-7533-42f3-a2f7-e3a60477f68c'

UNION ALL

SELECT 
    'APOS_SINCRONIZACAO' as tipo,
    'Fields Leads' as fonte,
    SUM(CAST(fields->>'sold_amount' AS NUMERIC)) as valor_total
FROM leads
WHERE tenant_id = '8bd69047-7533-42f3-a2f7-e3a60477f68c'
AND (fields->>'sold' = 'true' OR fields->>'sold_amount' IS NOT NULL);

-- PASSO 5: Verificar quantos leads foram sincronizados
SELECT 
    'LEADS_SINCRONIZADOS' as tipo,
    COUNT(*) as total_leads_sincronizados
FROM leads l
JOIN sales s ON l.id = s.lead_id
WHERE l.tenant_id = '8bd69047-7533-42f3-a2f7-e3a60477f68c'
AND s.tenant_id = '8bd69047-7533-42f3-a2f7-e3a60477f68c';

-- PASSO 6: Verificar se ainda há diferenças
SELECT 
    'VERIFICACAO_FINAL' as tipo,
    CASE 
        WHEN (SELECT SUM(amount) FROM sales WHERE tenant_id = '8bd69047-7533-42f3-a2f7-e3a60477f68c') = 
             (SELECT SUM(CAST(fields->>'sold_amount' AS NUMERIC)) FROM leads WHERE tenant_id = '8bd69047-7533-42f3-a2f7-e3a60477f68c' AND (fields->>'sold' = 'true' OR fields->>'sold_amount' IS NOT NULL))
        THEN 'DADOS_SINCRONIZADOS'
        ELSE 'DADOS_DESINCRONIZADOS'
    END as status,
    (SELECT SUM(amount) FROM sales WHERE tenant_id = '8bd69047-7533-42f3-a2f7-e3a60477f68c') as valor_sales,
    (SELECT SUM(CAST(fields->>'sold_amount' AS NUMERIC)) FROM leads WHERE tenant_id = '8bd69047-7533-42f3-a2f7-e3a60477f68c' AND (fields->>'sold' = 'true' OR fields->>'sold_amount' IS NOT NULL)) as valor_fields;
