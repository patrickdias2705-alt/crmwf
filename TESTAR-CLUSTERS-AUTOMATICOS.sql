-- ========================================
-- TESTAR CLUSTERS AUTOMÁTICOS
-- ========================================
-- Execute este script no Supabase SQL Editor

-- 1. Verificar se a tabela existe
SELECT 
    'TABELA_EXISTE' as status,
    COUNT(*) as total_clusters
FROM leads_daily_clusters;

-- 2. Verificar clusters para o tenant da Maria
SELECT 
    'CLUSTERS_MARIA' as status,
    date,
    total_leads,
    leads_attended,
    leads_closed,
    leads_vendidos,
    total_revenue
FROM leads_daily_clusters
WHERE tenant_id = '8bd69047-7533-42f3-a2f7-e3a60477f68c'
ORDER BY date;

-- 3. Verificar se os triggers estão funcionando
SELECT 
    'TRIGGERS_ATIVOS' as status,
    trigger_name,
    event_manipulation,
    action_timing
FROM information_schema.triggers
WHERE trigger_name LIKE '%daily_cluster%';

-- 4. Testar inserção de um lead para ver se o trigger funciona
-- Verificar TODOS os clusters criados (não apenas hoje)
SELECT 
  'TODOS_CLUSTERS' as status,
  date,
  total_leads,
  leads_attended,
  leads_closed,
  total_revenue
FROM leads_daily_clusters
WHERE tenant_id = '8bd69047-7533-42f3-a2f7-e3a60477f68c'
ORDER BY date DESC
LIMIT 30;
