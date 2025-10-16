-- ========================================
-- SINCRONIZAR DADOS PARA TODAS AS CONTAS
-- ========================================
-- Execute este script no Supabase SQL Editor

-- PASSO 1: Verificar dados atuais antes da sincronização
SELECT 
    'ANTES_SINCRONIZACAO' as tipo,
    'Tabela Sales' as fonte,
    COUNT(*) as total_registros,
    SUM(amount) as valor_total
FROM sales
WHERE tenant_id = '8bd69047-7533-42f3-a2f7-e3a60477f68c'

UNION ALL

SELECT 
    'ANTES_SINCRONIZACAO' as tipo,
    'Fields Leads' as fonte,
    COUNT(*) as total_registros,
    SUM(CAST(fields->>'sold_amount' AS NUMERIC)) as valor_total
FROM leads
WHERE tenant_id = '8bd69047-7533-42f3-a2f7-e3a60477f68c'
AND (fields->>'sold' = 'true' OR fields->>'sold_amount' IS NOT NULL);

-- PASSO 2: Limpar dados duplicados na tabela sales
-- Remover vendas duplicadas (manter apenas a mais recente)
WITH vendas_duplicadas AS (
    SELECT 
        lead_id,
        MAX(created_at) as ultima_venda
    FROM sales
    WHERE tenant_id = '8bd69047-7533-42f3-a2f7-e3a60477f68c'
    GROUP BY lead_id
    HAVING COUNT(*) > 1
)
DELETE FROM sales 
WHERE id IN (
    SELECT s.id
    FROM sales s
    JOIN vendas_duplicadas vd ON s.lead_id = vd.lead_id
    WHERE s.tenant_id = '8bd69047-7533-42f3-a2f7-e3a60477f68c'
    AND s.created_at < vd.ultima_venda
);

-- PASSO 3: Sincronizar fields dos leads com a tabela sales
-- Atualizar fields dos leads para refletir os dados da tabela sales
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

-- PASSO 4: Atualizar métricas diárias com dados corretos
-- Calcular vendas por dia
WITH vendas_por_dia AS (
    SELECT 
        DATE(created_at) as data,
        COUNT(*) as total_vendas,
        SUM(amount) as valor_total
    FROM sales
    WHERE tenant_id = '8bd69047-7533-42f3-a2f7-e3a60477f68c'
    GROUP BY DATE(created_at)
)
-- Atualizar ou inserir métricas diárias
INSERT INTO metrics_daily (
    tenant_id,
    date,
    total_revenue,
    closed,
    leads_in,
    created_at
)
SELECT 
    '8bd69047-7533-42f3-a2f7-e3a60477f68c',
    vpd.data,
    vpd.valor_total,
    vpd.total_vendas,
    0, -- leads_in será calculado separadamente
    NOW()
FROM vendas_por_dia vpd
ON CONFLICT (tenant_id, date) 
DO UPDATE SET
    total_revenue = EXCLUDED.total_revenue,
    closed = EXCLUDED.closed;

-- PASSO 5: Verificar dados após sincronização
SELECT 
    'APOS_SINCRONIZACAO' as tipo,
    'Tabela Sales' as fonte,
    COUNT(*) as total_registros,
    SUM(amount) as valor_total
FROM sales
WHERE tenant_id = '8bd69047-7533-42f3-a2f7-e3a60477f68c'

UNION ALL

SELECT 
    'APOS_SINCRONIZACAO' as tipo,
    'Fields Leads' as fonte,
    COUNT(*) as total_registros,
    SUM(CAST(fields->>'sold_amount' AS NUMERIC)) as valor_total
FROM leads
WHERE tenant_id = '8bd69047-7533-42f3-a2f7-e3a60477f68c'
AND (fields->>'sold' = 'true' OR fields->>'sold_amount' IS NOT NULL);

-- PASSO 6: Verificar vendas por vendedor após sincronização
SELECT 
    'VENDAS_POR_VENDEDOR_SINCRONIZADO' as tipo,
    sold_by_name,
    COUNT(*) as total_vendas,
    SUM(amount) as valor_total
FROM sales
WHERE tenant_id = '8bd69047-7533-42f3-a2f7-e3a60477f68c'
GROUP BY sold_by_name
ORDER BY total_vendas DESC;

-- PASSO 7: Verificar métricas diárias após sincronização
SELECT 
    'METRICAS_DIARIAS_SINCRONIZADAS' as tipo,
    COUNT(*) as total_registros,
    SUM(total_revenue) as valor_total_revenue,
    SUM(closed) as total_fechados
FROM metrics_daily
WHERE tenant_id = '8bd69047-7533-42f3-a2f7-e3a60477f68c';

-- PASSO 8: Verificar se ainda há diferenças
SELECT 
    'VERIFICACAO_FINAL' as tipo,
    CASE 
        WHEN (SELECT SUM(amount) FROM sales WHERE tenant_id = '8bd69047-7533-42f3-a2f7-e3a60477f68c') = 
             (SELECT SUM(CAST(fields->>'sold_amount' AS NUMERIC)) FROM leads WHERE tenant_id = '8bd69047-7533-42f3-a2f7-e3a60477f68c' AND (fields->>'sold' = 'true' OR fields->>'sold_amount' IS NOT NULL))
        THEN 'DADOS_SINCRONIZADOS'
        ELSE 'DADOS_DESINCRONIZADOS'
    END as status;
