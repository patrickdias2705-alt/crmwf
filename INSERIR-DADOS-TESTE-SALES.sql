-- Inserir dados de teste na tabela sales para debug
-- Primeiro, verificar se há leads para usar
SELECT 
    'LEADS DISPONÍVEIS' as info,
    COUNT(*) as total_leads,
    MIN(created_at) as primeiro_lead,
    MAX(created_at) as ultimo_lead
FROM leads 
WHERE tenant_id = '8bd69047-7533-42f3-a2f7-e3a60477f68c';

-- Inserir vendas de teste para alguns leads existentes
INSERT INTO sales (
    tenant_id,
    lead_id,
    amount,
    stage_id,
    stage_name,
    sold_by_name,
    budget_description,
    created_at
)
SELECT 
    '8bd69047-7533-42f3-a2f7-e3a60477f68c'::UUID,
    l.id,
    CASE 
        WHEN l.fields->>'budget_amount' IS NOT NULL 
        THEN (l.fields->>'budget_amount')::DECIMAL
        ELSE 1500.00 + (RANDOM() * 5000)::DECIMAL
    END as amount,
    l.stage_id,
    s.name as stage_name,
    'Teste Maria' as sold_by_name,
    'Venda de teste para debug' as budget_description,
    l.created_at + INTERVAL '1 day' as created_at
FROM leads l
LEFT JOIN stages s ON l.stage_id = s.id
WHERE l.tenant_id = '8bd69047-7533-42f3-a2f7-e3a60477f68c'
  AND l.id NOT IN (SELECT lead_id FROM sales WHERE tenant_id = '8bd69047-7533-42f3-a2f7-e3a60477f68c')
LIMIT 10;

-- Verificar se as vendas foram inseridas
SELECT 
    'VENDAS INSERIDAS' as info,
    COUNT(*) as total_vendas,
    SUM(amount) as valor_total,
    AVG(amount) as ticket_medio
FROM sales 
WHERE tenant_id = '8bd69047-7533-42f3-a2f7-e3a60477f68c';
