-- ========================================
-- VERIFICAR STATUS DOS LEADS DA MARIA
-- ========================================
-- Execute este script no Supabase SQL Editor

-- PASSO 1: Verificar todos os status dos leads da Maria
SELECT 
    'STATUS_LEADS_MARIA' as tipo,
    status,
    COUNT(*) AS total_leads,
    SUM(CAST(fields->>'sale_value' AS NUMERIC)) AS total_valor
FROM 
    public.leads
WHERE 
    tenant_id = '8bd69047-7533-42f3-a2f7-e3a60477f68c'::UUID
    AND fields->>'sale_value' IS NOT NULL
    AND fields->>'sale_value' != '0'
    AND fields->>'sale_value' != ''
GROUP BY 
    status
ORDER BY 
    total_valor DESC;

-- PASSO 2: Verificar leads específicos da Maria com valores
SELECT 
    'LEADS_ESPECIFICOS_COM_VALORES' as tipo,
    id,
    name,
    status,
    fields->>'sale_value' AS valor_em_fields,
    fields->>'sale_date' AS data_venda_em_fields,
    created_at,
    updated_at
FROM 
    public.leads
WHERE 
    tenant_id = '8bd69047-7533-42f3-a2f7-e3a60477f68c'::UUID
    AND fields->>'sale_value' IS NOT NULL
    AND fields->>'sale_value' != '0'
    AND fields->>'sale_value' != ''
    AND (
        name ILIKE '%dra renata%' OR
        name ILIKE '%amador bueno%' OR
        name ILIKE '%life sorrisos%' OR
        name ILIKE '%implants odonto%' OR
        name ILIKE '%dr leandro lana%'
    )
ORDER BY 
    CAST(fields->>'sale_value' AS NUMERIC) DESC;

-- PASSO 3: Atualizar status dos leads específicos para 'closed'
UPDATE public.leads
SET 
    status = 'closed',
    updated_at = NOW()
WHERE 
    tenant_id = '8bd69047-7533-42f3-a2f7-e3a60477f68c'::UUID
    AND fields->>'sale_value' IS NOT NULL
    AND fields->>'sale_value' != '0'
    AND fields->>'sale_value' != ''
    AND (
        name ILIKE '%dra renata%' OR
        name ILIKE '%amador bueno%' OR
        name ILIKE '%life sorrisos%' OR
        name ILIKE '%implants odonto%' OR
        name ILIKE '%dr leandro lana%'
    )
    AND status != 'closed';

-- PASSO 4: Verificar se a atualização funcionou
SELECT 
    'LEADS_APOS_ATUALIZACAO_STATUS' as tipo,
    status,
    COUNT(*) AS total_leads,
    SUM(CAST(fields->>'sale_value' AS NUMERIC)) AS total_valor
FROM 
    public.leads
WHERE 
    tenant_id = '8bd69047-7533-42f3-a2f7-e3a60477f68c'::UUID
    AND fields->>'sale_value' IS NOT NULL
    AND fields->>'sale_value' != '0'
    AND fields->>'sale_value' != ''
GROUP BY 
    status
ORDER BY 
    total_valor DESC;

-- PASSO 5: Migrar vendas para a tabela sales (agora que os leads estão 'closed')
INSERT INTO public.sales (lead_id, amount, created_at, tenant_id)
SELECT 
    l.id,
    (l.fields->>'sale_value')::NUMERIC,
    COALESCE(
        (l.fields->>'sale_date')::TIMESTAMP WITH TIME ZONE, 
        l.updated_at, 
        l.created_at, 
        NOW()
    ),
    l.tenant_id
FROM 
    public.leads l
LEFT JOIN 
    public.sales s ON l.id = s.lead_id
WHERE 
    l.tenant_id = '8bd69047-7533-42f3-a2f7-e3a60477f68c'::UUID
    AND l.status = 'closed'
    AND s.id IS NULL
    AND l.fields->>'sale_value' IS NOT NULL
    AND l.fields->>'sale_value' != '0'
    AND l.fields->>'sale_value' != ''
    AND (l.fields->>'sale_value')::NUMERIC > 0
ON CONFLICT (lead_id) DO UPDATE SET
    amount = EXCLUDED.amount,
    created_at = EXCLUDED.created_at,
    tenant_id = EXCLUDED.tenant_id;

-- PASSO 6: Verificar total de vendas após migração
SELECT 
    'TOTAL_VENDAS_FINAL' as tipo,
    COUNT(*) AS total_vendas,
    SUM(amount) AS total_valor
FROM 
    public.sales
WHERE 
    tenant_id = '8bd69047-7533-42f3-a2f7-e3a60477f68c'::UUID;

-- PASSO 7: Verificar leads fechados
SELECT 
    'LEADS_FECHADOS_FINAL' as tipo,
    COUNT(*) AS total_leads_fechados
FROM 
    public.leads
WHERE 
    tenant_id = '8bd69047-7533-42f3-a2f7-e3a60477f68c'::UUID
    AND status = 'closed';

-- ========================================
-- INSTRUÇÕES:
-- ========================================
-- 1. Execute TODOS os passos em sequência
-- 2. Verifique que o PASSO 4 mostra leads com status 'closed'
-- 3. Verifique que o PASSO 6 mostra o valor correto (R$ 9.854,78)
-- 4. Faça logout e login novamente
-- 5. Recarregue a página (F5)
-- ========================================
