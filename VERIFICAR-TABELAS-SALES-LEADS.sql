-- Verificar tabelas sales e leads para valores reais

-- 1. Verificar se existe tabela sales
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('sales', 'vendas', 'sells');

-- 2. Se existir tabela sales, ver estrutura
SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'sales' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 3. Buscar dados da tabela sales (se existir)
SELECT 
  id,
  created_at,
  updated_at,
  amount,
  value,
  price,
  total,
  revenue,
  lead_id,
  tenant_id
FROM sales 
WHERE tenant_id = '8bd69047-7533-42f3-a2f7-e3a60477f68c'
AND created_at >= '2025-10-01T00:00:00.000Z'
ORDER BY created_at;

-- 4. Buscar leads vendidos com valores nos fields
SELECT 
  id,
  created_at,
  updated_at,
  status,
  fields,
  CASE 
    WHEN status = 'closed' THEN 'VENDIDO_STATUS'
    WHEN fields::text LIKE '%"sold":true%' THEN 'VENDIDO_FIELDS'
    WHEN fields::text LIKE '%"sold":"true"%' THEN 'VENDIDO_FIELDS_STRING'
    ELSE 'NAO_VENDIDO'
  END as vendido_indicador
FROM leads 
WHERE tenant_id = '8bd69047-7533-42f3-a2f7-e3a60477f68c'
AND created_at >= '2025-10-01T00:00:00.000Z'
AND (status = 'closed' OR fields::text LIKE '%"sold":true%' OR fields::text LIKE '%"sold":"true"%')
ORDER BY created_at;

-- 5. Extrair valores específicos dos leads vendidos
SELECT 
  id,
  created_at,
  updated_at,
  status,
  fields->>'orcamento' as orcamento,
  fields->>'budget' as budget,
  fields->>'valor' as valor,
  fields->>'price' as price,
  fields->>'revenue' as revenue,
  fields->>'amount' as amount,
  fields->>'total' as total,
  fields->>'sold' as sold
FROM leads 
WHERE tenant_id = '8bd69047-7533-42f3-a2f7-e3a60477f68c'
AND created_at >= '2025-10-01T00:00:00.000Z'
AND (fields->>'sold' = 'true' OR status = 'closed')
ORDER BY created_at;

-- 6. Calcular vendas por dia desde 01/10
SELECT 
  DATE(created_at) as dia,
  COUNT(*) as total_vendas,
  SUM(
    CASE 
      WHEN fields->>'orcamento' IS NOT NULL AND fields->>'orcamento' != '' 
        THEN CAST(fields->>'orcamento' AS DECIMAL)
      WHEN fields->>'budget' IS NOT NULL AND fields->>'budget' != '' 
        THEN CAST(fields->>'budget' AS DECIMAL)
      WHEN fields->>'valor' IS NOT NULL AND fields->>'valor' != '' 
        THEN CAST(fields->>'valor' AS DECIMAL)
      WHEN fields->>'price' IS NOT NULL AND fields->>'price' != '' 
        THEN CAST(fields->>'price' AS DECIMAL)
      WHEN fields->>'revenue' IS NOT NULL AND fields->>'revenue' != '' 
        THEN CAST(fields->>'revenue' AS DECIMAL)
      WHEN fields->>'amount' IS NOT NULL AND fields->>'amount' != '' 
        THEN CAST(fields->>'amount' AS DECIMAL)
      WHEN fields->>'total' IS NOT NULL AND fields->>'total' != '' 
        THEN CAST(fields->>'total' AS DECIMAL)
      ELSE 0
    END
  ) as valor_total_dia
FROM leads 
WHERE tenant_id = '8bd69047-7533-42f3-a2f7-e3a60477f68c'
AND created_at >= '2025-10-01T00:00:00.000Z'
AND (fields->>'sold' = 'true' OR status = 'closed')
GROUP BY DATE(created_at)
ORDER BY dia;
