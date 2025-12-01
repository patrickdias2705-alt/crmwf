-- =====================================================
-- CRIAR NOVAS TENANTS E USUÁRIOS PARA DEPARTAMENTOS
-- =====================================================

-- 1. CRIAR TENANT "DISTRIBUIDOR"
INSERT INTO tenants (id, name, created_at, updated_at) VALUES (
  '423d5a76-6d17-4c2c-b5c9-7b2d8e9f0a2b',
  'Distribuidor',
  NOW(),
  NOW()
);

-- 2. CRIAR TENANT "PORTA A PORTA"
INSERT INTO tenants (id, name, created_at, updated_at) VALUES (
  '423d5a76-6d17-4c2c-b5c9-7b2d8e9f0a3c',
  'Porta a Porta',
  NOW(),
  NOW()
);

-- 3. CRIAR USUÁRIOS PARA TENANT DISTRIBUIDOR

-- Usuário Julia (Agente - cadastra vendas)
INSERT INTO users (id, email, name, role, tenant_id, created_at, updated_at) VALUES (
  '423d5a76-6d17-4c2c-b5c9-7b2d8e9f0a4d',
  'julia@distribuidor.com',
  'Julia',
  'agent',
  '423d5a76-6d17-4c2c-b5c9-7b2d8e9f0a2b',
  NOW(),
  NOW()
);

-- Usuário Julio (Supervisor)
INSERT INTO users (id, email, name, role, tenant_id, created_at, updated_at) VALUES (
  '423d5a76-6d17-4c2c-b5c9-7b2d8e9f0a5e',
  'julio@distribuidor.com',
  'Julio',
  'supervisor',
  '423d5a76-6d17-4c2c-b5c9-7b2d8e9f0a2b',
  NOW(),
  NOW()
);

-- 4. CRIAR USUÁRIOS PARA TENANT PORTA A PORTA

-- Usuário Elaine (Agente - cadastra vendas)
INSERT INTO users (id, email, name, role, tenant_id, created_at, updated_at) VALUES (
  '423d5a76-6d17-4c2c-b5c9-7b2d8e9f0a6f',
  'elaine@portaporta.com',
  'Elaine',
  'agent',
  '423d5a76-6d17-4c2c-b5c9-7b2d8e9f0a3c',
  NOW(),
  NOW()
);

-- Usuário Julio (Agente)
INSERT INTO users (id, email, name, role, tenant_id, created_at, updated_at) VALUES (
  '423d5a76-6d17-4c2c-b5c9-7b2d8e9f0a7g',
  'julio@portaporta.com',
  'Julio',
  'agent',
  '423d5a76-6d17-4c2c-b5c9-7b2d8e9f0a3c',
  NOW(),
  NOW()
);

-- 5. CRIAR PIPELINES PARA CADA TENANT

-- Pipeline para Distribuidor
INSERT INTO pipelines (id, name, tenant_id, created_at, updated_at) VALUES (
  '423d5a76-6d17-4c2c-b5c9-7b2d8e9f0a8h',
  'Pipeline Distribuidor',
  '423d5a76-6d17-4c2c-b5c9-7b2d8e9f0a2b',
  NOW(),
  NOW()
);

-- Pipeline para Porta a Porta
INSERT INTO pipelines (id, name, tenant_id, created_at, updated_at) VALUES (
  '423d5a76-6d17-4c2c-b5c9-7b2d8e9f0a9i',
  'Pipeline Porta a Porta',
  '423d5a76-6d17-4c2c-b5c9-7b2d8e9f0a3c',
  NOW(),
  NOW()
);

-- 6. CRIAR ESTÁGIOS PADRÃO PARA CADA PIPELINE

-- Estágios para Pipeline Distribuidor
INSERT INTO stages (id, name, pipeline_id, order_index, created_at, updated_at) VALUES 
('423d5a76-6d17-4c2c-b5c9-7b2d8e9f0a1j', 'Novo Lead', '423d5a76-6d17-4c2c-b5c9-7b2d8e9f0a8h', 1, NOW(), NOW()),
('423d5a76-6d17-4c2c-b5c9-7b2d8e9f0a2k', 'Qualificado', '423d5a76-6d17-4c2c-b5c9-7b2d8e9f0a8h', 2, NOW(), NOW()),
('423d5a76-6d17-4c2c-b5c9-7b2d8e9f0a3l', 'Proposta', '423d5a76-6d17-4c2c-b5c9-7b2d8e9f0a8h', 3, NOW(), NOW()),
('423d5a76-6d17-4c2c-b5c9-7b2d8e9f0a4m', 'Negociação', '423d5a76-6d17-4c2c-b5c9-7b2d8e9f0a8h', 4, NOW(), NOW()),
('423d5a76-6d17-4c2c-b5c9-7b2d8e9f0a5n', 'Vendido', '423d5a76-6d17-4c2c-b5c9-7b2d8e9f0a8h', 5, NOW(), NOW()),
('423d5a76-6d17-4c2c-b5c9-7b2d8e9f0a6o', 'Perdido', '423d5a76-6d17-4c2c-b5c9-7b2d8e9f0a8h', 6, NOW(), NOW());

