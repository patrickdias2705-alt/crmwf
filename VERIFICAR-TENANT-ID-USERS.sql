-- ========================================
-- VERIFICAR TENANT_ID NA TABELA USERS
-- ========================================
-- Execute este script no Supabase SQL Editor

-- PASSO 1: Verificar se os usuários existem na tabela users
SELECT 
    'USUARIOS_TABELA_USERS' as tipo,
    id,
    email,
    tenant_id,
    active
FROM 
    public.users
WHERE 
    email IN ('mariabrebal26@gmail.com', 'recebimento.fto@gmail.com', 'taicaracho@gmail.com')
ORDER BY 
    email;

-- PASSO 2: Verificar se os tenant_ids estão corretos na tabela users
UPDATE public.users
SET tenant_id = '8bd69047-7533-42f3-a2f7-e3a60477f68c'::UUID
WHERE 
    email IN ('mariabrebal26@gmail.com', 'recebimento.fto@gmail.com', 'taicaracho@gmail.com')
    AND (tenant_id IS NULL OR tenant_id != '8bd69047-7533-42f3-a2f7-e3a60477f68c'::UUID);

-- PASSO 3: Verificar se a atualização funcionou
SELECT 
    'USUARIOS_APOS_ATUALIZACAO' as tipo,
    id,
    email,
    tenant_id,
    active
FROM 
    public.users
WHERE 
    email IN ('mariabrebal26@gmail.com', 'recebimento.fto@gmail.com', 'taicaracho@gmail.com')
ORDER BY 
    email;

-- PASSO 4: Verificar se há inconsistências entre auth.users e public.users
SELECT 
    'COMPARACAO_AUTH_VS_PUBLIC' as tipo,
    au.email as auth_email,
    au.raw_user_meta_data->>'tenant_id' as auth_tenant_id,
    pu.tenant_id as public_tenant_id,
    CASE 
        WHEN au.raw_user_meta_data->>'tenant_id' = pu.tenant_id::text THEN 'CONSISTENTE'
        ELSE 'INCONSISTENTE'
    END as status
FROM 
    auth.users au
LEFT JOIN 
    public.users pu ON au.email = pu.email
WHERE 
    au.email IN ('mariabrebal26@gmail.com', 'recebimento.fto@gmail.com', 'taicaracho@gmail.com')
ORDER BY 
    au.email;

-- PASSO 5: Verificar vendas por tenant_id
SELECT 
    'VENDAS_POR_TENANT' as tipo,
    tenant_id,
    COUNT(*) AS total_vendas,
    SUM(amount) AS total_valor
FROM 
    public.sales
GROUP BY 
    tenant_id
ORDER BY 
    total_valor DESC;

-- PASSO 6: Verificar leads por tenant_id
SELECT 
    'LEADS_POR_TENANT' as tipo,
    tenant_id,
    COUNT(*) AS total_leads,
    COUNT(CASE WHEN status = 'closed' THEN 1 END) AS leads_fechados
FROM 
    public.leads
GROUP BY 
    tenant_id
ORDER BY 
    total_leads DESC;

-- ========================================
-- INSTRUÇÕES:
-- ========================================
-- 1. Execute TODOS os passos em sequência
-- 2. Verifique que o PASSO 3 mostra tenant_id correto
-- 3. Verifique que o PASSO 4 mostra "CONSISTENTE" para todos
-- 4. Faça logout e login novamente
-- 5. Recarregue a página (F5)
-- ========================================
