-- ========================================
-- VERIFICAÇÃO DE REALTIME EM TODAS AS CONTAS
-- ========================================
-- Execute este script no Supabase SQL Editor

-- PASSO 1: Verificar se todos os usuários (exceto Julia) têm o mesmo tenant_id
SELECT 
    'TENANT_IDS_ATUAIS' as tipo,
    email,
    raw_user_meta_data->>'name' as name,
    raw_user_meta_data->>'tenant_id' as tenant_id,
    CASE 
        WHEN raw_user_meta_data->>'tenant_id' = '8bd69047-7533-42f3-a2f7-e3a60477f68c' 
        THEN 'CORRETO' 
        ELSE 'INCORRETO' 
    END as status
FROM auth.users
WHERE email IN (
    'taicaracho@gmail.com',
    'patrickdias2705@gmail.com', 
    'mariabrebal26@gmail.com',
    'recebimento.fto@gmail.com'
)
ORDER BY email;

-- PASSO 2: Verificar se Julia tem tenant_id diferente
SELECT 
    'JULIA_TENANT' as tipo,
    email,
    raw_user_meta_data->>'name' as name,
    raw_user_meta_data->>'tenant_id' as tenant_id,
    CASE 
        WHEN raw_user_meta_data->>'tenant_id' != '8bd69047-7533-42f3-a2f7-e3a60477f68c' 
        THEN 'DIFERENTE (CORRETO)' 
        ELSE 'IGUAL (INCORRETO)' 
    END as status
FROM auth.users
WHERE email = 'julia@wfcirurgicos.com.br';

-- PASSO 3: Verificar dados atuais em tempo real
SELECT 
    'DADOS_ATUAIS' as tipo,
    'Tabela Sales' as fonte,
    COUNT(*) as total_vendas,
    SUM(amount) as valor_total,
    MAX(created_at) as ultima_venda
FROM sales
WHERE tenant_id = '8bd69047-7533-42f3-a2f7-e3a60477f68c'

UNION ALL

SELECT 
    'DADOS_ATUAIS' as tipo,
    'Fields Leads' as fonte,
    COUNT(*) as total_vendas,
    SUM(CAST(fields->>'sold_amount' AS NUMERIC)) as valor_total,
    MAX(updated_at) as ultima_venda
FROM leads
WHERE tenant_id = '8bd69047-7533-42f3-a2f7-e3a60477f68c'
AND (fields->>'sold' = 'true' OR fields->>'sold_amount' IS NOT NULL);

-- PASSO 4: Verificar se há vendas recentes (últimas 24h)
SELECT 
    'VENDAS_RECENTES' as tipo,
    COUNT(*) as vendas_24h,
    SUM(amount) as valor_24h
FROM sales
WHERE tenant_id = '8bd69047-7533-42f3-a2f7-e3a60477f68c'
AND created_at >= NOW() - INTERVAL '24 hours';

-- PASSO 5: Verificar leads recentes (últimas 24h)
SELECT 
    'LEADS_RECENTES' as tipo,
    COUNT(*) as leads_24h,
    COUNT(CASE WHEN fields->>'sold' = 'true' THEN 1 END) as vendidos_24h
FROM leads
WHERE tenant_id = '8bd69047-7533-42f3-a2f7-e3a60477f68c'
AND created_at >= NOW() - INTERVAL '24 hours';

-- PASSO 6: Verificar se o sistema está sincronizado
SELECT 
    'SINCRONIZACAO' as tipo,
    CASE 
        WHEN (SELECT SUM(amount) FROM sales WHERE tenant_id = '8bd69047-7533-42f3-a2f7-e3a60477f68c') = 
             (SELECT SUM(CAST(fields->>'sold_amount' AS NUMERIC)) FROM leads WHERE tenant_id = '8bd69047-7533-42f3-a2f7-e3a60477f68c' AND (fields->>'sold' = 'true' OR fields->>'sold_amount' IS NOT NULL))
        THEN 'SINCRONIZADO'
        ELSE 'DESINCRONIZADO'
    END as status,
    (SELECT SUM(amount) FROM sales WHERE tenant_id = '8bd69047-7533-42f3-a2f7-e3a60477f68c') as valor_sales,
    (SELECT SUM(CAST(fields->>'sold_amount' AS NUMERIC)) FROM leads WHERE tenant_id = '8bd69047-7533-42f3-a2f7-e3a60477f68c' AND (fields->>'sold' = 'true' OR fields->>'sold_amount' IS NOT NULL)) as valor_fields;

-- PASSO 7: Verificar se há dados para Julia (deve estar vazio)
SELECT 
    'DADOS_JULIA' as tipo,
    'Leads' as fonte,
    COUNT(*) as total
FROM leads
WHERE tenant_id = (
    SELECT raw_user_meta_data->>'tenant_id' 
    FROM auth.users 
    WHERE email = 'julia@wfcirurgicos.com.br'
)

UNION ALL

SELECT 
    'DADOS_JULIA' as tipo,
    'Sales' as fonte,
    COUNT(*) as total
FROM sales
WHERE tenant_id = (
    SELECT raw_user_meta_data->>'tenant_id' 
    FROM auth.users 
    WHERE email = 'julia@wfcirurgicos.com.br'
);
