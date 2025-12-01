-- =====================================================
-- CORRIGIR LOGIN DA JULIA (juliawf@gmail.com)
-- =====================================================
-- Este script corrige o erro "Erro ao carregar dados do usuário"
-- que acontece quando o usuário não está em public.users ou não tem tenant_id

-- PASSO 1: Verificar situação atual
SELECT 
    'SITUACAO_ATUAL' as passo,
    'auth.users' as tabela,
    au.id,
    au.email,
    au.email_confirmed_at IS NOT NULL as email_confirmado,
    au.created_at
FROM auth.users au
WHERE au.email = 'juliawf@gmail.com'

UNION ALL

SELECT 
    'SITUACAO_ATUAL' as passo,
    'public.users' as tabela,
    pu.id,
    pu.email,
    pu.active as ativo,
    pu.created_at
FROM public.users pu
WHERE pu.email = 'juliawf@gmail.com';

-- PASSO 2: Verificar tenant_id de Maria e Elaine (para copiar)
SELECT 
    'TENANT_MARIA_ELAINE' as passo,
    u.name,
    u.email,
    u.tenant_id,
    t.name as tenant_name
FROM public.users u
LEFT JOIN public.tenants t ON u.tenant_id = t.id
WHERE (u.email LIKE '%maria%' OR u.email LIKE '%elaine%')
  AND u.tenant_id IS NOT NULL
ORDER BY u.name
LIMIT 2;

-- PASSO 3: Pegar tenant_id de Maria ou Elaine (prioridade: Maria > Elaine)
DO $$
DECLARE
    target_tenant_id UUID;
    julia_auth_id UUID;
    julia_name TEXT := 'Julia';
BEGIN
    -- Pegar tenant_id de Maria ou Elaine
    SELECT u.tenant_id INTO target_tenant_id
    FROM public.users u
    WHERE (u.email LIKE '%maria%' OR u.email LIKE '%elaine%')
      AND u.tenant_id IS NOT NULL
    ORDER BY CASE WHEN u.email LIKE '%maria%' THEN 1 ELSE 2 END
    LIMIT 1;
    
    -- Se não encontrou, criar um tenant padrão ou usar o primeiro disponível
    IF target_tenant_id IS NULL THEN
        SELECT id INTO target_tenant_id
        FROM public.tenants
        LIMIT 1;
        
        -- Se ainda não tem tenant, criar um
        IF target_tenant_id IS NULL THEN
            INSERT INTO public.tenants (name, plan)
            VALUES ('Default', 'free')
            RETURNING id INTO target_tenant_id;
        END IF;
    END IF;
    
    -- Pegar ID da Julia em auth.users
    SELECT id INTO julia_auth_id
    FROM auth.users
    WHERE email = 'juliawf@gmail.com';
    
    -- Se Julia existe em auth.users mas não em public.users, criar
    IF julia_auth_id IS NOT NULL THEN
        INSERT INTO public.users (
            id,
            email,
            name,
            role,
            active,
            tenant_id,
            created_at,
            updated_at
        )
        SELECT 
            julia_auth_id,
            'juliawf@gmail.com',
            julia_name,
            COALESCE(
                (SELECT role FROM public.users WHERE email LIKE '%maria%' LIMIT 1),
                (SELECT role FROM public.users WHERE email LIKE '%elaine%' LIMIT 1),
                'agent'::app_role
            ),
            true,
            target_tenant_id,
            COALESCE((SELECT created_at FROM auth.users WHERE id = julia_auth_id), NOW()),
            NOW()
        ON CONFLICT (id) DO UPDATE SET
            email = EXCLUDED.email,
            name = EXCLUDED.name,
            role = EXCLUDED.role,
            active = true,
            tenant_id = EXCLUDED.tenant_id,
            updated_at = NOW();
    END IF;
    
    -- Atualizar Julia existente para garantir que está correta
    UPDATE public.users
    SET 
        tenant_id = COALESCE(tenant_id, target_tenant_id),
        active = true,
        role = COALESCE(
            role,
            (SELECT role FROM public.users WHERE email LIKE '%maria%' LIMIT 1),
            (SELECT role FROM public.users WHERE email LIKE '%elaine%' LIMIT 1),
            'agent'::app_role
        ),
        updated_at = NOW()
    WHERE email = 'juliawf@gmail.com';
    
    -- Garantir que user_role está configurado
    INSERT INTO public.user_roles (user_id, tenant_id, role)
    SELECT 
        u.id,
        u.tenant_id,
        u.role
    FROM public.users u
    WHERE u.email = 'juliawf@gmail.com'
      AND u.tenant_id IS NOT NULL
    ON CONFLICT (user_id, tenant_id) DO UPDATE SET
        role = EXCLUDED.role;
    
    -- Log de sucesso (comentado para evitar erro)
    -- RAISE NOTICE 'Julia corrigida com sucesso! Tenant ID: %', target_tenant_id;
END $$;

-- PASSO 4: Verificar resultado final
SELECT 
    'RESULTADO_FINAL' as passo,
    au.id as auth_id,
    au.email as auth_email,
    au.email_confirmed_at IS NOT NULL as email_confirmado,
    pu.id as public_id,
    pu.email as public_email,
    pu.name,
    pu.active,
    pu.role,
    pu.tenant_id,
    t.name as tenant_name,
    ur.role as user_role_role,
    CASE 
        WHEN au.id IS NULL THEN '❌ PROBLEMA: Não existe em auth.users'
        WHEN pu.id IS NULL THEN '❌ PROBLEMA: Não existe em public.users'
        WHEN au.id != pu.id THEN '❌ PROBLEMA: IDs diferentes'
        WHEN pu.active = false THEN '❌ PROBLEMA: Usuário inativo'
        WHEN pu.tenant_id IS NULL THEN '❌ PROBLEMA: Sem tenant_id'
        WHEN ur.role IS NULL THEN '⚠️ AVISO: Sem user_role configurado'
        WHEN au.email_confirmed_at IS NULL THEN '⚠️ AVISO: Email não confirmado'
        ELSE '✅ TUDO OK - Login deve funcionar!'
    END as status
FROM auth.users au
FULL OUTER JOIN public.users pu ON au.id = pu.id
LEFT JOIN public.tenants t ON pu.tenant_id = t.id
LEFT JOIN public.user_roles ur ON ur.user_id = pu.id AND ur.tenant_id = pu.tenant_id
WHERE au.email = 'juliawf@gmail.com' 
   OR pu.email = 'juliawf@gmail.com';

-- PASSO 5: Comparar com Maria e Elaine
SELECT 
    'COMPARACAO_FINAL' as passo,
    u.name,
    u.email,
    u.role,
    u.active,
    u.tenant_id,
    t.name as tenant_name,
    ur.role as user_role_role
FROM public.users u
LEFT JOIN public.tenants t ON u.tenant_id = t.id
LEFT JOIN public.user_roles ur ON ur.user_id = u.id AND ur.tenant_id = u.tenant_id
WHERE u.email = 'juliawf@gmail.com'
   OR u.email LIKE '%maria%'
   OR u.email LIKE '%elaine%'
ORDER BY 
    CASE 
        WHEN u.email = 'juliawf@gmail.com' THEN 1
        WHEN u.email LIKE '%maria%' THEN 2
        WHEN u.email LIKE '%elaine%' THEN 3
    END;

