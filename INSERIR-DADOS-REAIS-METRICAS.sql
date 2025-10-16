-- =====================================================
-- INSERIR DADOS REAIS PARA MÉTRICAS
-- =====================================================
-- Script para inserir dados de exemplo realistas no banco

-- 1. Inserir leads de exemplo para os últimos 7 dias
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
-- Hoje
(gen_random_uuid(), '8bd69047-7533-42f3-a2f7-e3a60477f68c', 'João Silva', '11999999999', 'joao@email.com', 'meta_ads', NOW() - INTERVAL '0 days', NOW(), '{"sold": true, "sold_amount": 850, "qualified": true, "budget": 850}'),
(gen_random_uuid(), '8bd69047-7533-42f3-a2f7-e3a60477f68c', 'Maria Santos', '11999999998', 'maria@email.com', 'instagram', NOW() - INTERVAL '0 days', NOW(), '{"sold": true, "sold_amount": 1200, "qualified": true, "budget": 1200}'),
(gen_random_uuid(), '8bd69047-7533-42f3-a2f7-e3a60477f68c', 'Pedro Costa', '11999999997', 'pedro@email.com', 'site', NOW() - INTERVAL '0 days', NOW(), '{"qualified": true, "budget": 600}'),

-- Ontem
(gen_random_uuid(), '8bd69047-7533-42f3-a2f7-e3a60477f68c', 'Ana Oliveira', '11999999996', 'ana@email.com', 'meta_ads', NOW() - INTERVAL '1 days', NOW(), '{"sold": true, "sold_amount": 950, "qualified": true, "budget": 950}'),
(gen_random_uuid(), '8bd69047-7533-42f3-a2f7-e3a60477f68c', 'Carlos Lima', '11999999995', 'carlos@email.com', 'facebook', NOW() - INTERVAL '1 days', NOW(), '{"qualified": true, "budget": 750}'),

-- 2 dias atrás
(gen_random_uuid(), '8bd69047-7533-42f3-a2f7-e3a60477f68c', 'Lucia Ferreira', '11999999994', 'lucia@email.com', 'instagram', NOW() - INTERVAL '2 days', NOW(), '{"sold": true, "sold_amount": 1100, "qualified": true, "budget": 1100}'),
(gen_random_uuid(), '8bd69047-7533-42f3-a2f7-e3a60477f68c', 'Roberto Alves', '11999999993', 'roberto@email.com', 'site', NOW() - INTERVAL '2 days', NOW(), '{"qualified": true, "budget": 500}'),
(gen_random_uuid(), '8bd69047-7533-42f3-a2f7-e3a60477f68c', 'Fernanda Rocha', '11999999992', 'fernanda@email.com', 'meta_ads', NOW() - INTERVAL '2 days', NOW(), '{"sold": true, "sold_amount": 800, "qualified": true, "budget": 800}'),

-- 3 dias atrás
(gen_random_uuid(), '8bd69047-7533-42f3-a2f7-e3a60477f68c', 'Marcos Pereira', '11999999991', 'marcos@email.com', 'facebook', NOW() - INTERVAL '3 days', NOW(), '{"sold": true, "sold_amount": 1300, "qualified": true, "budget": 1300}'),
(gen_random_uuid(), '8bd69047-7533-42f3-a2f7-e3a60477f68c', 'Juliana Souza', '11999999990', 'juliana@email.com', 'instagram', NOW() - INTERVAL '3 days', NOW(), '{"qualified": true, "budget": 700}'),

-- 4 dias atrás
(gen_random_uuid(), '8bd69047-7533-42f3-a2f7-e3a60477f68c', 'Rafael Mendes', '11999999989', 'rafael@email.com', 'site', NOW() - INTERVAL '4 days', NOW(), '{"sold": true, "sold_amount": 900, "qualified": true, "budget": 900}'),
(gen_random_uuid(), '8bd69047-7533-42f3-a2f7-e3a60477f68c', 'Patricia Gomes', '11999999988', 'patricia@email.com', 'meta_ads', NOW() - INTERVAL '4 days', NOW(), '{"qualified": true, "budget": 650}'),
(gen_random_uuid(), '8bd69047-7533-42f3-a2f7-e3a60477f68c', 'Diego Santos', '11999999987', 'diego@email.com', 'facebook', NOW() - INTERVAL '4 days', NOW(), '{"sold": true, "sold_amount": 1050, "qualified": true, "budget": 1050}'),

