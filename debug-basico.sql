-- Teste básico das tabelas
SELECT 'leads' as tabela, COUNT(*) as total FROM leads WHERE tenant_id = '8bd69047-7533-42f3-a2f7-e3a60477f68c'
UNION ALL
SELECT 'messages' as tabela, COUNT(*) as total FROM messages WHERE tenant_id = '8bd69047-7533-42f3-a2f7-e3a60477f68c'
UNION ALL
SELECT 'stages' as tabela, COUNT(*) as total FROM stages WHERE tenant_id = '8bd69047-7533-42f3-a2f7-e3a60477f68c'
UNION ALL
SELECT 'budgets' as tabela, COUNT(*) as total FROM budgets WHERE tenant_id = '8bd69047-7533-42f3-a2f7-e3a60477f68c'
UNION ALL
SELECT 'sales' as tabela, COUNT(*) as total FROM sales WHERE tenant_id = '8bd69047-7533-42f3-a2f7-e3a60477f68c'
UNION ALL
SELECT 'metrics_daily' as tabela, COUNT(*) as total FROM metrics_daily WHERE tenant_id = '8bd69047-7533-42f3-a2f7-e3a60477f68c';
