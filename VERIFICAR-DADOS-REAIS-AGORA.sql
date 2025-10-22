-- VERIFICAR DADOS REAIS DOS LEADS DA MARIA
-- Para descobrir exatamente quais dias têm leads

SELECT 
  'LEADS_POR_DIA' as tipo,
  DATE(created_at) as dia,
  COUNT(*) as total_leads,
  COUNT(CASE WHEN status = 'closed' THEN 1 END) as leads_fechados,
  COUNT(CASE WHEN fields->>'sold' = 'true' THEN 1 END) as leads_vendidos
FROM leads 
WHERE tenant_id = '8bd69047-7533-42f3-a2f7-e3a60477f68c'
GROUP BY DATE(created_at)
ORDER BY dia DESC;

-- VERIFICAR TODOS OS LEADS INDIVIDUAIS COM DATAS
SELECT 
  'LEADS_INDIVIDUAIS' as tipo,
  id,
  created_at,
  DATE(created_at) as dia_simples,
  status,
  fields->>'sold' as vendido,
  origin
FROM leads 
WHERE tenant_id = '8bd69047-7533-42f3-a2f7-e3a60477f68c'
ORDER BY created_at DESC
LIMIT 50;
