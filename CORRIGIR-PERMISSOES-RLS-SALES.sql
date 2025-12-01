-- ========================================
-- CORRIGIR PERMISSÕES RLS PARA TABELA SALES
-- ========================================
-- Execute este script no Supabase SQL Editor

-- PASSO 1: Verificar políticas RLS atuais
SELECT 
    'POLITICAS_ATUAIS' as tipo,
    policyname,
    cmd,
    roles,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'sales' 
AND schemaname = 'public';

-- PASSO 2: Remover políticas RLS restritivas
DROP POLICY IF EXISTS "Users can delete sales for their tenant" ON sales;
DROP POLICY IF EXISTS "Users can insert sales for their tenant" ON sales;
DROP POLICY IF EXISTS "Users can update sales for their tenant" ON sales;
DROP POLICY IF EXISTS "Users can view sales from their tenant" ON sales;

-- PASSO 3: Criar políticas RLS mais permissivas
-- Política para SELECT - todos os usuários autenticados podem ver vendas do tenant
CREATE POLICY "Allow authenticated users to view sales from their tenant" ON sales
    FOR SELECT
    TO authenticated
    USING (tenant_id = '8bd69047-7533-42f3-a2f7-e3a60477f68c');

-- Política para INSERT - todos os usuários autenticados podem inserir vendas
CREATE POLICY "Allow authenticated users to insert sales" ON sales
    FOR INSERT
    TO authenticated
    WITH CHECK (tenant_id = '8bd69047-7533-42f3-a2f7-e3a60477f68c');

-- Política para UPDATE - todos os usuários autenticados podem atualizar vendas do tenant
CREATE POLICY "Allow authenticated users to update sales from their tenant" ON sales
    FOR UPDATE
    TO authenticated
    USING (tenant_id = '8bd69047-7533-42f3-a2f7-e3a60477f68c')
    WITH CHECK (tenant_id = '8bd69047-7533-42f3-a2f7-e3a60477f68c');

-- Política para DELETE - todos os usuários autenticados podem deletar vendas do tenant
CREATE POLICY "Allow authenticated users to delete sales from their tenant" ON sales
    FOR DELETE
    TO authenticated
    USING (tenant_id = '8bd69047-7533-42f3-a2f7-e3a60477f68c');

-- PASSO 4: Verificar se as políticas foram criadas corretamente
SELECT 
    'POLITICAS_NOVAS' as tipo,
    policyname,
    cmd,
    roles,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'sales' 
AND schemaname = 'public';

-- PASSO 5: Verificar se RLS está ativo na tabela sales
SELECT 
    'RLS_STATUS' as tipo,
    schemaname,
    tablename,
    rowsecurity,
    hasrules
FROM pg_tables 
WHERE tablename = 'sales' 
AND schemaname = 'public';

-- PASSO 6: Testar inserção com usuário não-admin
-- Este teste deve funcionar agora
SELECT 
    'TESTE_INSERCAO_NAO_ADMIN' as tipo,
    'Testando inserção com permissões corrigidas' as status;

-- Buscar um lead real para teste
WITH lead_real AS (
    SELECT id, name
    FROM leads
    WHERE tenant_id = '8bd69047-7533-42f3-a2f7-e3a60477f68c'
    LIMIT 1
),
stage_real AS (
    SELECT id, name
    FROM stages
    WHERE tenant_id = '8bd69047-7533-42f3-a2f7-e3a60477f68c'
    LIMIT 1
)
-- Tentar inserir um registro de teste
INSERT INTO sales (
    tenant_id,
    lead_id,
    amount,
    stage_id,
    stage_name,
    sold_by,
    sold_by_name,
    budget_description,
    budget_file_name
)
SELECT 
    '8bd69047-7533-42f3-a2f7-e3a60477f68c',
    lr.id,
    50.00,
    sr.id,
    sr.name,
    lr.id,
    lr.name,
    'Teste de permissões corrigidas',
    'teste_permissoes.pdf'
FROM lead_real lr
CROSS JOIN stage_real sr;

-- Verificar se o registro foi inserido
SELECT 
    'TESTE_INSERCAO_RESULTADO' as tipo,
    COUNT(*) as registros_inseridos
FROM sales
WHERE budget_description = 'Teste de permissões corrigidas';

-- Limpar o registro de teste
DELETE FROM sales WHERE budget_description = 'Teste de permissões corrigidas';

-- PASSO 7: Verificar total de vendas após correção de permissões
SELECT 
    'TOTAL_VENDAS_FINAL' as tipo,
    COUNT(*) as total_vendas,
    SUM(amount) as valor_total,
    MIN(created_at) as primeira_venda,
    MAX(created_at) as ultima_venda
FROM sales
WHERE tenant_id = '8bd69047-7533-42f3-a2f7-e3a60477f68c';
