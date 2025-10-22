-- CRIAR TENANT DISTRIBUIDOR
-- Execute este script no Supabase SQL Editor

-- Limpar dados existentes da tenant Distribuidor (se houver)
DELETE FROM leads WHERE tenant_id = '550e8400-e29b-41d4-a716-446655440001';
DELETE FROM stages WHERE tenant_id = '550e8400-e29b-41d4-a716-446655440001';
DELETE FROM pipelines WHERE tenant_id = '550e8400-e29b-41d4-a716-446655440001';
DELETE FROM user_roles WHERE tenant_id = '550e8400-e29b-41d4-a716-446655440001';
DELETE FROM users WHERE tenant_id = '550e8400-e29b-41d4-a716-446655440001';
DELETE FROM tenants WHERE id = '550e8400-e29b-41d4-a716-446655440001';

-- Criar tenant Distribuidor
INSERT INTO tenants (id, name, created_at, updated_at) 
VALUES (
  '550e8400-e29b-41d4-a716-446655440001', 
  'Distribuidor', 
  NOW(), 
  NOW()
);

-- Aguardar
SELECT pg_sleep(1.0);

-- Criar usuário Julia (Agente)
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

-- Aguardar
SELECT pg_sleep(1.0);

-- Criar usuário Julio (Supervisor)
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

-- Aguardar
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

-- Aguardar
SELECT pg_sleep(2.0);

-- Adicionar leads de exemplo
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

-- Verificar dados criados
SELECT 'TENANT DISTRIBUIDOR CRIADA COM SUCESSO!' as resultado;
SELECT 'Tenant ID: 550e8400-e29b-41d4-a716-446655440001' as info;
SELECT 'Usuários: Julia (Agente) e Julio (Supervisor)' as usuarios;