-- 5 dias atrás
(gen_random_uuid(), '8bd69047-7533-42f3-a2f7-e3a60477f68c', 'Camila Lima', '11999999986', 'camila@email.com', 'instagram', NOW() - INTERVAL '5 days', NOW(), '{"sold": true, "sold_amount": 750, "qualified": true, "budget": 750}'),
(gen_random_uuid(), '8bd69047-7533-42f3-a2f7-e3a60477f68c', 'Bruno Costa', '11999999985', 'bruno@email.com', 'site', NOW() - INTERVAL '5 days', NOW(), '{"qualified": true, "budget": 550}'),

-- 6 dias atrás
(gen_random_uuid(), '8bd69047-7533-42f3-a2f7-e3a60477f68c', 'Larissa Silva', '11999999984', 'larissa@email.com', 'meta_ads', NOW() - INTERVAL '6 days', NOW(), '{"sold": true, "sold_amount": 1150, "qualified": true, "budget": 1150}'),
(gen_random_uuid(), '8bd69047-7533-42f3-a2f7-e3a60477f68c', 'Thiago Oliveira', '11999999983', 'thiago@email.com', 'facebook', NOW() - INTERVAL '6 days', NOW(), '{"qualified": true, "budget": 800}'),
(gen_random_uuid(), '8bd69047-7533-42f3-a2f7-e3a60477f68c', 'Vanessa Rocha', '11999999982', 'vanessa@email.com', 'instagram', NOW() - INTERVAL '6 days', NOW(), '{"sold": true, "sold_amount": 950, "qualified": true, "budget": 950}');

-- 2. Inserir métricas diárias para os últimos 7 dias
INSERT INTO metrics_daily (
    tenant_id,
    date,
    leads_in,
    leads_attended,
    qualified,
    closed,
    refused,
    lost,
    booked,
    total_revenue,
    average_ticket,
    total_budget_value,
    created_at,
    updated_at
) VALUES 
-- Hoje
('8bd69047-7533-42f3-a2f7-e3a60477f68c', CURRENT_DATE, 3, 3, 3, 2, 0, 0, 0, 2050, 1025, 2050, NOW(), NOW()),

-- Ontem
('8bd69047-7533-42f3-a2f7-e3a60477f68c', CURRENT_DATE - INTERVAL '1 days', 2, 2, 2, 1, 0, 0, 0, 950, 950, 1700, NOW(), NOW()),

-- 2 dias atrás
('8bd69047-7533-42f3-a2f7-e3a60477f68c', CURRENT_DATE - INTERVAL '2 days', 3, 3, 3, 2, 0, 0, 0, 1900, 950, 2400, NOW(), NOW()),

-- 3 dias atrás
('8bd69047-7533-42f3-a2f7-e3a60477f68c', CURRENT_DATE - INTERVAL '3 days', 2, 2, 2, 1, 0, 0, 0, 1300, 1300, 2000, NOW(), NOW()),

-- 4 dias atrás
('8bd69047-7533-42f3-a2f7-e3a60477f68c', CURRENT_DATE - INTERVAL '4 days', 3, 3, 3, 2, 0, 0, 0, 1950, 975, 2600, NOW(), NOW()),

-- 5 dias atrás
('8bd69047-7533-42f3-a2f7-e3a60477f68c', CURRENT_DATE - INTERVAL '5 days', 2, 2, 2, 1, 0, 0, 0, 750, 750, 1300, NOW(), NOW()),

-- 6 dias atrás
('8bd69047-7533-42f3-a2f7-e3a60477f68c', CURRENT_DATE - INTERVAL '6 days', 3, 3, 3, 2, 0, 0, 0, 2100, 1050, 2900, NOW(), NOW());

-- 3. Verificar os dados inseridos
SELECT 
    'LEADS INSERIDOS' as tipo,
    COUNT(*) as total_leads,
    COUNT(CASE WHEN fields->>'sold' = 'true' THEN 1 END) as vendidos,
    SUM(CAST(fields->>'sold_amount' AS NUMERIC)) as total_vendas
FROM leads 
WHERE tenant_id = '8bd69047-7533-42f3-a2f7-e3a60477f68c'
    AND created_at >= NOW() - INTERVAL '7 days';

-- 4. Verificar métricas diárias
SELECT 
    'METRICS_DAILY' as tipo,
    date,
    leads_in,
    closed,
    total_revenue,
    average_ticket
FROM metrics_daily 
WHERE tenant_id = '8bd69047-7533-42f3-a2f7-e3a60477f68c'
    AND date >= CURRENT_DATE - INTERVAL '7 days'
ORDER BY date DESC;

COMMIT;
