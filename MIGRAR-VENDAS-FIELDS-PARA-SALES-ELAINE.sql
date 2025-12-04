-- ========================================
-- MIGRAR VENDAS DO FIELDS PARA SALES - ELAINE
-- ========================================
-- Este script migra vendas que estão apenas no fields dos leads
-- para a tabela sales, garantindo que apareçam no banco de dados
-- Conta: elaineportaporta@gmail.com

-- PASSO 1: Identificar o tenant_id da Elaine
-- Primeiro tentar na tabela users (pública)
SELECT 
    'TENANT_ID_ELAINE' as tipo,
    u.id as user_id,
    u.email,
    u.tenant_id
FROM public.users u
WHERE u.email = 'elaineportaporta@gmail.com'

UNION ALL

-- Fallback: tentar na tabela auth.users
SELECT 
    'TENANT_ID_ELAINE' as tipo,
    u.id::text as user_id,
    u.email,
    (u.raw_user_meta_data->>'tenant_id')::uuid as tenant_id
FROM auth.users u
WHERE u.email = 'elaineportaporta@gmail.com';

-- PASSO 2: Verificar leads vendidos no fields que NÃO estão na tabela sales
-- (Substitua 'TENANT_ID_AQUI' pelo tenant_id encontrado no PASSO 1)
WITH tenant_elaine AS (
    -- Tentar primeiro na tabela users (pública)
    SELECT tenant_id 
    FROM public.users 
    WHERE email = 'elaineportaporta@gmail.com'
    LIMIT 1
    
    UNION ALL
    
    -- Fallback: tentar na tabela auth.users
    SELECT (raw_user_meta_data->>'tenant_id')::uuid as tenant_id
    FROM auth.users 
    WHERE email = 'elaineportaporta@gmail.com'
    AND raw_user_meta_data->>'tenant_id' IS NOT NULL
    LIMIT 1
)
SELECT 
    'VENDAS_FALTANTES' as tipo,
    l.id as lead_id,
    l.name as lead_name,
    l.created_at,
    l.updated_at,
    l.fields->>'sold' as sold_field,
    l.fields->>'sold_amount' as sold_amount_field,
    l.fields->>'budget_amount' as budget_amount_field,
    l.fields->>'budget_description' as budget_description_field,
    l.fields->>'budget_file_name' as budget_file_name_field,
    l.stage_id,
    s.name as stage_name,
    sa.id as sales_id_existente
FROM leads l
CROSS JOIN tenant_elaine te
LEFT JOIN stages s ON l.stage_id = s.id
LEFT JOIN sales sa ON sa.lead_id = l.id
WHERE l.tenant_id = te.tenant_id
AND (
    l.fields->>'sold' = 'true' 
    OR l.fields->>'sold_amount' IS NOT NULL
    OR (l.fields->>'sold_amount' IS NOT NULL AND CAST(l.fields->>'sold_amount' AS NUMERIC) > 0)
)
AND sa.id IS NULL  -- Não tem registro na tabela sales
ORDER BY l.updated_at DESC;

-- PASSO 3: MIGRAR VENDAS DO FIELDS PARA A TABELA SALES
-- Este comando insere as vendas faltantes na tabela sales
WITH tenant_elaine AS (
    -- Tentar primeiro na tabela users (pública)
    SELECT tenant_id 
    FROM public.users 
    WHERE email = 'elaineportaporta@gmail.com'
    LIMIT 1
    
    UNION ALL
    
    -- Fallback: tentar na tabela auth.users
    SELECT (raw_user_meta_data->>'tenant_id')::uuid as tenant_id
    FROM auth.users 
    WHERE email = 'elaineportaporta@gmail.com'
    AND raw_user_meta_data->>'tenant_id' IS NOT NULL
    LIMIT 1
),
leads_vendidos_sem_sales AS (
    SELECT 
        l.id as lead_id,
        l.tenant_id,
        l.name as lead_name,
        l.stage_id,
        l.assigned_to,
        l.created_at,
        l.updated_at,
        -- Tentar pegar sold_amount, se não tiver, pegar budget_amount
        COALESCE(
            CAST(l.fields->>'sold_amount' AS NUMERIC),
            CAST(l.fields->>'budget_amount' AS NUMERIC),
            0
        ) as amount,
        l.fields->>'budget_description' as budget_description,
        l.fields->>'budget_file_name' as budget_file_name,
        l.fields->>'sold_at' as sold_at_field,
        l.fields->>'sold_by' as sold_by_field
    FROM leads l
    CROSS JOIN tenant_elaine te
    LEFT JOIN sales sa ON sa.lead_id = l.id
    WHERE l.tenant_id = te.tenant_id
    AND (
        l.fields->>'sold' = 'true' 
        OR l.fields->>'sold_amount' IS NOT NULL
        OR (l.fields->>'budget_amount' IS NOT NULL AND CAST(l.fields->>'budget_amount' AS NUMERIC) > 0)
    )
    AND sa.id IS NULL  -- Não tem registro na tabela sales
    AND COALESCE(
        CAST(l.fields->>'sold_amount' AS NUMERIC),
        CAST(l.fields->>'budget_amount' AS NUMERIC),
        0
    ) > 0  -- Só migrar se tiver valor > 0
)
INSERT INTO sales (
    tenant_id,
    lead_id,
    amount,
    budget_description,
    budget_file_name,
    sold_at,
    sold_by_name,
    created_at,
    updated_at
)
SELECT 
    tenant_id,
    lead_id,
    amount,
    budget_description,
    budget_file_name,
    COALESCE(
        CASE 
            WHEN sold_at_field IS NOT NULL AND sold_at_field != '' 
            THEN sold_at_field::timestamp
            ELSE NULL
        END,
        updated_at,
        created_at
    ) as sold_at,
    COALESCE(sold_by_field, 'Sistema') as sold_by_name,
    COALESCE(
        CASE 
            WHEN sold_at_field IS NOT NULL AND sold_at_field != '' 
            THEN sold_at_field::timestamp
            ELSE NULL
        END,
        updated_at,
        created_at
    ) as created_at,
    NOW() as updated_at
