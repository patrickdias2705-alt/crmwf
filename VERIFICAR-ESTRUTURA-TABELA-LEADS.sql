-- ========================================
-- VERIFICAR ESTRUTURA DA TABELA LEADS
-- ========================================
-- Execute este script no Supabase SQL Editor

-- PASSO 1: Verificar estrutura da tabela leads
SELECT 
    column_name,
    data_type,
    is_nullable
FROM 
    information_schema.columns
WHERE 
    table_schema = 'public'
    AND table_name = 'leads'
ORDER BY 
    ordinal_position;

-- PASSO 2: Verificar algumas linhas da tabela leads
SELECT 
    *
FROM 
    public.leads
LIMIT 5;

-- PASSO 3: Verificar se há coluna user_id ou similar
SELECT 
    column_name
FROM 
    information_schema.columns
WHERE 
    table_schema = 'public'
    AND table_name = 'leads'
    AND column_name LIKE '%user%';

-- PASSO 4: Verificar se há coluna agent_id ou similar
SELECT 
    column_name
FROM 
    information_schema.columns
WHERE 
    table_schema = 'public'
    AND table_name = 'leads'
    AND column_name LIKE '%agent%';

-- PASSO 5: Verificar se há coluna created_by ou similar
SELECT 
    column_name
FROM 
    information_schema.columns
WHERE 
    table_schema = 'public'
    AND table_name = 'leads'
    AND column_name LIKE '%created%';

-- PASSO 6: Verificar todas as colunas que podem identificar o usuário
SELECT 
    column_name
FROM 
    information_schema.columns
WHERE 
    table_schema = 'public'
    AND table_name = 'leads'
    AND (
        column_name LIKE '%user%' OR
        column_name LIKE '%agent%' OR
        column_name LIKE '%created%' OR
        column_name LIKE '%owner%' OR
        column_name LIKE '%author%'
    );
