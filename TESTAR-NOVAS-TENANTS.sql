-- =====================================================
-- TESTAR NOVAS TENANTS E USUÁRIOS
-- =====================================================

-- 1. VERIFICAR SE AS TENANTS FORAM CRIADAS
SELECT '=== VERIFICANDO TENANTS ===' as teste;
SELECT 
  id,
  name,
  created_at,
  CASE 
    WHEN id = 'tenant-distribuidor-001' THEN '✅ DISTRIBUIDOR'
    WHEN id = 'tenant-porta-porta-001' THEN '✅ PORTA A PORTA'
    ELSE '❌ DESCONHECIDA'
  END as status
FROM tenants 
WHERE id IN ('tenant-distribuidor-001', 'tenant-porta-porta-001')
ORDER BY created_at;

-- 2. VERIFICAR USUÁRIOS CRIADOS
SELECT '=== VERIFICANDO USUÁRIOS ===' as teste;
SELECT 
  u.id,
  u.name,
  u.email,
  u.role,
  t.name as tenant,
  CASE 
    WHEN u.role = 'agent' THEN '👤 Agente'
    WHEN u.role = 'supervisor' THEN '👨‍💼 Supervisor'
    ELSE '❓ Desconhecido'
  END as tipo_usuario
FROM users u
JOIN tenants t ON u.tenant_id = t.id
WHERE u.tenant_id IN ('tenant-distribuidor-001', 'tenant-porta-porta-001')
ORDER BY t.name, u.role, u.name;

-- 3. VERIFICAR PIPELINES E ESTÁGIOS
SELECT '=== VERIFICANDO PIPELINES E ESTÁGIOS ===' as teste;
SELECT 
  p.name as pipeline,
  t.name as tenant,
  COUNT(s.id) as total_estagios,
  STRING_AGG(s.name, ', ' ORDER BY s.order_index) as estagios
FROM pipelines p
JOIN tenants t ON p.tenant_id = t.id
LEFT JOIN stages s ON p.id = s.pipeline_id
WHERE p.tenant_id IN ('tenant-distribuidor-001', 'tenant-porta-porta-001')
GROUP BY p.id, p.name, t.name
ORDER BY t.name, p.name;

-- 4. VERIFICAR LEADS CRIADOS
SELECT '=== VERIFICANDO LEADS ===' as teste;
SELECT 
  l.name as cliente,
  l.email,
  l.origin,
  l.stage_id,
  s.name as estagio,
  u.name as agente,
  t.name as tenant
FROM leads l
JOIN tenants t ON l.tenant_id = t.id
LEFT JOIN stages s ON l.stage_id = s.id
LEFT JOIN users u ON l.assigned_to = u.id
WHERE l.tenant_id IN ('tenant-distribuidor-001', 'tenant-porta-porta-001')
ORDER BY t.name, l.created_at;

-- 5. VERIFICAR VENDAS
SELECT '=== VERIFICANDO VENDAS ===' as teste;
SELECT 
  l.name as cliente,
  s.amount as valor,
  l.origin,
  u.name as agente,
  t.name as tenant,
  s.created_at as data_venda
FROM sales s
JOIN leads l ON s.lead_id = l.id
JOIN tenants t ON l.tenant_id = t.id
LEFT JOIN users u ON l.assigned_to = u.id
WHERE l.tenant_id IN ('tenant-distribuidor-001', 'tenant-porta-porta-001')
ORDER BY t.name, s.created_at;

-- 6. TESTAR ISOLAMENTO DE DADOS - DISTRIBUIDOR
SELECT '=== TESTANDO ISOLAMENTO - DISTRIBUIDOR ===' as teste;
SELECT set_user_context('user-julia-distribuidor', 'tenant-distribuidor-001');
SELECT 'Leads visíveis para Julia (Distribuidor):' as info;
SELECT 
  l.name as cliente,
  l.email,
  l.origin,
  s.name as estagio
