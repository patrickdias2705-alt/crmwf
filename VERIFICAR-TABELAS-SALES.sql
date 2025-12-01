-- ========================================
-- VERIFICAÇÃO COMPLETA DAS TABELAS DE VENDAS
-- ========================================

-- 1. Verificar se a tabela sales existe e tem dados
SELECT 
  'TABELA SALES' as tabela,
  COUNT(*) as total_registros,
  SUM(amount) as total_vendido,
  AVG(amount) as ticket_medio,
  MIN(sold_at) as primeira_venda,
  MAX(sold_at) as ultima_venda
FROM sales;

-- 2. Verificar leads com orçamentos
SELECT 
  'LEADS COM ORÇAMENTO' as tipo,
  COUNT(*) as total,
  SUM((fields->>'budget_amount')::DECIMAL) as total_orcamento
FROM leads 
WHERE fields->>'budget_amount' IS NOT NULL 
  AND (fields->>'budget_amount')::DECIMAL > 0;

-- 3. Verificar métricas diárias
SELECT 
  'MÉTRICAS DIÁRIAS' as tabela,
  date,
  total_sold,
  avg_ticket,
  closed
FROM metrics_daily 
ORDER BY date DESC 
LIMIT 10;

-- 4. Verificar se os triggers estão funcionando
SELECT 
  trigger_name,
  event_manipulation,
  action_statement,
  action_timing
FROM information_schema.triggers 
WHERE event_object_table = 'sales';

-- 5. Verificar função get_sales_stats
SELECT public.get_sales_stats('8bd69047-7533-42f3-a2f7-e3a60477f68c'::UUID);

-- 6. Testar inserção de venda para verificar trigger
-- (Descomente para testar)
/*
INSERT INTO sales (tenant_id, lead_id, amount, sold_by_name, stage_name)
VALUES (
  '8bd69047-7533-42f3-a2f7-e3a60477f68c'::UUID,
  (SELECT id FROM leads LIMIT 1),
  1000.00,
  'Teste Trigger',
  'Teste'
);
*/
