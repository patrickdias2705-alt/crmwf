-- ========================================
-- MIGRATION: Inteligência Automática para Ticket Médio
-- ========================================

-- 1. Criar função para calcular ticket médio automaticamente
CREATE OR REPLACE FUNCTION public.calculate_ticket_medio()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  total_sales DECIMAL(15,2);
  total_count INTEGER;
  avg_ticket DECIMAL(15,2);
  tenant_uuid UUID;
BEGIN
  -- Obter tenant_id do registro afetado
  IF TG_OP = 'DELETE' THEN
    tenant_uuid := OLD.tenant_id;
  ELSE
    tenant_uuid := NEW.tenant_id;
  END IF;

  -- Calcular totais para o tenant
  SELECT 
    COALESCE(SUM(amount), 0),
    COUNT(*)
  INTO total_sales, total_count
  FROM sales 
  WHERE tenant_id = tenant_uuid;

  -- Calcular ticket médio
  avg_ticket := CASE 
    WHEN total_count > 0 THEN total_sales / total_count 
    ELSE 0 
  END;

  -- Atualizar métricas diárias com ticket médio calculado
  INSERT INTO metrics_daily (
    tenant_id, 
    date, 
    total_sold, 
    avg_ticket,
    closed
  ) VALUES (
    tenant_uuid,
    CURRENT_DATE,
    total_sales,
    avg_ticket,
    total_count
  )
  ON CONFLICT (tenant_id, date) 
  DO UPDATE SET 
    total_sold = EXCLUDED.total_sold,
    avg_ticket = EXCLUDED.avg_ticket,
    closed = EXCLUDED.closed;

  -- Log para debug
  RAISE NOTICE 'Ticket médio calculado: % para tenant % com % vendas totalizando R$ %', 
    avg_ticket, tenant_uuid, total_count, total_sales;

  -- Retornar registro apropriado
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$;

-- 2. Criar trigger para executar cálculo automático
DROP TRIGGER IF EXISTS trigger_calculate_ticket_medio ON public.sales;
CREATE TRIGGER trigger_calculate_ticket_medio
  AFTER INSERT OR UPDATE OR DELETE ON public.sales
  FOR EACH ROW
  EXECUTE FUNCTION public.calculate_ticket_medio();

-- 3. Criar função para obter estatísticas em tempo real
CREATE OR REPLACE FUNCTION public.get_sales_stats(tenant_uuid UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result JSONB;
  total_sales DECIMAL(15,2);
  total_count INTEGER;
  avg_ticket DECIMAL(15,2);
  today_sales DECIMAL(15,2);
  today_count INTEGER;
  today_avg DECIMAL(15,2);
BEGIN
  -- Estatísticas totais
  SELECT 
    COALESCE(SUM(amount), 0),
    COUNT(*)
  INTO total_sales, total_count
  FROM sales 
  WHERE tenant_id = tenant_uuid;

  avg_ticket := CASE 
    WHEN total_count > 0 THEN total_sales / total_count 
    ELSE 0 
  END;

  -- Estatísticas do dia
  SELECT 
    COALESCE(SUM(amount), 0),
    COUNT(*)
  INTO today_sales, today_count
  FROM sales 
  WHERE tenant_id = tenant_uuid 
    AND DATE(sold_at) = CURRENT_DATE;

  today_avg := CASE 
    WHEN today_count > 0 THEN today_sales / today_count 
    ELSE 0 
  END;

  result := jsonb_build_object(
    'success', true,
    'total_stats', jsonb_build_object(
      'total_sales', total_sales,
      'total_count', total_count,
      'avg_ticket', avg_ticket
    ),
    'today_stats', jsonb_build_object(
      'today_sales', today_sales,
      'today_count', today_count,
      'today_avg', today_avg
    ),
    'calculated_at', NOW()
  );

  RETURN result;
END;
$$;

-- 4. Conceder permissões
GRANT EXECUTE ON FUNCTION public.calculate_ticket_medio() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_sales_stats(UUID) TO authenticated;

-- 5. Comentários
COMMENT ON FUNCTION public.calculate_ticket_medio() IS 'Calcula ticket médio automaticamente quando vendas são inseridas/atualizadas/removidas';
COMMENT ON FUNCTION public.get_sales_stats(UUID) IS 'Retorna estatísticas de vendas em tempo real para um tenant';

-- ========================================
-- INSTRUÇÕES:
-- ========================================
-- 1. Copie todo este conteúdo
-- 2. Vá para o Supabase Dashboard
-- 3. Clique em "SQL Editor"
-- 4. Cole o conteúdo e execute
-- 5. Agora o ticket médio será calculado automaticamente!
-- 6. Teste marcando um lead como vendido
