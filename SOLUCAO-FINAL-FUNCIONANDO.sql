-- SOLUÇÃO FINAL QUE FUNCIONA: Criar tenants sem problemas de trigger
-- Execute este script no Supabase SQL Editor

-- =====================================================
-- 1. LIMPAR DADOS EXISTENTES (SE HOUVER)
-- =====================================================

-- Limpar dados das novas tenants (se existirem)
DELETE FROM leads WHERE tenant_id IN ('550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440011');
DELETE FROM stages WHERE tenant_id IN ('550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440011');
DELETE FROM pipelines WHERE tenant_id IN ('550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440011');
DELETE FROM user_roles WHERE tenant_id IN ('550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440011');
DELETE FROM users WHERE tenant_id IN ('550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440011');
DELETE FROM tenants WHERE id IN ('550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440011');

-- =====================================================
-- 2. CRIAR TENANT DISTRIBUIDOR
-- =====================================================

-- Inserir tenant Distribuidor
INSERT INTO tenants (id, name, created_at, updated_at) 
VALUES (
  '550e8400-e29b-41d4-a716-446655440001', 
  'Distribuidor', 
  NOW(), 
  NOW()
);

-- Aguardar um pouco
SELECT pg_sleep(0.5);

-- Criar usuário Julia (Agente) - UM POR VEZ
INSERT INTO users (id, email, name, tenant_id, role, created_at, updated_at) 
VALUES (
  '550e8400-e29b-41d4-a716-446655440002', 
  'julia@distribuidor.com', 
  'Julia - Agente Distribuidor', 
  '550e8400-e29b-41d4-a716-446655440001', 
  'agent', 
  NOW(), 
  NOW()
);

-- Aguardar para o trigger processar
SELECT pg_sleep(1.0);

-- Criar usuário Julio (Supervisor) - UM POR VEZ
INSERT INTO users (id, email, name, tenant_id, role, created_at, updated_at) 
VALUES (
  '550e8400-e29b-41d4-a716-446655440003', 
  'julio@distribuidor.com', 
  'Julio - Supervisor Distribuidor', 
  '550e8400-e29b-41d4-a716-446655440001', 
  'supervisor', 
  NOW(), 
  NOW()
);

-- Aguardar para o trigger processar
SELECT pg_sleep(1.0);

-- Criar pipeline para Distribuidor
INSERT INTO pipelines (id, name, tenant_id, created_at, updated_at) 
VALUES (
  '550e8400-e29b-41d4-a716-446655440004', 
  'Pipeline Distribuidor', 
  '550e8400-e29b-41d4-a716-446655440001', 
  NOW(), 
  NOW()
);

-- Criar stages para Distribuidor
INSERT INTO stages (id, name, pipeline_id, tenant_id, created_at, updated_at) 
VALUES 
(
  '550e8400-e29b-41d4-a716-446655440005', 
  'Novo Lead', 
  '550e8400-e29b-41d4-a716-446655440004', 
  '550e8400-e29b-41d4-a716-446655440001', 
  NOW(), 
  NOW()
),
(
  '550e8400-e29b-41d4-a716-446655440006', 
  'Contato Inicial', 
  '550e8400-e29b-41d4-a716-446655440004', 
  '550e8400-e29b-41d4-a716-446655440001', 
  NOW(), 
  NOW()
),
(
  '550e8400-e29b-41d4-a716-446655440007', 
  'Qualificado', 
  '550e8400-e29b-41d4-a716-446655440004', 
  '550e8400-e29b-41d4-a716-446655440001', 
  NOW(), 
  NOW()
),
(
  '550e8400-e29b-41d4-a716-446655440008', 
  'Orçamento', 
  '550e8400-e29b-41d4-a716-446655440004', 
  '550e8400-e29b-41d4-a716-446655440001', 
  NOW(), 
  NOW()
),
(
  '550e8400-e29b-41d4-a716-446655440009', 
  'Negociação', 
  '550e8400-e29b-41d4-a716-446655440004', 
  '550e8400-e29b-41d4-a716-446655440001', 
  NOW(), 
  NOW()
),
(
  '550e8400-e29b-41d4-a716-446655440010', 
  'Fechado', 
  '550e8400-e29b-41d4-a716-446655440004', 
  '550e8400-e29b-41d4-a716-446655440001', 
  NOW(), 
  NOW()
);

