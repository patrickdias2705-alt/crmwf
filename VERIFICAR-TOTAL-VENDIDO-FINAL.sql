-- ========================================
-- VERIFICAR TOTAL VENDIDO FINAL
-- ========================================
-- Este script verifica se o Total Vendido está correto para todos os usuários

-- PASSO 1: Verificar vendas na tabela 'sales' para o tenant unificado
SELECT 
    'VENDAS_TABELA_SALES' as tipo,
    COUNT(*) as total_vendas,
    SUM(amount) as total_receita,
    AVG(amount) as ticket_medio,
    MIN(created_at) as primeira_venda,
    MAX(created_at) as ultima_venda
FROM 
    public.sales 
WHERE 
    tenant_id = '8bd69047-7533-42f3-a2f7-e3a60477f68c';

-- PASSO 2: Verificar vendas em leads.fields para o tenant unificado
SELECT 
    'VENDAS_LEADS_FIELDS' as tipo,
    COUNT(*) as total_leads_fechados,
    SUM(CAST(fields->>'sale_value' AS NUMERIC)) as total_receita_fields,
    AVG(CAST(fields->>'sale_value' AS NUMERIC)) as ticket_medio_fields
FROM 
    public.leads 
WHERE 
    tenant_id = '8bd69047-7533-42f3-a2f7-e3a60477f68c'
    AND status = 'closed'
    AND fields->>'sale_value' IS NOT NULL
    AND fields->>'sale_value' != '0'
    AND fields->>'sale_value' != '';

-- PASSO 3: Verificar leads fechados sem valor de venda (problemas)
SELECT 
    'LEADS_FECHADOS_SEM_VALOR' as tipo,
    COUNT(*) as total_leads_sem_valor,
    array_agg(name) as nomes_leads
FROM 
    public.leads 
WHERE 
    tenant_id = '8bd69047-7533-42f3-a2f7-e3a60477f68c'
    AND status = 'closed'
    AND (fields->>'sale_value' IS NULL OR fields->>'sale_value' = '0' OR fields->>'sale_value' = '');

-- PASSO 4: Verificar métricas diárias
SELECT 
    'METRICAS_DIARIAS' as tipo,
    COUNT(*) as total_dias,
    SUM(total_sold) as total_vendido_metrics,
    AVG(avg_ticket) as ticket_medio_metrics
FROM 
    public.metrics_daily 
WHERE 
    tenant_id = '8bd69047-7533-42f3-a2f7-e3a60477f68c';

-- PASSO 5: Comparar totais (deve ser igual)
SELECT 
    'COMPARACAO_FINAL' as tipo,
    'TOTAL_SALES_TABLE' as fonte,
    SUM(amount) as valor_total
FROM 
    public.sales 
WHERE 
    tenant_id = '8bd69047-7533-42f3-a2f7-e3a60477f68c'

UNION ALL

SELECT 
    'COMPARACAO_FINAL' as tipo,
    'TOTAL_LEADS_FIELDS' as fonte,
    SUM(CAST(fields->>'sale_value' AS NUMERIC)) as valor_total
FROM 
    public.leads 
WHERE 
    tenant_id = '8bd69047-7533-42f3-a2f7-e3a60477f68c'
    AND status = 'closed'
    AND fields->>'sale_value' IS NOT NULL
    AND fields->>'sale_value' != '0'
    AND fields->>'sale_value' != '';

-- PASSO 6: Verificar se há inconsistências
SELECT 
    'INCONSISTENCIAS' as tipo,
    l.id as lead_id,
    l.name as lead_name,
    l.status,
    l.fields->>'sale_value' as valor_no_fields,
    s.amount as valor_na_sales_table,
    CASE 
        WHEN s.id IS NULL THEN 'FALTA_NA_SALES'
        WHEN l.fields->>'sale_value' IS NULL THEN 'FALTA_NO_FIELDS'
        WHEN CAST(l.fields->>'sale_value' AS NUMERIC) != s.amount THEN 'VALORES_DIFERENTES'
        ELSE 'OK'
    END as status_inconsistencia
FROM 
    public.leads l
LEFT JOIN 
    public.sales s ON l.id = s.lead_id
WHERE 
    l.tenant_id = '8bd69047-7533-42f3-a2f7-e3a60477f68c'
    AND l.status = 'closed'
    AND (
        s.id IS NULL 
        OR l.fields->>'sale_value' IS NULL 
        OR CAST(l.fields->>'sale_value' AS NUMERIC) != s.amount
    );
