-- ========================================
-- CORRIGIR MÉTRICAS DIÁRIAS BASEADAS EM DATAS REAIS
-- ========================================
-- Este script analisa as datas reais dos leads e cria métricas diárias
-- corretas para cada dia, desde o primeiro lead cadastrado

-- PASSO 1: Limpar dados existentes da tabela daily_sales_metrics
DELETE FROM public.daily_sales_metrics 
WHERE tenant_id = '8bd69047-7533-42f3-a2f7-e3a60477f68c';

-- PASSO 2: Criar função para calcular métricas diárias baseadas em datas reais
CREATE OR REPLACE FUNCTION public.calculate_real_daily_metrics()
RETURNS VOID AS $$
DECLARE
    v_date DATE;
    v_start_date DATE;
    v_end_date DATE;
    v_daily_sales NUMERIC;
    v_daily_leads BIGINT;
    v_daily_closed BIGINT;
    v_daily_avg_ticket NUMERIC;
BEGIN
    -- Encontrar o primeiro e último lead
    SELECT 
        DATE(MIN(created_at)) as start_date,
        DATE(MAX(created_at)) as end_date
    INTO v_start_date, v_end_date
    FROM public.leads
    WHERE tenant_id = '8bd69047-7533-42f3-a2f7-e3a60477f68c';
    
    RAISE NOTICE 'Calculando métricas de % até %', v_start_date, v_end_date;
    
    -- Loop através de cada dia
    v_date := v_start_date;
    
    WHILE v_date <= v_end_date LOOP
        -- Calcular métricas para este dia específico
        SELECT 
            COALESCE(SUM(CASE 
                WHEN l.status = 'closed' AND s.amount IS NOT NULL 
                THEN s.amount 
                ELSE 0 
            END), 0) as daily_sales,
            COUNT(l.id) as daily_leads,
            COUNT(CASE WHEN l.status = 'closed' THEN 1 END) as daily_closed,
            COALESCE(AVG(CASE 
                WHEN l.status = 'closed' AND s.amount IS NOT NULL 
                THEN s.amount 
            END), 0) as daily_avg_ticket
        INTO v_daily_sales, v_daily_leads, v_daily_closed, v_daily_avg_ticket
        FROM public.leads l
        LEFT JOIN public.sales s ON l.id = s.lead_id
        WHERE l.tenant_id = '8bd69047-7533-42f3-a2f7-e3a60477f68c'
        AND DATE(l.created_at) = v_date;
        
        -- Inserir métricas para este dia
        INSERT INTO public.daily_sales_metrics (
            date, 
            tenant_id, 
            total_sales, 
            total_leads, 
            closed_leads, 
            avg_ticket
        ) VALUES (
            v_date,
            '8bd69047-7533-42f3-a2f7-e3a60477f68c',
            v_daily_sales,
            v_daily_leads,
            v_daily_closed,
            v_daily_avg_ticket
        );
        
        RAISE NOTICE 'Dia %: % leads, % vendas, R$ %', v_date, v_daily_leads, v_daily_closed, v_daily_sales;
        
        -- Próximo dia
        v_date := v_date + INTERVAL '1 day';
    END LOOP;
    
    RAISE NOTICE 'Métricas diárias reais calculadas com sucesso!';
END;
$$ LANGUAGE plpgsql;

-- PASSO 3: Executar o cálculo das métricas reais
SELECT public.calculate_real_daily_metrics();

-- PASSO 4: Verificar os resultados - mostrar últimos 10 dias
SELECT 
    'METRICAS_DIARIAS_REAIS' as tipo,
    date,
    total_sales,
    total_leads,
    closed_leads,
    avg_ticket,
    CASE 
        WHEN date = CURRENT_DATE THEN 'HOJE'
        WHEN date = CURRENT_DATE - 1 THEN 'ONTEM'
        ELSE 'HISTÓRICO'
    END as periodo
FROM public.daily_sales_metrics
WHERE tenant_id = '8bd69047-7533-42f3-a2f7-e3a60477f68c'
ORDER BY date DESC
LIMIT 10;

-- PASSO 5: Verificar vendas totais por período
SELECT 
    'RESUMO_VENDAS' as tipo,
    'HOJE' as periodo,
    total_sales as valor
FROM public.daily_sales_metrics
WHERE tenant_id = '8bd69047-7533-42f3-a2f7-e3a60477f68c'
AND date = CURRENT_DATE

UNION ALL

SELECT 
    'RESUMO_VENDAS' as tipo,
    'ONTEM' as periodo,
    total_sales as valor
FROM public.daily_sales_metrics
WHERE tenant_id = '8bd69047-7533-42f3-a2f7-e3a60477f68c'
AND date = CURRENT_DATE - 1

UNION ALL

SELECT 
    'RESUMO_VENDAS' as tipo,
    'TOTAL_HISTORICO' as periodo,
    SUM(total_sales) as valor
FROM public.daily_sales_metrics
WHERE tenant_id = '8bd69047-7533-42f3-a2f7-e3a60477f68c';

-- PASSO 6: Verificar se as vendas de hoje estão corretas
SELECT 
    'VERIFICACAO_HOJE' as tipo,
    'VENDAS_LEADS_HOJE' as fonte,
    COUNT(*) as quantidade,
    SUM(CAST(fields->>'sale_value' AS NUMERIC)) as total_valor
FROM public.leads
WHERE tenant_id = '8bd69047-7533-42f3-a2f7-e3a60477f68c'
AND DATE(created_at) = CURRENT_DATE
AND status = 'closed'
AND fields->>'sale_value' IS NOT NULL

UNION ALL

SELECT 
    'VERIFICACAO_HOJE' as tipo,
    'VENDAS_TABELA_SALES_HOJE' as fonte,
    COUNT(*) as quantidade,
    SUM(amount) as total_valor
FROM public.sales s
JOIN public.leads l ON s.lead_id = l.id
WHERE s.tenant_id = '8bd69047-7533-42f3-a2f7-e3a60477f68c'
AND DATE(l.created_at) = CURRENT_DATE;
