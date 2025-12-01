-- =====================================================
-- MIGRAÇÃO: Vendas do fields para tabela sales
-- =====================================================
-- 
-- Este script vai:
-- 1. Migrar todas as vendas do fields dos leads para a tabela sales
-- 2. Sincronizar as métricas diárias
-- 3. Garantir que tudo funcione corretamente
-- 
-- ⚠️ IMPORTANTE: Este script NÃO apaga dados!
-- Apenas cria registros na tabela sales baseado nos dados existentes
-- =====================================================

-- 1. Migrar vendas do fields para a tabela sales
INSERT INTO sales (
  tenant_id,
  lead_id,
  amount,
  stage_id,
  stage_name,
  sold_at,
  sold_by_name,
  budget_description,
  budget_file_name,
  created_at,
  updated_at
)
SELECT 
  l.tenant_id,
  l.id as lead_id,
  CAST(l.fields->>'sold_amount' AS DECIMAL) as amount,
  l.stage_id,
  s.name as stage_name,
  COALESCE(
    (l.fields->>'sold_at')::TIMESTAMP WITH TIME ZONE,
    l.updated_at
  ) as sold_at,
  COALESCE(
    l.fields->>'sold_by',
    'Sistema (Migração)'
  ) as sold_by_name,
  l.fields->>'budget_description' as budget_description,
  l.fields->>'budget_file_name' as budget_file_name,
  NOW() as created_at,
  NOW() as updated_at
FROM leads l
LEFT JOIN stages s ON l.stage_id = s.id
WHERE l.fields->>'sold' = 'true' 
   AND l.fields->>'sold_amount' IS NOT NULL
   AND CAST(l.fields->>'sold_amount' AS DECIMAL) > 0
   -- Evitar duplicatas (só migrar se não existir na tabela sales)
   AND NOT EXISTS (
     SELECT 1 FROM sales 
     WHERE sales.lead_id = l.id
   );

-- 2. Verificar quantos registros foram migrados
SELECT 
  'MIGRAÇÃO CONCLUÍDA:' as info,
  COUNT(*) as vendas_migradas,
  SUM(amount) as valor_total_migrado
FROM sales;

-- 3. Função para sincronizar métricas diárias com vendas reais
CREATE OR REPLACE FUNCTION public.sync_all_daily_metrics()
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
    'message', 'Métricas diárias sincronizadas com sucesso!'
  );

  RETURN result;
END;
$$;

-- 4. Executar sincronização das métricas
SELECT public.sync_all_daily_metrics();

-- 5. Trigger para manter tudo sincronizado automaticamente
CREATE OR REPLACE FUNCTION public.auto_update_daily_metrics()
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

-- 6. Aplicar trigger na tabela sales
DROP TRIGGER IF EXISTS auto_update_daily_metrics_trigger ON public.sales;
CREATE TRIGGER auto_update_daily_metrics_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.sales
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_update_daily_metrics();

-- 7. Conceder permissões
GRANT EXECUTE ON FUNCTION public.sync_all_daily_metrics() TO authenticated;

-- =====================================================
-- VERIFICAR RESULTADOS FINAIS
-- =====================================================

-- Ver vendas por dia (deve mostrar dados agora)
SELECT 
  'VENDAS POR DIA:' as info,
  DATE(sold_at) as data,
  COUNT(*) as quantidade,
  SUM(amount) as valor_total,
  AVG(amount) as ticket_medio
FROM sales
GROUP BY DATE(sold_at)
ORDER BY DATE(sold_at) DESC
LIMIT 7;

-- Ver métricas diárias (deve estar sincronizado)
SELECT 
  'MÉTRICAS DIÁRIAS:' as info,
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

-- Comparação final: métricas vs vendas reais
SELECT 
  'COMPARAÇÃO FINAL HOJE:' as info,
  m.date,
  m.closed as vendas_metricas,
  m.total_sold as valor_metricas,
  s.vendas_reais,
  s.valor_reais,
  CASE 
    WHEN m.total_sold = s.valor_reais THEN '✅ SINCRONIZADO'
    ELSE '❌ DESINCRONIZADO'
  END as status
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
