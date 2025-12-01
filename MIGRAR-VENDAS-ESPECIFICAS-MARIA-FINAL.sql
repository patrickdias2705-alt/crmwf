-- ========================================
-- MIGRAR VENDAS ESPECÍFICAS DA MARIA
-- ========================================
-- Este script migra as vendas específicas que você mencionou para a tabela 'sales'

-- PASSO 1: Verificar se os leads da Maria existem
SELECT 
    'LEADS_MARIA_EXISTENTES' as tipo,
    id,
    name,
    email,
    status,
    fields->>'sale_value' as valor_venda,
    fields->>'sale_date' as data_venda
FROM 
    public.leads 
WHERE 
    tenant_id = '8bd69047-7533-42f3-a2f7-e3a60477f68c'
    AND name ILIKE '%Renata%'
    OR name ILIKE '%Amador%'
    OR name ILIKE '%Life%'
    OR name ILIKE '%Implants%'
    OR name ILIKE '%Leandro%';

-- PASSO 2: Inserir vendas específicas da Maria na tabela 'sales'
-- Dra Renata: R$ 628,25
INSERT INTO public.sales (lead_id, amount, created_at, tenant_id)
SELECT 
    id,
    628.25,
    COALESCE((fields->>'sale_date')::TIMESTAMP WITH TIME ZONE, updated_at, NOW()),
    '8bd69047-7533-42f3-a2f7-e3a60477f68c'
FROM 
    public.leads 
WHERE 
    tenant_id = '8bd69047-7533-42f3-a2f7-e3a60477f68c'
    AND name ILIKE '%Renata%'
    AND NOT EXISTS (
        SELECT 1 FROM public.sales WHERE lead_id = leads.id
    );

-- Amador Bueno Clínica: R$ 410,00
INSERT INTO public.sales (lead_id, amount, created_at, tenant_id)
SELECT 
    id,
    410.00,
    COALESCE((fields->>'sale_date')::TIMESTAMP WITH TIME ZONE, updated_at, NOW()),
    '8bd69047-7533-42f3-a2f7-e3a60477f68c'
FROM 
    public.leads 
WHERE 
    tenant_id = '8bd69047-7533-42f3-a2f7-e3a60477f68c'
    AND name ILIKE '%Amador%'
    AND NOT EXISTS (
        SELECT 1 FROM public.sales WHERE lead_id = leads.id
    );

-- Life Sorrisos: R$ 400,00
INSERT INTO public.sales (lead_id, amount, created_at, tenant_id)
SELECT 
    id,
    400.00,
    COALESCE((fields->>'sale_date')::TIMESTAMP WITH TIME ZONE, updated_at, NOW()),
    '8bd69047-7533-42f3-a2f7-e3a60477f68c'
FROM 
    public.leads 
WHERE 
    tenant_id = '8bd69047-7533-42f3-a2f7-e3a60477f68c'
    AND name ILIKE '%Life%'
    AND NOT EXISTS (
        SELECT 1 FROM public.sales WHERE lead_id = leads.id
    );

-- Implants Odonto: R$ 428,00
INSERT INTO public.sales (lead_id, amount, created_at, tenant_id)
SELECT 
    id,
    428.00,
    COALESCE((fields->>'sale_date')::TIMESTAMP WITH TIME ZONE, updated_at, NOW()),
    '8bd69047-7533-42f3-a2f7-e3a60477f68c'
FROM 
    public.leads 
WHERE 
    tenant_id = '8bd69047-7533-42f3-a2f7-e3a60477f68c'
    AND name ILIKE '%Implants%'
    AND NOT EXISTS (
        SELECT 1 FROM public.sales WHERE lead_id = leads.id
    );

-- Dr Leandro Lana: R$ 324,00
INSERT INTO public.sales (lead_id, amount, created_at, tenant_id)
SELECT 
    id,
    324.00,
    COALESCE((fields->>'sale_date')::TIMESTAMP WITH TIME ZONE, updated_at, NOW()),
    '8bd69047-7533-42f3-a2f7-e3a60477f68c'
FROM 
    public.leads 
WHERE 
    tenant_id = '8bd69047-7533-42f3-a2f7-e3a60477f68c'
    AND name ILIKE '%Leandro%'
    AND NOT EXISTS (
        SELECT 1 FROM public.sales WHERE lead_id = leads.id
    );

-- PASSO 3: Verificar o total após a migração
SELECT 
    'TOTAL_APOS_MIGRACAO' as tipo,
    COUNT(*) as total_vendas,
    SUM(amount) as total_receita,
    AVG(amount) as ticket_medio
FROM 
    public.sales 
WHERE 
    tenant_id = '8bd69047-7533-42f3-a2f7-e3a60477f68c';

-- PASSO 4: Verificar se as vendas específicas foram inseridas
SELECT 
    'VENDAS_ESPECIFICAS_INSERIDAS' as tipo,
    s.amount,
    l.name,
    s.created_at
FROM 
    public.sales s
JOIN 
    public.leads l ON s.lead_id = l.id
WHERE 
    s.tenant_id = '8bd69047-7533-42f3-a2f7-e3a60477f68c'
    AND s.amount IN (628.25, 410.00, 400.00, 428.00, 324.00)
ORDER BY 
    s.amount DESC;

-- PASSO 5: Atualizar leads para status 'closed' se necessário
UPDATE public.leads 
SET 
    status = 'closed',
    fields = COALESCE(fields, '{}'::jsonb) || 
    jsonb_build_object(
        'sold', true,
        'sale_date', NOW()::text
    )
WHERE 
    tenant_id = '8bd69047-7533-42f3-a2f7-e3a60477f68c'
    AND name ILIKE '%Renata%'
    OR name ILIKE '%Amador%'
    OR name ILIKE '%Life%'
    OR name ILIKE '%Implants%'
    OR name ILIKE '%Leandro%'
    AND status != 'closed';

-- PASSO 6: Confirmar total final
SELECT 
    'TOTAL_FINAL_CONFIRMADO' as tipo,
    'R$ 9.854,78' as valor_esperado,
    SUM(amount) as valor_atual,
    CASE 
        WHEN SUM(amount) >= 9854.78 THEN '✅ CORRETO'
        ELSE '❌ AINDA FALTANDO'
    END as status
FROM 
    public.sales 
WHERE 
    tenant_id = '8bd69047-7533-42f3-a2f7-e3a60477f68c';
