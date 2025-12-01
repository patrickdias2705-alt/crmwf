-- DEBUG: Verificar dados do dashboard
-- Execute este script no Supabase SQL Editor para diagnosticar

-- 1. Verificar se há leads no banco
SELECT 
  'Leads totais' as tipo,
  COUNT(*) as total
FROM leads
WHERE tenant_id = (SELECT id FROM tenants LIMIT 1);

-- 2. Verificar leads por estágio
SELECT 
  s.name as estagio,
  COUNT(l.id) as total_leads
FROM stages s
LEFT JOIN leads l ON s.id = l.stage_id AND l.tenant_id = s.tenant_id
WHERE s.tenant_id = (SELECT id FROM tenants LIMIT 1)
GROUP BY s.id, s.name, s.order
ORDER BY s.order;

-- 3. Verificar métricas diárias
SELECT 
  date,
  leads_in,
  leads_attended,
  closed,
  refused,
  lost
FROM metrics_daily
WHERE tenant_id = (SELECT id FROM tenants LIMIT 1)
ORDER BY date DESC
LIMIT 7;

-- 4. Verificar vendas (tabela sales)
SELECT 
  COUNT(*) as total_vendas,
  SUM(amount) as receita_total
FROM sales
WHERE tenant_id = (SELECT id FROM tenants LIMIT 1);

-- 5. Verificar vendas no fields dos leads (fallback)
SELECT 
  COUNT(*) as leads_vendidos,
  SUM((fields->>'sold_amount')::numeric) as receita_fields
FROM leads
WHERE tenant_id = (SELECT id FROM tenants LIMIT 1)
  AND fields->>'sold' = 'true'
  AND fields->>'sold_amount' IS NOT NULL;

-- 6. Verificar leads fechados (últimos 7 dias)
SELECT 
  DATE(updated_at) as data,
  COUNT(*) as leads_fechados
FROM leads
WHERE tenant_id = (SELECT id FROM tenants LIMIT 1)
  AND stage_id IN (
    SELECT id FROM stages 
    WHERE tenant_id = (SELECT id FROM tenants LIMIT 1)
    AND name ILIKE '%fechado%' OR name ILIKE '%vendido%'
  )
  AND updated_at >= NOW() - INTERVAL '7 days'
GROUP BY DATE(updated_at)
ORDER BY data DESC;

-- 7. Verificar se há tenant_id correto
SELECT 
  t.id as tenant_id,
  t.name as tenant_name,
  COUNT(l.id) as total_leads
FROM tenants t
LEFT JOIN leads l ON t.id = l.tenant_id
GROUP BY t.id, t.name
ORDER BY total_leads DESC;
