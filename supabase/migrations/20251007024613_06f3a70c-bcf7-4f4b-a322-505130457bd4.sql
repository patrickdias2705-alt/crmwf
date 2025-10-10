-- Remover a view anterior e recriar sem security definer
DROP VIEW IF EXISTS whatsapp_connections_with_users;

-- Criar view simples para supervisores (RLS será aplicado na tabela base)
CREATE OR REPLACE VIEW whatsapp_connections_with_users AS
SELECT 
  wc.id,
  wc.tenant_id,
  wc.user_id,
  wc.instance_name,
  wc.api_url,
  wc.status,
  wc.phone,
  wc.qr_code_url,
  wc.is_active,
  wc.last_sync_at,
  wc.created_at,
  wc.updated_at,
  u.name as user_name,
  u.email as user_email
FROM whatsapp_connections wc
LEFT JOIN users u ON u.id = wc.user_id;

-- Grant access
GRANT SELECT ON whatsapp_connections_with_users TO authenticated;