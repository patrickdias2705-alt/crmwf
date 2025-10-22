-- =====================================================
-- RENOMEAR TENANTS PARA ORGANIZAÇÃO
-- =====================================================
-- Script para renomear os tenants:
-- 1. Tenant da Maria (com todos os dados) → "Varejo"
-- 2. Outro tenant → "Porta a Porta" 
-- 3. Terceiro tenant → "Distribuidor"

-- PRIMEIRO: Verificar tenants atuais
SELECT 
    'TENANTS ANTES DA ALTERAÇÃO' as info,
    id,
    name,
    plan,
    created_at
FROM tenants
ORDER BY created_at;

-- SEGUNDO: Identificar o tenant da Maria (provavelmente o que tem mais dados)
-- Vamos assumir que o tenant com mais leads/sales é o da Maria
WITH tenant_stats AS (
    SELECT 
        t.id,
        t.name,
        COUNT(DISTINCT l.id) as total_leads,
        COUNT(DISTINCT s.id) as total_sales,
        COUNT(DISTINCT u.id) as total_users
    FROM tenants t
    LEFT JOIN leads l ON t.id = l.tenant_id
    LEFT JOIN sales s ON t.id = s.tenant_id
    LEFT JOIN users u ON t.id = u.tenant_id
    GROUP BY t.id, t.name
    ORDER BY (total_leads + total_sales) DESC
)
SELECT 
    'TENANT DA MARIA (MAIS DADOS)' as info,
    id,
    name,
    total_leads,
    total_sales,
    total_users
FROM tenant_stats
LIMIT 1;

-- TERCEIRO: Renomear tenants
-- ATENÇÃO: Execute estas queries uma por vez e verifique os IDs corretos

-- 1. Renomear tenant da Maria para "Varejo"
-- (Substitua 'TENANT_ID_DA_MARIA' pelo ID real do tenant da Maria)
UPDATE tenants 
SET name = 'Varejo', updated_at = NOW()
WHERE id = (
    SELECT t.id 
    FROM tenants t
    LEFT JOIN leads l ON t.id = l.tenant_id
    LEFT JOIN sales s ON t.id = s.tenant_id
    GROUP BY t.id, t.name
    ORDER BY (COUNT(DISTINCT l.id) + COUNT(DISTINCT s.id)) DESC
    LIMIT 1
);

-- 2. Renomear o segundo tenant para "Porta a Porta"
-- (Substitua 'TENANT_ID_2' pelo ID real do segundo tenant)
UPDATE tenants 
SET name = 'Porta a Porta', updated_at = NOW()
WHERE id = (
    SELECT t.id 
    FROM tenants t
    LEFT JOIN leads l ON t.id = l.tenant_id
    LEFT JOIN sales s ON t.id = s.tenant_id
    GROUP BY t.id, t.name
    ORDER BY (COUNT(DISTINCT l.id) + COUNT(DISTINCT s.id)) DESC
    OFFSET 1
    LIMIT 1
);

-- 3. Renomear o terceiro tenant para "Distribuidor"
-- (Substitua 'TENANT_ID_3' pelo ID real do terceiro tenant)
UPDATE tenants 
SET name = 'Distribuidor', updated_at = NOW()
WHERE id = (
    SELECT t.id 
    FROM tenants t
    LEFT JOIN leads l ON t.id = l.tenant_id
    LEFT JOIN sales s ON t.id = s.tenant_id
    GROUP BY t.id, t.name
    ORDER BY (COUNT(DISTINCT l.id) + COUNT(DISTINCT s.id)) DESC
    OFFSET 2
    LIMIT 1
);

-- QUARTO: Verificar resultado final
SELECT 
    'TENANTS APÓS ALTERAÇÃO' as info,
    id,
    name,
    plan,
    updated_at
FROM tenants
ORDER BY updated_at DESC;
