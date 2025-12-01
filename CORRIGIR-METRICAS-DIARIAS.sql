-- ========================================
-- CORRIGIR MÉTRICAS DIÁRIAS - ZERAR A CADA DIA
-- ========================================
-- Execute este script no Supabase SQL Editor

-- PASSO 1: Verificar métricas diárias atuais
SELECT 
    date,
    tenant_id,
    total_leads,
    total_sold,
    avg_ticket,
    leads_in,
    closed
FROM 
    public.metrics_daily
ORDER BY 
    date DESC, tenant_id
LIMIT 20;

-- PASSO 2: Criar função para recalcular métricas diárias corretamente
CREATE OR REPLACE FUNCTION recalculate_daily_metrics()
RETURNS void AS $$
DECLARE
    rec RECORD;
    start_date DATE;
    end_date DATE;
    daily_sales NUMERIC;
    daily_leads INTEGER;
    daily_closed INTEGER;
    daily_avg_ticket NUMERIC;
BEGIN
    -- Limpar métricas diárias existentes
    DELETE FROM public.metrics_daily;
    
    -- Para cada tenant_id, recalcular métricas diárias
    FOR rec IN 
        SELECT DISTINCT tenant_id 
        FROM public.leads 
        WHERE tenant_id IS NOT NULL
    LOOP
        -- Encontrar o período de dados
        SELECT 
            MIN(created_at::DATE) as min_date,
            MAX(created_at::DATE) as max_date
        INTO start_date, end_date
        FROM public.leads 
        WHERE tenant_id = rec.tenant_id;
        
        -- Se não há dados, pular
        IF start_date IS NULL THEN
            CONTINUE;
        END IF;
        
        -- Para cada dia no período
        WHILE start_date <= end_date LOOP
            -- Calcular vendas do dia específico
            SELECT 
                COALESCE(SUM(amount), 0),
                COALESCE(AVG(amount), 0)
            INTO daily_sales, daily_avg_ticket
            FROM public.sales 
            WHERE tenant_id = rec.tenant_id 
            AND created_at::DATE = start_date;
            
            -- Calcular leads do dia específico
            SELECT 
                COUNT(*),
                COUNT(CASE WHEN status = 'closed' THEN 1 END)
            INTO daily_leads, daily_closed
            FROM public.leads 
            WHERE tenant_id = rec.tenant_id 
            AND created_at::DATE = start_date;
            
            -- Inserir métrica do dia
            INSERT INTO public.metrics_daily (
                date,
                tenant_id,
                total_leads,
                total_sold,
                avg_ticket,
                leads_in,
                closed
            ) VALUES (
                start_date,
                rec.tenant_id,
                daily_leads,
                daily_sales,
                daily_avg_ticket,
                daily_leads,
                daily_closed
            );
            
            -- Próximo dia
            start_date := start_date + INTERVAL '1 day';
        END LOOP;
    END LOOP;
    
    RAISE NOTICE 'Métricas diárias recalculadas com sucesso!';
END;
$$ LANGUAGE plpgsql;

-- PASSO 3: Executar a função para recalcular
SELECT recalculate_daily_metrics();

-- PASSO 4: Verificar o resultado
SELECT 
    date,
    tenant_id,
    total_leads,
    total_sold,
    avg_ticket,
    leads_in,
    closed
FROM 
    public.metrics_daily
ORDER BY 
    date DESC, tenant_id
LIMIT 20;

-- PASSO 5: Criar trigger para atualizar métricas diárias automaticamente
CREATE OR REPLACE FUNCTION update_daily_metrics_on_change()
RETURNS TRIGGER AS $$
DECLARE
    target_date DATE;
    daily_sales NUMERIC;
    daily_leads INTEGER;
    daily_closed INTEGER;
    daily_avg_ticket NUMERIC;
BEGIN
    -- Determinar a data do evento
    IF TG_OP = 'DELETE' THEN
        target_date := OLD.created_at::DATE;
    ELSE
        target_date := NEW.created_at::DATE;
    END IF;
    
    -- Recalcular métricas para a data específica
    SELECT 
        COALESCE(SUM(amount), 0),
        COALESCE(AVG(amount), 0)
    INTO daily_sales, daily_avg_ticket
    FROM public.sales 
    WHERE tenant_id = COALESCE(NEW.tenant_id, OLD.tenant_id)
    AND created_at::DATE = target_date;
    
    SELECT 
        COUNT(*),
        COUNT(CASE WHEN status = 'closed' THEN 1 END)
    INTO daily_leads, daily_closed
    FROM public.leads 
    WHERE tenant_id = COALESCE(NEW.tenant_id, OLD.tenant_id)
    AND created_at::DATE = target_date;
    
    -- Atualizar ou inserir métrica do dia
    INSERT INTO public.metrics_daily (
        date,
        tenant_id,
        total_leads,
        total_sold,
        avg_ticket,
        leads_in,
        closed
    ) VALUES (
        target_date,
        COALESCE(NEW.tenant_id, OLD.tenant_id),
        daily_leads,
        daily_sales,
        daily_avg_ticket,
        daily_leads,
        daily_closed
    )
    ON CONFLICT (date, tenant_id) 
    DO UPDATE SET
        total_leads = EXCLUDED.total_leads,
        total_sold = EXCLUDED.total_sold,
        avg_ticket = EXCLUDED.avg_ticket,
        leads_in = EXCLUDED.leads_in,
        closed = EXCLUDED.closed;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- PASSO 6: Aplicar triggers
DROP TRIGGER IF EXISTS trigger_update_daily_metrics_sales ON public.sales;
CREATE TRIGGER trigger_update_daily_metrics_sales
    AFTER INSERT OR UPDATE OR DELETE ON public.sales
    FOR EACH ROW
    EXECUTE FUNCTION update_daily_metrics_on_change();

DROP TRIGGER IF EXISTS trigger_update_daily_metrics_leads ON public.leads;
CREATE TRIGGER trigger_update_daily_metrics_leads
    AFTER INSERT OR UPDATE OR DELETE ON public.leads
    FOR EACH ROW
    EXECUTE FUNCTION update_daily_metrics_on_change();

-- PASSO 7: Verificar métricas do dia atual
SELECT 
    date,
    tenant_id,
    total_leads,
    total_sold,
    avg_ticket
FROM 
    public.metrics_daily
WHERE 
    date = CURRENT_DATE
ORDER BY 
    tenant_id;

-- ========================================
-- INSTRUÇÕES:
-- ========================================
-- 1. Execute TODOS os passos em sequência
-- 2. As métricas diárias agora zeram a cada dia
-- 3. Cada dia mostra apenas as vendas daquele dia específico
-- 4. Os dias anteriores são preservados para histórico
-- ========================================
