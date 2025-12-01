-- =====================================================
-- MOVER JULIA PARA TENANT "DISTRIBUIDOR"
-- =====================================================
-- Este script move a Julia (juliawf@gmail.com) para a tenant "Distribuidor"
-- que já existe, separando-a do Varejo

-- PASSO 1: Verificar situação atual da Julia
SELECT 
    'SITUACAO_ATUAL_JULIA' as passo,
    u.id,
    u.name,
    u.email,
    u.role,
    u.active,
    u.tenant_id,
    t.name as tenant_atual,
    (SELECT COUNT(*) FROM public.users WHERE tenant_id = u.tenant_id) as total_usuarios_tenant
FROM public.users u
LEFT JOIN public.tenants t ON u.tenant_id = t.id
WHERE u.email = 'juliawf@gmail.com';

-- PASSO 2: Verificar tenant "Distribuidor"
SELECT 
    'VERIFICAR_TENANT_DISTRIBUIDOR' as passo,
    id,
    name,
    plan,
    created_at,
    (SELECT COUNT(*) FROM public.users WHERE tenant_id = id) as total_usuarios
FROM public.tenants
WHERE name = 'Distribuidor';

-- PASSO 3: Garantir que tenant "Distribuidor" existe
INSERT INTO public.tenants (id, name, plan, created_at, updated_at)
SELECT 
    'a961a599-65ab-408c-b39e-bc2109a07bff'::UUID,
    'Distribuidor',
    'free',
    NOW(),
    NOW()
WHERE NOT EXISTS (
    SELECT 1 FROM public.tenants WHERE name = 'Distribuidor'
);

-- PASSO 4: Mover Julia para tenant "Distribuidor"
DO $$
DECLARE
    distribuidor_tenant_id UUID;
    julia_user_id UUID;
    julia_role app_role;
BEGIN
    -- Pegar ID da tenant Distribuidor
    SELECT id INTO distribuidor_tenant_id
    FROM public.tenants
    WHERE name = 'Distribuidor'
    LIMIT 1;
    
    -- Se não encontrou, criar
    IF distribuidor_tenant_id IS NULL THEN
        INSERT INTO public.tenants (id, name, plan, created_at, updated_at)
        VALUES (
            'a961a599-65ab-408c-b39e-bc2109a07bff'::UUID,
            'Distribuidor',
            'free',
            NOW(),
            NOW()
        )
        RETURNING id INTO distribuidor_tenant_id;
    END IF;
    
    -- Pegar ID e role da Julia
    SELECT id, role INTO julia_user_id, julia_role
    FROM public.users
    WHERE email = 'juliawf@gmail.com';
    
    -- Se Julia não existe em public.users, criar
    IF julia_user_id IS NULL THEN
        -- Pegar ID de auth.users
        SELECT id INTO julia_user_id
        FROM auth.users
        WHERE email = 'juliawf@gmail.com';
        
        -- Criar Julia em public.users
        IF julia_user_id IS NOT NULL THEN
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
            VALUES (
                julia_user_id,
                'juliawf@gmail.com',
                'Julia',
                'agent'::app_role,
                true,
                distribuidor_tenant_id,
                NOW(),
                NOW()
            );
        END IF;
    ELSE
        -- Atualizar Julia para tenant Distribuidor
        UPDATE public.users
        SET 
            tenant_id = distribuidor_tenant_id,
            active = true,
            updated_at = NOW()
        WHERE email = 'juliawf@gmail.com';
    END IF;
    
    -- Garantir que user_role está configurado
    INSERT INTO public.user_roles (user_id, tenant_id, role)
    SELECT 
        u.id,
        u.tenant_id,
        COALESCE(u.role, 'agent'::app_role)
    FROM public.users u
    WHERE u.email = 'juliawf@gmail.com'
      AND u.tenant_id = distribuidor_tenant_id
    ON CONFLICT (user_id, tenant_id) DO UPDATE SET
        role = EXCLUDED.role;
    
    -- Julia movida para tenant Distribuidor
END $$;

-- PASSO 5: Mover dados da Julia para tenant Distribuidor
DO $$
DECLARE
    julia_user_id UUID;
    distribuidor_tenant_id UUID;
