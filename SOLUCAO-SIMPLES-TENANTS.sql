-- =====================================================
-- SOLUÇÃO SIMPLES - CRIAR TENANTS SEM CONFLITOS
-- =====================================================

-- 1. PRIMEIRO: LIMPAR DADOS EXISTENTES (SE HOUVER)
DELETE FROM sales WHERE lead_id IN (
  SELECT id FROM leads WHERE tenant_id IN (
    '423d5a76-6d17-4c2c-b5c9-7b2d8e9f0a2b', 
    '423d5a76-6d17-4c2c-b5c9-7b2d8e9f0a3c'
  )
);

DELETE FROM leads WHERE tenant_id IN (
  '423d5a76-6d17-4c2c-b5c9-7b2d8e9f0a2b', 
  '423d5a76-6d17-4c2c-b5c9-7b2d8e9f0a3c'
);

DELETE FROM stages WHERE pipeline_id IN (
  '423d5a76-6d17-4c2c-b5c9-7b2d8e9f0a8h',
  '423d5a76-6d17-4c2c-b5c9-7b2d8e9f0a9i'
);

DELETE FROM pipelines WHERE tenant_id IN (
  '423d5a76-6d17-4c2c-b5c9-7b2d8e9f0a2b', 
  '423d5a76-6d17-4c2c-b5c9-7b2d8e9f0a3c'
);

DELETE FROM user_roles WHERE tenant_id IN (
  '423d5a76-6d17-4c2c-b5c9-7b2d8e9f0a2b', 
  '423d5a76-6d17-4c2c-b5c9-7b2d8e9f0a3c'
);

DELETE FROM users WHERE tenant_id IN (
  '423d5a76-6d17-4c2c-b5c9-7b2d8e9f0a2b', 
  '423d5a76-6d17-4c2c-b5c9-7b2d8e9f0a3c'
);

DELETE FROM tenants WHERE id IN (
  '423d5a76-6d17-4c2c-b5c9-7b2d8e9f0a2b', 
  '423d5a76-6d17-4c2c-b5c9-7b2d8e9f0a3c'
);

-- 2. CRIAR TENANTS
INSERT INTO tenants (id, name, created_at, updated_at) VALUES 
('423d5a76-6d17-4c2c-b5c9-7b2d8e9f0a2b', 'Distribuidor', NOW(), NOW()),
('423d5a76-6d17-4c2c-b5c9-7b2d8e9f0a3c', 'Porta a Porta', NOW(), NOW());

-- 3. CRIAR USUÁRIOS USANDO INSERT INDIVIDUAL (EVITA TRIGGERS EM BATCH)
INSERT INTO users (id, email, name, role, tenant_id, created_at, updated_at) 
VALUES ('423d5a76-6d17-4c2c-b5c9-7b2d8e9f0a4d', 'julia@distribuidor.com', 'Julia', 'agent', '423d5a76-6d17-4c2c-b5c9-7b2d8e9f0a2b', NOW(), NOW());

INSERT INTO users (id, email, name, role, tenant_id, created_at, updated_at) 
VALUES ('423d5a76-6d17-4c2c-b5c9-7b2d8e9f0a5e', 'julio@distribuidor.com', 'Julio', 'supervisor', '423d5a76-6d17-4c2c-b5c9-7b2d8e9f0a2b', NOW(), NOW());

INSERT INTO users (id, email, name, role, tenant_id, created_at, updated_at) 
VALUES ('423d5a76-6d17-4c2c-b5c9-7b2d8e9f0a6f', 'elaine@portaporta.com', 'Elaine', 'agent', '423d5a76-6d17-4c2c-b5c9-7b2d8e9f0a3c', NOW(), NOW());

INSERT INTO users (id, email, name, role, tenant_id, created_at, updated_at) 
VALUES ('423d5a76-6d17-4c2c-b5c9-7b2d8e9f0a7g', 'julio@portaporta.com', 'Julio', 'agent', '423d5a76-6d17-4c2c-b5c9-7b2d8e9f0a3c', NOW(), NOW());

-- 4. CRIAR PIPELINES
INSERT INTO pipelines (id, name, tenant_id, created_at, updated_at) VALUES 
('423d5a76-6d17-4c2c-b5c9-7b2d8e9f0a8h', 'Pipeline Distribuidor', '423d5a76-6d17-4c2c-b5c9-7b2d8e9f0a2b', NOW(), NOW()),
('423d5a76-6d17-4c2c-b5c9-7b2d8e9f0a9i', 'Pipeline Porta a Porta', '423d5a76-6d17-4c2c-b5c9-7b2d8e9f0a3c', NOW(), NOW());

