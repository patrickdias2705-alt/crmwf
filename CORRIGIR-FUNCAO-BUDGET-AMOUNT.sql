-- Script para corrigir a função para usar budget_amount

-- 1. Atualizar função para incluir budget_amount
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
    
    -- Extrair valor do orçamento - INCLUINDO budget_amount
    orcamento_text := COALESCE(
      NEW.fields->>'budget_amount',  -- NOVO CAMPO DESCOBERTO!
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
      'budget_amount', NEW.fields->>'budget_amount',  -- ADICIONAR CAMPO ORIGINAL
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
            CASE WHEN OLD.fields ? 'budget_amount' AND OLD.fields->>'budget_amount' != '' THEN (OLD.fields->>'budget_amount')::DECIMAL ELSE 0 END +
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

-- 2. Atualizar função de reprocessamento também
CREATE OR REPLACE FUNCTION reprocess_all_daily_leads()
RETURNS void AS $$
BEGIN
  -- Limpar dados existentes
  DELETE FROM leads_daily_summary WHERE tenant_id = '8bd69047-7533-42f3-a2f7-e3a60477f68c';
  
  -- Reprocessar todos os leads com budget_amount
  INSERT INTO leads_daily_summary (tenant_id, data, total_leads, leads_vendidos, valor_total_vendido, leads_data)
  SELECT 
    tenant_id,
    DATE(created_at) as data,
    COUNT(*) as total_leads,
    COUNT(CASE WHEN status = 'closed' OR (fields ? 'sold' AND fields->>'sold' = 'true') THEN 1 END) as leads_vendidos,
    SUM(CASE WHEN status = 'closed' OR (fields ? 'sold' AND fields->>'sold' = 'true') THEN 
      COALESCE(
        CASE WHEN fields ? 'budget_amount' AND fields->>'budget_amount' != '' THEN (fields->>'budget_amount')::DECIMAL ELSE 0 END +
        CASE WHEN fields ? 'orcamento' AND fields->>'orcamento' != '' THEN (fields->>'orcamento')::DECIMAL ELSE 0 END +
        CASE WHEN fields ? 'budget' AND fields->>'budget' != '' THEN (fields->>'budget')::DECIMAL ELSE 0 END +
        CASE WHEN fields ? 'valor' AND fields->>'valor' != '' THEN (fields->>'valor')::DECIMAL ELSE 0 END +
        CASE WHEN fields ? 'price' AND fields->>'price' != '' THEN (fields->>'price')::DECIMAL ELSE 0 END,
        0
      )
    ELSE 0 END) as valor_total_vendido,
    jsonb_agg(
      jsonb_build_object(
        'id', id,
        'name', fields->>'name',
        'email', fields->>'email',
        'phone', fields->>'phone',
        'orcamento', COALESCE(
          CASE WHEN fields ? 'budget_amount' AND fields->>'budget_amount' != '' THEN (fields->>'budget_amount')::DECIMAL ELSE 0 END +
          CASE WHEN fields ? 'orcamento' AND fields->>'orcamento' != '' THEN (fields->>'orcamento')::DECIMAL ELSE 0 END +
          CASE WHEN fields ? 'budget' AND fields->>'budget' != '' THEN (fields->>'budget')::DECIMAL ELSE 0 END +
          CASE WHEN fields ? 'valor' AND fields->>'valor' != '' THEN (fields->>'valor')::DECIMAL ELSE 0 END +
          CASE WHEN fields ? 'price' AND fields->>'price' != '' THEN (fields->>'price')::DECIMAL ELSE 0 END,
          0
        ),
        'budget_amount', fields->>'budget_amount',
        'status', status,
        'sold', (status = 'closed' OR (fields ? 'sold' AND fields->>'sold' = 'true'))
      )
    ) as leads_data
  FROM leads 
  WHERE tenant_id = '8bd69047-7533-42f3-a2f7-e3a60477f68c'
  AND created_at >= '2025-10-01'
  GROUP BY tenant_id, DATE(created_at)
  ORDER BY data;
END;
$$ LANGUAGE plpgsql;

-- 3. Executar reprocessamento com budget_amount
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
  leads_vendidos,
  valor_total_vendido,
  leads_data
FROM leads_daily_summary 
WHERE tenant_id = '8bd69047-7533-42f3-a2f7-e3a60477f68c'
AND leads_vendidos > 0
ORDER BY data DESC;
