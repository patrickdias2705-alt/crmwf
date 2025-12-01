-- Verificar dados de vendas para a IA analisar corretamente

-- 1. Verificar estrutura da tabela leads
SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'leads' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2. Verificar dados de leads com vendas
SELECT 
  id,
  created_at,
  status,
  fields,
  CASE 
    WHEN status = 'closed' THEN 'VENDIDO_STATUS'
    WHEN fields::text LIKE '%"sold":true%' THEN 'VENDIDO_FIELDS'
    WHEN fields::text LIKE '%"sold":"true"%' THEN 'VENDIDO_FIELDS_STRING'
    ELSE 'NAO_VENDIDO'
  END as vendido_indicador,
  fields::text as fields_text
FROM leads 
WHERE tenant_id = '8bd69047-7533-42f3-a2f7-e3a60477f68c'
AND created_at >= '2025-10-07T00:00:00.000Z'
AND created_at <= '2025-10-31T23:59:59.999Z'
ORDER BY created_at;

-- 3. Contar vendas por dia
SELECT 
  DATE(created_at) as dia,
  COUNT(*) as total_leads,
  COUNT(CASE WHEN status = 'closed' THEN 1 END) as vendidos_status,
  COUNT(CASE WHEN fields::text LIKE '%"sold":true%' OR fields::text LIKE '%"sold":"true"%' THEN 1 END) as vendidos_fields,
  ROUND(
    (COUNT(CASE WHEN status = 'closed' OR fields::text LIKE '%"sold":true%' OR fields::text LIKE '%"sold":"true"%' THEN 1 END)::decimal / COUNT(*)) * 100, 
    1
  ) as taxa_conversao
FROM leads 
WHERE tenant_id = '8bd69047-7533-42f3-a2f7-e3a60477f68c'
AND created_at >= '2025-10-07T00:00:00.000Z'
AND created_at <= '2025-10-31T23:59:59.999Z'
GROUP BY DATE(created_at)
ORDER BY dia;

-- 4. Verificar se existe tabela sales
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('sales', 'vendas', 'sells');

-- 5. Dados específicos por dia (dias mencionados pelo usuário)
SELECT 
  '07/10' as dia,
  COUNT(*) as leads,
  COUNT(CASE WHEN status = 'closed' OR fields::text LIKE '%"sold":true%' OR fields::text LIKE '%"sold":"true"%' THEN 1 END) as vendas
FROM leads 
WHERE tenant_id = '8bd69047-7533-42f3-a2f7-e3a60477f68c'
AND DATE(created_at) = '2025-10-07'

UNION ALL

SELECT 
  '10/10' as dia,
  COUNT(*) as leads,
  COUNT(CASE WHEN status = 'closed' OR fields::text LIKE '%"sold":true%' OR fields::text LIKE '%"sold":"true"%' THEN 1 END) as vendas
FROM leads 
WHERE tenant_id = '8bd69047-7533-42f3-a2f7-e3a60477f68c'
AND DATE(created_at) = '2025-10-10'

UNION ALL

SELECT 
  '13/10' as dia,
  COUNT(*) as leads,
  COUNT(CASE WHEN status = 'closed' OR fields::text LIKE '%"sold":true%' OR fields::text LIKE '%"sold":"true"%' THEN 1 END) as vendas
FROM leads 
WHERE tenant_id = '8bd69047-7533-42f3-a2f7-e3a60477f68c'
AND DATE(created_at) = '2025-10-13'

UNION ALL

SELECT 
  '14/10' as dia,
  COUNT(*) as leads,
  COUNT(CASE WHEN status = 'closed' OR fields::text LIKE '%"sold":true%' OR fields::text LIKE '%"sold":"true"%' THEN 1 END) as vendas
FROM leads 
WHERE tenant_id = '8bd69047-7533-42f3-a2f7-e3a60477f68c'
AND DATE(created_at) = '2025-10-14'

UNION ALL

SELECT 
  '15/10' as dia,
  COUNT(*) as leads,
  COUNT(CASE WHEN status = 'closed' OR fields::text LIKE '%"sold":true%' OR fields::text LIKE '%"sold":"true"%' THEN 1 END) as vendas
FROM leads 
WHERE tenant_id = '8bd69047-7533-42f3-a2f7-e3a60477f68c'
AND DATE(created_at) = '2025-10-15'

UNION ALL

SELECT 
  '16/10' as dia,
  COUNT(*) as leads,
  COUNT(CASE WHEN status = 'closed' OR fields::text LIKE '%"sold":true%' OR fields::text LIKE '%"sold":"true"%' THEN 1 END) as vendas
FROM leads 
WHERE tenant_id = '8bd69047-7533-42f3-a2f7-e3a60477f68c'
AND DATE(created_at) = '2025-10-16'

UNION ALL

SELECT 
  '17/10' as dia,
  COUNT(*) as leads,
  COUNT(CASE WHEN status = 'closed' OR fields::text LIKE '%"sold":true%' OR fields::text LIKE '%"sold":"true"%' THEN 1 END) as vendas
FROM leads 
WHERE tenant_id = '8bd69047-7533-42f3-a2f7-e3a60477f68c'
AND DATE(created_at) = '2025-10-17'

ORDER BY dia;
