-- ========================================
-- SISTEMA DE MÉTRICAS DIÁRIAS AUTOMÁTICO
-- ========================================
-- Este script implementa reset diário automático das vendas

-- PASSO 1: Criar função para calcular métricas do dia atual
CREATE OR REPLACE FUNCTION public.calculate_daily_metrics(target_date DATE DEFAULT CURRENT_DATE)
RETURNS TABLE(
    date DATE,
    total_sales NUMERIC,
    total_leads BIGINT,
    closed_leads BIGINT,
    avg_ticket NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        target_date as date,
        COALESCE(SUM(s.amount), 0) as total_sales,
        COUNT(l.id) as total_leads,
        COUNT(CASE WHEN l.status = 'closed' THEN 1 END) as closed_leads,
        COALESCE(AVG(s.amount), 0) as avg_ticket
    FROM 
        public.leads l
    LEFT JOIN 
        public.sales s ON l.id = s.lead_id
    WHERE 
        l.tenant_id = '8bd69047-7533-42f3-a2f7-e3a60477f68c'
        AND DATE(l.created_at) = target_date;
END;
$$ LANGUAGE plpgsql;

-- PASSO 2: Criar ou substituir tabela de métricas diárias
CREATE TABLE IF NOT EXISTS public.daily_sales_metrics (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    date DATE NOT NULL,
    tenant_id UUID NOT NULL,
    total_sales NUMERIC DEFAULT 0,
    total_leads BIGINT DEFAULT 0,
    closed_leads BIGINT DEFAULT 0,
    avg_ticket NUMERIC DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(date, tenant_id)
);

-- PASSO 3: Habilitar RLS na tabela
ALTER TABLE public.daily_sales_metrics ENABLE ROW LEVEL SECURITY;

-- PASSO 4: Criar política RLS
CREATE POLICY "daily_sales_metrics_tenant_policy" ON public.daily_sales_metrics
    FOR ALL USING (tenant_id = '8bd69047-7533-42f3-a2f7-e3a60477f68c');

-- PASSO 5: Função para atualizar métricas diárias automaticamente
CREATE OR REPLACE FUNCTION public.update_daily_metrics()
RETURNS void AS $$
DECLARE
    today_metrics RECORD;
BEGIN
    -- Calcular métricas de hoje
    SELECT * INTO today_metrics FROM public.calculate_daily_metrics(CURRENT_DATE);
    
    -- Inserir ou atualizar métricas de hoje
    INSERT INTO public.daily_sales_metrics (
        date, 
        tenant_id, 
        total_sales, 
        total_leads, 
        closed_leads, 
        avg_ticket
    ) VALUES (
        today_metrics.date,
        '8bd69047-7533-42f3-a2f7-e3a60477f68c',
        today_metrics.total_sales,
        today_metrics.total_leads,
        today_metrics.closed_leads,
        today_metrics.avg_ticket
    )
    ON CONFLICT (date, tenant_id) 
    DO UPDATE SET
        total_sales = EXCLUDED.total_sales,
        total_leads = EXCLUDED.total_leads,
        closed_leads = EXCLUDED.closed_leads,
        avg_ticket = EXCLUDED.avg_ticket,
        updated_at = NOW();
        
    RAISE NOTICE 'Métricas diárias atualizadas para %', CURRENT_DATE;
END;
$$ LANGUAGE plpgsql;

-- PASSO 6: Função para obter métricas de um dia específico
CREATE OR REPLACE FUNCTION public.get_daily_metrics(target_date DATE DEFAULT CURRENT_DATE)
RETURNS TABLE(
    date DATE,
    total_sales NUMERIC,
    total_leads BIGINT,
    closed_leads BIGINT,
    avg_ticket NUMERIC,
    is_today BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        dsm.date,
        dsm.total_sales,
        dsm.total_leads,
        dsm.closed_leads,
        dsm.avg_ticket,
        (dsm.date = CURRENT_DATE) as is_today
    FROM 
        public.daily_sales_metrics dsm
    WHERE 
        dsm.tenant_id = '8bd69047-7533-42f3-a2f7-e3a60477f68c'
        AND dsm.date = target_date;
END;
$$ LANGUAGE plpgsql;

-- PASSO 7: Executar primeira atualização
SELECT public.update_daily_metrics();

-- PASSO 8: Verificar resultado
SELECT 
    'METRICAS_DIARIAS_INICIAIS' as tipo,
    date,
    total_sales,
    total_leads,
    closed_leads,
    avg_ticket
FROM 
    public.daily_sales_metrics 
WHERE 
    tenant_id = '8bd69047-7533-42f3-a2f7-e3a60477f68c'
    AND date = CURRENT_DATE;
