-- =====================================================
-- VERIFICAR TODAS AS TABELAS - BUSCAR DADOS REAIS
-- =====================================================
-- Script para verificar se existem dados em todas as tabelas

-- 1. Verificar todas as tabelas que existem
SELECT 
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- 2. Verificar se existem dados em outras tabelas (sem tenant_id)
SELECT 
    'DADOS EM SALES' as tabela,
    COUNT(*) as total_registros
FROM sales;

-- 3. Verificar se existem dados em outras tabelas (sem tenant_id)
SELECT 
    'DADOS EM MESSAGES' as tabela,
    COUNT(*) as total_registros
FROM messages;

-- 4. Verificar se existem dados em outras tabelas (sem tenant_id)
SELECT 
    'DADOS EM STAGES' as tabela,
    COUNT(*) as total_registros
FROM stages;

-- 5. Verificar se existem dados em outras tabelas (sem tenant_id)
SELECT 
    'DADOS EM BUDGETS' as tabela,
    COUNT(*) as total_registros
FROM budgets;

-- 6. Verificar se existem dados em outras tabelas (sem tenant_id)
SELECT 
    'DADOS EM METRICS_DAILY' as tabela,
    COUNT(*) as total_registros
FROM metrics_daily;

-- 7. Verificar se existem dados em outras tabelas (sem tenant_id)
SELECT 
    'DADOS EM DAILY_SALES_METRICS' as tabela,
    COUNT(*) as total_registros
FROM daily_sales_metrics;
