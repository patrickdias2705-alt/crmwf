-- ========================================
-- DEBUG MÉTRICAS DO JÚLIO
-- ========================================
-- Execute este script no Supabase SQL Editor para verificar os dados

-- PASSO 1: Verificar qual tenant_id o Júlio está usando
SELECT 
    'JULIO_TENANT' as tipo,
    email,
    raw_user_meta_data->>'tenant_id' AS tenant_id,
    raw_user_meta_data->>'role' AS role
FROM auth.users
WHERE email = 'recebimento.fto@gmail.com';

-- PASSO 2: Verificar quantos leads o Júlio tem acesso
SELECT 
    'LEADS_JULIO' as tipo,
    COUNT(*) as total_leads
FROM leads
WHERE tenant_id = (
    SELECT raw_user_meta_data->>'tenant_id' 
    FROM auth.users 
    WHERE email = 'recebimento.fto@gmail.com'
)::UUID;

-- PASSO 3: Verificar quantas vendas o Júlio tem acesso
SELECT 
    'VENDAS_JULIO' as tipo,
    COUNT(*) as total_vendas,
    SUM(amount) as total_valor
FROM sales
WHERE tenant_id = (
    SELECT raw_user_meta_data->>'tenant_id' 
    FROM auth.users 
    WHERE email = 'recebimento.fto@gmail.com'
)::UUID;

-- PASSO 4: Verificar quantas mensagens o Júlio tem acesso
SELECT 
    'MENSAGENS_JULIO' as tipo,
    COUNT(*) as total_mensagens
FROM messages
WHERE tenant_id = (
    SELECT raw_user_meta_data->>'tenant_id' 
    FROM auth.users 
    WHERE email = 'recebimento.fto@gmail.com'
)::UUID;

-- PASSO 5: Verificar quantos qualificados o Júlio tem acesso
SELECT 
    'QUALIFICADOS_JULIO' as tipo,
    COUNT(*) as total_qualificados
FROM leads l
JOIN stages s ON l.stage_id = s.id
WHERE l.tenant_id = (
    SELECT raw_user_meta_data->>'tenant_id' 
    FROM auth.users 
    WHERE email = 'recebimento.fto@gmail.com'
)::UUID
AND s.name ILIKE '%qualificado%';

-- PASSO 6: Verificar orçamentos em aberto do Júlio
SELECT 
    'ORCAMENTOS_JULIO' as tipo,
    COUNT(*) as total_orcamentos,
    SUM(CAST(l.fields->>'budget_amount' AS NUMERIC)) as valor_total
FROM leads l
WHERE l.tenant_id = (
    SELECT raw_user_meta_data->>'tenant_id' 
    FROM auth.users 
    WHERE email = 'recebimento.fto@gmail.com'
)::UUID
AND l.fields->>'budget_amount' IS NOT NULL
AND CAST(l.fields->>'budget_amount' AS NUMERIC) > 0;

-- PASSO 7: Comparar com a Maria
SELECT 
    'COMPARACAO_MARIA_JULIO' as tipo,
    'Maria' as usuario,
    u.raw_user_meta_data->>'tenant_id' AS tenant_id,
    COUNT(l.id) as total_leads,
    (SELECT COUNT(*) FROM sales WHERE tenant_id = u.raw_user_meta_data->>'tenant_id') as total_vendas
FROM auth.users u
LEFT JOIN leads l ON l.tenant_id::text = u.raw_user_meta_data->>'tenant_id'
WHERE u.email LIKE '%maria%'
GROUP BY u.email, u.raw_user_meta_data->>'tenant_id'

UNION ALL

SELECT 
    'COMPARACAO_MARIA_JULIO' as tipo,
    'Julio' as usuario,
    u.raw_user_meta_data->>'tenant_id' AS tenant_id,
    COUNT(l.id) as total_leads,
    (SELECT COUNT(*) FROM sales WHERE tenant_id = u.raw_user_meta_data->>'tenant_id') as total_vendas
FROM auth.users u
LEFT JOIN leads l ON l.tenant_id::text = u.raw_user_meta_data->>'tenant_id'
WHERE u.email = 'recebimento.fto@gmail.com'
GROUP BY u.email, u.raw_user_meta_data->>'tenant_id';

-- PASSO 8: Verificar se há leads duplicados ou com tenant_id diferente
SELECT 
    'LEADS_DUPLICADOS' as tipo,
    name,
    email,
    phone,
    tenant_id,
    COUNT(*) as duplicatas
FROM leads
GROUP BY name, email, phone, tenant_id
HAVING COUNT(*) > 1
ORDER BY duplicatas DESC;
