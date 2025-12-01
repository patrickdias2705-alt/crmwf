-- Verificar estrutura da tabela leads para campos de data de venda
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'leads' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Verificar alguns leads para entender a estrutura dos campos
SELECT id, created_at, updated_at, status, fields
FROM leads 
WHERE tenant_id = '8bd69047-7533-42f3-a2f7-e3a60477f68c'
LIMIT 5;