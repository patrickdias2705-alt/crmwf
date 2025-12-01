-- =====================================================
-- TESTAR MÉTRICAS POR TENANT
-- =====================================================

-- 1. Testar leads para cada tenant
SELECT 
    'LEADS - VAREJO' as info,
    COUNT(*) as total_leads
FROM leads 
WHERE tenant_id = (SELECT id FROM tenants WHERE name = 'Varejo');

SELECT 
    'LEADS - PORTA A PORTA' as info,
    COUNT(*) as total_leads
FROM leads 
WHERE tenant_id = (SELECT id FROM tenants WHERE name = 'Porta a Porta');

SELECT 
    'LEADS - DISTRIBUIDOR' as info,
    COUNT(*) as total_leads
FROM leads 
WHERE tenant_id = (SELECT id FROM tenants WHERE name = 'Distribuidor');

-- 2. Testar sales para cada tenant
SELECT 
    'SALES - VAREJO' as info,
    COUNT(*) as total_sales,
    COALESCE(SUM(amount), 0) as total_valor
FROM sales 
WHERE tenant_id = (SELECT id FROM tenants WHERE name = 'Varejo');

SELECT 
    'SALES - PORTA A PORTA' as info,
    COUNT(*) as total_sales,
    COALESCE(SUM(amount), 0) as total_valor
FROM sales 
WHERE tenant_id = (SELECT id FROM tenants WHERE name = 'Porta a Porta');

SELECT 
    'SALES - DISTRIBUIDOR' as info,
    COUNT(*) as total_sales,
    COALESCE(SUM(amount), 0) as total_valor
FROM sales 
WHERE tenant_id = (SELECT id FROM tenants WHERE name = 'Distribuidor');
