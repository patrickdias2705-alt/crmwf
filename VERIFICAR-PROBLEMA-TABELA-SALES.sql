-- ========================================
-- VERIFICAR PROBLEMA NA TABELA SALES
-- ========================================
-- Execute este script no Supabase SQL Editor

-- PASSO 1: Verificar se a tabela sales existe
SELECT 
    'TABELA_SALES_EXISTE' as tipo,
    table_name,
    table_schema
FROM information_schema.tables 
WHERE table_name = 'sales' 
AND table_schema = 'public';

-- PASSO 2: Verificar estrutura da tabela sales
SELECT 
    'ESTRUTURA_SALES' as tipo,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'sales' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- PASSO 3: Verificar RLS (Row Level Security) na tabela sales
SELECT 
    'RLS_SALES' as tipo,
    schemaname,
    tablename,
    rowsecurity,
    hasrules
FROM pg_tables 
WHERE tablename = 'sales' 
AND schemaname = 'public';

-- PASSO 4: Verificar políticas RLS na tabela sales
SELECT 
    'POLITICAS_RLS_SALES' as tipo,
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'sales' 
AND schemaname = 'public';

-- PASSO 5: Verificar permissões na tabela sales
SELECT 
    'PERMISSOES_SALES' as tipo,
    grantee,
    privilege_type,
    is_grantable
FROM information_schema.table_privileges 
WHERE table_name = 'sales' 
AND table_schema = 'public';

-- PASSO 6: Verificar se há dados na tabela sales
SELECT 
    'DADOS_SALES' as tipo,
    COUNT(*) as total_registros,
    MIN(created_at) as primeiro_registro,
    MAX(created_at) as ultimo_registro
FROM sales
WHERE tenant_id = '8bd69047-7533-42f3-a2f7-e3a60477f68c';

-- PASSO 7: Verificar se há leads que deveriam estar em sales
SELECT 
    'LEADS_VENDIDOS_SEM_SALES' as tipo,
    l.id,
    l.name,
    l.email,
    l.phone,
    l.fields->>'sold' as sold_field,
    l.fields->>'sold_amount' as sold_amount_field,
    s.id as sales_id
FROM leads l
LEFT JOIN sales s ON s.lead_id = l.id
WHERE l.tenant_id = '8bd69047-7533-42f3-a2f7-e3a60477f68c'
AND (l.fields->>'sold' = 'true' OR l.fields->>'sold_amount' IS NOT NULL)
AND s.id IS NULL;

-- PASSO 8: Verificar se há vendas órfãs (sem lead)
SELECT 
    'VENDAS_ORFAS' as tipo,
    s.id,
    s.lead_id,
    s.amount,
    s.created_at,
    l.id as lead_exists
FROM sales s
LEFT JOIN leads l ON l.id = s.lead_id
WHERE s.tenant_id = '8bd69047-7533-42f3-a2f7-e3a60477f68c'
AND l.id IS NULL;

-- PASSO 9: Verificar se há problemas de inserção
SELECT 
    'TESTE_INSERCAO_SALES' as tipo,
    'Testando inserção na tabela sales' as status;

-- Buscar um lead real para teste
WITH lead_real AS (
    SELECT id, name
    FROM leads
    WHERE tenant_id = '8bd69047-7533-42f3-a2f7-e3a60477f68c'
    LIMIT 1
),
stage_real AS (
    SELECT id, name
    FROM stages
    WHERE tenant_id = '8bd69047-7533-42f3-a2f7-e3a60477f68c'
    LIMIT 1
)
-- Tentar inserir um registro de teste com IDs reais
INSERT INTO sales (
    tenant_id,
    lead_id,
    amount,
    stage_id,
    stage_name,
    sold_by,
    sold_by_name,
    budget_description,
    budget_file_name
)
SELECT 
    '8bd69047-7533-42f3-a2f7-e3a60477f68c',
    lr.id,
    100.00,
    sr.id,
    sr.name,
    lr.id, -- Usar o mesmo ID do lead como sold_by
    lr.name,
    'Teste de inserção',
    'teste.pdf'
FROM lead_real lr
CROSS JOIN stage_real sr;

-- Verificar se o registro foi inserido
SELECT 
    'TESTE_INSERCAO_RESULTADO' as tipo,
    COUNT(*) as registros_inseridos
FROM sales
WHERE budget_description = 'Teste de inserção';

-- Limpar o registro de teste
DELETE FROM sales WHERE budget_description = 'Teste de inserção';

-- PASSO 10: Verificar logs de erro (se disponível)
SELECT 
    'LOGS_ERRO' as tipo,
    'Verificar logs do Supabase para erros de inserção' as status;