-- =====================================================
-- 3. CRIAR TENANT PORTA A PORTA
-- =====================================================

-- Inserir tenant Porta a Porta
INSERT INTO tenants (id, name, created_at, updated_at) 
VALUES (
  '550e8400-e29b-41d4-a716-446655440011', 
  'Porta a Porta', 
  NOW(), 
  NOW()
);

-- Aguardar um pouco
SELECT pg_sleep(0.5);

-- Criar usuário Elaine (Agente) - UM POR VEZ
INSERT INTO users (id, email, name, tenant_id, role, created_at, updated_at) 
VALUES (
  '550e8400-e29b-41d4-a716-446655440012', 
  'elaine@portaporta.com', 
  'Elaine - Agente Porta a Porta', 
  '550e8400-e29b-41d4-a716-446655440011', 
  'agent', 
  NOW(), 
  NOW()
);

-- Aguardar para o trigger processar
SELECT pg_sleep(1.0);

-- Criar usuário Julio (Agente) - UM POR VEZ
INSERT INTO users (id, email, name, tenant_id, role, created_at, updated_at) 
VALUES (
  '550e8400-e29b-41d4-a716-446655440013', 
  'julio@portaporta.com', 
  'Julio - Agente Porta a Porta', 
  '550e8400-e29b-41d4-a716-446655440011', 
  'agent', 
  NOW(), 
  NOW()
);

-- Aguardar para o trigger processar
SELECT pg_sleep(1.0);

-- Criar pipeline para Porta a Porta
INSERT INTO pipelines (id, name, tenant_id, created_at, updated_at) 
VALUES (
  '550e8400-e29b-41d4-a716-446655440014', 
  'Pipeline Porta a Porta', 
  '550e8400-e29b-41d4-a716-446655440011', 
  NOW(), 
  NOW()
);

-- Criar stages para Porta a Porta
INSERT INTO stages (id, name, pipeline_id, tenant_id, created_at, updated_at) 
VALUES 
(
  '550e8400-e29b-41d4-a716-446655440015', 
  'Novo Lead', 
  '550e8400-e29b-41d4-a716-446655440014', 
  '550e8400-e29b-41d4-a716-446655440011', 
  NOW(), 
  NOW()
),
(
  '550e8400-e29b-41d4-a716-446655440016', 
  'Contato Inicial', 
  '550e8400-e29b-41d4-a716-446655440014', 
  '550e8400-e29b-41d4-a716-446655440011', 
  NOW(), 
  NOW()
),
(
  '550e8400-e29b-41d4-a716-446655440017', 
  'Qualificado', 
  '550e8400-e29b-41d4-a716-446655440014', 
  '550e8400-e29b-41d4-a716-446655440011', 
  NOW(), 
  NOW()
),
(
  '550e8400-e29b-41d4-a716-446655440018', 
  'Orçamento', 
  '550e8400-e29b-41d4-a716-446655440014', 
  '550e8400-e29b-41d4-a716-446655440011', 
  NOW(), 
  NOW()
),
(
  '550e8400-e29b-41d4-a716-446655440019', 
  'Negociação', 
  '550e8400-e29b-41d4-a716-446655440014', 
  '550e8400-e29b-41d4-a716-446655440011', 
  NOW(), 
  NOW()
),
(
  '550e8400-e29b-41d4-a716-446655440020', 
  'Fechado', 
  '550e8400-e29b-41d4-a716-446655440014', 
  '550e8400-e29b-41d4-a716-446655440011', 
  NOW(), 
  NOW()
);

-- =====================================================
-- 4. AGUARDAR E VERIFICAR USER_ROLES
-- =====================================================