-- 5. CRIAR ESTÁGIOS
INSERT INTO stages (id, name, pipeline_id, order_index, created_at, updated_at) VALUES 
('423d5a76-6d17-4c2c-b5c9-7b2d8e9f0a1j', 'Novo Lead', '423d5a76-6d17-4c2c-b5c9-7b2d8e9f0a8h', 1, NOW(), NOW()),
('423d5a76-6d17-4c2c-b5c9-7b2d8e9f0a2k', 'Qualificado', '423d5a76-6d17-4c2c-b5c9-7b2d8e9f0a8h', 2, NOW(), NOW()),
('423d5a76-6d17-4c2c-b5c9-7b2d8e9f0a3l', 'Proposta', '423d5a76-6d17-4c2c-b5c9-7b2d8e9f0a8h', 3, NOW(), NOW()),
('423d5a76-6d17-4c2c-b5c9-7b2d8e9f0a4m', 'Negociação', '423d5a76-6d17-4c2c-b5c9-7b2d8e9f0a8h', 4, NOW(), NOW()),
('423d5a76-6d17-4c2c-b5c9-7b2d8e9f0a5n', 'Vendido', '423d5a76-6d17-4c2c-b5c9-7b2d8e9f0a8h', 5, NOW(), NOW()),
('423d5a76-6d17-4c2c-b5c9-7b2d8e9f0a6o', 'Perdido', '423d5a76-6d17-4c2c-b5c9-7b2d8e9f0a8h', 6, NOW(), NOW()),
('423d5a76-6d17-4c2c-b5c9-7b2d8e9f0a7p', 'Novo Lead', '423d5a76-6d17-4c2c-b5c9-7b2d8e9f0a9i', 1, NOW(), NOW()),
('423d5a76-6d17-4c2c-b5c9-7b2d8e9f0a8q', 'Qualificado', '423d5a76-6d17-4c2c-b5c9-7b2d8e9f0a9i', 2, NOW(), NOW()),
('423d5a76-6d17-4c2c-b5c9-7b2d8e9f0a9r', 'Proposta', '423d5a76-6d17-4c2c-b5c9-7b2d8e9f0a9i', 3, NOW(), NOW()),
('423d5a76-6d17-4c2c-b5c9-7b2d8e9f0a1s', 'Negociação', '423d5a76-6d17-4c2c-b5c9-7b2d8e9f0a9i', 4, NOW(), NOW()),
('423d5a76-6d17-4c2c-b5c9-7b2d8e9f0a2t', 'Vendido', '423d5a76-6d17-4c2c-b5c9-7b2d8e9f0a9i', 5, NOW(), NOW()),
('423d5a76-6d17-4c2c-b5c9-7b2d8e9f0a3u', 'Perdido', '423d5a76-6d17-4c2c-b5c9-7b2d8e9f0a9i', 6, NOW(), NOW());

