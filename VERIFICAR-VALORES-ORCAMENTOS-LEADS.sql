-- Script para verificar valores dos orçamentos nos leads

-- 1. Verificar leads vendidos e seus orçamentos
SELECT 
  id,
  created_at,
  status,
  fields->>'name' as nome,
  fields->>'email' as email,
  fields->>'phone' as telefone,
  fields->>'orcamento' as orcamento,
  fields->>'budget' as budget,
  fields->>'valor' as valor,
  fields->>'price' as price,
  fields->>'revenue' as revenue,
  fields->>'sold' as sold,
  fields
FROM leads 
WHERE tenant_id = '8bd69047-7533-42f3-a2f7-e3a60477f68c'
AND (status = 'closed' OR (fields ? 'sold' AND fields->>'sold' = 'true'))
ORDER BY created_at DESC;

-- 2. Verificar todos os campos que podem conter valores
SELECT 
  'orcamento' as campo,
  COUNT(*) as total,
  COUNT(CASE WHEN fields->>'orcamento' IS NOT NULL AND fields->>'orcamento' != '' THEN 1 END) as com_valor,
  string_agg(DISTINCT fields->>'orcamento', ', ') as valores_unicos
FROM leads 
WHERE tenant_id = '8bd69047-7533-42f3-a2f7-e3a60477f68c'

UNION ALL

SELECT 
  'budget' as campo,
  COUNT(*) as total,
  COUNT(CASE WHEN fields->>'budget' IS NOT NULL AND fields->>'budget' != '' THEN 1 END) as com_valor,
  string_agg(DISTINCT fields->>'budget', ', ') as valores_unicos
FROM leads 
WHERE tenant_id = '8bd69047-7533-42f3-a2f7-e3a60477f68c'

UNION ALL

SELECT 
  'valor' as campo,
  COUNT(*) as total,
  COUNT(CASE WHEN fields->>'valor' IS NOT NULL AND fields->>'valor' != '' THEN 1 END) as com_valor,
  string_agg(DISTINCT fields->>'valor', ', ') as valores_unicos
FROM leads 
WHERE tenant_id = '8bd69047-7533-42f3-a2f7-e3a60477f68c'

UNION ALL

SELECT 
  'price' as campo,
  COUNT(*) as total,
  COUNT(CASE WHEN fields->>'price' IS NOT NULL AND fields->>'price' != '' THEN 1 END) as com_valor,
  string_agg(DISTINCT fields->>'price', ', ') as valores_unicos
FROM leads 
WHERE tenant_id = '8bd69047-7533-42f3-a2f7-e3a60477f68c';

-- 3. Verificar estrutura completa de alguns leads
SELECT 
  id,
  created_at,
  status,
  jsonb_pretty(fields) as campos_completos
FROM leads 
WHERE tenant_id = '8bd69047-7533-42f3-a2f7-e3a60477f68c'
AND (status = 'closed' OR (fields ? 'sold' AND fields->>'sold' = 'true'))
LIMIT 3;
