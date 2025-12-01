-- ========================================
-- CRIAR MÉTRICAS DOS ÚLTIMOS 5 DIAS
-- ========================================
-- Este script força a criação de métricas diárias para os últimos 5 dias
-- baseadas nas datas reais dos leads

-- PASSO 1: Limpar métricas existentes para os últimos 5 dias
DELETE FROM public.daily_sales_metrics 
WHERE tenant_id = '8bd69047-7533-42f3-a2f7-e3a60477f68c'
AND date >= CURRENT_DATE - INTERVAL '5 days';

-- PASSO 2: Criar função para calcular métricas de um dia específico
CREATE OR REPLACE FUNCTION public.calculate_specific_day_metrics(target_date DATE)
RETURNS VOID AS $$
DECLARE
    v_daily_sales NUMERIC;
    v_daily_leads BIGINT;
    v_daily_closed BIGINT;
    v_daily_avg_ticket NUMERIC;
BEGIN
    -- Calcular métricas para o dia específico
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
    AND DATE(l.created_at) = target_date;
    
    -- Inserir métricas para este dia
    INSERT INTO public.daily_sales_metrics (
        date, 
        tenant_id, 
        total_sales, 
        total_leads, 
        closed_leads, 
        avg_ticket
    ) VALUES (
        target_date,
        '8bd69047-7533-42f3-a2f7-e3a60477f68c',
        v_daily_sales,
        v_daily_leads,
        v_daily_closed,
        v_daily_avg_ticket
    );
    
    RAISE NOTICE 'Métricas criadas para %: % leads, % vendas, R$ %', target_date, v_daily_leads, v_daily_closed, v_daily_sales;
END;
$$ LANGUAGE plpgsql;

-- PASSO 3: Calcular métricas para os últimos 5 dias
DO $$
DECLARE
    v_date DATE;
    v_counter INTEGER := 0;
BEGIN
    -- Loop pelos últimos 5 dias
    FOR v_counter IN 0..4 LOOP
        v_date := CURRENT_DATE - v_counter;
        PERFORM public.calculate_specific_day_metrics(v_date);
    END LOOP;
    
    RAISE NOTICE 'Métricas dos últimos 5 dias criadas com sucesso!';
END $$;

-- PASSO 4: Verificar os resultados
SELECT
    'METRICAS_ULTIMOS_5_DIAS' as tipo,
    date,
    total_sales,
    total_leads,
    closed_leads,
    avg_ticket,
    CASE 
        WHEN date = CURRENT_DATE THEN 'HOJE'
        WHEN date = CURRENT_DATE - 1 THEN 'ONTEM'
        WHEN date = CURRENT_DATE - 2 THEN 'ANTEONTEM'
        ELSE 'HISTÓRICO'
    END as periodo
FROM
    public.daily_sales_metrics
WHERE
    tenant_id = '8bd69047-7533-42f3-a2f7-e3a60477f68c'
    AND date >= CURRENT_DATE - INTERVAL '5 days'
ORDER BY
    date DESC;

-- PASSO 5: Verificar total de vendas por período
SELECT
    'RESUMO_PERIODO' as tipo,
    'ULTIMOS_5_DIAS' as periodo,
    COUNT(*) as dias_com_dados,
    SUM(total_sales) as total_vendas,
    SUM(closed_leads) as total_vendas_quantidade,
    AVG(avg_ticket) as ticket_medio_geral
FROM
    public.daily_sales_metrics
WHERE
    tenant_id = '8bd69047-7533-42f3-a2f7-e3a60477f68c'
    AND date >= CURRENT_DATE - INTERVAL '5 days'
    AND total_sales > 0;
