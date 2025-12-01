-- Verificar se há dados na tabela metrics_daily
SELECT 
  tenant_id,
  date,
  leads_in,
  leads_attended,
  qualified,
  closed,
  refused,
  lost,
  total_sold,
  avg_ticket
FROM metrics_daily 
WHERE tenant_id = '8bd69047-7533-42f3-a2f7-e3a60477f68c' 
ORDER BY date DESC 
LIMIT 5;

-- Verificar se a função get_sales_stats funciona
SELECT public.get_sales_stats('8bd69047-7533-42f3-a2f7-e3a60477f68c');
