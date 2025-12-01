-- Verificar se há dados nas tabelas
SELECT 'sales' as tabela, COUNT(*) as registros FROM sales WHERE tenant_id = '8bd69047-7533-42f3-a2f7-e3a60477f68c'
UNION ALL
SELECT 'metrics_daily' as tabela, COUNT(*) as registros FROM metrics_daily WHERE tenant_id = '8bd69047-7533-42f3-a2f7-e3a60477f68c'
UNION ALL
SELECT 'leads' as tabela, COUNT(*) as registros FROM leads WHERE tenant_id = '8bd69047-7533-42f3-a2f7-e3a60477f68c';

-- Verificar estrutura da tabela metrics_daily
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'metrics_daily' 
  AND table_schema = 'public'
ORDER BY ordinal_position;
