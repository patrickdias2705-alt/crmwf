-- =====================================================
-- SINCRONIZAÇÃO COMPLETA DAS MÉTRICAS DIÁRIAS
-- =====================================================
-- 
-- Este script vai garantir que:
-- 1. Cada dia tenha suas próprias métricas corretas
-- 2. As vendas sejam contabilizadas por dia específico
-- 3. O histórico seja mantido e atualizado
-- 
-- ⚠️ IMPORTANTE: Este script NÃO apaga dados!
-- Ele apenas sincroniza e recalcula as métricas
-- =====================================================

-- 1. Função para sincronizar métricas diárias com vendas reais
CREATE OR REPLACE FUNCTION public.sync_daily_metrics_from_sales()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  tenant_record RECORD;
  result JSONB;
  updated_days INTEGER := 0;
  sale_record RECORD;
BEGIN
  -- Processar todos os tenants
  FOR tenant_record IN 
    SELECT DISTINCT tenant_id FROM sales
  LOOP
    -- Para cada dia que tem vendas, recalcular as métricas
    FOR sale_record IN
      SELECT 
        DATE(sold_at) as sale_date,
        COUNT(*) as sales_count,
        SUM(amount) as total_amount
      FROM sales 
      WHERE tenant_id = tenant_record.tenant_id
      GROUP BY DATE(sold_at)
      ORDER BY DATE(sold_at) DESC
    LOOP
      -- Atualizar ou inserir métricas para o dia específico
      INSERT INTO metrics_daily (
        tenant_id, 
        date, 
        closed, 
        total_revenue, 
        total_sold,
        avg_ticket
      ) VALUES (
        tenant_record.tenant_id,
        sale_record.sale_date,
        sale_record.sales_count,
        sale_record.total_amount,
        sale_record.total_amount,
        CASE 
          WHEN sale_record.sales_count > 0 THEN sale_record.total_amount / sale_record.sales_count
          ELSE 0
        END
      )
      ON CONFLICT (tenant_id, date) 
      DO UPDATE SET 
        closed = EXCLUDED.closed,
        total_revenue = EXCLUDED.total_revenue,
        total_sold = EXCLUDED.total_sold,
        avg_ticket = EXCLUDED.avg_ticket;
      
      updated_days := updated_days + 1;
    END LOOP;
  END LOOP;

  result := jsonb_build_object(
    'success', true,
    'updated_days', updated_days,
    'message', 'Métricas diárias sincronizadas com sucesso! Cada dia agora tem suas vendas específicas.'
  );

  RETURN result;
END;
$$;

-- 2. Função para garantir que métricas de hoje estejam corretas
CREATE OR REPLACE FUNCTION public.update_today_metrics()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  tenant_record RECORD;
  result JSONB;
  today_sales_count INTEGER;
  today_total_amount DECIMAL(15,2);
BEGIN
  -- Processar todos os tenants
  FOR tenant_record IN 
    SELECT DISTINCT tenant_id FROM sales
  LOOP
    -- Buscar vendas de hoje para este tenant
    SELECT 
      COUNT(*),
      COALESCE(SUM(amount), 0)
    INTO today_sales_count, today_total_amount
    FROM sales 
    WHERE tenant_id = tenant_record.tenant_id
      AND DATE(sold_at) = CURRENT_DATE;

    -- Atualizar métricas de hoje
    INSERT INTO metrics_daily (
      tenant_id, 
      date, 
      closed, 
      total_revenue, 
      total_sold,
      avg_ticket
    ) VALUES (
      tenant_record.tenant_id,
      CURRENT_DATE,
      today_sales_count,
      today_total_amount,
      today_total_amount,
      CASE 
        WHEN today_sales_count > 0 THEN today_total_amount / today_sales_count
        ELSE 0
      END
    )
    ON CONFLICT (tenant_id, date) 
    DO UPDATE SET 
      closed = EXCLUDED.closed,
      total_revenue = EXCLUDED.total_revenue,
      total_sold = EXCLUDED.total_sold,
      avg_ticket = EXCLUDED.avg_ticket;
  END LOOP;

  result := jsonb_build_object(
    'success', true,
    'message', 'Métricas de hoje atualizadas com sucesso!'
  );

  RETURN result;
