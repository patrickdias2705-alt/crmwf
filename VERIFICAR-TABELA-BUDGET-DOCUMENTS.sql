-- ========================================
-- VERIFICAR SE A TABELA budget_documents ESTÁ CORRETA
-- ========================================
-- Execute no SQL Editor do Supabase

-- 1. VERIFICAR SE A TABELA EXISTE
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'budget_documents'
) as tabela_existe;

-- 2. VERIFICAR TODAS AS COLUNAS DA TABELA
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'budget_documents'
ORDER BY ordinal_position;

-- 3. VERIFICAR SE A COLUNA status EXISTE
SELECT EXISTS (
  SELECT FROM information_schema.columns
  WHERE table_schema = 'public'
    AND table_name = 'budget_documents'
    AND column_name = 'status'
) as coluna_status_existe;

-- 4. VERIFICAR SE A COLUNA file_base64 EXISTE
SELECT EXISTS (
  SELECT FROM information_schema.columns
  WHERE table_schema = 'public'
    AND table_name = 'budget_documents'
    AND column_name = 'file_base64'
) as coluna_file_base64_existe;

-- 5. VERIFICAR SE A COLUNA sale_id EXISTE
SELECT EXISTS (
  SELECT FROM information_schema.columns
  WHERE table_schema = 'public'
    AND table_name = 'budget_documents'
    AND column_name = 'sale_id'
) as coluna_sale_id_existe;

-- 6. VERIFICAR POLÍTICAS RLS
SELECT 
  policyname,
  cmd as operacao,
  roles
FROM pg_policies
WHERE tablename = 'budget_documents';

-- 7. TESTAR INSERÇÃO (substitua os valores pelos seus)
-- DESCOMENTE E EXECUTE APENAS PARA TESTAR
/*
INSERT INTO budget_documents (
  lead_id,
  tenant_id,
  file_name,
  file_url,
  file_path,
  file_size,
  description,
  amount,
  uploaded_by,
  status
) VALUES (
  'SUBSTITUA_PELO_ID_DO_LEAD',
  'SUBSTITUA_PELO_TENANT_ID',
  'teste.pdf',
  'data:application/pdf;base64,teste',
  'budgets/teste/teste.pdf',
  1000,
  'Teste',
  100.00,
  'SUBSTITUA_PELO_USER_ID',
  'aberto'
);
*/