FROM leads l
LEFT JOIN stages s ON l.stage_id = s.id
ORDER BY l.created_at;

-- 7. TESTAR ISOLAMENTO DE DADOS - PORTA A PORTA
SELECT '=== TESTANDO ISOLAMENTO - PORTA A PORTA ===' as teste;
SELECT set_user_context('user-elaine-porta-porta', 'tenant-porta-porta-001');
SELECT 'Leads visíveis para Elaine (Porta a Porta):' as info;
SELECT 
  l.name as cliente,
  l.email,
  l.origin,
  s.name as estagio
FROM leads l
LEFT JOIN stages s ON l.stage_id = s.id
ORDER BY l.created_at;

-- 8. VERIFICAR PERMISSÕES POR USUÁRIO
SELECT '=== VERIFICANDO PERMISSÕES ===' as teste;

-- Julia (Distribuidor)
SELECT 'Permissões da Julia (Distribuidor):' as info;
SELECT * FROM check_user_permissions('user-julia-distribuidor', 'tenant-distribuidor-001');

-- Elaine (Porta a Porta)
SELECT 'Permissões da Elaine (Porta a Porta):' as info;
SELECT * FROM check_user_permissions('user-elaine-porta-porta', 'tenant-porta-porta-001');

-- Julio Supervisor (Distribuidor)
SELECT 'Permissões do Julio Supervisor (Distribuidor):' as info;
SELECT * FROM check_user_permissions('user-julio-distribuidor', 'tenant-distribuidor-001');

-- Julio Agente (Porta a Porta)
SELECT 'Permissões do Julio Agente (Porta a Porta):' as info;
SELECT * FROM check_user_permissions('user-julio-porta-porta', 'tenant-porta-porta-001');

-- 9. RESUMO FINAL
SELECT '=== RESUMO FINAL ===' as teste;
SELECT 
  'TENANTS CRIADAS' as categoria,
  COUNT(*) as total
FROM tenants 
WHERE id IN ('tenant-distribuidor-001', 'tenant-porta-porta-001')

UNION ALL

SELECT 
  'USUÁRIOS CRIADOS' as categoria,
  COUNT(*) as total
FROM users 
WHERE tenant_id IN ('tenant-distribuidor-001', 'tenant-porta-porta-001')

UNION ALL

SELECT 
  'LEADS CRIADOS' as categoria,
  COUNT(*) as total
FROM leads 
WHERE tenant_id IN ('tenant-distribuidor-001', 'tenant-porta-porta-001')

UNION ALL

SELECT 
  'VENDAS CRIADAS' as categoria,
  COUNT(*) as total
FROM sales s
JOIN leads l ON s.lead_id = l.id
WHERE l.tenant_id IN ('tenant-distribuidor-001', 'tenant-porta-porta-001')

ORDER BY categoria;

-- =====================================================
-- COMANDOS PARA TESTAR NO FRONTEND
-- =====================================================

/*
PARA TESTAR NO FRONTEND:

1. FAZER LOGIN COMO JULIA (DISTRIBUIDOR):
   - Email: julia@distribuidor.com
   - Tenant: tenant-distribuidor-001
   - Deve ver apenas leads do distribuidor

2. FAZER LOGIN COMO ELAINE (PORTA A PORTA):
   - Email: elaine@portaporta.com
   - Tenant: tenant-porta-porta-001
   - Deve ver apenas leads de porta a porta

3. FAZER LOGIN COMO JULIO SUPERVISOR (DISTRIBUIDOR):
   - Email: julio@distribuidor.com
   - Tenant: tenant-distribuidor-001
   - Deve ver todos os leads do distribuidor e poder gerenciar pipeline

4. FAZER LOGIN COMO JULIO AGENTE (PORTA A PORTA):
   - Email: julio@portaporta.com
   - Tenant: tenant-porta-porta-001
   - Deve ver apenas seus leads de porta a porta

TODOS OS DADOS ESTÃO COMPLETAMENTE ISOLADOS!
*/
