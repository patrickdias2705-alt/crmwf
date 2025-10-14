-- =====================================================
-- RESTAURAR DADOS APÓS LIMPEZA
-- =====================================================

-- Execute este script DEPOIS de fazer a limpeza
-- Cole aqui os dados que você salvou do backup

-- EXEMPLO DE COMO RESTAURAR:

-- 1. RESTAURAR LEADS (cole os dados do backup aqui):
-- INSERT INTO public.leads (id, name, phone, email, source, stage_id, assigned_to, tenant_id, fields, created_at, updated_at, is_public, order_number)
-- VALUES 
--   ('id-do-lead-1', 'Nome do Lead', 'telefone', 'email@exemplo.com', 'whatsapp', 'stage-id', 'user-id', 'tenant-id', '{}', NOW(), NOW(), false, 'PED-001'),
--   ('id-do-lead-2', 'Outro Lead', 'telefone2', 'email2@exemplo.com', 'manual', 'stage-id', 'user-id', 'tenant-id', '{}', NOW(), NOW(), true, 'PED-002');

-- 2. RESTAURAR CONVERSAS (se houver):
-- INSERT INTO public.conversations (id, tenant_id, lead_id, phone, status, created_at, updated_at)
-- VALUES 
--   ('conv-id-1', 'tenant-id', 'lead-id', 'telefone', 'active', NOW(), NOW());

-- 3. RESTAURAR MENSAGENS (se houver):
-- INSERT INTO public.messages (id, conversation_id, tenant_id, content, direction, created_at)
-- VALUES 
--   ('msg-id-1', 'conv-id-1', 'tenant-id', 'Mensagem importante', 'inbound', NOW());

-- 4. RESTAURAR EVENTOS DE LEAD (se houver):
-- INSERT INTO public.lead_events (id, tenant_id, lead_id, type, actor, data, created_at)
-- VALUES 
--   ('event-id-1', 'tenant-id', 'lead-id', 'lead.created', 'sistema', '{}', NOW());

-- =====================================================
-- INSTRUÇÕES:
-- =====================================================

-- 1. Execute primeiro o script de limpeza
-- 2. Copie os dados importantes do backup
-- 3. Cole aqui substituindo os exemplos
-- 4. Execute este script para restaurar
-- 5. Verifique se os dados foram restaurados corretamente

-- =====================================================
-- VERIFICAÇÃO:
-- =====================================================

-- Execute para verificar se os dados foram restaurados:
-- SELECT COUNT(*) as total_leads FROM public.leads;
-- SELECT COUNT(*) as total_conversations FROM public.conversations;
-- SELECT COUNT(*) as total_messages FROM public.messages;




