-- ========================================
-- TRIGGER PARA ATUALIZAÇÃO AUTOMÁTICA
-- ========================================
-- Este script cria o trigger que atualiza as métricas diárias
-- automaticamente quando uma venda é adicionada ou modificada

-- PASSO 1: Criar função para atualizar métricas diárias quando uma venda muda
CREATE OR REPLACE FUNCTION public.update_daily_sales_metrics_on_sale_change()
RETURNS TRIGGER AS $$
DECLARE
    v_tenant_id UUID;
    v_sale_date DATE;
    v_lead_date DATE;
BEGIN
    -- Determinar tenant_id e data da venda
    IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
        v_tenant_id := NEW.tenant_id;
        v_sale_date := DATE(NEW.created_at);
        
        -- Buscar a data de criação do lead para métricas históricas
        SELECT DATE(created_at) INTO v_lead_date
        FROM public.leads 
        WHERE id = NEW.lead_id;
        
        -- Atualizar métricas para a data da venda
        INSERT INTO public.daily_sales_metrics (
            date, tenant_id, total_sales, total_leads, closed_leads, avg_ticket
        )
        SELECT 
            v_sale_date,
            v_tenant_id,
            COALESCE(SUM(s.amount), 0),
            COUNT(l.id),
            COUNT(CASE WHEN l.status = 'closed' THEN 1 END),
            COALESCE(AVG(s.amount), 0)
        FROM 
            public.leads l
        LEFT JOIN 
            public.sales s ON l.id = s.lead_id
        WHERE 
            l.tenant_id = v_tenant_id
            AND DATE(l.created_at) = v_sale_date
        ON CONFLICT (date, tenant_id) DO UPDATE SET
            total_sales = EXCLUDED.total_sales,
            total_leads = EXCLUDED.total_leads,
            closed_leads = EXCLUDED.closed_leads,
            avg_ticket = EXCLUDED.avg_ticket,
            updated_at = NOW();
            
        -- Se a data do lead for diferente da data da venda, atualizar também
        IF v_lead_date IS NOT NULL AND v_lead_date != v_sale_date THEN
            INSERT INTO public.daily_sales_metrics (
                date, tenant_id, total_sales, total_leads, closed_leads, avg_ticket
            )
            SELECT 
                v_lead_date,
                v_tenant_id,
                COALESCE(SUM(s.amount), 0),
                COUNT(l.id),
                COUNT(CASE WHEN l.status = 'closed' THEN 1 END),
                COALESCE(AVG(s.amount), 0)
            FROM 
                public.leads l
            LEFT JOIN 
                public.sales s ON l.id = s.lead_id
            WHERE 
                l.tenant_id = v_tenant_id
                AND DATE(l.created_at) = v_lead_date
            ON CONFLICT (date, tenant_id) DO UPDATE SET
                total_sales = EXCLUDED.total_sales,
                total_leads = EXCLUDED.total_leads,
                closed_leads = EXCLUDED.closed_leads,
                avg_ticket = EXCLUDED.avg_ticket,
                updated_at = NOW();
        END IF;
        
        RAISE NOTICE 'Métricas diárias atualizadas para tenant % na data %', v_tenant_id, v_sale_date;
    END IF;

    -- Para DELETE, recalcular as métricas para a data afetada
    IF TG_OP = 'DELETE' THEN
        v_tenant_id := OLD.tenant_id;
        v_sale_date := DATE(OLD.created_at);
        
        -- Buscar a data de criação do lead
        SELECT DATE(created_at) INTO v_lead_date
        FROM public.leads 
        WHERE id = OLD.lead_id;
        
        -- Recalcular métricas para a data da venda
        INSERT INTO public.daily_sales_metrics (
            date, tenant_id, total_sales, total_leads, closed_leads, avg_ticket
        )
        SELECT 
            v_sale_date,
            v_tenant_id,
            COALESCE(SUM(s.amount), 0),
            COUNT(l.id),
            COUNT(CASE WHEN l.status = 'closed' THEN 1 END),
            COALESCE(AVG(s.amount), 0)
        FROM 
            public.leads l
        LEFT JOIN 
            public.sales s ON l.id = s.lead_id
        WHERE 
            l.tenant_id = v_tenant_id
            AND DATE(l.created_at) = v_sale_date
        ON CONFLICT (date, tenant_id) DO UPDATE SET
            total_sales = EXCLUDED.total_sales,
            total_leads = EXCLUDED.total_leads,
            closed_leads = EXCLUDED.closed_leads,
            avg_ticket = EXCLUDED.avg_ticket,
            updated_at = NOW();
            
        -- Recalcular para a data do lead se diferente
        IF v_lead_date IS NOT NULL AND v_lead_date != v_sale_date THEN
            INSERT INTO public.daily_sales_metrics (
                date, tenant_id, total_sales, total_leads, closed_leads, avg_ticket
            )
            SELECT 
                v_lead_date,
                v_tenant_id,
                COALESCE(SUM(s.amount), 0),
                COUNT(l.id),
                COUNT(CASE WHEN l.status = 'closed' THEN 1 END),
                COALESCE(AVG(s.amount), 0)
            FROM 
                public.leads l
            LEFT JOIN 
                public.sales s ON l.id = s.lead_id
            WHERE 
                l.tenant_id = v_tenant_id
                AND DATE(l.created_at) = v_lead_date
            ON CONFLICT (date, tenant_id) DO UPDATE SET
                total_sales = EXCLUDED.total_sales,
                total_leads = EXCLUDED.total_leads,
                closed_leads = EXCLUDED.closed_leads,
                avg_ticket = EXCLUDED.avg_ticket,
                updated_at = NOW();
        END IF;
        
        RAISE NOTICE 'Métricas diárias recalculadas para tenant % na data % após exclusão', v_tenant_id, v_sale_date;
    END IF;

    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- PASSO 2: Criar trigger na tabela sales