FROM leads_vendidos_sem_sales
ON CONFLICT (lead_id) DO NOTHING;  -- Evitar duplicatas

-- PASSO 4: Verificar quantas vendas foram migradas
WITH tenant_elaine AS (
    -- Tentar primeiro na tabela users (pública)
    SELECT tenant_id 
    FROM public.users 
    WHERE email = 'elaineportaporta@gmail.com'
    LIMIT 1
    
    UNION ALL
    
    -- Fallback: tentar na tabela auth.users
    SELECT (raw_user_meta_data->>'tenant_id')::uuid as tenant_id
    FROM auth.users 
    WHERE email = 'elaineportaporta@gmail.com'
    AND raw_user_meta_data->>'tenant_id' IS NOT NULL
    LIMIT 1
)
SELECT 
    'VENDAS_MIGRADAS' as tipo,
    COUNT(*) as total_vendas_migradas,
    SUM(amount) as valor_total_migrado
FROM sales s
CROSS JOIN tenant_elaine te
WHERE s.tenant_id = te.tenant_id
AND s.created_at >= NOW() - INTERVAL '1 minute';  -- Vendas criadas nos últimos minutos

-- PASSO 5: Verificar total de vendas na tabela sales (após migração)
WITH tenant_elaine AS (
    -- Tentar primeiro na tabela users (pública)
    SELECT tenant_id 
    FROM public.users 
    WHERE email = 'elaineportaporta@gmail.com'
    LIMIT 1
    
    UNION ALL
    
    -- Fallback: tentar na tabela auth.users
    SELECT (raw_user_meta_data->>'tenant_id')::uuid as tenant_id
    FROM auth.users 
    WHERE email = 'elaineportaporta@gmail.com'
    AND raw_user_meta_data->>'tenant_id' IS NOT NULL
    LIMIT 1
)
SELECT 
    'TOTAL_VENDAS_SALES' as tipo,
    COUNT(*) as total_vendas,
    SUM(amount) as valor_total,
    AVG(amount) as ticket_medio,
    MIN(sold_at) as primeira_venda,
    MAX(sold_at) as ultima_venda
FROM sales s
CROSS JOIN tenant_elaine te
WHERE s.tenant_id = te.tenant_id;

-- PASSO 6: Comparar com vendas no fields (deve ser igual ou menor após migração)
WITH tenant_elaine AS (
    -- Tentar primeiro na tabela users (pública)
    SELECT tenant_id 
    FROM public.users 
    WHERE email = 'elaineportaporta@gmail.com'
    LIMIT 1
    
    UNION ALL
    
    -- Fallback: tentar na tabela auth.users
    SELECT (raw_user_meta_data->>'tenant_id')::uuid as tenant_id
    FROM auth.users 
    WHERE email = 'elaineportaporta@gmail.com'
    AND raw_user_meta_data->>'tenant_id' IS NOT NULL
    LIMIT 1
)
SELECT 
    'COMPARACAO_FINAL' as tipo,
    'Tabela Sales' as fonte,
    COUNT(*) as total_registros,
    SUM(amount) as valor_total
FROM sales s
CROSS JOIN tenant_elaine te
WHERE s.tenant_id = te.tenant_id

UNION ALL

SELECT 
    'COMPARACAO_FINAL' as tipo,
    'Fields Leads' as fonte,
    COUNT(*) as total_registros,
    SUM(COALESCE(
        CAST(fields->>'sold_amount' AS NUMERIC),
        CAST(fields->>'budget_amount' AS NUMERIC),
        0
    )) as valor_total
FROM leads l
CROSS JOIN tenant_elaine te
WHERE l.tenant_id = te.tenant_id
AND (
    l.fields->>'sold' = 'true' 
    OR l.fields->>'sold_amount' IS NOT NULL
    OR (l.fields->>'budget_amount' IS NOT NULL AND CAST(l.fields->>'budget_amount' AS NUMERIC) > 0)
);

