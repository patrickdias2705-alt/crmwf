-- =====================================================
-- SOLUÇÃO ÚLTIMA - CRIAR SEM DEPENDER DE TRIGGERS
-- =====================================================

-- 1. LIMPAR DADOS EXISTENTES (SE HOUVER)
DELETE FROM sales WHERE lead_id IN (
  SELECT id FROM leads WHERE tenant_id IN (
    '550e8400-e29b-41d4-a716-446655440001', 
    '550e8400-e29b-41d4-a716-446655440002'
  )
);

DELETE FROM leads WHERE tenant_id IN (
  '550e8400-e29b-41d4-a716-446655440001', 
  '550e8400-e29b-41d4-a716-446655440002'
);

DELETE FROM stages WHERE pipeline_id IN (
  '550e8400-e29b-41d4-a716-446655440011',
  '550e8400-e29b-41d4-a716-446655440012'
);

DELETE FROM pipelines WHERE tenant_id IN (
  '550e8400-e29b-41d4-a716-446655440001', 
  '550e8400-e29b-41d4-a716-446655440002'
);

DELETE FROM user_roles WHERE tenant_id IN (
  '550e8400-e29b-41d4-a716-446655440001', 
  '550e8400-e29b-41d4-a716-446655440002'
);

DELETE FROM users WHERE tenant_id IN (
  '550e8400-e29b-41d4-a716-446655440001', 
  '550e8400-e29b-41d4-a716-446655440002'
);

DELETE FROM tenants WHERE id IN (
  '550e8400-e29b-41d4-a716-446655440001', 
  '550e8400-e29b-41d4-a716-446655440002'
);

-- 2. CRIAR TENANTS
INSERT INTO tenants (id, name, created_at, updated_at) VALUES 
('550e8400-e29b-41d4-a716-446655440001', 'Distribuidor', NOW(), NOW()),
('550e8400-e29b-41d4-a716-446655440002', 'Porta a Porta', NOW(), NOW());

