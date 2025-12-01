-- ========================================
-- VERIFICAR TODOS OS USUÁRIOS REAIS
-- ========================================
-- Este script lista TODOS os usuários cadastrados no sistema

SELECT 
    email,
    id as user_id,
    raw_user_meta_data->>'tenant_id' AS tenant_id,
    raw_user_meta_data->>'role' AS role,
    created_at
FROM 
    auth.users
ORDER BY 
    created_at DESC;

