-- Verificar se as colunas total_sold e avg_ticket existem e têm valores
SELECT 
  tenant_id,
  date,
  leads_in,
  leads_attended,
  booked,
  closed,
  refused,
  lost,
  total_sold,
  avg_ticket
FROM metrics_daily 
WHERE tenant_id = '8bd69047-7533-42f3-a2f7-e3a60477f68c' 
ORDER BY date DESC 
LIMIT 1;

-- Verificar se as colunas existem na tabela
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'metrics_daily' 
  AND table_schema = 'public'
  AND column_name IN ('total_sold', 'avg_ticket');
