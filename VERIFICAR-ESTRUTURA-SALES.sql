-- Verificar estrutura da tabela sales
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'sales' 
ORDER BY ordinal_position;

-- Verificar dados da tabela sales
SELECT 
    id,
    lead_id,
    amount,
    created_at,
    tenant_id
FROM sales 
WHERE tenant_id = '8bd69047-7533-42f3-a2f7-e3a60477f68c'
ORDER BY created_at DESC
LIMIT 10;

-- Verificar se há vendas para leads existentes
SELECT 
    s.id as sale_id,
    s.lead_id,
    s.amount,
    s.created_at as sale_created_at,
    l.id as lead_exists,
    l.name as lead_name,
    l.created_at as lead_created_at
FROM sales s
LEFT JOIN leads l ON s.lead_id = l.id
WHERE s.tenant_id = '8bd69047-7533-42f3-a2f7-e3a60477f68c'
ORDER BY s.created_at DESC
LIMIT 10;

-- Contar vendas por tenant
SELECT 
    tenant_id,
    COUNT(*) as total_vendas,
    SUM(amount) as total_valor
FROM sales 
GROUP BY tenant_id;

-- Verificar leads que têm vendas
SELECT 
    l.id,
    l.name,
    l.created_at,
    s.amount,
    s.created_at as sale_created_at
FROM leads l
INNER JOIN sales s ON l.id = s.lead_id
WHERE l.tenant_id = '8bd69047-7533-42f3-a2f7-e3a60477f68c'
ORDER BY l.created_at DESC
LIMIT 10;
