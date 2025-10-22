-- SOLUÇÃO ULTRA SIMPLES: Criar tenants sem triggers
-- Execute este script no Supabase SQL Editor

-- =====================================================
-- 1. CRIAR TENANT DISTRIBUIDOR
-- =====================================================

-- Inserir tenant Distribuidor
INSERT INTO tenants (id, name, created_at, updated_at) 
VALUES (
  '550e8400-e29b-41d4-a716-446655440001', 
  'Distribuidor', 
  NOW(), 
  NOW()
);

-- Aguardar
SELECT pg_sleep(2.0);

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
SELECT pg_sleep(2.0);

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
SELECT pg_sleep(2.0);

-- Criar pipeline para Distribuidor
INSERT INTO pipelines (id, name, tenant_id, created_at, updated_at) 
VALUES (
  '550e8400-e29b-41d4-a716-446655440004', 
  'Pipeline Distribuidor', 
  '550e8400-e29b-41d4-a716-446655440001', 
  NOW(), 
  NOW()
);

-- Aguardar
SELECT pg_sleep(1.0);

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
);

INSERT INTO stages (id, name, pipeline_id, tenant_id, created_at, updated_at) 
VALUES 
(
  '550e8400-e29b-41d4-a716-446655440006', 
  'Contato Inicial', 
  '550e8400-e29b-41d4-a716-446655440004', 
  '550e8400-e29b-41d4-a716-446655440001', 
  NOW(), 
  NOW()
);

INSERT INTO stages (id, name, pipeline_id, tenant_id, created_at, updated_at) 
VALUES 
(
  '550e8400-e29b-41d4-a716-446655440007', 
  'Qualificado', 
  '550e8400-e29b-41d4-a716-446655440004', 
  '550e8400-e29b-41d4-a716-446655440001', 
  NOW(), 
  NOW()
);

INSERT INTO stages (id, name, pipeline_id, tenant_id, created_at, updated_at) 
VALUES 
(
  '550e8400-e29b-41d4-a716-446655440008', 
  'Orçamento', 
  '550e8400-e29b-41d4-a716-446655440004', 
  '550e8400-e29b-41d4-a716-446655440001', 
  NOW(), 
  NOW()
);

INSERT INTO stages (id, name, pipeline_id, tenant_id, created_at, updated_at) 
VALUES 
(
  '550e8400-e29b-41d4-a716-446655440009', 
  'Negociação', 
  '550e8400-e29b-41d4-a716-446655440004', 
  '550e8400-e29b-41d4-a716-446655440001', 
  NOW(), 
  NOW()
);

INSERT INTO stages (id, name, pipeline_id, tenant_id, created_at, updated_at) 
VALUES 
(
  '550e8400-e29b-41d4-a716-446655440010', 
  'Fechado', 
  '550e8400-e29b-41d4-a716-446655440004', 
  '550e8400-e29b-41d4-a716-446655440001', 
  NOW(), 
  NOW()
);

-- Aguardar
SELECT pg_sleep(3.0);

-- Verificar dados criados
SELECT 'TENANT DISTRIBUIDOR CRIADA COM SUCESSO!' as resultado;
SELECT 'Tenant ID: 550e8400-e29b-41d4-a716-446655440001' as info;
SELECT 'Usuários: Julia (Agente) e Julio (Supervisor)' as usuarios;