DROP TRIGGER IF EXISTS trigger_update_daily_sales_metrics ON public.sales;

CREATE TRIGGER trigger_update_daily_sales_metrics
    AFTER INSERT OR UPDATE OR DELETE ON public.sales
    FOR EACH ROW
    EXECUTE FUNCTION public.update_daily_sales_metrics_on_sale_change();

-- PASSO 3: Criar função para reset diário automático (executada por cron job)
CREATE OR REPLACE FUNCTION public.reset_daily_sales_metrics_daily()
RETURNS VOID AS $$
BEGIN
    -- Esta função será chamada diariamente para garantir que as métricas
    -- sejam recalculadas corretamente para o dia atual
    PERFORM public.update_daily_metrics();
    
    RAISE NOTICE 'Reset diário das métricas executado para %', CURRENT_DATE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- PASSO 4: Verificar se o trigger foi criado
SELECT 
    'TRIGGER_CRIADO' as status,
    tgname as trigger_name,
    relname as table_name,
    tgtype as trigger_type
FROM 
    pg_trigger t
JOIN 
    pg_class c ON t.tgrelid = c.oid
WHERE 
    c.relname = 'sales' 
    AND tgname = 'trigger_update_daily_sales_metrics';

-- PASSO 5: Testar o sistema com uma venda de exemplo (opcional)
-- Descomente as linhas abaixo para testar:
/*
INSERT INTO public.sales (lead_id, amount, tenant_id)
VALUES (
    (SELECT id FROM public.leads WHERE status = 'closed' LIMIT 1),
    100.00,
    '8bd69047-7533-42f3-a2f7-e3a60477f68c'
);
*/

-- PASSO 6: Verificar métricas após trigger
SELECT 
    'METRICAS_APOS_TRIGGER' as tipo,
    date,
    total_sales,
    total_leads,
    closed_leads,
    avg_ticket
FROM 
    public.daily_sales_metrics
WHERE 
    tenant_id = '8bd69047-7533-42f3-a2f7-e3a60477f68c'
ORDER BY 
    date DESC
LIMIT 5;

-- Sistema de métricas diárias automáticas configurado com sucesso!