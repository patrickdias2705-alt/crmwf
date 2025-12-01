-- ========================================
-- LIMPAR ORÇAMENTOS ANTIGOS E INCORRETOS
-- ========================================
-- ⚠️ IMPORTANTE: Execute APLICAR-MIGRATION-STATUS.sql ANTES deste script!
-- Execute no SQL Editor do Supabase

-- 1. VERIFICAR SE A COLUNA status EXISTE (se não existir, execute APLICAR-MIGRATION-STATUS.sql primeiro)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'budget_documents'
      AND column_name = 'status'
  ) THEN
    RAISE EXCEPTION '❌ ERRO: A coluna status não existe! Execute APLICAR-MIGRATION-STATUS.sql primeiro.';
  END IF;
END $$;

-- 2. VER QUANTOS ORÇAMENTOS ESTÃO SEM STATUS OU COM STATUS INCORRETO
SELECT 
  COUNT(*) as total_orcamentos,
  COUNT(CASE WHEN status IS NULL THEN 1 END) as sem_status,
  COUNT(CASE WHEN status NOT IN ('aberto', 'vendido', 'cancelado', 'expirado') THEN 1 END) as status_invalido
FROM budget_documents;

-- 2. VER TODOS OS ORÇAMENTOS EM ABERTO (para verificar os 11 que estão aparecendo)
SELECT 
  id,
  lead_id,
  file_name,
  amount,
  status,
  created_at,
  tenant_id
FROM budget_documents
WHERE status = 'aberto' OR status IS NULL
ORDER BY created_at DESC;

-- 3. ATUALIZAR ORÇAMENTOS SEM STATUS PARA 'vendido' (se já foram vendidos)
-- Primeiro, verificar quais têm sale_id (já foram vendidos)
UPDATE budget_documents
SET status = 'vendido'
WHERE status IS NULL 
  AND sale_id IS NOT NULL;

-- 4. ATUALIZAR ORÇAMENTOS SEM STATUS E SEM sale_id PARA 'vendido' (se o lead já foi vendido)
UPDATE budget_documents
SET status = 'vendido'
WHERE status IS NULL 
  AND sale_id IS NULL
  AND lead_id IN (
    SELECT DISTINCT lead_id 
    FROM sales
  );

-- 5. ATUALIZAR ORÇAMENTOS SEM STATUS E SEM VENDA PARA 'cancelado' (se foram criados há mais de 30 dias)
UPDATE budget_documents
SET status = 'cancelado'
WHERE status IS NULL 
  AND sale_id IS NULL
  AND lead_id NOT IN (SELECT DISTINCT lead_id FROM sales)
  AND created_at < NOW() - INTERVAL '30 days';

-- 6. ATUALIZAR ORÇAMENTOS SEM STATUS RECENTES PARA 'aberto' (se foram criados há menos de 30 dias e não foram vendidos)
UPDATE budget_documents
SET status = 'aberto'
WHERE status IS NULL 
  AND sale_id IS NULL
  AND lead_id NOT IN (SELECT DISTINCT lead_id FROM sales)
  AND created_at >= NOW() - INTERVAL '30 days';

-- 7. VERIFICAR RESULTADO FINAL
SELECT 
  status,
  COUNT(*) as quantidade
FROM budget_documents
GROUP BY status
ORDER BY status;

-- 8. VER ORÇAMENTOS EM ABERTO APÓS LIMPEZA
SELECT 
  id,
  lead_id,
  file_name,
  amount,
  status,
  created_at
FROM budget_documents
WHERE status = 'aberto'
ORDER BY created_at DESC;

