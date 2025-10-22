-- Verificar valores reais dos orçamentos dos leads

-- 1. Verificar estrutura da tabela leads para campos de orçamento
SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'leads' 
AND table_schema = 'public'
AND (column_name LIKE '%orcamento%' OR column_name LIKE '%budget%' OR column_name LIKE '%valor%' OR column_name LIKE '%price%' OR column_name LIKE '%revenue%')
ORDER BY ordinal_position;

-- 2. Verificar campos JSON dos leads para valores de orçamento
SELECT 
  id,
  created_at,
  status,
  fields,
  CASE 
    WHEN fields::text LIKE '%"orcamento"%' THEN 'TEM_ORCAMENTO'
    WHEN fields::text LIKE '%"budget"%' THEN 'TEM_BUDGET'
    WHEN fields::text LIKE '%"valor"%' THEN 'TEM_VALOR'
    WHEN fields::text LIKE '%"price"%' THEN 'TEM_PRICE'
    WHEN fields::text LIKE '%"revenue"%' THEN 'TEM_REVENUE'
    ELSE 'SEM_VALOR'
  END as tipo_valor,
  fields::text as fields_text
FROM leads 
WHERE tenant_id = '8bd69047-7533-42f3-a2f7-e3a60477f68c'
AND created_at >= '2025-10-07T00:00:00.000Z'
AND created_at <= '2025-10-31T23:59:59.999Z'
ORDER BY created_at
LIMIT 20;

-- 3. Extrair valores específicos dos campos JSON
SELECT 
  id,
  created_at,
  status,
  fields->>'orcamento' as orcamento,
  fields->>'budget' as budget,
  fields->>'valor' as valor,
  fields->>'price' as price,
  fields->>'revenue' as revenue,
  fields->>'sold' as sold
FROM leads 
WHERE tenant_id = '8bd69047-7533-42f3-a2f7-e3a60477f68c'
AND created_at >= '2025-10-07T00:00:00.000Z'
AND created_at <= '2025-10-31T23:59:59.999Z'
AND (fields->>'sold' = 'true' OR status = 'closed')
ORDER BY created_at;

-- 4. Calcular total real dos orçamentos vendidos
SELECT 
  'TOTAL_REAL_ORCAMENTOS' as tipo,
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
      ELSE 0
    END
  ) as valor_total_real
FROM leads 
WHERE tenant_id = '8bd69047-7533-42f3-a2f7-e3a60477f68c'
AND created_at >= '2025-10-07T00:00:00.000Z'
AND created_at <= '2025-10-31T23:59:59.999Z'
AND (fields->>'sold' = 'true' OR status = 'closed');

-- 5. Comparar com valores fixos que a IA estava usando
SELECT 
  'COMPARACAO' as tipo,
  COUNT(*) as total_vendas,
  1052.08 * COUNT(*) as valor_com_ia_fixa,
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
      ELSE 0
    END
  ) as valor_real_orcamentos
FROM leads 
WHERE tenant_id = '8bd69047-7533-42f3-a2f7-e3a60477f68c'
AND created_at >= '2025-10-07T00:00:00.000Z'
AND created_at <= '2025-10-31T23:59:59.999Z'
AND (fields->>'sold' = 'true' OR status = 'closed');
