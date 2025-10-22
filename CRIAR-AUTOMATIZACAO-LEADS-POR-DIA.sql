-- Script para criar automatização de leads por dia no Supabase

-- 1. Criar tabela para armazenar leads agrupados por dia
CREATE TABLE IF NOT EXISTS leads_daily_summary (
  id SERIAL PRIMARY KEY,
  tenant_id UUID NOT NULL,
  data DATE NOT NULL,
  total_leads INTEGER DEFAULT 0,
  leads_vendidos INTEGER DEFAULT 0,
  valor_total_vendido DECIMAL(10,2) DEFAULT 0,
  leads_data JSONB DEFAULT '[]'::jsonb, -- Array com dados dos leads do dia
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(tenant_id, data)
);

-- 2. Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_leads_daily_summary_tenant_data ON leads_daily_summary(tenant_id, data);
CREATE INDEX IF NOT EXISTS idx_leads_daily_summary_data ON leads_daily_summary(data);

-- 3. Função para atualizar resumo diário de leads
CREATE OR REPLACE FUNCTION update_daily_leads_summary()
RETURNS TRIGGER AS $$
DECLARE
  lead_date DATE;
  lead_data JSONB;
  lead_value DECIMAL(10,2) := 0;
  is_sold BOOLEAN := FALSE;
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
    
    -- Extrair valor do orçamento
    IF NEW.fields ? 'orcamento' AND NEW.fields->>'orcamento' != '' THEN
      lead_value := (NEW.fields->>'orcamento')::DECIMAL;
    ELSIF NEW.fields ? 'budget' AND NEW.fields->>'budget' != '' THEN
      lead_value := (NEW.fields->>'budget')::DECIMAL;
    ELSIF NEW.fields ? 'valor' AND NEW.fields->>'valor' != '' THEN
      lead_value := (NEW.fields->>'valor')::DECIMAL;
    ELSIF NEW.fields ? 'price' AND NEW.fields->>'price' != '' THEN
      lead_value := (NEW.fields->>'price')::DECIMAL;
    END IF;
    
    -- Verificar se é venda
    is_sold := (
      NEW.status = 'closed' OR 
      (NEW.fields ? 'sold' AND NEW.fields->>'sold' = 'true')
    );
    
    lead_data := jsonb_build_object(
      'id', NEW.id,
      'name', NEW.fields->>'name',
      'email', NEW.fields->>'email',
      'phone', NEW.fields->>'phone',
      'orcamento', lead_value,
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
            CASE WHEN OLD.fields ? 'orcamento' THEN (OLD.fields->>'orcamento')::DECIMAL ELSE 0 END +
            CASE WHEN OLD.fields ? 'budget' THEN (OLD.fields->>'budget')::DECIMAL ELSE 0 END +
            CASE WHEN OLD.fields ? 'valor' THEN (OLD.fields->>'valor')::DECIMAL ELSE 0 END +
            CASE WHEN OLD.fields ? 'price' THEN (OLD.fields->>'price')::DECIMAL ELSE 0 END,
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

-- 4. Criar triggers para automatizar a atualização
DROP TRIGGER IF EXISTS trigger_update_daily_leads_summary ON leads;

CREATE TRIGGER trigger_update_daily_leads_summary
  AFTER INSERT OR UPDATE OR DELETE ON leads
  FOR EACH ROW
  EXECUTE FUNCTION update_daily_leads_summary();

-- 5. Função para reprocessar todos os leads existentes
CREATE OR REPLACE FUNCTION reprocess_all_daily_leads()
RETURNS void AS $$
BEGIN
  -- Limpar dados existentes
  DELETE FROM leads_daily_summary WHERE tenant_id = '8bd69047-7533-42f3-a2f7-e3a60477f68c';
  
  -- Reprocessar todos os leads
  INSERT INTO leads_daily_summary (tenant_id, data, total_leads, leads_vendidos, valor_total_vendido, leads_data)
  SELECT 
    tenant_id,
    DATE(created_at) as data,
    COUNT(*) as total_leads,
    COUNT(CASE WHEN status = 'closed' OR (fields ? 'sold' AND fields->>'sold' = 'true') THEN 1 END) as leads_vendidos,
    SUM(CASE WHEN status = 'closed' OR (fields ? 'sold' AND fields->>'sold' = 'true') THEN 
      COALESCE(
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
        'orcamento', CASE WHEN fields ? 'orcamento' THEN (fields->>'orcamento')::DECIMAL ELSE 0 END,
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

-- 6. Executar reprocessamento inicial
SELECT reprocess_all_daily_leads();

-- 7. Verificar dados criados
SELECT 
  data,
  total_leads,
  leads_vendidos,
  valor_total_vendido,
  jsonb_array_length(leads_data) as leads_count,
  leads_data
FROM leads_daily_summary 
WHERE tenant_id = '8bd69047-7533-42f3-a2f7-e3a60477f68c'
ORDER BY data DESC;
