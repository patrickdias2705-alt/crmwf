-- ========================================
-- VERIFICAR MÉTRICAS DIÁRIAS DOS ÚLTIMOS 5 DIAS
-- ========================================
-- Este script verifica o conteúdo da tabela daily_sales_metrics
-- para garantir que as vendas diárias estão sendo registradas corretamente.

-- PASSO 1: Verificar métricas dos últimos 5 dias
SELECT
    'METRICAS_DIARIAS' as tipo,
    date,
    total_sales,
    total_leads,
    closed_leads,
    avg_ticket,
    created_at,
    updated_at
FROM
    public.daily_sales_metrics
WHERE
    tenant_id = '8bd69047-7533-42f3-a2f7-e3a60477f68c'
    AND date >= CURRENT_DATE - INTERVAL '5 days'
ORDER BY
    date DESC;

-- PASSO 2: Verificar se existem vendas para hoje na tabela sales
SELECT
    'VENDAS_HOJE_SALES' as tipo,
    COUNT(*) as quantidade_vendas,
    SUM(amount) as total_valor,
    AVG(amount) as ticket_medio
FROM
    public.sales s
JOIN public.leads l ON s.lead_id = l.id
WHERE
    s.tenant_id = '8bd69047-7533-42f3-a2f7-e3a60477f68c'
    AND DATE(l.created_at) = CURRENT_DATE;

-- PASSO 3: Verificar leads de hoje
SELECT
    'LEADS_HOJE' as tipo,
    COUNT(*) as total_leads,
    COUNT(CASE WHEN status = 'closed' THEN 1 END) as leads_fechados,
    SUM(CASE 
        WHEN status = 'closed' AND fields->>'sale_value' IS NOT NULL 
        THEN CAST(fields->>'sale_value' AS NUMERIC) 
        ELSE 0 
    END) as valor_vendas_fields
FROM
    public.leads
WHERE
    tenant_id = '8bd69047-7533-42f3-a2f7-e3a60477f68c'
    AND DATE(created_at) = CURRENT_DATE;

-- PASSO 4: Verificar se a função de métricas diárias existe
SELECT
    'FUNCAO_METRICAS' as tipo,
    proname as nome_funcao,
    prosrc as codigo_funcao
FROM
    pg_proc
WHERE
    proname = 'calculate_real_daily_metrics';

-- PASSO 5: Verificar se o trigger existe
SELECT
    'TRIGGER_VENDAS' as tipo,
    tgname as nome_trigger,
    relname as tabela,
    pg_get_triggerdef(t.oid) as definicao_trigger
FROM
    pg_trigger t
JOIN pg_class c ON t.tgrelid = c.oid
WHERE
    c.relname = 'sales' 
    AND tgname = 'trigger_update_daily_sales_metrics';
