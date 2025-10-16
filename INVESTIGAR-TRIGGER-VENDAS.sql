-- ========================================
-- INVESTIGAR TRIGGER DE VENDAS - POR QUE NÃO ATUALIZA
-- ========================================
-- Execute este script no Supabase SQL Editor

-- PASSO 1: Verificar se existe o trigger para criar vendas
SELECT 
    'TRIGGERS_EXISTENTES' as tipo,
    trigger_name,
    event_manipulation,
    event_object_table,
    action_statement
FROM 
    information_schema.triggers
WHERE 
    trigger_schema = 'public'
    AND event_object_table IN ('leads', 'sales')
ORDER BY 
    event_object_table, trigger_name;

-- PASSO 2: Verificar leads marcados como vendidos mas sem sales
SELECT 
    'LEADS_VENDIDOS_SEM_SALES' as tipo,
    l.id as lead_id,
    l.name as lead_name,
    l.status,
    l.fields->>'sale_value' as sale_value_fields,
    l.fields->>'sale_date' as sale_date_fields,
    s.id as sale_id,
    s.amount as sale_amount
FROM 
    public.leads l
LEFT JOIN 
    public.sales s ON l.id = s.lead_id
WHERE 
    l.status = 'closed'
    AND l.fields ? 'sale_value'
    AND l.fields->>'sale_value' IS NOT NULL
    AND l.fields->>'sale_value' != '0'
    AND l.fields->>'sale_value' != ''
    AND s.id IS NULL
ORDER BY 
    l.created_at DESC
LIMIT 10;

-- PASSO 3: Verificar se há função para inserir vendas
SELECT 
    'FUNCOES_VENDAS' as tipo,
    routine_name,
    routine_type,
    routine_definition
FROM 
    information_schema.routines
WHERE 
    routine_schema = 'public'
    AND routine_name LIKE '%sale%'
ORDER BY 
    routine_name;

-- PASSO 4: Verificar leads fechados recentemente
SELECT 
    'LEADS_FECHADOS_RECENTES' as tipo,
    id,
    name,
    status,
    fields->>'sale_value' as sale_value,
    fields->>'sale_date' as sale_date,
    created_at,
    updated_at
FROM 
    public.leads
WHERE 
    status = 'closed'
    AND updated_at > NOW() - INTERVAL '7 days'
ORDER BY 
    updated_at DESC
LIMIT 10;

-- PASSO 5: Verificar se há vendas criadas recentemente
SELECT 
    'VENDAS_RECENTES' as tipo,
    id,
    lead_id,
    amount,
    created_at
FROM 
    public.sales
WHERE 
    created_at > NOW() - INTERVAL '7 days'
ORDER BY 
    created_at DESC
LIMIT 10;

-- ========================================
-- ANÁLISE:
-- ========================================
-- 1. Se PASSO 1 não mostrar trigger: Precisa criar trigger
-- 2. Se PASSO 2 mostrar leads: Há leads vendidos sem sales
-- 3. Se PASSO 3 não mostrar função: Precisa criar função
-- ========================================
