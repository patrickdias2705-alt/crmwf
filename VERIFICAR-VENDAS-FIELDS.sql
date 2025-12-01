-- ========================================
-- VERIFICAR VENDAS NO CAMPO FIELDS
-- ========================================
-- Execute este script no Supabase SQL Editor

-- Verificar leads vendidos no fields para os dias específicos
SELECT 
    'LEADS_VENDIDOS_FIELDS' as tipo,
    DATE(created_at) as data,
    COUNT(*) as total_leads,
    COUNT(CASE WHEN fields->>'sold' = 'true' THEN 1 END) as leads_vendidos,
    SUM(CASE WHEN fields->>'sold_amount' IS NOT NULL THEN CAST(fields->>'sold_amount' AS NUMERIC) ELSE 0 END) as valor_vendas
FROM leads
WHERE tenant_id = '8bd69047-7533-42f3-a2f7-e3a60477f68c'
AND DATE(created_at) IN ('2025-10-07', '2025-10-10', '2025-10-13', '2025-10-14', '2025-10-15')
GROUP BY DATE(created_at)
ORDER BY data;

-- Verificar detalhes dos leads vendidos
SELECT 
    'DETALHES_LEADS_VENDIDOS' as tipo,
    DATE(created_at) as data,
    name,
    email,
    status,
    fields->>'sold' as sold,
    fields->>'sold_amount' as sold_amount,
    fields->>'sale_value' as sale_value
FROM leads
WHERE tenant_id = '8bd69047-7533-42f3-a2f7-e3a60477f68c'
AND DATE(created_at) IN ('2025-10-07', '2025-10-10', '2025-10-13', '2025-10-14', '2025-10-15')
AND fields->>'sold' = 'true'
ORDER BY created_at;
