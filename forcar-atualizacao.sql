-- Verificar valores atuais das colunas total_sold e avg_ticket
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

-- Forçar atualização das métricas baseado na tabela sales
UPDATE metrics_daily 
SET 
  total_sold = (
    SELECT COALESCE(SUM(amount), 0) 
    FROM sales 
    WHERE tenant_id = '8bd69047-7533-42f3-a2f7-e3a60477f68c'
  ),
  avg_ticket = (
    SELECT CASE 
      WHEN COUNT(*) > 0 THEN COALESCE(SUM(amount), 0) / COUNT(*) 
      ELSE 0 
    END
    FROM sales 
    WHERE tenant_id = '8bd69047-7533-42f3-a2f7-e3a60477f68c'
  ),
  closed = (
    SELECT COUNT(*) 
    FROM sales 
    WHERE tenant_id = '8bd69047-7533-42f3-a2f7-e3a60477f68c'
  )
WHERE tenant_id = '8bd69047-7533-42f3-a2f7-e3a60477f68c'
  AND date = '2025-10-09';

-- Verificar resultado após atualização
SELECT 
  tenant_id,
  date,
  total_sold,
  avg_ticket,
  closed
FROM metrics_daily 
WHERE tenant_id = '8bd69047-7533-42f3-a2f7-e3a60477f68c' 
ORDER BY date DESC LIMIT 1;
