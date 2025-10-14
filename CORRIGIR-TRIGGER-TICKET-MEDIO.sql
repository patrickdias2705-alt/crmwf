-- ========================================
-- CORREÇÃO: Trigger para Atualizar Ticket Médio Automaticamente
-- ========================================

-- 1. Recriar função do trigger com lógica corrigida
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

  -- Calcular totais para o tenant a partir da tabela sales
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

  -- Atualizar ou inserir nas métricas diárias
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
  RAISE NOTICE 'Trigger executado: tenant=%, total_sales=%, total_count=%, avg_ticket=%', 
    tenant_uuid, total_sales, total_count, avg_ticket;

  -- Retornar registro apropriado
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$;

-- 2. Recriar trigger
DROP TRIGGER IF EXISTS trigger_calculate_ticket_medio ON public.sales;
CREATE TRIGGER trigger_calculate_ticket_medio
  AFTER INSERT OR UPDATE OR DELETE ON public.sales
  FOR EACH ROW
  EXECUTE FUNCTION public.calculate_ticket_medio();

-- 3. Função para forçar atualização manual das métricas
CREATE OR REPLACE FUNCTION public.force_update_metrics(tenant_uuid UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  total_sales DECIMAL(15,2);
  total_count INTEGER;
  avg_ticket DECIMAL(15,2);
  result JSONB;
BEGIN
  -- Calcular totais da tabela sales
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

  -- Atualizar métricas
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

  result := jsonb_build_object(
    'success', true,
    'tenant_id', tenant_uuid,
    'total_sales', total_sales,
    'total_count', total_count,
    'avg_ticket', avg_ticket,
    'message', 'Métricas atualizadas com sucesso'
  );

  RETURN result;
END;
$$;

-- 4. Conceder permissões
GRANT EXECUTE ON FUNCTION public.calculate_ticket_medio() TO authenticated;
GRANT EXECUTE ON FUNCTION public.force_update_metrics(UUID) TO authenticated;

-- 5. Testar o trigger criando uma venda de teste
INSERT INTO public.sales (
  tenant_id,
  lead_id,
  amount,
  stage_id,
  stage_name,
  sold_by,
  sold_by_name,
  budget_description,
  budget_file_name
) VALUES (
  '8bd69047-7533-42f3-a2f7-e3a60477f68c',
  gen_random_uuid(),
  1000.00,
  null,
  'Teste',
  null,
  'Teste',
  'Teste de trigger',
  'teste.pdf'
);

-- 6. Verificar se as métricas foram atualizadas
SELECT * FROM metrics_daily WHERE tenant_id = '8bd69047-7533-42f3-a2f7-e3a60477f68c' ORDER BY date DESC LIMIT 1;
