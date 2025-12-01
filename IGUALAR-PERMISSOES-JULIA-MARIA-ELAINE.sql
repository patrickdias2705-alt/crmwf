-- =====================================================
-- IGUALAR PERMISSÕES DA JULIA COM MARIA E ELAINE
-- =====================================================

-- PASSO 1: Verificar permissões atuais de Maria, Elaine e Julia
SELECT 
    'VERIFICAR_PERMISSOES_ATUAIS' as passo,
    u.id,
    u.name,
    u.email,
    u.role as role_users,
    u.tenant_id,
    t.name as tenant_name,
    u.active,
    ur.role as role_user_roles
FROM public.users u
LEFT JOIN public.tenants t ON u.tenant_id = t.id
LEFT JOIN public.user_roles ur ON ur.user_id = u.id AND ur.tenant_id = u.tenant_id
WHERE u.email LIKE '%maria%' 
   OR u.email LIKE '%elaine%' 
   OR u.email LIKE '%julia%'
ORDER BY u.name;

-- PASSO 2: Verificar se Julia existe e qual é o email exato
SELECT 
    'VERIFICAR_JULIA' as passo,
    u.id,
    u.name,
    u.email,
    u.role,
    u.tenant_id,
    u.active
FROM public.users u
WHERE u.email LIKE '%julia%'
   OR u.name ILIKE '%julia%';

-- PASSO 3: Verificar permissões de Maria (para copiar)
SELECT 
    'PERMISSOES_MARIA' as passo,
    u.id,
    u.name,
    u.email,
    u.role,
    u.tenant_id,
    u.active,
    ur.role as role_user_roles
FROM public.users u
LEFT JOIN public.user_roles ur ON ur.user_id = u.id AND ur.tenant_id = u.tenant_id
WHERE u.email LIKE '%maria%'
LIMIT 1;

-- PASSO 4: Verificar permissões de Elaine (para copiar)
SELECT 
    'PERMISSOES_ELAINE' as passo,
    u.id,
    u.name,
    u.email,
    u.role,
    u.tenant_id,
    u.active,
    ur.role as role_user_roles
FROM public.users u
LEFT JOIN public.user_roles ur ON ur.user_id = u.id AND ur.tenant_id = u.tenant_id
WHERE u.email LIKE '%elaine%'
LIMIT 1;

-- PASSO 5: Atualizar Julia para ter o mesmo role de Maria e Elaine
-- Primeiro, vamos pegar o role de Maria ou Elaine (assumindo que ambos são 'agent')
WITH maria_role AS (
    SELECT u.role, u.tenant_id
    FROM public.users u
    WHERE u.email LIKE '%maria%'
    LIMIT 1
),
elaine_role AS (
    SELECT u.role, u.tenant_id
    FROM public.users u
    WHERE u.email LIKE '%elaine%'
    LIMIT 1
)
UPDATE public.users u
SET 
    role = COALESCE((SELECT role FROM maria_role), (SELECT role FROM elaine_role), 'agent'::app_role),
    active = true,
    updated_at = NOW()
WHERE u.email LIKE '%julia%'
   OR u.name ILIKE '%julia%';

-- PASSO 6: Garantir que Julia tem user_role configurado igual a Maria e Elaine
DO $$
DECLARE
    maria_role app_role;
    elaine_role app_role;
    julia_user_id UUID;
    julia_tenant_id UUID;
    target_role app_role;
BEGIN
    -- Pegar role de Maria
    SELECT ur.role INTO maria_role
    FROM public.users u
    LEFT JOIN public.user_roles ur ON ur.user_id = u.id AND ur.tenant_id = u.tenant_id
    WHERE u.email LIKE '%maria%'
    LIMIT 1;
    
    -- Pegar role de Elaine
    SELECT ur.role INTO elaine_role
    FROM public.users u
    LEFT JOIN public.user_roles ur ON ur.user_id = u.id AND ur.tenant_id = u.tenant_id
    WHERE u.email LIKE '%elaine%'
    LIMIT 1;
    
    -- Pegar ID e tenant_id da Julia
    SELECT u.id, u.tenant_id INTO julia_user_id, julia_tenant_id
    FROM public.users u
    WHERE u.email LIKE '%julia%' OR u.name ILIKE '%julia%'
    LIMIT 1;
    
    -- Determinar role alvo (prioridade: Maria > Elaine > agent)
    target_role := COALESCE(maria_role, elaine_role, 'agent'::app_role);
    
    -- Inserir ou atualizar user_role da Julia
    IF julia_user_id IS NOT NULL AND julia_tenant_id IS NOT NULL THEN
        INSERT INTO public.user_roles (user_id, tenant_id, role)
        VALUES (julia_user_id, julia_tenant_id, target_role)
        ON CONFLICT (user_id, tenant_id) DO UPDATE SET
            role = EXCLUDED.role;
    END IF;
END $$;

-- PASSO 7: Verificar resultado final
SELECT 
    'RESULTADO_FINAL' as passo,
    u.id,
    u.name,
    u.email,
    u.role as role_users,
    u.tenant_id,
    t.name as tenant_name,
    u.active,
    ur.role as role_user_roles,
    CASE 
        WHEN u.role = (SELECT role FROM public.users WHERE email LIKE '%maria%' LIMIT 1) 
         AND ur.role = (SELECT ur2.role FROM public.users u2 
                        LEFT JOIN public.user_roles ur2 ON ur2.user_id = u2.id 
                        WHERE u2.email LIKE '%maria%' LIMIT 1)
        THEN '✅ PERMISSÕES IGUAIS'
        ELSE '❌ PERMISSÕES DIFERENTES'
    END as status
FROM public.users u
LEFT JOIN public.tenants t ON u.tenant_id = t.id
LEFT JOIN public.user_roles ur ON ur.user_id = u.id AND ur.tenant_id = u.tenant_id
WHERE u.email LIKE '%julia%' 
   OR u.name ILIKE '%julia%';

-- PASSO 8: Comparação final entre Maria, Elaine e Julia
SELECT 
    'COMPARACAO_FINAL' as passo,
    u.name,
    u.email,
    u.role as role_users,
    ur.role as role_user_roles,
    u.active,
    t.name as tenant_name
FROM public.users u
LEFT JOIN public.tenants t ON u.tenant_id = t.id
LEFT JOIN public.user_roles ur ON ur.user_id = u.id AND ur.tenant_id = u.tenant_id
WHERE u.email LIKE '%maria%' 
   OR u.email LIKE '%elaine%' 
   OR u.email LIKE '%julia%'
   OR u.name ILIKE '%julia%'
ORDER BY u.name;

