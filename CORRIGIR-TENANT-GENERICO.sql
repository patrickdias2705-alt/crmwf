-- ========================================
-- CORRIGIR TENANT_ID - VERSÃO GENÉRICA
-- ========================================
-- Execute este script passo a passo no Supabase SQL Editor

-- PASSO 1: Ver TODOS os usuários e seus tenant_ids
SELECT 
    email,
    id as user_id,
    raw_user_meta_data->>'tenant_id' AS tenant_id_atual,
    raw_user_meta_data->>'role' AS role
FROM 
    auth.users
ORDER BY 
    email;

-- PASSO 2: Identificar o tenant_id da Maria
SELECT 
    email,
    raw_user_meta_data->>'tenant_id' AS tenant_id_maria
FROM 
    auth.users
WHERE 
    email LIKE '%maria%';

-- PASSO 3: Identificar o tenant_id do Júlio (recebimento.fto@gmail.com)
SELECT 
    email,
    raw_user_meta_data->>'tenant_id' AS tenant_id_julio
FROM 
    auth.users
WHERE 
    email = 'recebimento.fto@gmail.com';

-- PASSO 4: Identificar o tenant_id do Taiguara
SELECT 
    email,
    raw_user_meta_data->>'tenant_id' AS tenant_id_taiguara
FROM 
    auth.users
WHERE 
    email LIKE '%taiguara%';

-- ========================================
-- DEPOIS DE IDENTIFICAR OS EMAILS CORRETOS ACIMA,
-- SUBSTITUA OS EMAILS ABAIXO PELOS CORRETOS E EXECUTE:
-- ========================================

-- PASSO 5: Atualizar Júlio para o mesmo tenant_id da Maria
-- SUBSTITUA 'EMAIL_DA_MARIA' e 'EMAIL_DO_JULIO' pelos emails corretos
UPDATE auth.users
SET raw_user_meta_data = jsonb_set(
    COALESCE(raw_user_meta_data, '{}'::jsonb),
    '{tenant_id}',
    (SELECT to_jsonb(raw_user_meta_data->>'tenant_id') FROM auth.users WHERE email = 'EMAIL_DA_MARIA')
)
WHERE email = 'EMAIL_DO_JULIO';

-- PASSO 6: Atualizar Taiguara para o mesmo tenant_id da Maria
-- SUBSTITUA 'EMAIL_DA_MARIA' e 'EMAIL_DO_TAIGUARA' pelos emails corretos
UPDATE auth.users
SET raw_user_meta_data = jsonb_set(
    COALESCE(raw_user_meta_data, '{}'::jsonb),
    '{tenant_id}',
    (SELECT to_jsonb(raw_user_meta_data->>'tenant_id') FROM auth.users WHERE email = 'EMAIL_DA_MARIA')
)
WHERE email = 'EMAIL_DO_TAIGUARA';

-- PASSO 7: Verificar se funcionou
SELECT 
    email,
    raw_user_meta_data->>'tenant_id' AS tenant_id_atualizado,
    raw_user_meta_data->>'role' AS role
FROM 
    auth.users
WHERE 
    email IN ('EMAIL_DA_MARIA', 'EMAIL_DO_JULIO', 'EMAIL_DO_TAIGUARA')
ORDER BY 
    email;

-- PASSO 8: Verificar leads por tenant
SELECT 
    tenant_id,
    COUNT(*) AS total_leads,
    COUNT(CASE WHEN status = 'closed' THEN 1 END) AS leads_fechados
FROM 
    public.leads
GROUP BY 
    tenant_id
ORDER BY 
    tenant_id;

-- PASSO 9: Verificar vendas por tenant
SELECT 
    tenant_id,
    COUNT(*) AS total_vendas,
    SUM(amount) AS total_valor,
    AVG(amount) AS ticket_medio
FROM 
    public.sales
GROUP BY 
    tenant_id
ORDER BY 
    tenant_id;

-- ========================================
-- INSTRUÇÕES:
-- ========================================
-- 1. Execute o PASSO 1 para ver TODOS os usuários
-- 2. Execute os PASSOS 2, 3 e 4 para identificar os emails corretos
-- 3. SUBSTITUA os emails nos PASSOS 5, 6 e 7 pelos emails reais
-- 4. Execute os PASSOS 5 e 6 para atualizar os tenant_ids
-- 5. Execute o PASSO 7 para confirmar
-- 6. Execute os PASSOS 8 e 9 para verificar os dados
-- 7. Faça LOGOUT e LOGIN novamente no sistema
-- ========================================

