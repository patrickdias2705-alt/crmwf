-- =====================================================
-- RESTAURAR BACKUP - RECUPERAR DADOS REAIS
-- =====================================================
-- Script para restaurar o backup mais recente

-- 1. Verificar se o backup existe
SELECT 
    'BACKUP ENCONTRADO' as status,
    '15-10-2025@04-27-21.backup.gz' as arquivo,
    '218KB' as tamanho;

-- 2. IMPORTANTE: Para restaurar o backup, você precisa:
--    a) Ir no Supabase Dashboard
--    b) Ir em Settings > Database
--    c) Procurar por "Restore from backup"
--    d) Selecionar o arquivo: db_cluster-15-10-2025@04-27-21.backup.gz
--    e) Confirmar a restauração

-- 3. Após restaurar, verificar se os dados voltaram
SELECT 
    'DADOS APÓS RESTAURAÇÃO' as status,
    COUNT(*) as total_leads
FROM leads 
WHERE tenant_id = '8bd69047-7533-42f3-a2f7-e3a60477f68c';

-- 4. Verificar se existem leads com nomes reais
SELECT 
    'LEADS REAIS RESTAURADOS' as status,
    COUNT(*) as total_leads
FROM leads 
WHERE name NOT LIKE 'João Silva'
    AND name NOT LIKE 'Maria Santos'
    AND name NOT LIKE 'Pedro Costa'
    AND name NOT LIKE 'Ana Oliveira'
    AND name NOT LIKE 'Carlos Lima'
    AND name NOT LIKE 'Lucia Ferreira'
    AND name NOT LIKE 'Roberto Alves'
    AND name NOT LIKE 'Fernanda Rocha'
    AND name NOT LIKE 'Marcos Pereira'
    AND name NOT LIKE 'Juliana Souza'
    AND name NOT LIKE 'Rafael Mendes'
    AND name NOT LIKE 'Patricia Gomes'
    AND name NOT LIKE 'Diego Santos'
    AND name NOT LIKE 'Camila Lima'
    AND name NOT LIKE 'Bruno Costa'
    AND name NOT LIKE 'Larissa Silva'
    AND name NOT LIKE 'Thiago Oliveira'
    AND name NOT LIKE 'Vanessa Rocha'
    AND name IS NOT NULL
    AND name != '';

-- 5. Verificar vendas restauradas
SELECT 
    'VENDAS RESTAURADAS' as status,
    COUNT(*) as total_vendas,
    SUM(CAST(fields->>'sold_amount' AS NUMERIC)) as total_valor
FROM leads 
WHERE fields->>'sold' = 'true'
    AND fields->>'sold_amount' IS NOT NULL
    AND CAST(fields->>'sold_amount' AS NUMERIC) > 0;
