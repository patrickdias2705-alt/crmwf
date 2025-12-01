-- VERIFICAR DATAS REAIS DOS LEADS DA MARIA
-- Para descobrir por que os leads estão aparecendo nos dias errados

SELECT 
  'LEADS_POR_DIA_REAL' as tipo,
  DATE(created_at) as dia_real,
  created_at as data_completa,
  COUNT(*) as total_leads,
  COUNT(CASE WHEN fields->>'sold' = 'true' THEN 1 END) as leads_vendidos
FROM leads 
WHERE tenant_id = '8bd69047-7533-42f3-a2f7-e3a60477f68c'
GROUP BY DATE(created_at), created_at
ORDER BY created_at DESC;

-- VERIFICAR LEADS INDIVIDUAIS COM DATAS COMPLETAS
SELECT 
  'LEADS_INDIVIDUAIS_DETALHADOS' as tipo,
  id,
  created_at,
  DATE(created_at) as dia_simples,
  status,
  fields->>'sold' as vendido,
  origin,
  EXTRACT(DAY FROM created_at) as dia_do_mes,
  EXTRACT(MONTH FROM created_at) as mes,
  EXTRACT(YEAR FROM created_at) as ano
FROM leads 
WHERE tenant_id = '8bd69047-7533-42f3-a2f7-e3a60477f68c'
ORDER BY created_at DESC
LIMIT 20;
