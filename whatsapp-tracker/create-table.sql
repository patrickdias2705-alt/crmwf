-- ==========================================
-- Tabela para rastreamento de leads do WhatsApp
-- ==========================================

CREATE TABLE IF NOT EXISTS leads_whatsapp (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Dados do lead
  nome text,
  telefone text NOT NULL,
  mensagem text NOT NULL,
  
  -- Tracking
  codigo text,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  utm_term text,
  utm_content text,
  
  -- Análise IA
  resposta_ia text,
  produto_interesse text,
  grau_interesse text CHECK (grau_interesse IN ('alto', 'médio', 'baixo')),
  intencao text CHECK (intencao IN ('compra', 'dúvida', 'reclamação', 'outro')),
  
  -- Dados extras
  dados_origem jsonb,
  tenant_id uuid REFERENCES tenants(id) ON DELETE CASCADE,
  
  -- Timestamps
  criado_em timestamptz DEFAULT NOW(),
  atualizado_em timestamptz DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_leads_whatsapp_telefone ON leads_whatsapp(telefone);
CREATE INDEX IF NOT EXISTS idx_leads_whatsapp_codigo ON leads_whatsapp(codigo);
CREATE INDEX IF NOT EXISTS idx_leads_whatsapp_utm_source ON leads_whatsapp(utm_source);
CREATE INDEX IF NOT EXISTS idx_leads_whatsapp_utm_campaign ON leads_whatsapp(utm_campaign);
CREATE INDEX IF NOT EXISTS idx_leads_whatsapp_grau_interesse ON leads_whatsapp(grau_interesse);
CREATE INDEX IF NOT EXISTS idx_leads_whatsapp_criado_em ON leads_whatsapp(criado_em DESC);
CREATE INDEX IF NOT EXISTS idx_leads_whatsapp_tenant_id ON leads_whatsapp(tenant_id);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_leads_whatsapp_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.atualizado_em = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_leads_whatsapp_timestamp
  BEFORE UPDATE ON leads_whatsapp
  FOR EACH ROW
  EXECUTE FUNCTION update_leads_whatsapp_updated_at();

-- View para análises rápidas
CREATE OR REPLACE VIEW leads_whatsapp_stats AS
SELECT 
  utm_source,
  utm_campaign,
  grau_interesse,
  COUNT(*) as total_leads,
  COUNT(CASE WHEN criado_em >= NOW() - INTERVAL '7 days' THEN 1 END) as ultimos_7_dias,
  COUNT(CASE WHEN criado_em >= NOW() - INTERVAL '30 days' THEN 1 END) as ultimos_30_dias,
  COUNT(CASE WHEN grau_interesse = 'alto' THEN 1 END) as interesse_alto,
  COUNT(CASE WHEN grau_interesse = 'médio' THEN 1 END) as interesse_medio,
  COUNT(CASE WHEN grau_interesse = 'baixo' THEN 1 END) as interesse_baixo
FROM leads_whatsapp
GROUP BY utm_source, utm_campaign, grau_interesse;

-- Comentários
COMMENT ON TABLE leads_whatsapp IS 'Leads capturados do WhatsApp com tracking UTM e análise de IA';
COMMENT ON COLUMN leads_whatsapp.codigo IS 'Código único de rastreamento gerado no link';
COMMENT ON COLUMN leads_whatsapp.utm_source IS 'Origem do tráfego (instagram, facebook, google, etc)';
COMMENT ON COLUMN leads_whatsapp.utm_campaign IS 'Nome da campanha de marketing';
COMMENT ON COLUMN leads_whatsapp.resposta_ia IS 'Análise completa gerada pela IA (JSON)';
COMMENT ON COLUMN leads_whatsapp.grau_interesse IS 'Nível de interesse detectado pela IA';
COMMENT ON COLUMN leads_whatsapp.intencao IS 'Intenção do lead detectada pela IA';
COMMENT ON COLUMN leads_whatsapp.dados_origem IS 'Dados extras da origem (IP, user agent, etc)';

-- RLS (Row Level Security) - Opcional, se usar multi-tenant
ALTER TABLE leads_whatsapp ENABLE ROW LEVEL SECURITY;

-- Política para acesso por tenant
CREATE POLICY "Usuarios podem ver leads do seu tenant"
  ON leads_whatsapp
  FOR SELECT
  USING (
    tenant_id IS NULL OR 
    tenant_id = (SELECT tenant_id FROM users WHERE id = auth.uid())
  );

CREATE POLICY "Usuarios podem inserir leads"
  ON leads_whatsapp
  FOR INSERT
  WITH CHECK (true);

-- Grants
GRANT SELECT, INSERT, UPDATE ON leads_whatsapp TO authenticated;
GRANT SELECT ON leads_whatsapp_stats TO authenticated;



