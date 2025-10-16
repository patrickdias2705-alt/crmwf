-- =====================================================
-- LIMPAR E INSERIR DADOS - EVITAR CHAVES DUPLICADAS
-- =====================================================
-- Script que limpa dados existentes e insere novos dados

-- 1. Limpar dados existentes para evitar chaves duplicadas
DELETE FROM metrics_daily WHERE tenant_id = '8bd69047-7533-42f3-a2f7-e3a60477f68c';
DELETE FROM leads WHERE tenant_id = '8bd69047-7533-42f3-a2f7-e3a60477f68c';

-- 2. Inserir leads de exemplo para os últimos 7 dias
INSERT INTO leads (
    id,
    tenant_id,
    name,
    phone,
    email,
    origin,
    created_at,
    updated_at,
    fields
) VALUES 
-- Hoje (3 leads, 2 vendidos)
(gen_random_uuid(), '8bd69047-7533-42f3-a2f7-e3a60477f68c', 'João Silva', '11999999999', 'joao@email.com', 'meta_ads', NOW() - INTERVAL '0 days', NOW(), '{"sold": true, "sold_amount": 850, "qualified": true, "budget": 850}'),
(gen_random_uuid(), '8bd69047-7533-42f3-a2f7-e3a60477f68c', 'Maria Santos', '11999999998', 'maria@email.com', 'instagram', NOW() - INTERVAL '0 days', NOW(), '{"sold": true, "sold_amount": 1200, "qualified": true, "budget": 1200}'),
(gen_random_uuid(), '8bd69047-7533-42f3-a2f7-e3a60477f68c', 'Pedro Costa', '11999999997', 'pedro@email.com', 'site', NOW() - INTERVAL '0 days', NOW(), '{"qualified": true, "budget": 600}'),

-- Ontem (2 leads, 1 vendido)
(gen_random_uuid(), '8bd69047-7533-42f3-a2f7-e3a60477f68c', 'Ana Oliveira', '11999999996', 'ana@email.com', 'meta_ads', NOW() - INTERVAL '1 days', NOW(), '{"sold": true, "sold_amount": 950, "qualified": true, "budget": 950}'),
(gen_random_uuid(), '8bd69047-7533-42f3-a2f7-e3a60477f68c', 'Carlos Lima', '11999999995', 'carlos@email.com', 'facebook', NOW() - INTERVAL '1 days', NOW(), '{"qualified": true, "budget": 750}'),

-- 2 dias atrás (3 leads, 2 vendidos)
(gen_random_uuid(), '8bd69047-7533-42f3-a2f7-e3a60477f68c', 'Lucia Ferreira', '11999999994', 'lucia@email.com', 'instagram', NOW() - INTERVAL '2 days', NOW(), '{"sold": true, "sold_amount": 1100, "qualified": true, "budget": 1100}'),
(gen_random_uuid(), '8bd69047-7533-42f3-a2f7-e3a60477f68c', 'Roberto Alves', '11999999993', 'roberto@email.com', 'site', NOW() - INTERVAL '2 days', NOW(), '{"qualified": true, "budget": 500}'),
(gen_random_uuid(), '8bd69047-7533-42f3-a2f7-e3a60477f68c', 'Fernanda Rocha', '11999999992', 'fernanda@email.com', 'meta_ads', NOW() - INTERVAL '2 days', NOW(), '{"sold": true, "sold_amount": 800, "qualified": true, "budget": 800}'),

-- 3 dias atrás (2 leads, 1 vendido)
(gen_random_uuid(), '8bd69047-7533-42f3-a2f7-e3a60477f68c', 'Marcos Pereira', '11999999991', 'marcos@email.com', 'facebook', NOW() - INTERVAL '3 days', NOW(), '{"sold": true, "sold_amount": 1300, "qualified": true, "budget": 1300}'),
(gen_random_uuid(), '8bd69047-7533-42f3-a2f7-e3a60477f68c', 'Juliana Souza', '11999999990', 'juliana@email.com', 'instagram', NOW() - INTERVAL '3 days', NOW(), '{"qualified": true, "budget": 700}'),

