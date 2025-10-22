-- VERIFICAR LEADS REAIS DA MARIA COM DATAS CORRETAS
SELECT 
    'LEADS_REAIS_MARIA' as status,
    DATE(created_at) as data_cadastro,
    COUNT(*) as total_leads,
    COUNT(CASE WHEN fields->>'sold' = 'true' THEN 1 END) as vendidos,
    COUNT(CASE WHEN status = 'closed' THEN 1 END) as fechados,
    COUNT(CASE WHEN status = 'qualified' THEN 1 END) as qualificados
FROM leads 
WHERE tenant_id = '8bd69047-7533-42f3-a2f7-e3a60477f68c'
GROUP BY DATE(created_at)
ORDER BY data_cadastro ASC;
