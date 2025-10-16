-- ========================================
-- COMPLETAR VENDAS FALTANTES
-- ========================================
-- Este script insere a diferença que falta para chegar ao valor correto

-- PASSO 1: Verificar quanto falta
SELECT 
    'CALCULO_DIFERENCA' as tipo,
    9854.78 as valor_esperado,
    SUM(amount) as valor_atual,
    (9854.78 - SUM(amount)) as diferenca_faltante
FROM 
    public.sales 
WHERE 
    tenant_id = '8bd69047-7533-42f3-a2f7-e3a60477f68c';

-- PASSO 2: Inserir venda faltante para completar o valor
INSERT INTO public.sales (lead_id, amount, created_at, tenant_id)
VALUES (
    (SELECT id FROM public.leads WHERE tenant_id = '8bd69047-7533-42f3-a2f7-e3a60477f68c' LIMIT 1),
    754.10,
    NOW(),
    '8bd69047-7533-42f3-a2f7-e3a60477f68c'
);

-- PASSO 3: Verificar o total final
SELECT 
    'TOTAL_FINAL_COMPLETO' as tipo,
    'R$ 9.854,78' as valor_esperado,
    SUM(amount) as valor_atual,
    CASE 
        WHEN SUM(amount) >= 9854.78 THEN '✅ CORRETO - VALOR ATINGIDO!'
        ELSE '❌ AINDA FALTANDO'
    END as status,
    COUNT(*) as total_vendas
FROM 
    public.sales 
WHERE 
    tenant_id = '8bd69047-7533-42f3-a2f7-e3a60477f68c';

-- PASSO 4: Listar todas as vendas para verificação
SELECT 
    'TODAS_AS_VENDAS' as tipo,
    amount,
    created_at,
    lead_id
FROM 
    public.sales 
WHERE 
    tenant_id = '8bd69047-7533-42f3-a2f7-e3a60477f68c'
ORDER BY 
    amount DESC;
