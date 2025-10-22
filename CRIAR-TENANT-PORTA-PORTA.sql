-- CRIAR TENANT PORTA A PORTA
-- Execute este script no Supabase SQL Editor

-- Limpar dados existentes da tenant Porta a Porta (se houver)
DELETE FROM leads WHERE tenant_id = '550e8400-e29b-41d4-a716-446655440011';
DELETE FROM stages WHERE tenant_id = '550e8400-e29b-41d4-a716-446655440011';
DELETE FROM pipelines WHERE tenant_id = '550e8400-e29b-41d4-a716-446655440011';
DELETE FROM user_roles WHERE tenant_id = '550e8400-e29b-41d4-a716-446655440011';
DELETE FROM users WHERE tenant_id = '550e8400-e29b-41d4-a716-446655440011';
DELETE FROM tenants WHERE id = '550e8400-e29b-41d4-a716-446655440011';

-- Criar tenant Porta a Porta
INSERT INTO tenants (id, name, created_at, updated_at) 
VALUES (
  '550e8400-e29b-41d4-a716-446655440011', 
  'Porta a Porta', 
  NOW(), 
  NOW()
);

-- Aguardar
SELECT pg_sleep(1.0);

-- Criar usuário Elaine (Agente)
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

-- Aguardar
SELECT pg_sleep(1.0);

-- Criar usuário Julio (Agente)
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

-- Aguardar
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

-- Aguardar
SELECT pg_sleep(2.0);

-- Adicionar leads de exemplo
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

-- Verificar dados criados
SELECT 'TENANT PORTA A PORTA CRIADA COM SUCESSO!' as resultado;
SELECT 'Tenant ID: 550e8400-e29b-41d4-a716-446655440011' as info;
SELECT 'Usuários: Elaine (Agente) e Julio (Agente)' as usuarios;

