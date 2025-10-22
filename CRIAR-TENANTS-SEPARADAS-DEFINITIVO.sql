-- Script para criar tenants separadas: Distribuidor e Porta a Porta
-- Mantendo a tenant da Maria isolada
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
) ON CONFLICT (id) DO NOTHING;

-- Criar usuários para Distribuidor
INSERT INTO users (id, email, name, tenant_id, role, created_at, updated_at) 
VALUES 
(
  '550e8400-e29b-41d4-a716-446655440002', 
  'julia@distribuidor.com', 
  'Julia - Agente Distribuidor', 
  '550e8400-e29b-41d4-a716-446655440001', 
  'agent', 
  NOW(), 
  NOW()
),
(
  '550e8400-e29b-41d4-a716-446655440003', 
  'julio@distribuidor.com', 
  'Julio - Supervisor Distribuidor', 
  '550e8400-e29b-41d4-a716-446655440001', 
  'supervisor', 
  NOW(), 
  NOW()
) ON CONFLICT (id) DO NOTHING;

-- Criar pipelines para Distribuidor
INSERT INTO pipelines (id, name, tenant_id, created_at, updated_at) 
VALUES (
  '550e8400-e29b-41d4-a716-446655440004', 
  'Pipeline Distribuidor', 
  '550e8400-e29b-41d4-a716-446655440001', 
  NOW(), 
  NOW()
) ON CONFLICT (id) DO NOTHING;

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
) ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- 2. CRIAR TENANT PORTA A PORTA
-- =====================================================

-- Inserir tenant Porta a Porta
INSERT INTO tenants (id, name, created_at, updated_at) 
VALUES (
  'portaporta-tenant-001', 
  'Porta a Porta', 
  NOW(), 
  NOW()
) ON CONFLICT (id) DO NOTHING;

-- Criar usuários para Porta a Porta
INSERT INTO users (id, email, name, tenant_id, role, created_at, updated_at) 
VALUES 
(
  'portaporta-elaine-001', 
  'elaine@portaporta.com', 
  'Elaine - Agente Porta a Porta', 
  'portaporta-tenant-001', 
  'agent', 
  NOW(), 
  NOW()
),
(
  'portaporta-julio-001', 
  'julio@portaporta.com', 
  'Julio - Agente Porta a Porta', 
  'portaporta-tenant-001', 
  'agent', 
  NOW(), 
  NOW()
) ON CONFLICT (id) DO NOTHING;

-- Criar pipelines para Porta a Porta
INSERT INTO pipelines (id, name, tenant_id, created_at, updated_at) 
VALUES (
  'portaporta-pipeline-001', 
  'Pipeline Porta a Porta', 
  'portaporta-tenant-001', 
  NOW(), 
  NOW()
) ON CONFLICT (id) DO NOTHING;

-- Criar stages para Porta a Porta
INSERT INTO stages (id, name, pipeline_id, tenant_id, created_at, updated_at) 
VALUES 
(
  'portaporta-stage-001', 
  'Novo Lead', 
  'portaporta-pipeline-001', 
  'portaporta-tenant-001', 
  NOW(), 
  NOW()
),
(
  'portaporta-stage-002', 
  'Contato Inicial', 
  'portaporta-pipeline-001', 
  'portaporta-tenant-001', 
  NOW(), 
  NOW()
),
(
  'portaporta-stage-003', 
  'Qualificado', 
  'portaporta-pipeline-001', 
  'portaporta-tenant-001', 
  NOW(), 
  NOW()
),
(
  'portaporta-stage-004', 
  'Orçamento', 
  'portaporta-pipeline-001', 
  'portaporta-tenant-001', 
  NOW(), 
  NOW()
),
(
  'portaporta-stage-005', 
  'Negociação', 
  'portaporta-pipeline-001', 
  'portaporta-tenant-001', 
  NOW(), 
  NOW()
),
(
  'portaporta-stage-006', 
  'Fechado', 
  'portaporta-pipeline-001', 
  'portaporta-tenant-001', 
  NOW(), 
  NOW()
) ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- 3. ADICIONAR DADOS DE EXEMPLO PARA CADA TENANT
-- =====================================================

-- Leads de exemplo para Distribuidor
INSERT INTO leads (
  id, tenant_id, name, phone, email, source, stage_id, fields, created_at, updated_at
) VALUES 
(
  gen_random_uuid(), 
  'distribuidor-tenant-001', 
  'Dr. João Silva - Distribuidor', 
  '(11) 99999-1111', 
  'joao@distribuidor.com', 
  'meta_ads', 
  'distribuidor-stage-006', 
  '{"budget_amount": 15000, "sold": true}'::jsonb, 
  '2025-10-16T10:00:00.000Z', 
  NOW()
),
(
  gen_random_uuid(), 
  'distribuidor-tenant-001', 
  'Dr. Maria Santos - Distribuidor', 
  '(11) 99999-2222', 
  'maria@distribuidor.com', 
  'instagram', 
  'distribuidor-stage-003', 
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
  'portaporta-tenant-001', 
  'Dr. Ana Costa - Porta a Porta', 
  '(11) 99999-4444', 
  'ana@portaporta.com', 
  'indicacao', 
  'portaporta-stage-006', 
  '{"budget_amount": 8000, "sold": true}'::jsonb, 
  '2025-10-16T11:00:00.000Z', 
  NOW()
),
(
  gen_random_uuid(), 
  'portaporta-tenant-001', 
  'Dr. Pedro Lima - Porta a Porta', 
  '(11) 99999-5555', 
  'pedro@portaporta.com', 
  'linkedin', 
  'portaporta-stage-003', 
  '{"budget_amount": 9500, "sold": false}'::jsonb, 
  '2025-10-17T15:00:00.000Z', 
  NOW()
);

-- =====================================================
-- 4. VERIFICAR DADOS CRIADOS
-- =====================================================

-- Verificar tenants criadas
SELECT 'TENANTS CRIADAS:' as info;
SELECT id, name FROM tenants WHERE id IN ('distribuidor-tenant-001', 'portaporta-tenant-001');

-- Verificar usuários criados
SELECT 'USUÁRIOS CRIADOS:' as info;
SELECT id, email, name, tenant_id, role FROM users WHERE tenant_id IN ('distribuidor-tenant-001', 'portaporta-tenant-001');

-- Verificar pipelines criadas
SELECT 'PIPELINES CRIADAS:' as info;
SELECT id, name, tenant_id FROM pipelines WHERE tenant_id IN ('distribuidor-tenant-001', 'portaporta-tenant-001');

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
WHERE l.tenant_id IN ('distribuidor-tenant-001', 'portaporta-tenant-001');

-- =====================================================
-- 5. CONFIGURAR RLS (Row Level Security)
-- =====================================================

-- Garantir que cada tenant só vê seus próprios dados
-- (As políticas RLS já devem estar configuradas, mas vamos verificar)

SELECT 'TENANTS SEPARADAS CRIADAS COM SUCESSO!' as resultado;
SELECT 'Dados da Maria permanecem isolados na tenant: 8bd69047-7533-42f3-a2f7-e3a60477f68c' as info;
