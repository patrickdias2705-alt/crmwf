-- ========================================
-- TESTAR SE A RECOMPRA ESTÁ FUNCIONANDO
-- ========================================
-- Execute no SQL Editor do Supabase

-- 1. VERIFICAR SE A CONSTRAINT FOI REMOVIDA
SELECT 
  CASE 
    WHEN COUNT(*) = 0 THEN '✅ Constraint removida! Pode ter múltiplas vendas do mesmo lead.'
    ELSE '⚠️ Ainda existe constraint UNIQUE em lead_id'
  END as status,
  COUNT(*) as constraints_encontradas
FROM pg_constraint
WHERE conrelid = 'public.sales'::regclass
  AND conname = 'sales_lead_id_key';

-- 2. VERIFICAR VENDAS EXISTENTES (para ver se já tem múltiplas vendas do mesmo lead)
SELECT 
  lead_id,
  COUNT(*) as total_vendas,
  SUM(amount) as valor_total,
  ARRAY_AGG(sold_at ORDER BY sold_at) as datas_vendas
FROM sales
GROUP BY lead_id
HAVING COUNT(*) > 1
ORDER BY total_vendas DESC
LIMIT 10;

-- 3. TESTAR INSERÇÃO DE MÚLTIPLAS VENDAS (substitua os valores)
/*
-- Exemplo: Criar duas vendas do mesmo lead para testar
-- DESCOMENTE E SUBSTITUA OS VALORES:

INSERT INTO sales (
  tenant_id,
  lead_id,
  amount,
  stage_id,
  sold_by,
  sold_by_name,
  budget_description,
  budget_file_name
) VALUES (
  'SEU_TENANT_ID',
  'ID_DO_LEAD_QUE_JA_TEM_VENDA',
  100.00,
  'ID_DO_STAGE',
  'SEU_USER_ID',
  'Seu Nome',
  'Teste de recompra',
  'orcamento-teste.pdf'
);

-- Se inserir sem erro, está funcionando! ✅
*/

-- ✅ Se a query 1 mostrar "Constraint removida", está tudo certo!
-- Agora você pode marcar o mesmo lead como vendido múltiplas vezes

