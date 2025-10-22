-- =====================================================
-- RENOMEAR TENANTS - VERSÃO SIMPLES E SEGURA
-- =====================================================

-- PASSO 1: Verificar tenants atuais e identificar qual é da Maria
SELECT 
    'TENANTS ATUAIS' as info,
    id,
    name,
    plan,
    created_at
FROM tenants
ORDER BY created_at;

-- PASSO 2: Verificar qual tenant tem mais dados (provavelmente o da Maria)
SELECT 
    'ANÁLISE DE DADOS POR TENANT' as info,
    t.id,
    t.name,
    COUNT(DISTINCT l.id) as total_leads,
    COUNT(DISTINCT s.id) as total_sales,
    COUNT(DISTINCT u.id) as total_users,
    (COUNT(DISTINCT l.id) + COUNT(DISTINCT s.id)) as total_dados
FROM tenants t
LEFT JOIN leads l ON t.id = l.tenant_id
LEFT JOIN sales s ON t.id = s.tenant_id
LEFT JOIN users u ON t.id = u.tenant_id
GROUP BY t.id, t.name
ORDER BY total_dados DESC;

-- PASSO 3: Executar as alterações (substitua os IDs pelos reais)
-- IMPORTANTE: Execute uma query por vez e verifique o resultado

-- 3.1. Renomear tenant da Maria para "Varejo" (substitua 'ID_AQUI' pelo ID real)
-- UPDATE tenants SET name = 'Varejo', updated_at = NOW() WHERE id = 'ID_AQUI';

-- 3.2. Renomear segundo tenant para "Porta a Porta" (substitua 'ID_AQUI' pelo ID real)
-- UPDATE tenants SET name = 'Porta a Porta', updated_at = NOW() WHERE id = 'ID_AQUI';

-- 3.3. Renomear terceiro tenant para "Distribuidor" (substitua 'ID_AQUI' pelo ID real)
-- UPDATE tenants SET name = 'Distribuidor', updated_at = NOW() WHERE id = 'ID_AQUI';

-- PASSO 4: Verificar resultado final
-- SELECT 'TENANTS APÓS ALTERAÇÃO' as info, id, name, plan, updated_at FROM tenants ORDER BY updated_at DESC;
