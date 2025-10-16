-- ========================================
-- DESCOBRIR EMAILS REAIS DOS USUÁRIOS
-- ========================================
-- Execute este script no Supabase SQL Editor

-- PASSO 1: Ver TODOS os usuários cadastrados no sistema
SELECT 
    'TODOS_USUARIOS' as tipo,
    email,
    id as user_id,
    created_at,
    raw_user_meta_data->>'tenant_id' AS tenant_id,
    raw_user_meta_data->>'role' AS role,
    raw_user_meta_data->>'name' AS name
FROM 
    auth.users
ORDER BY 
    created_at ASC;

-- PASSO 2: Verificar especificamente usuários que podem ser Maria
SELECT 
    'POSSIVEIS_MARIAS' as tipo,
    email,
    id as user_id,
    created_at,
    raw_user_meta_data->>'tenant_id' AS tenant_id,
    raw_user_meta_data->>'role' AS role,
    raw_user_meta_data->>'name' AS name
FROM 
    auth.users
WHERE 
    email ILIKE '%maria%' 
    OR raw_user_meta_data->>'name' ILIKE '%maria%'
ORDER BY 
    created_at ASC;

-- PASSO 3: Verificar especificamente usuários que podem ser Julio
SELECT 
    'POSSIVEIS_JULIOS' as tipo,
    email,
    id as user_id,
    created_at,
    raw_user_meta_data->>'tenant_id' AS tenant_id,
    raw_user_meta_data->>'role' AS role,
    raw_user_meta_data->>'name' AS name
FROM 
    auth.users
WHERE 
    email ILIKE '%julio%' 
    OR email ILIKE '%recebimento%'
    OR raw_user_meta_data->>'name' ILIKE '%julio%'
ORDER BY 
    created_at ASC;

-- PASSO 4: Verificar usuários com role de supervisor
SELECT 
    'SUPERVISORES' as tipo,
    email,
    id as user_id,
    created_at,
    raw_user_meta_data->>'tenant_id' AS tenant_id,
    raw_user_meta_data->>'role' AS role,
    raw_user_meta_data->>'name' AS name
FROM 
    auth.users
WHERE 
    raw_user_meta_data->>'role' = 'supervisor'
ORDER BY 
    created_at ASC;

-- PASSO 5: Verificar usuários com role de admin
SELECT 
    'ADMINS' as tipo,
    email,
    id as user_id,
    created_at,
    raw_user_meta_data->>'tenant_id' AS tenant_id,
    raw_user_meta_data->>'role' AS role,
    raw_user_meta_data->>'name' AS name
FROM 
    auth.users
WHERE 
    raw_user_meta_data->>'role' = 'admin'
ORDER BY 
    created_at ASC;

-- PASSO 6: Verificar quantos leads cada usuário tem
SELECT 
    'LEADS_POR_USUARIO' as tipo,
    u.email,
    u.raw_user_meta_data->>'name' AS name,
    u.raw_user_meta_data->>'tenant_id' AS tenant_id,
    u.raw_user_meta_data->>'role' AS role,
    COUNT(l.id) as total_leads
FROM auth.users u
LEFT JOIN leads l ON l.tenant_id::text = u.raw_user_meta_data->>'tenant_id'
GROUP BY u.email, u.raw_user_meta_data->>'name', u.raw_user_meta_data->>'tenant_id', u.raw_user_meta_data->>'role'
ORDER BY total_leads DESC;

-- PASSO 7: Verificar quantas vendas cada usuário tem
SELECT 
    'VENDAS_POR_USUARIO' as tipo,
    u.email,
    u.raw_user_meta_data->>'name' AS name,
    u.raw_user_meta_data->>'tenant_id' AS tenant_id,
    u.raw_user_meta_data->>'role' AS role,
    COUNT(s.id) as total_vendas,
    SUM(s.amount) as valor_total
FROM auth.users u
LEFT JOIN sales s ON s.tenant_id::text = u.raw_user_meta_data->>'tenant_id'
GROUP BY u.email, u.raw_user_meta_data->>'name', u.raw_user_meta_data->>'tenant_id', u.raw_user_meta_data->>'role'
ORDER BY total_vendas DESC;
