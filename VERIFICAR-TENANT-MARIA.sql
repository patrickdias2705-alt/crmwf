-- ========================================
-- VERIFICAR TENANT_ID COMPLETO DA MARIA
-- ========================================
-- Execute este script no Supabase SQL Editor

SELECT 
    'TENANT_MARIA_COMPLETO' as tipo,
    email,
    raw_user_meta_data->>'name' as name,
    raw_user_meta_data->>'tenant_id' as tenant_id,
    LENGTH(raw_user_meta_data->>'tenant_id') AS tamanho_tenant_id
FROM 
    auth.users
WHERE 
    email = 'mariabrebal26@gmail.com';

-- Verificar se há leads com esse tenant_id
SELECT 
    'LEADS_MARIA' as tipo,
    COUNT(*) as total_leads
FROM leads
WHERE tenant_id = (
    SELECT raw_user_meta_data->>'tenant_id' 
    FROM auth.users 
    WHERE email = 'mariabrebal26@gmail.com'
)::UUID;

-- Verificar se há vendas com esse tenant_id
SELECT 
    'VENDAS_MARIA' as tipo,
    COUNT(*) as total_vendas,
    SUM(amount) as valor_total
FROM sales
WHERE tenant_id = (
    SELECT raw_user_meta_data->>'tenant_id' 
    FROM auth.users 
    WHERE email = 'mariabrebal26@gmail.com'
)::UUID;
