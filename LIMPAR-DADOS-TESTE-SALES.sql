-- LIMPAR DADOS DE TESTE DA TABELA SALES
-- Remover vendas de teste que foram inseridas incorretamente

-- 1. Verificar quantas vendas de teste existem
SELECT 
    'VENDAS ANTES DA LIMPEZA' as info,
    COUNT(*) as total_vendas,
    SUM(amount) as valor_total
FROM sales 
WHERE tenant_id = '8bd69047-7533-42f3-a2f7-e3a60477f68c'
  AND sold_by_name = 'Teste Maria';

-- 2. Remover vendas de teste
DELETE FROM sales 
WHERE tenant_id = '8bd69047-7533-42f3-a2f7-e3a60477f68c'
  AND sold_by_name = 'Teste Maria';

-- 3. Verificar vendas reais restantes
SELECT 
    'VENDAS REAIS RESTANTES' as info,
    COUNT(*) as total_vendas,
    SUM(amount) as valor_total,
    AVG(amount) as ticket_medio
FROM sales 
WHERE tenant_id = '8bd69047-7533-42f3-a2f7-e3a60477f68c';

-- 4. Verificar se há vendas reais nos leads.fields
SELECT 
    'VENDAS NOS FIELDS DOS LEADS' as info,
    COUNT(*) as total_leads_vendidos,
    SUM((fields->>'budget_amount')::DECIMAL) as valor_total_fields
FROM leads 
WHERE tenant_id = '8bd69047-7533-42f3-a2f7-e3a60477f68c'
  AND (fields->>'sold' = 'true' OR fields->>'sold' = true)
  AND fields->>'budget_amount' IS NOT NULL;