BEGIN
    -- Pegar ID da Julia
    SELECT id INTO julia_user_id
    FROM public.users
    WHERE email = 'juliawf@gmail.com';
    
    -- Pegar ID da tenant Distribuidor
    SELECT id INTO distribuidor_tenant_id
    FROM public.tenants
    WHERE name = 'Distribuidor'
    LIMIT 1;
    
    IF julia_user_id IS NOT NULL AND distribuidor_tenant_id IS NOT NULL THEN
        -- Mover leads da Julia
        UPDATE public.leads
        SET tenant_id = distribuidor_tenant_id
        WHERE assigned_to = julia_user_id
          AND tenant_id != distribuidor_tenant_id;
        
        -- Mover orçamentos da Julia
        UPDATE public.budget_documents
        SET tenant_id = distribuidor_tenant_id
        WHERE created_by = julia_user_id
          AND tenant_id != distribuidor_tenant_id;
        
        -- Mover vendas da Julia
        UPDATE public.sales
        SET tenant_id = distribuidor_tenant_id
        WHERE sold_by = julia_user_id
          AND tenant_id != distribuidor_tenant_id;
        
        -- Dados da Julia movidos para tenant Distribuidor
    END IF;
END $$;

-- PASSO 6: Verificar resultado final
SELECT 
    'RESULTADO_FINAL' as passo,
    u.id,
    u.name,
    u.email,
    u.role,
    u.active,
    u.tenant_id,
    t.name as tenant_name,
    t.id as tenant_id,
    (SELECT COUNT(*) FROM public.users WHERE tenant_id = u.tenant_id) as total_usuarios_tenant,
    CASE 
        WHEN t.name = 'Distribuidor' THEN '✅ JULIA MOVIDA PARA DISTRIBUIDOR'
        ELSE '❌ ERRO: Julia não está no tenant Distribuidor'
    END as status
FROM public.users u
LEFT JOIN public.tenants t ON u.tenant_id = t.id
WHERE u.email = 'juliawf@gmail.com';

-- PASSO 7: Verificar isolamento completo
SELECT 
    'VERIFICAR_ISOLAMENTO' as passo,
    'Julia' as usuario,
    COUNT(DISTINCT l.id) as total_leads,
    COUNT(DISTINCT b.id) as total_orcamentos,
    COUNT(DISTINCT s.id) as total_vendas,
    t.name as tenant_name
FROM public.users u
LEFT JOIN public.tenants t ON u.tenant_id = t.id
LEFT JOIN public.leads l ON l.tenant_id = u.tenant_id AND l.assigned_to = u.id
LEFT JOIN public.budget_documents b ON b.tenant_id = u.tenant_id AND b.created_by = u.id
LEFT JOIN public.sales s ON s.tenant_id = u.tenant_id AND s.sold_by = u.id
WHERE u.email = 'juliawf@gmail.com'
GROUP BY u.id, u.name, t.name;

-- PASSO 8: Comparar tenants (Varejo vs Distribuidor)
SELECT 
    'COMPARACAO_TENANTS' as passo,
    t.name as tenant_name,
    COUNT(DISTINCT u.id) as total_usuarios,
    STRING_AGG(u.name, ', ') as usuarios
FROM public.tenants t
LEFT JOIN public.users u ON u.tenant_id = t.id
WHERE t.name IN ('Varejo', 'Distribuidor')
GROUP BY t.id, t.name
ORDER BY t.name;

-- PASSO 9: Verificar que Julia NÃO está mais no Varejo
SELECT 
    'VERIFICAR_ISOLAMENTO_VAREJO' as passo,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM public.users u
            JOIN public.tenants t ON u.tenant_id = t.id
            WHERE u.email = 'juliawf@gmail.com' 
            AND t.name = 'Varejo'
        ) THEN '❌ ERRO: Julia ainda está no Varejo!'
        WHEN EXISTS (
            SELECT 1 FROM public.users u
            JOIN public.tenants t ON u.tenant_id = t.id
            WHERE u.email = 'juliawf@gmail.com' 
            AND t.name = 'Distribuidor'
        ) THEN '✅ SUCESSO: Julia está no Distribuidor e isolada do Varejo!'
        ELSE '⚠️ AVISO: Verificar situação da Julia'
    END as status_isolamento;