-- 3. CRIAR USUÁRIOS USANDO INSERT OR IGNORE (EVITA ERROS DE DUPLICATA)
INSERT INTO users (id, email, name, role, tenant_id, created_at, updated_at) 
VALUES ('550e8400-e29b-41d4-a716-446655440021', 'julia@distribuidor.com', 'Julia', 'agent', '550e8400-e29b-41d4-a716-446655440001', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

INSERT INTO users (id, email, name, role, tenant_id, created_at, updated_at) 
VALUES ('550e8400-e29b-41d4-a716-446655440022', 'julio@distribuidor.com', 'Julio', 'supervisor', '550e8400-e29b-41d4-a716-446655440001', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

INSERT INTO users (id, email, name, role, tenant_id, created_at, updated_at) 
VALUES ('550e8400-e29b-41d4-a716-446655440023', 'elaine@portaporta.com', 'Elaine', 'agent', '550e8400-e29b-41d4-a716-446655440002', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

INSERT INTO users (id, email, name, role, tenant_id, created_at, updated_at) 
VALUES ('550e8400-e29b-41d4-a716-446655440024', 'julio@portaporta.com', 'Julio', 'agent', '550e8400-e29b-41d4-a716-446655440002', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 4. CRIAR USER ROLES MANUALMENTE (SE A TABELA EXISTIR)
-- Verificar se a tabela user_roles existe antes de inserir
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_roles') THEN
        INSERT INTO user_roles (user_id, tenant_id, role) VALUES 
        ('550e8400-e29b-41d4-a716-446655440021', '550e8400-e29b-41d4-a716-446655440001', 'agent'),
        ('550e8400-e29b-41d4-a716-446655440022', '550e8400-e29b-41d4-a716-446655440001', 'supervisor'),
        ('550e8400-e29b-41d4-a716-446655440023', '550e8400-e29b-41d4-a716-446655440002', 'agent'),
        ('550e8400-e29b-41d4-a716-446655440024', '550e8400-e29b-41d4-a716-446655440002', 'agent')
        ON CONFLICT (user_id, tenant_id) DO NOTHING;
    END IF;
END $$;

-- 5. CRIAR PIPELINES
INSERT INTO pipelines (id, name, tenant_id, created_at, updated_at) VALUES 
('550e8400-e29b-41d4-a716-446655440011', 'Pipeline Distribuidor', '550e8400-e29b-41d4-a716-446655440001', NOW(), NOW()),
('550e8400-e29b-41d4-a716-446655440012', 'Pipeline Porta a Porta', '550e8400-e29b-41d4-a716-446655440002', NOW(), NOW());

-- 6. CRIAR ESTÁGIOS
INSERT INTO stages (id, name, pipeline_id, order_index, created_at, updated_at) VALUES 
('550e8400-e29b-41d4-a716-446655440031', 'Novo Lead', '550e8400-e29b-41d4-a716-446655440011', 1, NOW(), NOW()),
('550e8400-e29b-41d4-a716-446655440032', 'Qualificado', '550e8400-e29b-41d4-a716-446655440011', 2, NOW(), NOW()),
('550e8400-e29b-41d4-a716-446655440033', 'Proposta', '550e8400-e29b-41d4-a716-446655440011', 3, NOW(), NOW()),
('550e8400-e29b-41d4-a716-446655440034', 'Negociação', '550e8400-e29b-41d4-a716-446655440011', 4, NOW(), NOW()),
('550e8400-e29b-41d4-a716-446655440035', 'Vendido', '550e8400-e29b-41d4-a716-446655440011', 5, NOW(), NOW()),
('550e8400-e29b-41d4-a716-446655440036', 'Perdido', '550e8400-e29b-41d4-a716-446655440011', 6, NOW(), NOW()),
('550e8400-e29b-41d4-a716-446655440041', 'Novo Lead', '550e8400-e29b-41d4-a716-446655440012', 1, NOW(), NOW()),
('550e8400-e29b-41d4-a716-446655440042', 'Qualificado', '550e8400-e29b-41d4-a716-446655440012', 2, NOW(), NOW()),
('550e8400-e29b-41d4-a716-446655440043', 'Proposta', '550e8400-e29b-41d4-a716-446655440012', 3, NOW(), NOW()),
('550e8400-e29b-41d4-a716-446655440044', 'Negociação', '550e8400-e29b-41d4-a716-446655440012', 4, NOW(), NOW()),
('550e8400-e29b-41d4-a716-446655440045', 'Vendido', '550e8400-e29b-41d4-a716-446655440012', 5, NOW(), NOW()),
('550e8400-e29b-41d4-a716-446655440046', 'Perdido', '550e8400-e29b-41d4-a716-446655440012', 6, NOW(), NOW());

-- 7. CRIAR LEADS
INSERT INTO leads (id, name, email, phone, origin, tenant_id, pipeline_id, stage_id, assigned_to, created_at, updated_at) VALUES 
('550e8400-e29b-41d4-a716-446655440051', 'Cliente Distribuidor 1', 'cliente1@email.com', '11999999991', 'Indicação', '550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440011', '550e8400-e29b-41d4-a716-446655440032', '550e8400-e29b-41d4-a716-446655440021', NOW(), NOW()),
('550e8400-e29b-41d4-a716-446655440052', 'Cliente Distribuidor 2', 'cliente2@email.com', '11999999992', 'Facebook', '550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440011', '550e8400-e29b-41d4-a716-446655440033', '550e8400-e29b-41d4-a716-446655440021', NOW(), NOW()),
('550e8400-e29b-41d4-a716-446655440053', 'Cliente Distribuidor 3', 'cliente3@email.com', '11999999993', 'WhatsApp', '550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440011', '550e8400-e29b-41d4-a716-446655440035', '550e8400-e29b-41d4-a716-446655440021', NOW(), NOW()),
('550e8400-e29b-41d4-a716-446655440061', 'Cliente Porta a Porta 1', 'cliente1pp@email.com', '11888888881', 'Porta a Porta', '550e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440012', '550e8400-e29b-41d4-a716-446655440042', '550e8400-e29b-41d4-a716-446655440023', NOW(), NOW()),
('550e8400-e29b-41d4-a716-446655440062', 'Cliente Porta a Porta 2', 'cliente2pp@email.com', '11888888882', 'Porta a Porta', '550e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440012', '550e8400-e29b-41d4-a716-446655440044', '550e8400-e29b-41d4-a716-446655440024', NOW(), NOW()),
('550e8400-e29b-41d4-a716-446655440063', 'Cliente Porta a Porta 3', 'cliente3pp@email.com', '11888888883', 'Porta a Porta', '550e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440012', '550e8400-e29b-41d4-a716-446655440045', '550e8400-e29b-41d4-a716-446655440023', NOW(), NOW());

-- 8. CRIAR VENDAS
INSERT INTO sales (id, lead_id, amount, created_at, updated_at) VALUES 
('550e8400-e29b-41d4-a716-446655440071', '550e8400-e29b-41d4-a716-446655440053', 2500.00, NOW(), NOW()),
('550e8400-e29b-41d4-a716-446655440072', '550e8400-e29b-41d4-a716-446655440063', 1800.00, NOW(), NOW());

-- =====================================================
-- VERIFICAR RESULTADOS
-- =====================================================

SELECT '✅ TENANTS CRIADAS:' as status;
SELECT id, name, created_at FROM tenants WHERE id IN ('550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440002');

SELECT '✅ USUÁRIOS CRIADOS:' as status;
SELECT id, email, name, role, tenant_id FROM users WHERE tenant_id IN ('550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440002');

SELECT '✅ PIPELINES CRIADOS:' as status;
SELECT id, name, tenant_id FROM pipelines WHERE tenant_id IN ('550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440002');

SELECT '✅ ESTÁGIOS CRIADOS:' as status;
SELECT COUNT(*) as total_estagios FROM stages WHERE pipeline_id IN ('550e8400-e29b-41d4-a716-446655440011', '550e8400-e29b-41d4-a716-446655440012');

SELECT '✅ LEADS CRIADOS:' as status;
SELECT id, name, email, origin, tenant_id, assigned_to FROM leads WHERE tenant_id IN ('550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440002');

SELECT '✅ VENDAS CRIADAS:' as status;
SELECT s.id, l.name as cliente, s.amount, l.tenant_id FROM sales s 
JOIN leads l ON s.lead_id = l.id 
WHERE l.tenant_id IN ('550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440002');

-- =====================================================
-- RESUMO FINAL
-- =====================================================

SELECT '🎉 CRIAÇÃO CONCLUÍDA COM SUCESSO!' as resultado;

/*
✅ TENANT DISTRIBUIDOR (550e8400-e29b-41d4-a716-446655440001):
- Julia (julia@distribuidor.com) - Agente (550e8400-e29b-41d4-a716-446655440021)
- Julio (julio@distribuidor.com) - Supervisor (550e8400-e29b-41d4-a716-446655440022)
- Pipeline com 6 estágios
- 3 leads de exemplo
- 1 venda de R$ 2.500,00

✅ TENANT PORTA A PORTA (550e8400-e29b-41d4-a716-446655440002):
- Elaine (elaine@portaporta.com) - Agente (550e8400-e29b-41d4-a716-446655440023)
- Julio (julio@portaporta.com) - Agente (550e8400-e29b-41d4-a716-446655440024)
- Pipeline com 6 estágios
- 3 leads de exemplo
- 1 venda de R$ 1.800,00

🔒 TODOS OS DADOS ISOLADOS POR TENANT_ID COM UUIDs VÁLIDOS!
🚫 USANDO INSERT OR IGNORE PARA EVITAR CONFLITOS!
*/
