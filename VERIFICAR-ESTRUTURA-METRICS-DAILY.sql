-- =====================================================
-- VERIFICAR ESTRUTURA DA TABELA METRICS_DAILY
-- =====================================================
-- Script para verificar a estrutura da tabela metrics_daily

-- 1. Verificar se a tabela existe
SELECT 
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
    AND table_name = 'metrics_daily';

-- 2. Verificar colunas da tabela metrics_daily
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
    AND table_name = 'metrics_daily'
ORDER BY ordinal_position;

-- 3. Verificar se há dados na tabela
SELECT 
    'DADOS ATUAIS' as tipo,
    COUNT(*) as total_registros,
    MIN(date) as data_mais_antiga,
    MAX(date) as data_mais_recente
FROM metrics_daily 
WHERE tenant_id = '8bd69047-7533-42f3-a2f7-e3a60477f68c';

-- 4. Verificar estrutura da tabela leads para comparação
SELECT 
    column_name,
    data_type
FROM information_schema.columns 
WHERE table_schema = 'public' 
    AND table_name = 'leads'
    AND column_name IN ('id', 'tenant_id', 'created_at')
ORDER BY ordinal_position;