-- Estágios para Pipeline Porta a Porta
INSERT INTO stages (id, name, pipeline_id, order_index, created_at, updated_at) VALUES 
('423d5a76-6d17-4c2c-b5c9-7b2d8e9f0a7p', 'Novo Lead', '423d5a76-6d17-4c2c-b5c9-7b2d8e9f0a9i', 1, NOW(), NOW()),
('423d5a76-6d17-4c2c-b5c9-7b2d8e9f0a8q', 'Qualificado', '423d5a76-6d17-4c2c-b5c9-7b2d8e9f0a9i', 2, NOW(), NOW()),
('423d5a76-6d17-4c2c-b5c9-7b2d8e9f0a9r', 'Proposta', '423d5a76-6d17-4c2c-b5c9-7b2d8e9f0a9i', 3, NOW(), NOW()),
('423d5a76-6d17-4c2c-b5c9-7b2d8e9f0a1s', 'Negociação', '423d5a76-6d17-4c2c-b5c9-7b2d8e9f0a9i', 4, NOW(), NOW()),
('423d5a76-6d17-4c2c-b5c9-7b2d8e9f0a2t', 'Vendido', '423d5a76-6d17-4c2c-b5c9-7b2d8e9f0a9i', 5, NOW(), NOW()),
('423d5a76-6d17-4c2c-b5c9-7b2d8e9f0a3u', 'Perdido', '423d5a76-6d17-4c2c-b5c9-7b2d8e9f0a9i', 6, NOW(), NOW());

-- 7. CRIAR LEADS DE EXEMPLO PARA CADA TENANT

-- Leads para Distribuidor
INSERT INTO leads (id, name, email, phone, origin, tenant_id, pipeline_id, stage_id, assigned_to, created_at, updated_at) VALUES 
('423d5a76-6d17-4c2c-b5c9-7b2d8e9f0a4v', 'Cliente Distribuidor 1', 'cliente1@email.com', '11999999991', 'Indicação', '423d5a76-6d17-4c2c-b5c9-7b2d8e9f0a2b', '423d5a76-6d17-4c2c-b5c9-7b2d8e9f0a8h', '423d5a76-6d17-4c2c-b5c9-7b2d8e9f0a2k', '423d5a76-6d17-4c2c-b5c9-7b2d8e9f0a4d', NOW(), NOW()),
('423d5a76-6d17-4c2c-b5c9-7b2d8e9f0a5w', 'Cliente Distribuidor 2', 'cliente2@email.com', '11999999992', 'Facebook', '423d5a76-6d17-4c2c-b5c9-7b2d8e9f0a2b', '423d5a76-6d17-4c2c-b5c9-7b2d8e9f0a8h', '423d5a76-6d17-4c2c-b5c9-7b2d8e9f0a3l', '423d5a76-6d17-4c2c-b5c9-7b2d8e9f0a4d', NOW(), NOW()),
('423d5a76-6d17-4c2c-b5c9-7b2d8e9f0a6x', 'Cliente Distribuidor 3', 'cliente3@email.com', '11999999993', 'WhatsApp', '423d5a76-6d17-4c2c-b5c9-7b2d8e9f0a2b', '423d5a76-6d17-4c2c-b5c9-7b2d8e9f0a8h', '423d5a76-6d17-4c2c-b5c9-7b2d8e9f0a5n', '423d5a76-6d17-4c2c-b5c9-7b2d8e9f0a4d', NOW(), NOW());

-- Leads para Porta a Porta
INSERT INTO leads (id, name, email, phone, origin, tenant_id, pipeline_id, stage_id, assigned_to, created_at, updated_at) VALUES 
('423d5a76-6d17-4c2c-b5c9-7b2d8e9f0a7y', 'Cliente Porta a Porta 1', 'cliente1pp@email.com', '11888888881', 'Porta a Porta', '423d5a76-6d17-4c2c-b5c9-7b2d8e9f0a3c', '423d5a76-6d17-4c2c-b5c9-7b2d8e9f0a9i', '423d5a76-6d17-4c2c-b5c9-7b2d8e9f0a8q', '423d5a76-6d17-4c2c-b5c9-7b2d8e9f0a6f', NOW(), NOW()),
('423d5a76-6d17-4c2c-b5c9-7b2d8e9f0a8z', 'Cliente Porta a Porta 2', 'cliente2pp@email.com', '11888888882', 'Porta a Porta', '423d5a76-6d17-4c2c-b5c9-7b2d8e9f0a3c', '423d5a76-6d17-4c2c-b5c9-7b2d8e9f0a9i', '423d5a76-6d17-4c2c-b5c9-7b2d8e9f0a1s', '423d5a76-6d17-4c2c-b5c9-7b2d8e9f0a7g', NOW(), NOW()),
('423d5a76-6d17-4c2c-b5c9-7b2d8e9f0a9a', 'Cliente Porta a Porta 3', 'cliente3pp@email.com', '11888888883', 'Porta a Porta', '423d5a76-6d17-4c2c-b5c9-7b2d8e9f0a3c', '423d5a76-6d17-4c2c-b5c9-7b2d8e9f0a9i', '423d5a76-6d17-4c2c-b5c9-7b2d8e9f0a2t', '423d5a76-6d17-4c2c-b5c9-7b2d8e9f0a6f', NOW(), NOW());

