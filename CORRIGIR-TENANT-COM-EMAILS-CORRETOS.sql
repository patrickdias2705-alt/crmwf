-- ========================================
-- CORRIGIR TENANT COM EMAILS CORRETOS
-- ========================================
-- Execute este script APÓS descobrir os emails reais

-- PASSO 1: Primeiro execute o script DESCOBRIR-EMAILS-REAIS.sql
-- para descobrir quais são os emails corretos

-- PASSO 2: Depois substitua os emails abaixo pelos emails reais encontrados
-- e execute este script

-- EXEMPLO (substitua pelos emails reais):
-- UPDATE auth.users
-- SET raw_user_meta_data = jsonb_set(
--     COALESCE(raw_user_meta_data, '{}'::jsonb),
--     '{tenant_id}',
--     (SELECT to_jsonb(raw_user_meta_data->>'tenant_id') FROM auth.users WHERE email = 'EMAIL_DA_MARIA_REAL')
-- )
-- WHERE email = 'EMAIL_DO_JULIO_REAL';

-- PASSO 3: Verificar se funcionou
SELECT 
    'DEPOIS_CORRECAO' as tipo,
    email,
    raw_user_meta_data->>'tenant_id' AS tenant_id,
    raw_user_meta_data->>'role' AS role,
    raw_user_meta_data->>'name' AS name
FROM 
    auth.users
WHERE 
    email IN (
        -- Substitua pelos emails reais encontrados
        'EMAIL_DA_MARIA_REAL',
        'EMAIL_DO_JULIO_REAL',
        'EMAIL_DO_TAIGUARA_REAL'
    )
ORDER BY 
    email;

-- PASSO 4: Verificar quantos leads cada usuário tem após correção
SELECT 
    'LEADS_APOS_CORRECAO' as tipo,
    u.email,
    u.raw_user_meta_data->>'name' AS name,
    u.raw_user_meta_data->>'tenant_id' AS tenant_id,
    COUNT(l.id) as total_leads
FROM auth.users u
LEFT JOIN leads l ON l.tenant_id::text = u.raw_user_meta_data->>'tenant_id'
WHERE u.email IN (
    -- Substitua pelos emails reais encontrados
    'EMAIL_DA_MARIA_REAL',
    'EMAIL_DO_JULIO_REAL',
    'EMAIL_DO_TAIGUARA_REAL'
)
GROUP BY u.email, u.raw_user_meta_data->>'name', u.raw_user_meta_data->>'tenant_id'
ORDER BY total_leads DESC;
