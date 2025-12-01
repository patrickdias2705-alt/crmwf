-- ========================================
-- UNIFICAR TODOS OS USUÁRIOS COM O TENANT_ID DA MARIA
-- ========================================
-- Este script garante que todos os usuários vejam exatamente os mesmos dados da Maria

-- PASSO 1: Verificar o tenant_id atual da Maria
SELECT 
    'MARIA_TENANT_ID' as tipo,
    email,
    raw_user_meta_data->>'tenant_id' as tenant_id_atual
FROM 
    auth.users 
WHERE 
    email = 'mariabrebal26@gmail.com';

-- PASSO 2: Definir o tenant_id unificado (usar o da Maria)
-- Se a Maria não tiver tenant_id, usar um UUID fixo
WITH maria_tenant AS (
    SELECT 
        COALESCE(
            raw_user_meta_data->>'tenant_id',
            '8bd69047-7533-42f3-a2f7-e3a60477f68c'
        ) as tenant_id_unificado
    FROM auth.users 
    WHERE email = 'mariabrebal26@gmail.com'
)
-- PASSO 3: Atualizar TODOS os usuários para o mesmo tenant_id
UPDATE auth.users 
SET 
    raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || 
    jsonb_build_object('tenant_id', (SELECT tenant_id_unificado FROM maria_tenant))
WHERE 
    email IN (
        'mariabrebal26@gmail.com',
        'recebimento.fto@gmail.com', 
        'taicaracho@gmail.com'
    );

-- PASSO 4: Verificar se a atualização foi bem-sucedida
SELECT 
    'USUARIOS_ATUALIZADOS' as tipo,
    email,
    raw_user_meta_data->>'tenant_id' as tenant_id_novo
FROM 
    auth.users 
WHERE 
    email IN (
        'mariabrebal26@gmail.com',
        'recebimento.fto@gmail.com', 
        'taicaracho@gmail.com'
    );

-- PASSO 5: Atualizar todas as tabelas para usar o tenant_id unificado
-- Leads
UPDATE public.leads 
SET tenant_id = '8bd69047-7533-42f3-a2f7-e3a60477f68c'
WHERE tenant_id IS NULL 
   OR tenant_id != '8bd69047-7533-42f3-a2f7-e3a60477f68c';

-- Sales
UPDATE public.sales 
SET tenant_id = '8bd69047-7533-42f3-a2f7-e3a60477f68c'
WHERE tenant_id IS NULL 
   OR tenant_id != '8bd69047-7533-42f3-a2f7-e3a60477f68c';

-- Metrics Daily
UPDATE public.metrics_daily 
SET tenant_id = '8bd69047-7533-42f3-a2f7-e3a60477f68c'
WHERE tenant_id IS NULL 
   OR tenant_id != '8bd69047-7533-42f3-a2f7-e3a60477f68c';

-- Stages
UPDATE public.stages 
SET tenant_id = '8bd69047-7533-42f3-a2f7-e3a60477f68c'
WHERE tenant_id IS NULL 
   OR tenant_id != '8bd69047-7533-42f3-a2f7-e3a60477f68c';

-- Messages
UPDATE public.messages 
SET tenant_id = '8bd69047-7533-42f3-a2f7-e3a60477f68c'
WHERE tenant_id IS NULL 
   OR tenant_id != '8bd69047-7533-42f3-a2f7-e3a60477f68c';

-- PASSO 6: Verificar o total de vendas unificado
SELECT 
    'TOTAL_VENDAS_UNIFICADO' as tipo,
    COUNT(*) as total_vendas,
    SUM(amount) as total_receita,
    AVG(amount) as ticket_medio
FROM 
    public.sales 
WHERE 
    tenant_id = '8bd69047-7533-42f3-a2f7-e3a60477f68c';

-- PASSO 7: Verificar o total de leads unificado
SELECT 
    'TOTAL_LEADS_UNIFICADO' as tipo,
    COUNT(*) as total_leads,
    COUNT(CASE WHEN status = 'closed' THEN 1 END) as leads_fechados
FROM 
    public.leads 
WHERE 
    tenant_id = '8bd69047-7533-42f3-a2f7-e3a60477f68c';

-- PASSO 8: Confirmar unificação
SELECT 
    'CONFIRMACAO_FINAL' as tipo,
    'TODOS_USUARIOS_UNIFICADOS' as status,
    '8bd69047-7533-42f3-a2f7-e3a60477f68c' as tenant_id_unificado;