-- 6. CRIAR LEADS
INSERT INTO leads (id, name, email, phone, origin, tenant_id, pipeline_id, stage_id, assigned_to, created_at, updated_at) VALUES 
('423d5a76-6d17-4c2c-b5c9-7b2d8e9f0a4v', 'Cliente Distribuidor 1', 'cliente1@email.com', '11999999991', 'Indicação', '423d5a76-6d17-4c2c-b5c9-7b2d8e9f0a2b', '423d5a76-6d17-4c2c-b5c9-7b2d8e9f0a8h', '423d5a76-6d17-4c2c-b5c9-7b2d8e9f0a2k', '423d5a76-6d17-4c2c-b5c9-7b2d8e9f0a4d', NOW(), NOW()),
('423d5a76-6d17-4c2c-b5c9-7b2d8e9f0a5w', 'Cliente Distribuidor 2', 'cliente2@email.com', '11999999992', 'Facebook', '423d5a76-6d17-4c2c-b5c9-7b2d8e9f0a2b', '423d5a76-6d17-4c2c-b5c9-7b2d8e9f0a8h', '423d5a76-6d17-4c2c-b5c9-7b2d8e9f0a3l', '423d5a76-6d17-4c2c-b5c9-7b2d8e9f0a4d', NOW(), NOW()),
('423d5a76-6d17-4c2c-b5c9-7b2d8e9f0a6x', 'Cliente Distribuidor 3', 'cliente3@email.com', '11999999993', 'WhatsApp', '423d5a76-6d17-4c2c-b5c9-7b2d8e9f0a2b', '423d5a76-6d17-4c2c-b5c9-7b2d8e9f0a8h', '423d5a76-6d17-4c2c-b5c9-7b2d8e9f0a5n', '423d5a76-6d17-4c2c-b5c9-7b2d8e9f0a4d', NOW(), NOW()),
('423d5a76-6d17-4c2c-b5c9-7b2d8e9f0a7y', 'Cliente Porta a Porta 1', 'cliente1pp@email.com', '11888888881', 'Porta a Porta', '423d5a76-6d17-4c2c-b5c9-7b2d8e9f0a3c', '423d5a76-6d17-4c2c-b5c9-7b2d8e9f0a9i', '423d5a76-6d17-4c2c-b5c9-7b2d8e9f0a8q', '423d5a76-6d17-4c2c-b5c9-7b2d8e9f0a6f', NOW(), NOW()),
('423d5a76-6d17-4c2c-b5c9-7b2d8e9f0a8z', 'Cliente Porta a Porta 2', 'cliente2pp@email.com', '11888888882', 'Porta a Porta', '423d5a76-6d17-4c2c-b5c9-7b2d8e9f0a3c', '423d5a76-6d17-4c2c-b5c9-7b2d8e9f0a9i', '423d5a76-6d17-4c2c-b5c9-7b2d8e9f0a1s', '423d5a76-6d17-4c2c-b5c9-7b2d8e9f0a7g', NOW(), NOW()),
('423d5a76-6d17-4c2c-b5c9-7b2d8e9f0a9a', 'Cliente Porta a Porta 3', 'cliente3pp@email.com', '11888888883', 'Porta a Porta', '423d5a76-6d17-4c2c-b5c9-7b2d8e9f0a3c', '423d5a76-6d17-4c2c-b5c9-7b2d8e9f0a9i', '423d5a76-6d17-4c2c-b5c9-7b2d8e9f0a2t', '423d5a76-6d17-4c2c-b5c9-7b2d8e9f0a6f', NOW(), NOW());

-- 7. CRIAR VENDAS
INSERT INTO sales (id, lead_id, amount, created_at, updated_at) VALUES 
('423d5a76-6d17-4c2c-b5c9-7b2d8e9f0a1b', '423d5a76-6d17-4c2c-b5c9-7b2d8e9f0a6x', 2500.00, NOW(), NOW()),
('423d5a76-6d17-4c2c-b5c9-7b2d8e9f0a2c', '423d5a76-6d17-4c2c-b5c9-7b2d8e9f0a9a', 1800.00, NOW(), NOW());

-- =====================================================
-- VERIFICAR RESULTADOS
-- =====================================================

SELECT '✅ TENANTS CRIADAS:' as status;
SELECT id, name, created_at FROM tenants WHERE id IN ('423d5a76-6d17-4c2c-b5c9-7b2d8e9f0a2b', '423d5a76-6d17-4c2c-b5c9-7b2d8e9f0a3c');

SELECT '✅ USUÁRIOS CRIADOS:' as status;
SELECT id, email, name, role, tenant_id FROM users WHERE tenant_id IN ('423d5a76-6d17-4c2c-b5c9-7b2d8e9f0a2b', '423d5a76-6d17-4c2c-b5c9-7b2d8e9f0a3c');

SELECT '✅ PIPELINES CRIADOS:' as status;
SELECT id, name, tenant_id FROM pipelines WHERE tenant_id IN ('423d5a76-6d17-4c2c-b5c9-7b2d8e9f0a2b', '423d5a76-6d17-4c2c-b5c9-7b2d8e9f0a3c');

SELECT '✅ ESTÁGIOS CRIADOS:' as status;
SELECT COUNT(*) as total_estagios FROM stages WHERE pipeline_id IN ('423d5a76-6d17-4c2c-b5c9-7b2d8e9f0a8h', '423d5a76-6d17-4c2c-b5c9-7b2d8e9f0a9i');

SELECT '✅ LEADS CRIADOS:' as status;
SELECT id, name, email, origin, tenant_id, assigned_to FROM leads WHERE tenant_id IN ('423d5a76-6d17-4c2c-b5c9-7b2d8e9f0a2b', '423d5a76-6d17-4c2c-b5c9-7b2d8e9f0a3c');

SELECT '✅ VENDAS CRIADAS:' as status;
SELECT s.id, l.name as cliente, s.amount, l.tenant_id FROM sales s 
JOIN leads l ON s.lead_id = l.id 
WHERE l.tenant_id IN ('423d5a76-6d17-4c2c-b5c9-7b2d8e9f0a2b', '423d5a76-6d17-4c2c-b5c9-7b2d8e9f0a3c');

-- =====================================================
-- RESUMO FINAL
-- =====================================================

SELECT '🎉 CRIAÇÃO CONCLUÍDA COM SUCESSO!' as resultado;
