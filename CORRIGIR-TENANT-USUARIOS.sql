-- ========================================
-- CORRIGIR TENANT_ID DOS USUÁRIOS
-- ========================================
-- Este script verifica e corrige o tenant_id dos usuários
-- para que Maria, Júlio e Taiguara vejam os mesmos dados

-- PASSO 1: Verificar tenant_ids atuais
SELECT 
    email,
    id as user_id,
    raw_user_meta_data->>'tenant_id' AS tenant_id_atual,
    raw_user_meta_data->>'role' AS role
FROM 
    auth.users
WHERE 
    email IN ('maria@varejo.com', 'recebimento.fto@gmail.com', 'taiguara@varejo.com', 'admin@demo.com')
ORDER BY 
    email;

-- PASSO 2: Identificar o tenant_id correto (da Maria)
-- Execute esta query primeiro para ver qual é o tenant_id da Maria
SELECT 
    raw_user_meta_data->>'tenant_id' AS tenant_id_maria
FROM 
    auth.users
WHERE 
    email = 'maria@varejo.com';

-- PASSO 3: Atualizar Júlio para o mesmo tenant_id da Maria
-- IMPORTANTE: Substitua 'TENANT_ID_DA_MARIA' pelo valor real obtido no PASSO 2
-- Exemplo: Se o tenant_id da Maria for '123e4567-e89b-12d3-a456-426614174000'
-- Você deve substituir 'TENANT_ID_DA_MARIA' por esse UUID

-- Atualizar Júlio (recebimento.fto@gmail.com)
UPDATE auth.users
SET raw_user_meta_data = jsonb_set(
    COALESCE(raw_user_meta_data, '{}'::jsonb),
    '{tenant_id}',
    (SELECT to_jsonb(raw_user_meta_data->>'tenant_id') FROM auth.users WHERE email = 'maria@varejo.com')
)
WHERE email = 'recebimento.fto@gmail.com';

-- Atualizar Taiguara
UPDATE auth.users
SET raw_user_meta_data = jsonb_set(
    COALESCE(raw_user_meta_data, '{}'::jsonb),
    '{tenant_id}',
    (SELECT to_jsonb(raw_user_meta_data->>'tenant_id') FROM auth.users WHERE email = 'maria@varejo.com')
)
WHERE email = 'taiguara@varejo.com';

-- PASSO 4: Verificar se a atualização funcionou
SELECT 
    email,
    raw_user_meta_data->>'tenant_id' AS tenant_id_atualizado,
    raw_user_meta_data->>'role' AS role
FROM 
    auth.users
WHERE 
    email IN ('maria@varejo.com', 'recebimento.fto@gmail.com', 'taiguara@varejo.com')
ORDER BY 
    email;

-- PASSO 5: Verificar quantos leads cada tenant tem
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

-- PASSO 6: Verificar vendas por tenant
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
-- 1. Execute o PASSO 1 para ver os tenant_ids atuais
-- 2. Execute o PASSO 2 para identificar o tenant_id da Maria
-- 3. Execute o PASSO 3 para atualizar Júlio e Taiguara
-- 4. Execute o PASSO 4 para confirmar a atualização
-- 5. Execute o PASSO 5 e 6 para verificar os dados
-- 6. Faça logout e login novamente no sistema para aplicar as mudanças
-- ========================================