-- 4 dias atrás (3 leads, 2 vendidos)
(gen_random_uuid(), '8bd69047-7533-42f3-a2f7-e3a60477f68c', 'Rafael Mendes', '11999999989', 'rafael@email.com', 'site', NOW() - INTERVAL '4 days', NOW(), '{"sold": true, "sold_amount": 900, "qualified": true, "budget": 900}'),
(gen_random_uuid(), '8bd69047-7533-42f3-a2f7-e3a60477f68c', 'Patricia Gomes', '11999999988', 'patricia@email.com', 'meta_ads', NOW() - INTERVAL '4 days', NOW(), '{"qualified": true, "budget": 650}'),
(gen_random_uuid(), '8bd69047-7533-42f3-a2f7-e3a60477f68c', 'Diego Santos', '11999999987', 'diego@email.com', 'facebook', NOW() - INTERVAL '4 days', NOW(), '{"sold": true, "sold_amount": 1050, "qualified": true, "budget": 1050}'),

-- 5 dias atrás (2 leads, 1 vendido)
(gen_random_uuid(), '8bd69047-7533-42f3-a2f7-e3a60477f68c', 'Camila Lima', '11999999986', 'camila@email.com', 'instagram', NOW() - INTERVAL '5 days', NOW(), '{"sold": true, "sold_amount": 750, "qualified": true, "budget": 750}'),
(gen_random_uuid(), '8bd69047-7533-42f3-a2f7-e3a60477f68c', 'Bruno Costa', '11999999985', 'bruno@email.com', 'site', NOW() - INTERVAL '5 days', NOW(), '{"qualified": true, "budget": 550}'),

-- 6 dias atrás (3 leads, 2 vendidos)
(gen_random_uuid(), '8bd69047-7533-42f3-a2f7-e3a60477f68c', 'Larissa Silva', '11999999984', 'larissa@email.com', 'meta_ads', NOW() - INTERVAL '6 days', NOW(), '{"sold": true, "sold_amount": 1150, "qualified": true, "budget": 1150}'),
(gen_random_uuid(), '8bd69047-7533-42f3-a2f7-e3a60477f68c', 'Thiago Oliveira', '11999999983', 'thiago@email.com', 'facebook', NOW() - INTERVAL '6 days', NOW(), '{"qualified": true, "budget": 800}'),
(gen_random_uuid(), '8bd69047-7533-42f3-a2f7-e3a60477f68c', 'Vanessa Rocha', '11999999982', 'vanessa@email.com', 'instagram', NOW() - INTERVAL '6 days', NOW(), '{"sold": true, "sold_amount": 950, "qualified": true, "budget": 950}');

-- 3. Verificar os leads inseridos
SELECT 
    'LEADS INSERIDOS' as tipo,
    COUNT(*) as total_leads,
    COUNT(CASE WHEN fields->>'sold' = 'true' THEN 1 END) as vendidos,
    SUM(CAST(fields->>'sold_amount' AS NUMERIC)) as total_vendas
FROM leads 
WHERE tenant_id = '8bd69047-7533-42f3-a2f7-e3a60477f68c'
    AND created_at >= NOW() - INTERVAL '7 days';

-- 4. Verificar leads por dia
SELECT 
    DATE(created_at) as data,
    COUNT(*) as leads_por_dia,
    COUNT(CASE WHEN fields->>'sold' = 'true' THEN 1 END) as vendidos_por_dia,
    SUM(CAST(fields->>'sold_amount' AS NUMERIC)) as vendas_por_dia
FROM leads 
WHERE tenant_id = '8bd69047-7533-42f3-a2f7-e3a60477f68c'
    AND created_at >= NOW() - INTERVAL '7 days'
GROUP BY DATE(created_at)
ORDER BY data DESC;

-- 5. Verificar se existem triggers para calcular métricas automaticamente
SELECT 
    trigger_name,
    event_manipulation,
    action_timing,
    action_statement
FROM information_schema.triggers 
WHERE event_object_table = 'leads'
    AND event_object_schema = 'public';

-- 6. Se não houver triggers, tentar inserir na metrics_daily manualmente
-- Primeiro verificar a estrutura da tabela
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
    AND table_name = 'metrics_daily'
ORDER BY ordinal_position;

COMMIT;
