-- Verificação rápida da tabela sales
SELECT 
    'SALES COUNT' as info,
    COUNT(*) as total
FROM sales 
WHERE tenant_id = '8bd69047-7533-42f3-a2f7-e3a60477f68c';

-- Verificar estrutura
SELECT 
    column_name,
    data_type
FROM information_schema.columns 
WHERE table_name = 'sales' 
ORDER BY ordinal_position;

-- Verificar alguns registros
SELECT 
    id,
    lead_id,
    amount,
    created_at
FROM sales 
WHERE tenant_id = '8bd69047-7533-42f3-a2f7-e3a60477f68c'
LIMIT 5;
