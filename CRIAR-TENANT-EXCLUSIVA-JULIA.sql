-- =====================================================
-- CRIAR TENANT EXCLUSIVA PARA JULIA
-- =====================================================
-- Este script cria uma tenant única para a Julia
-- para que ela não compartilhe o painel com outras pessoas

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

-- PASSO 2: Verificar se já existe tenant exclusiva para Julia
SELECT 
    'VERIFICAR_TENANT_EXISTENTE' as passo,
    id,
    name,
    plan,
    created_at
FROM public.tenants
WHERE name ILIKE '%julia%'
   OR name ILIKE '%julia%';

-- PASSO 3: Criar tenant exclusiva para Julia
DO $$
DECLARE
    nova_tenant_id UUID;
    julia_user_id UUID;
    julia_role app_role;
BEGIN
    -- Gerar UUID para nova tenant
    nova_tenant_id := gen_random_uuid();
    
    -- Criar tenant exclusiva para Julia
    INSERT INTO public.tenants (id, name, plan, created_at, updated_at)
    VALUES (
        nova_tenant_id,
        'Julia - Exclusiva',
        'free',
        NOW(),
        NOW()
    )
    ON CONFLICT (id) DO NOTHING;
    
    -- Se já existir tenant com nome similar, usar ela
    SELECT id INTO nova_tenant_id
    FROM public.tenants
    WHERE name ILIKE '%julia%'
    LIMIT 1;
    
    -- Se não encontrou, usar a que acabou de criar
    IF nova_tenant_id IS NULL THEN
        SELECT id INTO nova_tenant_id
        FROM public.tenants
        WHERE name = 'Julia - Exclusiva'
        LIMIT 1;
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
                nova_tenant_id,
                NOW(),
                NOW()
            );
        END IF;
    ELSE
        -- Atualizar Julia para nova tenant
        UPDATE public.users
        SET 
            tenant_id = nova_tenant_id,
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
      AND u.tenant_id = nova_tenant_id
    ON CONFLICT (user_id, tenant_id) DO UPDATE SET
        role = EXCLUDED.role;
    
    -- Tenant exclusiva criada para Julia
END $$;

-- PASSO 4: Mover dados da Julia para nova tenant (opcional)
-- ATENÇÃO: Isso move leads, orçamentos e vendas da Julia para a nova tenant
DO $$
DECLARE
    julia_user_id UUID;
    nova_tenant_id UUID;
BEGIN
    -- Pegar ID da Julia
    SELECT id INTO julia_user_id
    FROM public.users
    WHERE email = 'juliawf@gmail.com';
    
    -- Pegar ID da nova tenant
    SELECT id INTO nova_tenant_id
    FROM public.tenants
    WHERE name = 'Julia - Exclusiva'
       OR name ILIKE '%julia%'
    LIMIT 1;
    
    IF julia_user_id IS NOT NULL AND nova_tenant_id IS NOT NULL THEN
        -- Mover leads da Julia
        UPDATE public.leads
        SET tenant_id = nova_tenant_id
        WHERE assigned_to = julia_user_id
          AND tenant_id != nova_tenant_id;
        
        -- Mover orçamentos da Julia
        UPDATE public.budget_documents
        SET tenant_id = nova_tenant_id
        WHERE created_by = julia_user_id
          AND tenant_id != nova_tenant_id;
        
        -- Mover vendas da Julia
        UPDATE public.sales
        SET tenant_id = nova_tenant_id
        WHERE sold_by = julia_user_id
          AND tenant_id != nova_tenant_id;
        
        -- Dados da Julia movidos para nova tenant
    END IF;
END $$;

-- PASSO 5: Criar pipeline padrão para Julia (se não existir)
DO $$
DECLARE
    nova_tenant_id UUID;
    pipeline_id UUID;
BEGIN
    -- Pegar ID da nova tenant
    SELECT id INTO nova_tenant_id
    FROM public.tenants
    WHERE name = 'Julia - Exclusiva'
       OR name ILIKE '%julia%'
    LIMIT 1;
    
    IF nova_tenant_id IS NOT NULL THEN
        -- Verificar se já existe pipeline
        SELECT id INTO pipeline_id
        FROM public.pipelines
        WHERE tenant_id = nova_tenant_id
        LIMIT 1;
        
        -- Se não existe, criar
        IF pipeline_id IS NULL THEN
            INSERT INTO public.pipelines (id, tenant_id, name, is_default, created_at, updated_at)
            VALUES (
                gen_random_uuid(),
                nova_tenant_id,
                'Pipeline Padrão',
                true,
                NOW(),
                NOW()
            )
            RETURNING id INTO pipeline_id;
            
            -- Criar stages padrão
            INSERT INTO public.stages (tenant_id, pipeline_id, name, "order", color, created_at, updated_at)
            VALUES
                (nova_tenant_id, pipeline_id, 'Lead novo', 1, '#3B82F6', NOW(), NOW()),
                (nova_tenant_id, pipeline_id, 'Atendido', 2, '#10B981', NOW(), NOW()),
                (nova_tenant_id, pipeline_id, 'Agendado', 3, '#F59E0B', NOW(), NOW()),
                (nova_tenant_id, pipeline_id, 'Fechado', 4, '#8B5CF6', NOW(), NOW()),
                (nova_tenant_id, pipeline_id, 'Recusado', 5, '#EF4444', NOW(), NOW()),
                (nova_tenant_id, pipeline_id, 'Perdido', 6, '#6B7280', NOW(), NOW());
            
            -- Pipeline padrão criado para Julia
        END IF;
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
        WHEN (SELECT COUNT(*) FROM public.users WHERE tenant_id = u.tenant_id) = 1 
        THEN '✅ TENANT EXCLUSIVA - Apenas Julia'
        ELSE '⚠️ AVISO: Tenant compartilhada'
    END as status_isolamento
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
LEFT JOIN public.leads l ON l.tenant_id = u.tenant_id
LEFT JOIN public.budget_documents b ON b.tenant_id = u.tenant_id
LEFT JOIN public.sales s ON s.tenant_id = u.tenant_id
WHERE u.email = 'juliawf@gmail.com'
GROUP BY u.id, u.name, t.name;

-- PASSO 8: Comparar com outras tenants
SELECT 
    'COMPARACAO_TENANTS' as passo,
    t.name as tenant_name,
    COUNT(DISTINCT u.id) as total_usuarios,
    STRING_AGG(u.name, ', ') as usuarios
FROM public.tenants t
LEFT JOIN public.users u ON u.tenant_id = t.id
GROUP BY t.id, t.name
ORDER BY t.name;

