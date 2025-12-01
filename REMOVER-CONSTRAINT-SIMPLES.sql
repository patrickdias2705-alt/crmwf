-- ========================================
-- REMOVER CONSTRAINT UNIQUE - VERSÃO SIMPLES
-- ========================================
-- Execute no SQL Editor do Supabase
-- Remove diretamente pelo nome do erro

-- REMOVER A CONSTRAINT PELO NOME EXATO DO ERRO
DO $$
BEGIN
  ALTER TABLE public.sales DROP CONSTRAINT sales_lead_id_key;
  RAISE NOTICE '✅ Constraint sales_lead_id_key removida com sucesso!';
EXCEPTION 
  WHEN undefined_object THEN
    RAISE NOTICE 'ℹ️ Constraint sales_lead_id_key não existe (pode já ter sido removida)';
  WHEN OTHERS THEN
    RAISE NOTICE '⚠️ Erro: %', SQLERRM;
END $$;

-- VERIFICAR SE FOI REMOVIDA
SELECT 
  conname as constraint_name,
  contype as constraint_type
FROM pg_constraint
WHERE conrelid = 'public.sales'::regclass
  AND conname = 'sales_lead_id_key';

-- Se retornar 0 linhas, a constraint foi removida com sucesso!
-- ✅ Agora você pode ter múltiplas vendas do mesmo lead (recompra)

