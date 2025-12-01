-- ========================================
-- CRIAR TRIGGER PARA VENDAS AUTOMÁTICO
-- ========================================
-- Execute este script no Supabase SQL Editor

-- PASSO 1: Criar função para inserir venda automaticamente
CREATE OR REPLACE FUNCTION insert_sale_on_lead_close()
RETURNS TRIGGER AS $$
BEGIN
    -- Verificar se o lead foi marcado como fechado (vendido)
    IF NEW.status = 'closed' AND OLD.status != 'closed' THEN
        -- Verificar se há valor de venda nos fields
        IF NEW.fields ? 'sale_value' AND NEW.fields->>'sale_value' IS NOT NULL AND NEW.fields->>'sale_value' != '0' AND NEW.fields->>'sale_value' != '' THEN
            -- Inserir venda na tabela sales
            INSERT INTO public.sales (
                lead_id,
                tenant_id,
                amount,
                created_at,
                updated_at
            ) VALUES (
                NEW.id,
                NEW.tenant_id,
                CAST(NEW.fields->>'sale_value' AS NUMERIC),
                COALESCE(
                    CASE 
                        WHEN NEW.fields ? 'sale_date' AND NEW.fields->>'sale_date' IS NOT NULL 
                        THEN (NEW.fields->>'sale_date')::TIMESTAMP
                        ELSE NEW.updated_at
                    END,
                    NEW.updated_at
                ),
                NOW()
            )
            ON CONFLICT (lead_id) DO UPDATE SET
                amount = EXCLUDED.amount,
                updated_at = NOW();
            
            RAISE NOTICE 'Venda inserida automaticamente para lead %: R$ %', NEW.id, NEW.fields->>'sale_value';
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- PASSO 2: Criar trigger para executar a função
DROP TRIGGER IF EXISTS trigger_insert_sale_on_lead_close ON public.leads;
CREATE TRIGGER trigger_insert_sale_on_lead_close
    AFTER UPDATE ON public.leads
    FOR EACH ROW
    EXECUTE FUNCTION insert_sale_on_lead_close();

-- PASSO 3: Migrar vendas existentes que não foram criadas automaticamente
INSERT INTO public.sales (
    lead_id,
    tenant_id,
    amount,
    created_at,
    updated_at
)
SELECT 
    l.id,
    l.tenant_id,
    CAST(l.fields->>'sale_value' AS NUMERIC),
    COALESCE(
        CASE 
            WHEN l.fields ? 'sale_date' AND l.fields->>'sale_date' IS NOT NULL 
            THEN (l.fields->>'sale_date')::TIMESTAMP
            ELSE l.updated_at
        END,
        l.updated_at
    ),
    NOW()
FROM 
    public.leads l
LEFT JOIN 
    public.sales s ON l.id = s.lead_id
WHERE 
    l.status = 'closed'
    AND l.fields ? 'sale_value'
    AND l.fields->>'sale_value' IS NOT NULL
    AND l.fields->>'sale_value' != '0'
    AND l.fields->>'sale_value' != ''
    AND s.id IS NULL
ON CONFLICT (lead_id) DO NOTHING;

-- PASSO 4: Verificar quantas vendas foram migradas
SELECT 
    'VENDAS_MIGRADAS' as tipo,
    COUNT(*) as total_vendas_migradas
FROM 
    public.sales
WHERE 
    created_at > NOW() - INTERVAL '1 minute';

-- PASSO 5: Verificar total de vendas após migração
SELECT 
    'TOTAL_VENDAS_APOS_MIGRACAO' as tipo,
    tenant_id,
    COUNT(*) as total_vendas,
    SUM(amount) as total_valor
FROM 
    public.sales
GROUP BY 
    tenant_id
ORDER BY 
    total_valor DESC;

-- PASSO 6: Verificar se ainda há leads vendidos sem sales
SELECT 
    'LEADS_SEM_SALES_RESTANTES' as tipo,
    COUNT(*) as leads_vendidos_sem_sales
FROM 
    public.leads l
LEFT JOIN 
    public.sales s ON l.id = s.lead_id
WHERE 
    l.status = 'closed'
    AND l.fields ? 'sale_value'
    AND l.fields->>'sale_value' IS NOT NULL
    AND l.fields->>'sale_value' != '0'
    AND l.fields->>'sale_value' != ''
    AND s.id IS NULL;

-- ========================================
-- INSTRUÇÕES:
-- ========================================
-- 1. Execute TODOS os passos em sequência
-- 2. O trigger agora criará vendas automaticamente
-- 3. Vendas existentes foram migradas
-- 4. Teste marcando um lead como vendido
-- ========================================