-- Aguardar um pouco para todos os triggers processarem
SELECT pg_sleep(2.0);

-- Verificar se user_roles foram criadas automaticamente
SELECT 'VERIFICANDO USER_ROLES AUTOMÁTICAS:' as info;
SELECT user_id, tenant_id, role FROM user_roles WHERE tenant_id IN ('550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440011');

-- =====================================================
-- 5. ADICIONAR DADOS DE EXEMPLO
-- =====================================================

-- Leads de exemplo para Distribuidor
INSERT INTO leads (
  id, tenant_id, name, phone, email, source, stage_id, fields, created_at, updated_at
) VALUES 
(
  gen_random_uuid(), 
  '550e8400-e29b-41d4-a716-446655440001', 
  'Dr. João Silva - Distribuidor', 
  '(11) 99999-1111', 
  'joao@distribuidor.com', 
  'meta_ads', 
  '550e8400-e29b-41d4-a716-446655440010', 
  '{"budget_amount": 15000, "sold": true}'::jsonb, 
  '2025-10-16T10:00:00.000Z', 
  NOW()
),
(
  gen_random_uuid(), 
  '550e8400-e29b-41d4-a716-446655440001', 
  'Dr. Maria Santos - Distribuidor', 
  '(11) 99999-2222', 
  'maria@distribuidor.com', 
  'instagram', 
  '550e8400-e29b-41d4-a716-446655440007', 
  '{"budget_amount": 12000, "sold": false}'::jsonb, 
  '2025-10-17T09:00:00.000Z', 
  NOW()
);

-- Leads de exemplo para Porta a Porta
INSERT INTO leads (
  id, tenant_id, name, phone, email, source, stage_id, fields, created_at, updated_at
) VALUES 
(
  gen_random_uuid(), 
  '550e8400-e29b-41d4-a716-446655440011', 
  'Dr. Ana Costa - Porta a Porta', 
  '(11) 99999-4444', 
  'ana@portaporta.com', 
  'indicacao', 
  '550e8400-e29b-41d4-a716-446655440020', 
  '{"budget_amount": 8000, "sold": true}'::jsonb, 
  '2025-10-16T11:00:00.000Z', 
  NOW()
),
(
  gen_random_uuid(), 
  '550e8400-e29b-41d4-a716-446655440011', 
  'Dr. Pedro Lima - Porta a Porta', 
  '(11) 99999-5555', 
  'pedro@portaporta.com', 
  'linkedin', 
  '550e8400-e29b-41d4-a716-446655440017', 
  '{"budget_amount": 9500, "sold": false}'::jsonb, 
  '2025-10-17T15:00:00.000Z', 
  NOW()
);

-- =====================================================
-- 6. VERIFICAR DADOS CRIADOS
-- =====================================================

-- Verificar tenants criadas
SELECT 'TENANTS CRIADAS:' as info;
SELECT id, name FROM tenants WHERE id IN ('550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440011');

-- Verificar usuários criados
SELECT 'USUÁRIOS CRIADOS:' as info;
SELECT id, email, name, tenant_id, role FROM users WHERE tenant_id IN ('550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440011');

-- Verificar user_roles criadas
SELECT 'USER_ROLES CRIADAS:' as info;
SELECT user_id, tenant_id, role FROM user_roles WHERE tenant_id IN ('550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440011');

-- Verificar leads criados
SELECT 'LEADS CRIADOS:' as info;
SELECT 
  l.name, 
  l.tenant_id, 
  t.name as tenant_name,
  l.source,
  s.name as stage_name,
  l.fields->>'sold' as sold
FROM leads l
JOIN tenants t ON l.tenant_id = t.id
JOIN stages s ON l.stage_id = s.id
WHERE l.tenant_id IN ('550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440011');

SELECT 'TENANTS SEPARADAS CRIADAS COM SUCESSO!' as resultado;
SELECT 'Dados da Maria permanecem isolados na tenant: 8bd69047-7533-42f3-a2f7-e3a60477f68c' as info;