END;
$$;

-- 3. Trigger para manter métricas sempre sincronizadas
CREATE OR REPLACE FUNCTION public.auto_sync_daily_metrics()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  sale_date DATE;
  sales_count INTEGER;
  total_amount DECIMAL(15,2);
BEGIN
  -- Determinar a data da venda
  IF (TG_OP = 'DELETE') THEN
    sale_date := DATE(OLD.sold_at);
  ELSE
    sale_date := DATE(NEW.sold_at);
  END IF;

  -- Recalcular métricas para o dia específico da venda
  SELECT 
    COUNT(*),
    COALESCE(SUM(amount), 0)
  INTO sales_count, total_amount
  FROM sales 
  WHERE tenant_id = COALESCE(NEW.tenant_id, OLD.tenant_id)
    AND DATE(sold_at) = sale_date;

  -- Atualizar métricas do dia específico
  INSERT INTO metrics_daily (
    tenant_id, 
    date, 
    closed, 
    total_revenue, 
    total_sold,
    avg_ticket
  ) VALUES (
    COALESCE(NEW.tenant_id, OLD.tenant_id),
    sale_date,
    sales_count,
    total_amount,
    total_amount,
    CASE 
      WHEN sales_count > 0 THEN total_amount / sales_count
      ELSE 0
    END
  )
  ON CONFLICT (tenant_id, date) 
  DO UPDATE SET 
    closed = EXCLUDED.closed,
    total_revenue = EXCLUDED.total_revenue,
    total_sold = EXCLUDED.total_sold,
    avg_ticket = EXCLUDED.avg_ticket;

  IF (TG_OP = 'DELETE') THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$;

-- 4. Aplicar trigger na tabela sales
DROP TRIGGER IF EXISTS auto_sync_daily_metrics_trigger ON public.sales;
CREATE TRIGGER auto_sync_daily_metrics_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.sales
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_sync_daily_metrics();

-- 5. Conceder permissões
GRANT EXECUTE ON FUNCTION public.sync_daily_metrics_from_sales() TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_today_metrics() TO authenticated;

-- =====================================================
-- EXECUTAR SINCRONIZAÇÃO COMPLETA
-- =====================================================

-- Sincronizar todas as métricas diárias
SELECT public.sync_daily_metrics_from_sales();

-- Atualizar métricas de hoje especificamente
SELECT public.update_today_metrics();

-- =====================================================
-- VERIFICAR RESULTADOS
-- =====================================================

-- Ver métricas por dia (últimos 7 dias)
SELECT 
  'MÉTRICAS POR DIA:' as info,
  date,
  closed as vendas_dia,
  total_sold as valor_dia,
  avg_ticket as ticket_medio_dia
FROM metrics_daily
WHERE total_sold > 0
ORDER BY date DESC
LIMIT 7;

-- Ver vendas de hoje especificamente
SELECT 
  'VENDAS DE HOJE:' as info,
  COUNT(*) as quantidade,
  SUM(amount) as valor_total,
  AVG(amount) as ticket_medio
FROM sales
WHERE DATE(sold_at) = CURRENT_DATE;

-- Ver comparação: métricas vs vendas reais
SELECT 
  'COMPARAÇÃO HOJE:' as info,
  m.date,
  m.closed as vendas_metricas,
  m.total_sold as valor_metricas,
  s.vendas_reais,
  s.valor_reais
FROM metrics_daily m
LEFT JOIN (
  SELECT 
    DATE(sold_at) as data,
    COUNT(*) as vendas_reais,
    SUM(amount) as valor_reais
  FROM sales
  WHERE DATE(sold_at) = CURRENT_DATE
  GROUP BY DATE(sold_at)
) s ON m.date = s.data
WHERE m.date = CURRENT_DATE;
