-- SOLUÇÃO MANUAL: Criar tenant Porta a Porta e user_roles manualmente
-- Execute este script no Supabase SQL Editor

-- =====================================================
-- 1. CRIAR TENANT PORTA A PORTA
-- =====================================================

-- Inserir tenant Porta a Porta
INSERT INTO tenants (id, name, created_at, updated_at) 
VALUES (
  '550e8400-e29b-41d4-a716-446655440011', 
  'Porta a Porta', 
  NOW(), 
  NOW()
);

-- Aguardar
SELECT pg_sleep(2.0);

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
SELECT pg_sleep(2.0);

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
SELECT pg_sleep(2.0);

-- Criar user_roles manualmente
INSERT INTO user_roles (user_id, tenant_id, role) 
VALUES 
(
  '550e8400-e29b-41d4-a716-446655440012', 
  '550e8400-e29b-41d4-a716-446655440011', 
  'agent'
);

INSERT INTO user_roles (user_id, tenant_id, role) 
VALUES 
(
  '550e8400-e29b-41d4-a716-446655440013', 
  '550e8400-e29b-41d4-a716-446655440011', 
  'agent'
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

-- Aguardar
SELECT pg_sleep(1.0);

-- Criar stages para Porta a Porta (um por vez)
INSERT INTO stages (id, name, pipeline_id, tenant_id, created_at, updated_at) 
VALUES 
(
  '550e8400-e29b-41d4-a716-446655440015', 
  'Novo Lead', 
  '550e8400-e29b-41d4-a716-446655440014', 
  '550e8400-e29b-41d4-a716-446655440011', 
  NOW(), 
  NOW()
);

INSERT INTO stages (id, name, pipeline_id, tenant_id, created_at, updated_at) 
VALUES 
(
  '550e8400-e29b-41d4-a716-446655440016', 
  'Contato Inicial', 
  '550e8400-e29b-41d4-a716-446655440014', 
  '550e8400-e29b-41d4-a716-446655440011', 
  NOW(), 
  NOW()
);

INSERT INTO stages (id, name, pipeline_id, tenant_id, created_at, updated_at) 
VALUES 
(
  '550e8400-e29b-41d4-a716-446655440017', 
  'Qualificado', 
  '550e8400-e29b-41d4-a716-446655440014', 
  '550e8400-e29b-41d4-a716-446655440011', 
  NOW(), 
  NOW()
);

INSERT INTO stages (id, name, pipeline_id, tenant_id, created_at, updated_at) 
VALUES 
(
  '550e8400-e29b-41d4-a716-446655440018', 
  'Orçamento', 
  '550e8400-e29b-41d4-a716-446655440014', 
  '550e8400-e29b-41d4-a716-446655440011', 
  NOW(), 
  NOW()
);

INSERT INTO stages (id, name, pipeline_id, tenant_id, created_at, updated_at) 
VALUES 
(
  '550e8400-e29b-41d4-a716-446655440019', 
  'Negociação', 
  '550e8400-e29b-41d4-a716-446655440014', 
  '550e8400-e29b-41d4-a716-446655440011', 
  NOW(), 
  NOW()
);

INSERT INTO stages (id, name, pipeline_id, tenant_id, created_at, updated_at) 
VALUES 
(
  '550e8400-e29b-41d4-a716-446655440020', 
  'Fechado', 
  '550e8400-e29b-41d4-a716-446655440014', 
  '550e8400-e29b-41d4-a716-446655440011', 
  NOW(), 
  NOW()
);

-- Aguardar
SELECT pg_sleep(3.0);

-- Verificar dados criados
SELECT 'TENANT PORTA A PORTA CRIADA COM SUCESSO!' as resultado;
SELECT 'Tenant ID: 550e8400-e29b-41d4-a716-446655440011' as info;
SELECT 'Usuários: Elaine (Agente) e Julio (Agente)' as usuarios;
SELECT 'User Roles criados manualmente' as user_roles;














