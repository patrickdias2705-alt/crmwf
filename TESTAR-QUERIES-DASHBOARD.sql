-- =====================================================
-- TESTAR QUERIES DO DASHBOARD POR TENANT
-- =====================================================

-- Testar query de leads para cada tenant
-- Tenant Varejo (Maria)
SELECT 
    'LEADS - VAREJO' as info,
    COUNT(*) as total_leads
FROM leads 
WHERE tenant_id = (SELECT id FROM tenants WHERE name = 'Varejo');

-- Tenant Porta a Porta (Elaine)
SELECT 
    'LEADS - PORTA A PORTA' as info,
    COUNT(*) as total_leads
FROM leads 
WHERE tenant_id = (SELECT id FROM tenants WHERE name = 'Porta a Porta');

-- Tenant Distribuidor (Julia)
SELECT 
    'LEADS - DISTRIBUIDOR' as info,
    COUNT(*) as total_leads
FROM leads 
WHERE tenant_id = (SELECT id FROM tenants WHERE name = 'Distribuidor');

-- Testar query de sales para cada tenant
-- Tenant Varejo (Maria)
SELECT 
    'SALES - VAREJO' as info,
    COUNT(*) as total_sales,
    COALESCE(SUM(amount), 0) as total_valor
FROM sales 
WHERE tenant_id = (SELECT id FROM tenants WHERE name = 'Varejo');

-- Tenant Porta a Porta (Elaine)
SELECT 
    'SALES - PORTA A PORTA' as info,
    COUNT(*) as total_sales,
    COALESCE(SUM(amount), 0) as total_valor
FROM sales 
WHERE tenant_id = (SELECT id FROM tenants WHERE name = 'Porta a Porta');

-- Tenant Distribuidor (Julia)
SELECT 
    'SALES - DISTRIBUIDOR' as info,
    COUNT(*) as total_sales,
    COALESCE(SUM(amount), 0) as total_valor
FROM sales 
WHERE tenant_id = (SELECT id FROM tenants WHERE name = 'Distribuidor');
