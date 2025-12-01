-- Script para corrigir a extração de valores dos orçamentos

-- 1. Verificar como estão os dados dos orçamentos nos leads
SELECT 
  id,
  created_at,
  status,
  fields,
  fields->>'orcamento' as orcamento_direto,
  fields->>'budget' as budget_direto,
  fields->>'valor' as valor_direto,
  fields->>'price' as price_direto,
  fields->>'sold' as sold_status
FROM leads 
WHERE tenant_id = '8bd69047-7533-42f3-a2f7-e3a60477f68c'
AND (status = 'closed' OR (fields ? 'sold' AND fields->>'sold' = 'true'))
ORDER BY created_at DESC
LIMIT 10;

-- 2. Atualizar função para melhor extração de valores
CREATE OR REPLACE FUNCTION update_daily_leads_summary()
RETURNS TRIGGER AS $$
DECLARE
  lead_date DATE;
  lead_data JSONB;
  lead_value DECIMAL(10,2) := 0;
  is_sold BOOLEAN := FALSE;
  orcamento_text TEXT;
BEGIN
  -- Determinar a data do lead
  IF TG_OP = 'DELETE' THEN
    lead_date := DATE(OLD.created_at);
    lead_data := jsonb_build_object(
      'id', OLD.id,
      'name', OLD.fields->>'name',
      'email', OLD.fields->>'email',
      'phone', OLD.fields->>'phone',
      'status', OLD.status,
      'action', 'deleted'
    );
  ELSE
    lead_date := DATE(NEW.created_at);
    
    -- Extrair valor do orçamento com melhor lógica
    orcamento_text := COALESCE(
      NEW.fields->>'orcamento',
      NEW.fields->>'budget', 
      NEW.fields->>'valor',
      NEW.fields->>'price',
      NEW.fields->>'revenue',
      '0'
    );
    
    -- Converter para decimal, tratando strings vazias e inválidas
    BEGIN
      lead_value := CASE 
        WHEN orcamento_text IS NULL OR orcamento_text = '' OR orcamento_text = 'null' THEN 0
        ELSE orcamento_text::DECIMAL
      END;
    EXCEPTION WHEN OTHERS THEN
      lead_value := 0;
    END;
    
    -- Verificar se é venda
    is_sold := (
      NEW.status = 'closed' OR 
      (NEW.fields ? 'sold' AND (NEW.fields->>'sold' = 'true' OR NEW.fields->>'sold' = '1'))
    );
    
    lead_data := jsonb_build_object(
      'id', NEW.id,
      'name', NEW.fields->>'name',
      'email', NEW.fields->>'email',
      'phone', NEW.fields->>'phone',
      'orcamento', lead_value,
      'orcamento_text', orcamento_text,
      'status', NEW.status,
      'sold', is_sold,
      'action', TG_OP
    );
  END IF;

  -- Inserir ou atualizar resumo do dia
  INSERT INTO leads_daily_summary (tenant_id, data, total_leads, leads_vendidos, valor_total_vendido, leads_data, updated_at)
  VALUES (
    COALESCE(NEW.tenant_id, OLD.tenant_id),
    lead_date,
    1,
    CASE WHEN is_sold THEN 1 ELSE 0 END,
    CASE WHEN is_sold THEN lead_value ELSE 0 END,
    jsonb_build_array(lead_data),
    NOW()
  )
  ON CONFLICT (tenant_id, data) DO UPDATE SET
    total_leads = leads_daily_summary.total_leads + 
      CASE WHEN TG_OP = 'DELETE' THEN -1 ELSE 1 END,
    leads_vendidos = leads_daily_summary.leads_vendidos + 
      CASE WHEN TG_OP = 'DELETE' THEN 
        CASE WHEN OLD.status = 'closed' OR (OLD.fields ? 'sold' AND OLD.fields->>'sold' = 'true') THEN -1 ELSE 0 END
      ELSE 
        CASE WHEN is_sold THEN 1 ELSE 0 END
      END,
    valor_total_vendido = leads_daily_summary.valor_total_vendido + 
      CASE WHEN TG_OP = 'DELETE' THEN 
        CASE WHEN OLD.status = 'closed' OR (OLD.fields ? 'sold' AND OLD.fields->>'sold' = 'true') THEN 
          -COALESCE(
            CASE WHEN OLD.fields ? 'orcamento' AND OLD.fields->>'orcamento' != '' THEN (OLD.fields->>'orcamento')::DECIMAL ELSE 0 END +
            CASE WHEN OLD.fields ? 'budget' AND OLD.fields->>'budget' != '' THEN (OLD.fields->>'budget')::DECIMAL ELSE 0 END +
            CASE WHEN OLD.fields ? 'valor' AND OLD.fields->>'valor' != '' THEN (OLD.fields->>'valor')::DECIMAL ELSE 0 END +
            CASE WHEN OLD.fields ? 'price' AND OLD.fields->>'price' != '' THEN (OLD.fields->>'price')::DECIMAL ELSE 0 END,
            0
          )
        ELSE 0 END
      ELSE 
        CASE WHEN is_sold THEN lead_value ELSE 0 END
      END,
    leads_data = CASE WHEN TG_OP = 'DELETE' THEN 
      leads_daily_summary.leads_data || lead_data
    ELSE 
      leads_daily_summary.leads_data || lead_data
    END,
    updated_at = NOW();

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- 3. Reprocessar todos os dados com a nova lógica
SELECT reprocess_all_daily_leads();

-- 4. Verificar se os valores foram corrigidos
SELECT 
  data,
  total_leads,
  leads_vendidos,
  valor_total_vendido,
  jsonb_array_length(leads_data) as leads_count
FROM leads_daily_summary 
WHERE tenant_id = '8bd69047-7533-42f3-a2f7-e3a60477f68c'
ORDER BY data DESC;

-- 5. Verificar valores específicos dos leads vendidos
SELECT 
  data,
  leads_data
FROM leads_daily_summary 
WHERE tenant_id = '8bd69047-7533-42f3-a2f7-e3a60477f68c'
AND leads_vendidos > 0
ORDER BY data DESC;
