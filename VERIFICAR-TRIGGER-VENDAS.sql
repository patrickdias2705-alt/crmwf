-- ========================================
-- VERIFICAR E CORRIGIR TRIGGER DE VENDAS
-- ========================================
-- Execute este script no Supabase SQL Editor

-- PASSO 1: Verificar se o trigger existe
SELECT 
    'VERIFICAR_TRIGGER' as tipo,
    tgname AS trigger_name,
    relname AS table_name,
    pg_get_triggerdef(t.oid) AS trigger_definition
FROM 
    pg_trigger t
JOIN 
    pg_class c ON t.tgrelid = c.oid
WHERE 
    c.relname = 'leads' 
    AND tgname = 'trigger_insert_sale_on_lead_close';

-- PASSO 2: Verificar se a função existe
SELECT 
    'VERIFICAR_FUNCAO' as tipo,
    proname AS function_name,
    prosrc AS function_definition
FROM 
    pg_proc
WHERE 
    proname = 'insert_sale_on_lead_close';

-- PASSO 3: Recriar a função se necessário
CREATE OR REPLACE FUNCTION public.insert_sale_on_lead_close()
RETURNS TRIGGER AS $$
DECLARE
    v_sale_value NUMERIC;
    v_sale_date TIMESTAMP WITH TIME ZONE;
    v_existing_sale_id UUID;
BEGIN
    -- Verifica se o status mudou para 'closed'
    IF NEW.status = 'closed' AND (OLD.status IS DISTINCT FROM NEW.status OR OLD.status IS NULL) THEN
        -- Extrai o valor da venda do campo 'fields'
        v_sale_value := (NEW.fields->>'sale_value')::NUMERIC;
        v_sale_date := COALESCE((NEW.fields->>'sale_date')::TIMESTAMP WITH TIME ZONE, NEW.updated_at, NOW());

        -- Verifica se já existe uma venda para este lead_id
        SELECT id INTO v_existing_sale_id FROM public.sales WHERE lead_id = NEW.id;

        IF v_existing_sale_id IS NULL THEN
            -- Insere na tabela 'sales' se não existir e houver valor de venda
            IF v_sale_value IS NOT NULL AND v_sale_value > 0 THEN
                INSERT INTO public.sales (lead_id, amount, created_at, tenant_id)
                VALUES (NEW.id, v_sale_value, v_sale_date, NEW.tenant_id);
                RAISE NOTICE 'Venda criada para o lead % com valor %', NEW.id, v_sale_value;
            ELSE
                RAISE NOTICE 'Lead % marcado como fechado, mas sem valor de venda para inserir.', NEW.id;
            END IF;
        ELSE
            RAISE NOTICE 'Venda já existe para o lead %, atualizando valor para %', NEW.id, v_sale_value;
            UPDATE public.sales
            SET amount = v_sale_value, created_at = v_sale_date, tenant_id = NEW.tenant_id
            WHERE id = v_existing_sale_id;
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- PASSO 4: Recriar o trigger se necessário
DROP TRIGGER IF EXISTS trigger_insert_sale_on_lead_close ON public.leads;

CREATE TRIGGER trigger_insert_sale_on_lead_close
    AFTER UPDATE ON public.leads
    FOR EACH ROW
    EXECUTE FUNCTION public.insert_sale_on_lead_close();

-- PASSO 5: Verificar se o trigger foi criado
SELECT 
    'TRIGGER_CRIADO' as tipo,
    tgname AS trigger_name,
    relname AS table_name
FROM 
    pg_trigger t
JOIN 
    pg_class c ON t.tgrelid = c.oid
WHERE 
    c.relname = 'leads' 
    AND tgname = 'trigger_insert_sale_on_lead_close';

-- PASSO 6: Testar o trigger com um lead existente
-- DESCOMENTE as linhas abaixo para testar:
/*
UPDATE public.leads 
SET 
    status = 'closed',
    updated_at = NOW()
WHERE 
    id IN (
        SELECT id 
        FROM public.leads 
        WHERE status != 'closed'
        AND fields->>'sale_value' IS NOT NULL
        AND fields->>'sale_value' != '0'
        AND fields->>'sale_value' != ''
        LIMIT 1
    );

-- Verificar se a venda foi criada
SELECT 
    'TESTE_TRIGGER' as tipo,
    COUNT(*) AS vendas_criadas
FROM public.sales
WHERE created_at > NOW() - INTERVAL '1 minute';
*/

-- PASSO 7: Verificar leads que deveriam ter vendas mas não têm
SELECT 
    'LEADS_SEM_VENDA_REGISTRADA' as tipo,
    l.id AS lead_id,
    l.name,
    l.status,
    l.fields->>'sale_value' AS valor_em_fields,
    l.tenant_id
FROM 
    public.leads l
LEFT JOIN 
    public.sales s ON l.id = s.lead_id
WHERE 
    l.status = 'closed'
    AND s.id IS NULL
    AND l.fields->>'sale_value' IS NOT NULL
    AND l.fields->>'sale_value' != '0'
    AND l.fields->>'sale_value' != ''
ORDER BY 
    l.updated_at DESC;

-- ========================================
-- INSTRUÇÕES:
-- ========================================
-- 1. Execute TODOS os passos em sequência
-- 2. Verifique que o PASSO 5 mostra o trigger criado
-- 3. Se necessário, descomente o PASSO 6 para testar
-- 4. O PASSO 7 deve mostrar 0 leads sem venda registrada
-- ========================================
