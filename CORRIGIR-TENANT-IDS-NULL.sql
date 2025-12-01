-- ========================================
-- CORRIGIR TENANT_IDS NULL - SOLUÇÃO DEFINITIVA
-- ========================================
-- Execute este script no Supabase SQL Editor

-- PASSO 1: Verificar tenant_ids atuais (todos estão NULL)
SELECT 
    'ANTES' as status,
    email,
    raw_user_meta_data->>'tenant_id' AS tenant_id
FROM 
    auth.users
WHERE 
    email IN ('mariabrebal26@gmail.com', 'recebimento.fto@gmail.com', 'taicaracho@gmail.com')
ORDER BY 
    email;

-- PASSO 2: Criar um tenant_id único para todos os usuários
-- Vamos usar um UUID fixo para garantir consistência
DO $$
DECLARE
    novo_tenant_id UUID := '8bd69047-7533-42f3-a2f7-e3a60477f68c';
BEGIN
    -- Atualizar Maria
    UPDATE auth.users
    SET raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || jsonb_build_object('tenant_id', novo_tenant_id::text)
    WHERE email = 'mariabrebal26@gmail.com';
    
    -- Atualizar Júlio
    UPDATE auth.users
    SET raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || jsonb_build_object('tenant_id', novo_tenant_id::text)
    WHERE email = 'recebimento.fto@gmail.com';
    
    -- Atualizar Taiguara
    UPDATE auth.users
    SET raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || jsonb_build_object('tenant_id', novo_tenant_id::text)
    WHERE email = 'taicaracho@gmail.com';
    
    RAISE NOTICE 'Tenant IDs atualizados para: %', novo_tenant_id;
END $$;

-- PASSO 3: Verificar se os tenant_ids foram atualizados
SELECT 
    'DEPOIS' as status,
    email,
    raw_user_meta_data->>'tenant_id' AS tenant_id
FROM 
    auth.users
WHERE 
    email IN ('mariabrebal26@gmail.com', 'recebimento.fto@gmail.com', 'taicaracho@gmail.com')
ORDER BY 
    email;

-- PASSO 4: Atualizar todos os leads para usar o mesmo tenant_id
UPDATE public.leads
SET tenant_id = '8bd69047-7533-42f3-a2f7-e3a60477f68c'::UUID
WHERE tenant_id IS NULL OR tenant_id != '8bd69047-7533-42f3-a2f7-e3a60477f68c'::UUID;

-- PASSO 5: Atualizar todas as vendas para usar o mesmo tenant_id
UPDATE public.sales
SET tenant_id = '8bd69047-7533-42f3-a2f7-e3a60477f68c'::UUID
WHERE tenant_id IS NULL OR tenant_id != '8bd69047-7533-42f3-a2f7-e3a60477f68c'::UUID;

-- PASSO 6: Atualizar métricas diárias para usar o mesmo tenant_id
UPDATE public.metrics_daily
SET tenant_id = '8bd69047-7533-42f3-a2f7-e3a60477f68c'::UUID
WHERE tenant_id IS NULL OR tenant_id != '8bd69047-7533-42f3-a2f7-e3a60477f68c'::UUID;

-- PASSO 7: Migrar as vendas específicas da Maria para a tabela sales
INSERT INTO public.sales (lead_id, amount, created_at, tenant_id)
SELECT 
    l.id,
    (l.fields->>'sale_value')::NUMERIC,
    COALESCE(
        (l.fields->>'sale_date')::TIMESTAMP WITH TIME ZONE, 
        l.updated_at, 
        l.created_at, 
        NOW()
    ),
    '8bd69047-7533-42f3-a2f7-e3a60477f68c'::UUID
FROM 
    public.leads l
LEFT JOIN 
    public.sales s ON l.id = s.lead_id
WHERE 
    l.tenant_id = '8bd69047-7533-42f3-a2f7-e3a60477f68c'::UUID
    AND l.status = 'closed'
    AND s.id IS NULL
    AND l.fields->>'sale_value' IS NOT NULL
    AND l.fields->>'sale_value' != '0'
    AND l.fields->>'sale_value' != ''
    AND (l.fields->>'sale_value')::NUMERIC > 0
    AND (
        l.name ILIKE '%dra renata%' OR
        l.name ILIKE '%amador bueno%' OR
        l.name ILIKE '%life sorrisos%' OR
        l.name ILIKE '%implants odonto%' OR
        l.name ILIKE '%dr leandro lana%'
    )
ON CONFLICT (lead_id) DO UPDATE SET
    amount = EXCLUDED.amount,
    created_at = EXCLUDED.created_at,
    tenant_id = EXCLUDED.tenant_id;

-- PASSO 8: Verificar total de vendas após migração
SELECT 
    'TOTAL_VENDAS_FINAL' as tipo,
    COUNT(*) AS total_vendas,
    SUM(amount) AS total_valor
FROM 
    public.sales
WHERE 
    tenant_id = '8bd69047-7533-42f3-a2f7-e3a60477f68c'::UUID;

-- PASSO 9: Verificar leads fechados
SELECT 
    'LEADS_FECHADOS_FINAL' as tipo,
    COUNT(*) AS total_leads_fechados
FROM 
    public.leads
WHERE 
    tenant_id = '8bd69047-7533-42f3-a2f7-e3a60477f68c'::UUID
    AND status = 'closed';

-- PASSO 10: Verificar se todos os usuários têm o mesmo tenant_id
SELECT 
    'CONFIRMACAO_FINAL' as tipo,
    COUNT(DISTINCT raw_user_meta_data->>'tenant_id') AS total_tenants_diferentes
FROM 
    auth.users
WHERE 
    email IN ('mariabrebal26@gmail.com', 'recebimento.fto@gmail.com', 'taicaracho@gmail.com');
-- DEVE retornar 1!

-- ========================================
-- INSTRUÇÕES CRÍTICAS:
-- ========================================
-- 1. Execute TODOS os passos em sequência
-- 2. Verifique que o PASSO 10 retorna "1"
-- 3. Júlio e Taiguara devem fazer LOGOUT e LOGIN
-- 4. Recarregue a página no Chrome (F5)
-- 5. Agora todos devem ver o MESMO valor da Maria!
-- ========================================
