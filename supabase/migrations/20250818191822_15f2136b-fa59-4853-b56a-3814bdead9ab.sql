-- Seed data for Zaptro demo tenant
-- Insert demo tenant "Zaptro" with static ID
INSERT INTO public.tenants (id, name, plan, created_at, updated_at) VALUES 
('550e8400-e29b-41d4-a716-446655440000', 'Zaptro', 'premium', NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET 
  name = EXCLUDED.name,
  plan = EXCLUDED.plan,
  updated_at = NOW();

-- Insert demo users
INSERT INTO public.users (id, tenant_id, name, email, role, password_hash, active, created_at, updated_at) VALUES 
-- Admin user
('550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440000', 'Admin Demo', 'admin@demo.com', 'admin', '$2b$10$K8kVL8Y.O0vHFmcqHF2eO.bqY6O6ZCY8TLU4g1QHFLWG7vQ.VcfXS', true, NOW(), NOW()),
-- Client owner user
('550e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440000', 'Owner Demo', 'owner@demo.com', 'client_owner', '$2b$10$K8kVL8Y.O0vHFmcqHF2eO.bqY6O6ZCY8TLU4g1QHFLWG7vQ.VcfXS', true, NOW(), NOW())
ON CONFLICT (tenant_id, email) DO UPDATE SET 
  name = EXCLUDED.name,
  role = EXCLUDED.role,
  active = EXCLUDED.active,
  updated_at = NOW();

-- Insert default pipeline
INSERT INTO public.pipelines (id, tenant_id, name, is_default, created_at, updated_at) VALUES 
('550e8400-e29b-41d4-a716-446655440010', '550e8400-e29b-41d4-a716-446655440000', 'Pipeline Padrão', true, NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET 
  name = EXCLUDED.name,
  is_default = EXCLUDED.is_default,
  updated_at = NOW();

-- Insert default stages
INSERT INTO public.stages (id, tenant_id, pipeline_id, name, "order", created_at, updated_at) VALUES 
('550e8400-e29b-41d4-a716-446655440020', '550e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440010', 'Lead novo', 1, NOW(), NOW()),
('550e8400-e29b-41d4-a716-446655440021', '550e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440010', 'Sendo tratado', 2, NOW(), NOW()),
('550e8400-e29b-41d4-a716-446655440022', '550e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440010', 'Agendado', 3, NOW(), NOW()),
('550e8400-e29b-41d4-a716-446655440023', '550e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440010', 'Fechado', 4, NOW(), NOW()),
('550e8400-e29b-41d4-a716-446655440024', '550e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440010', 'Recusado', 5, NOW(), NOW()),
('550e8400-e29b-41d4-a716-446655440025', '550e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440010', 'Perdido', 6, NOW(), NOW())
ON CONFLICT (tenant_id, pipeline_id, "order") DO UPDATE SET 
  name = EXCLUDED.name,
  updated_at = NOW();

-- Insert sample WhatsApp connection
INSERT INTO public.whatsapp_connections (id, tenant_id, provider, status, phone, created_at, updated_at) VALUES 
('550e8400-e29b-41d4-a716-446655440030', '550e8400-e29b-41d4-a716-446655440000', 'evolution', 'disconnected', NULL, NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET 
  status = EXCLUDED.status,
  updated_at = NOW();

-- Insert sample leads
INSERT INTO public.leads (id, tenant_id, external_id, name, phone, email, source, owner_user_id, pipeline_id, stage_id, tags, fields, created_at, updated_at) VALUES 
('550e8400-e29b-41d4-a716-446655440040', '550e8400-e29b-41d4-a716-446655440000', 'lead001', 'João Silva', '+5511999999999', 'joao@exemplo.com', 'whatsapp', '550e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440010', '550e8400-e29b-41d4-a716-446655440020', '["prospect", "vip"]', '{"interesse": "produto_premium", "orcamento": 5000}', NOW() - INTERVAL '2 days', NOW()),
('550e8400-e29b-41d4-a716-446655440041', '550e8400-e29b-41d4-a716-446655440000', 'lead002', 'Maria Santos', '+5511888888888', 'maria@exemplo.com', 'manual', '550e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440010', '550e8400-e29b-41d4-a716-446655440021', '["quente"]', '{"origem": "indicacao", "produto": "basico"}', NOW() - INTERVAL '1 day', NOW()),
('550e8400-e29b-41d4-a716-446655440042', '550e8400-e29b-41d4-a716-446655440000', 'lead003', 'Pedro Costa', '+5511777777777', 'pedro@exemplo.com', 'n8n', '550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440010', '550e8400-e29b-41d4-a716-446655440022', '["agendado"]', '{"reuniao": "2024-01-20 10:00", "interesse": "consultoria"}', NOW() - INTERVAL '3 hours', NOW())
ON CONFLICT (id) DO UPDATE SET 
  name = EXCLUDED.name,
  phone = EXCLUDED.phone,
  email = EXCLUDED.email,
  source = EXCLUDED.source,
  owner_user_id = EXCLUDED.owner_user_id,
  stage_id = EXCLUDED.stage_id,
  tags = EXCLUDED.tags,
  fields = EXCLUDED.fields,
  updated_at = NOW();

-- Insert sample conversations
INSERT INTO public.conversations (id, tenant_id, lead_id, channel, last_message_at, status, created_at, updated_at) VALUES 
('550e8400-e29b-41d4-a716-446655440050', '550e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440040', 'whatsapp', NOW() - INTERVAL '1 hour', 'open', NOW() - INTERVAL '2 days', NOW()),
('550e8400-e29b-41d4-a716-446655440051', '550e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440041', 'whatsapp', NOW() - INTERVAL '6 hours', 'open', NOW() - INTERVAL '1 day', NOW()),
('550e8400-e29b-41d4-a716-446655440052', '550e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440042', 'whatsapp', NOW() - INTERVAL '3 hours', 'paused', NOW() - INTERVAL '3 hours', NOW())
ON CONFLICT (id) DO UPDATE SET 
  last_message_at = EXCLUDED.last_message_at,
  status = EXCLUDED.status,
  updated_at = NOW();

-- Insert sample messages
INSERT INTO public.messages (id, tenant_id, conversation_id, direction, text, wa_message_id, created_at) VALUES 
('550e8400-e29b-41d4-a716-446655440060', '550e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440050', 'inbound', 'Olá, tenho interesse em seus produtos', 'wa_msg_001', NOW() - INTERVAL '2 days'),
('550e8400-e29b-41d4-a716-446655440061', '550e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440050', 'outbound', 'Olá João! Que bom ter você aqui. Qual produto te interessa mais?', 'wa_msg_002', NOW() - INTERVAL '2 days' + INTERVAL '10 minutes'),
('550e8400-e29b-41d4-a716-446655440062', '550e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440050', 'inbound', 'Estou procurando algo para automatizar meu negócio', 'wa_msg_003', NOW() - INTERVAL '1 hour'),
('550e8400-e29b-41d4-a716-446655440063', '550e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440051', 'inbound', 'Oi, vi vocês no Instagram e queria saber mais', 'wa_msg_004', NOW() - INTERVAL '1 day'),
('550e8400-e29b-41d4-a716-446655440064', '550e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440051', 'outbound', 'Oi Maria! Obrigado pelo interesse. Posso te ajudar com algo específico?', 'wa_msg_005', NOW() - INTERVAL '6 hours')
ON CONFLICT (id) DO UPDATE SET 
  text = EXCLUDED.text,
  wa_message_id = EXCLUDED.wa_message_id;

-- Insert sample lead events
INSERT INTO public.lead_events (id, tenant_id, lead_id, type, data, actor, created_at) VALUES 
('550e8400-e29b-41d4-a716-446655440070', '550e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440040', 'created', '{"source": "whatsapp", "phone": "+5511999999999"}', 'system', NOW() - INTERVAL '2 days'),
('550e8400-e29b-41d4-a716-446655440071', '550e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440040', 'stage_changed', '{"from": null, "to": "Lead novo"}', 'system', NOW() - INTERVAL '2 days'),
('550e8400-e29b-41d4-a716-446655440072', '550e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440041', 'created', '{"source": "manual", "created_by": "Owner Demo"}', 'Owner Demo', NOW() - INTERVAL '1 day'),
('550e8400-e29b-41d4-a716-446655440073', '550e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440041', 'stage_changed', '{"from": "Lead novo", "to": "Sendo tratado"}', 'Owner Demo', NOW() - INTERVAL '12 hours'),
('550e8400-e29b-41d4-a716-446655440074', '550e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440042', 'stage_changed', '{"from": "Sendo tratado", "to": "Agendado"}', 'Admin Demo', NOW() - INTERVAL '3 hours')
ON CONFLICT (id) DO UPDATE SET 
  type = EXCLUDED.type,
  data = EXCLUDED.data,
  actor = EXCLUDED.actor;

-- Insert sample metrics
INSERT INTO public.metrics_daily (tenant_id, date, leads_in, leads_attended, booked, closed, refused, lost) VALUES 
('550e8400-e29b-41d4-a716-446655440000', CURRENT_DATE - INTERVAL '7 days', 5, 4, 2, 1, 1, 0),
('550e8400-e29b-41d4-a716-446655440000', CURRENT_DATE - INTERVAL '6 days', 3, 3, 1, 2, 0, 0),
('550e8400-e29b-41d4-a716-446655440000', CURRENT_DATE - INTERVAL '5 days', 8, 6, 3, 1, 1, 1),
('550e8400-e29b-41d4-a716-446655440000', CURRENT_DATE - INTERVAL '4 days', 2, 2, 1, 0, 0, 1),
('550e8400-e29b-41d4-a716-446655440000', CURRENT_DATE - INTERVAL '3 days', 6, 5, 2, 2, 0, 1),
('550e8400-e29b-41d4-a716-446655440000', CURRENT_DATE - INTERVAL '2 days', 4, 4, 1, 1, 1, 1),
('550e8400-e29b-41d4-a716-446655440000', CURRENT_DATE - INTERVAL '1 day', 7, 6, 4, 2, 1, 0)
ON CONFLICT (tenant_id, date) DO UPDATE SET 
  leads_in = EXCLUDED.leads_in,
  leads_attended = EXCLUDED.leads_attended,
  booked = EXCLUDED.booked,
  closed = EXCLUDED.closed,
  refused = EXCLUDED.refused,
  lost = EXCLUDED.lost;