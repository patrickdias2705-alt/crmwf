-- =====================================================
-- CORREÇÃO DAS ESTATÍSTICAS DE VENDAS
-- =====================================================
-- 
-- Este script corrige o cálculo das métricas diárias
-- baseado nos dados REAIS da tabela sales
-- 
-- ⚠️ IMPORTANTE: Este script NÃO apaga nenhum dado!
-- Ele apenas RECALCULA as métricas baseado nos dados existentes
-- 
-- Como aplicar:
-- 1. Acesse o painel do Supabase: https://supabase.com/dashboard/project/xqeqaagnnkilihlfjbrm
-- 2. Vá em "SQL Editor"
-- 3. Cole este script completo
-- 4. Clique em "Run" ou pressione Ctrl+Enter
-- =====================================================

-- Função para sincronizar métricas diárias com a tabela sales
CREATE OR REPLACE FUNCTION public.sync_metrics_from_sales(tenant_uuid UUID DEFAULT NULL)
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
  -- Se tenant_uuid for NULL, processar todos os tenants
  -- Se não, processar apenas o tenant especificado
  FOR tenant_record IN 
    SELECT DISTINCT tenant_id 
    FROM sales 
    WHERE tenant_uuid IS NULL OR tenant_id = tenant_uuid
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
    LOOP
      -- Atualizar ou inserir métricas para o dia
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
        closed = GREATEST(EXCLUDED.closed, metrics_daily.closed),
        total_revenue = GREATEST(EXCLUDED.total_revenue, metrics_daily.total_revenue),
        total_sold = GREATEST(EXCLUDED.total_sold, metrics_daily.total_sold),
        avg_ticket = CASE 
          WHEN GREATEST(EXCLUDED.closed, metrics_daily.closed) > 0 
          THEN GREATEST(EXCLUDED.total_revenue, metrics_daily.total_revenue) / GREATEST(EXCLUDED.closed, metrics_daily.closed)
          ELSE 0
        END;
      
      updated_days := updated_days + 1;
    END LOOP;
  END LOOP;

  result := jsonb_build_object(
    'success', true,
    'updated_days', updated_days,
    'message', 'Métricas sincronizadas com sucesso a partir da tabela sales'
  );

  RETURN result;
END;
$$;

-- Conceder permissões
GRANT EXECUTE ON FUNCTION public.sync_metrics_from_sales(UUID) TO authenticated;

-- Trigger para sincronizar automaticamente quando uma venda é inserida/atualizada
CREATE OR REPLACE FUNCTION public.trigger_sync_metrics_on_sale_change()
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

  -- Recalcular métricas para este dia específico
  SELECT 
    COUNT(*),
    COALESCE(SUM(amount), 0)
  INTO sales_count, total_amount
  FROM sales 
  WHERE tenant_id = COALESCE(NEW.tenant_id, OLD.tenant_id)
    AND DATE(sold_at) = sale_date;

  -- Atualizar métricas do dia
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

-- Aplicar trigger na tabela sales
DROP TRIGGER IF EXISTS trigger_sync_metrics_on_sale_change ON public.sales;
CREATE TRIGGER trigger_sync_metrics_on_sale_change
  AFTER INSERT OR UPDATE OR DELETE ON public.sales
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_sync_metrics_on_sale_change();

-- =====================================================
-- EXECUTAR SINCRONIZAÇÃO INICIAL
-- =====================================================
-- Isso vai recalcular TODAS as métricas baseado nos dados reais da tabela sales
-- NÃO apaga nenhum dado, apenas recalcula!
SELECT public.sync_metrics_from_sales();

-- =====================================================
-- VERIFICAR RESULTADOS
-- =====================================================
-- Execute estas queries para verificar se funcionou:

-- 1. Ver total de vendas por dia
SELECT 
  date,
  closed as vendas_fechadas,
  total_sold as valor_total,
  avg_ticket as ticket_medio
FROM metrics_daily
WHERE total_sold > 0
ORDER BY date DESC
LIMIT 30;

-- 2. Ver resumo geral
SELECT 
  COUNT(*) as dias_com_vendas,
  SUM(closed) as total_vendas,
  SUM(total_sold) as valor_total,
  AVG(avg_ticket) as ticket_medio_geral
FROM metrics_daily
WHERE total_sold > 0;

-- 3. Ver vendas da tabela sales
SELECT 
  DATE(sold_at) as data,
  COUNT(*) as quantidade,
  SUM(amount) as valor_total
FROM sales
GROUP BY DATE(sold_at)
ORDER BY DATE(sold_at) DESC
LIMIT 30;

