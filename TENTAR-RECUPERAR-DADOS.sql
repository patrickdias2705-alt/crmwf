-- =====================================================
-- TENTAR RECUPERAR DADOS APAGADOS
-- =====================================================
-- Script para tentar recuperar dados que foram apagados

-- 1. Verificar se existem dados em outras tabelas que possam ter referências
SELECT 
    'DADOS EM OUTRAS TABELAS' as status,
    'sales' as tabela,
    COUNT(*) as total_registros
FROM sales 
WHERE tenant_id = '8bd69047-7533-42f3-a2f7-e3a60477f68c'

UNION ALL

SELECT 
    'DADOS EM OUTRAS TABELAS' as status,
    'metrics_daily' as tabela,
    COUNT(*) as total_registros
FROM metrics_daily 
WHERE tenant_id = '8bd69047-7533-42f3-a2f7-e3a60477f68c'

UNION ALL

SELECT 
    'DADOS EM OUTRAS TABELAS' as status,
    'messages' as tabela,
    COUNT(*) as total_registros
FROM messages 
WHERE tenant_id = '8bd69047-7533-42f3-a2f7-e3a60477f68c';

-- 2. Verificar se existem dados com tenant_id diferente
SELECT 
    'DADOS COM OUTRO TENANT_ID' as status,
    tenant_id,
    COUNT(*) as total_leads
FROM leads 
GROUP BY tenant_id
ORDER BY total_leads DESC;

-- 3. Verificar se existem dados com tenant_id NULL
SELECT 
    'DADOS COM TENANT_ID NULL' as status,
    COUNT(*) as total_leads,
    MIN(created_at) as lead_mais_antigo,
    MAX(created_at) as lead_mais_recente
FROM leads 
WHERE tenant_id IS NULL;

-- 4. Verificar se existem dados em outras tabelas relacionadas
SELECT 
    'DADOS EM STAGES' as status,
    COUNT(*) as total_stages
FROM stages 
WHERE tenant_id = '8bd69047-7533-42f3-a2f7-e3a60477f68c';

-- 5. Verificar se existem dados em outras tabelas relacionadas
SELECT 
    'DADOS EM BUDGETS' as status,
    COUNT(*) as total_budgets
FROM budgets;
