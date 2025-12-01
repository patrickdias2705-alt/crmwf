-- Adicionar user_id à tabela whatsapp_connections para suportar múltiplas instâncias por tenant
ALTER TABLE whatsapp_connections
ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Criar índice para melhor performance
CREATE INDEX idx_whatsapp_connections_user_id ON whatsapp_connections(user_id);

-- Atualizar constraint único para permitir múltiplas conexões por tenant (uma por usuário)
ALTER TABLE whatsapp_connections
DROP CONSTRAINT IF EXISTS whatsapp_connections_tenant_id_key;

-- Adicionar constraint único por tenant e usuário
ALTER TABLE whatsapp_connections
ADD CONSTRAINT whatsapp_connections_tenant_user_unique UNIQUE (tenant_id, user_id);

-- Atualizar RLS policies para whatsapp_connections
DROP POLICY IF EXISTS "Users can view whatsapp connections" ON whatsapp_connections;
DROP POLICY IF EXISTS "Users can manage whatsapp connections" ON whatsapp_connections;
DROP POLICY IF EXISTS "Admins can manage whatsapp" ON whatsapp_connections;

-- Permitir que usuários vejam sua própria conexão
CREATE POLICY "Users can view own whatsapp connection"
ON whatsapp_connections
FOR SELECT
TO authenticated
USING (
  tenant_id = (SELECT tenant_id FROM users WHERE id = auth.uid())
  AND user_id = auth.uid()
);

-- Supervisores e admins podem ver todas as conexões do tenant
CREATE POLICY "Supervisors can view all whatsapp connections"
ON whatsapp_connections
FOR SELECT
TO authenticated
USING (
  tenant_id = (SELECT tenant_id FROM users WHERE id = auth.uid())
  AND (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'supervisor', 'client_owner')
    )
  )
);

-- Usuários podem inserir/atualizar sua própria conexão
CREATE POLICY "Users can manage own whatsapp connection"
ON whatsapp_connections
FOR ALL
TO authenticated
USING (
  tenant_id = (SELECT tenant_id FROM users WHERE id = auth.uid())
  AND user_id = auth.uid()
)
WITH CHECK (
  tenant_id = (SELECT tenant_id FROM users WHERE id = auth.uid())
  AND user_id = auth.uid()
);

-- Admins podem gerenciar todas as conexões
CREATE POLICY "Admins can manage all whatsapp connections"
ON whatsapp_connections
FOR ALL
TO authenticated
USING (has_role('admin'::app_role))
WITH CHECK (has_role('admin'::app_role));

-- Criar view para supervisores verem todas as conexões com informações dos usuários
CREATE OR REPLACE VIEW whatsapp_connections_with_users AS
SELECT 
  wc.*,
  u.name as user_name,
  u.email as user_email
FROM whatsapp_connections wc
LEFT JOIN users u ON u.id = wc.user_id;

-- Grant access to the view
GRANT SELECT ON whatsapp_connections_with_users TO authenticated;