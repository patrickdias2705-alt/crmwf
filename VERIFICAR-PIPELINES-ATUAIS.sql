-- Verificar pipelines atuais no banco
SELECT 
    id,
    name,
    description,
    tenant_id,
    created_at
FROM stages 
WHERE tenant_id = '8bd69047-7533-42f3-a2f7-e3a60477f68c'
ORDER BY created_at;

-- Verificar leads com stage_id atual
SELECT 
    l.id,
    l.name,
    l.stage_id,
    s.name as stage_name,
    l.created_at
FROM leads l
LEFT JOIN stages s ON l.stage_id = s.id
WHERE l.tenant_id = '8bd69047-7533-42f3-a2f7-e3a60477f68c'
ORDER BY l.created_at DESC
LIMIT 10;