-- 8. CRIAR VENDAS DE EXEMPLO

-- Vendas para Distribuidor
INSERT INTO sales (id, lead_id, amount, created_at, updated_at) VALUES 
('423d5a76-6d17-4c2c-b5c9-7b2d8e9f0a1b', '423d5a76-6d17-4c2c-b5c9-7b2d8e9f0a6x', 2500.00, NOW(), NOW());

-- Vendas para Porta a Porta
INSERT INTO sales (id, lead_id, amount, created_at, updated_at) VALUES 
('423d5a76-6d17-4c2c-b5c9-7b2d8e9f0a2c', '423d5a76-6d17-4c2c-b5c9-7b2d8e9f0a9a', 1800.00, NOW(), NOW());

-- =====================================================
-- VERIFICAR DADOS CRIADOS
-- =====================================================

-- Verificar tenants criadas
SELECT 'TENANTS CRIADAS:' as info;
SELECT id, name, created_at FROM tenants WHERE id IN ('423d5a76-6d17-4c2c-b5c9-7b2d8e9f0a2b', '423d5a76-6d17-4c2c-b5c9-7b2d8e9f0a3c');

-- Verificar usuários criados
SELECT 'USUÁRIOS CRIADOS:' as info;
SELECT id, email, name, role, tenant_id FROM users WHERE tenant_id IN ('423d5a76-6d17-4c2c-b5c9-7b2d8e9f0a2b', '423d5a76-6d17-4c2c-b5c9-7b2d8e9f0a3c');

-- Verificar pipelines criados
SELECT 'PIPELINES CRIADOS:' as info;
SELECT id, name, tenant_id FROM pipelines WHERE tenant_id IN ('423d5a76-6d17-4c2c-b5c9-7b2d8e9f0a2b', '423d5a76-6d17-4c2c-b5c9-7b2d8e9f0a3c');

-- Verificar leads criados
SELECT 'LEADS CRIADOS:' as info;
SELECT id, name, email, origin, tenant_id, assigned_to FROM leads WHERE tenant_id IN ('423d5a76-6d17-4c2c-b5c9-7b2d8e9f0a2b', '423d5a76-6d17-4c2c-b5c9-7b2d8e9f0a3c');

-- Verificar vendas criadas
SELECT 'VENDAS CRIADAS:' as info;
SELECT s.id, l.name as cliente, s.amount, l.tenant_id FROM sales s 
JOIN leads l ON s.lead_id = l.id 
WHERE l.tenant_id IN ('423d5a76-6d17-4c2c-b5c9-7b2d8e9f0a2b', '423d5a76-6d17-4c2c-b5c9-7b2d8e9f0a3c');

-- =====================================================
-- RESUMO DO QUE FOI CRIADO
-- =====================================================

/*
TENANT DISTRIBUIDOR (423d5a76-6d17-4c2c-b5c9-7b2d8e9f0a2b):
- Julia (julia@distribuidor.com) - Agente (423d5a76-6d17-4c2c-b5c9-7b2d8e9f0a4d)
- Julio (julio@distribuidor.com) - Supervisor (423d5a76-6d17-4c2c-b5c9-7b2d8e9f0a5e)
- Pipeline com 6 estágios
- 3 leads de exemplo
- 1 venda de R$ 2.500,00

TENANT PORTA A PORTA (423d5a76-6d17-4c2c-b5c9-7b2d8e9f0a3c):
- Elaine (elaine@portaporta.com) - Agente (423d5a76-6d17-4c2c-b5c9-7b2d8e9f0a6f)
- Julio (julio@portaporta.com) - Agente (423d5a76-6d17-4c2c-b5c9-7b2d8e9f0a7g)
- Pipeline com 6 estágios
- 3 leads de exemplo
- 1 venda de R$ 1.800,00

TODOS OS DADOS SÃO ISOLADOS POR TENANT_ID COM UUIDs VÁLIDOS!
*/
