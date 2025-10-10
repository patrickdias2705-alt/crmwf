-- =====================================================
-- BACKUP COMPLETO DOS DADOS ATUAIS
-- =====================================================

-- EXPORTAR TODOS OS DADOS IMPORTANTES
-- Execute estes SELECTs para fazer backup:

-- 1. BACKUP DE TENANTS
SELECT * FROM public.tenants;

-- 2. BACKUP DE USUÁRIOS  
SELECT * FROM public.users;

-- 3. BACKUP DE PIPELINES
SELECT * FROM public.pipelines;

-- 4. BACKUP DE STAGES
SELECT * FROM public.stages;

-- 5. BACKUP DE LEADS (DADOS MAIS IMPORTANTES!)
SELECT * FROM public.leads;

-- 6. BACKUP DE CONVERSAS
SELECT * FROM public.conversations;

-- 7. BACKUP DE MENSAGENS
SELECT * FROM public.messages;

-- 8. BACKUP DE EVENTOS DE LEAD
SELECT * FROM public.lead_events;

-- 9. BACKUP DE MÉTRICAS
SELECT * FROM public.metrics_daily;

-- 10. BACKUP DE CONEXÕES WHATSAPP
SELECT * FROM public.whatsapp_connections;

-- =====================================================
-- INSTRUÇÕES PARA RESTAURAR:
-- =====================================================

-- Para restaurar os dados após limpeza:
-- 1. Execute o script de limpeza
-- 2. Use os dados salvos aqui para recriar os registros
-- 3. Ajuste os IDs se necessário
-- 4. Mantenha a estrutura de tenants e usuários

-- =====================================================
-- DADOS ESPECÍFICOS PARA RESTAURAR:
-- =====================================================

-- Se você quiser restaurar apenas os LEADS importantes:
-- SELECT id, name, phone, email, source, stage_id, assigned_to, 
--        tenant_id, fields, created_at, updated_at, is_public, order_number
-- FROM public.leads 
-- WHERE created_at >= '2024-01-01'; -- Ajuste a data conforme necessário

-- Para restaurar leads de um usuário específico:
-- SELECT * FROM public.leads WHERE assigned_to = 'ID_DO_USUARIO';

-- Para restaurar leads de um tenant específico:
-- SELECT * FROM public.leads WHERE tenant_id = 'ID_DO_TENANT';




