-- ========================================
-- REMOVER CONSTRAINT UNIQUE DE lead_id NA TABELA sales
-- ========================================
-- Permite múltiplas vendas do mesmo lead (recompra)

-- 1. VERIFICAR SE A CONSTRAINT EXISTE
SELECT 
  conname as constraint_name,
  contype as constraint_type
FROM pg_constraint
WHERE conrelid = 'public.sales'::regclass
  AND conname LIKE '%lead_id%';

-- 2. REMOVER CONSTRAINT UNIQUE SE EXISTIR
DO $$
BEGIN
  -- Tentar remover a constraint se existir
  IF EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conrelid = 'public.sales'::regclass 
    AND conname = 'sales_lead_id_key'
  ) THEN
    ALTER TABLE public.sales DROP CONSTRAINT sales_lead_id_key;
    RAISE NOTICE '✅ Constraint UNIQUE removida de lead_id';
  ELSIF EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conrelid = 'public.sales'::regclass 
    AND conname LIKE '%lead_id%unique%'
  ) THEN
    -- Tentar encontrar e remover qualquer constraint unique em lead_id
    EXECUTE (
      SELECT 'ALTER TABLE public.sales DROP CONSTRAINT ' || conname
      FROM pg_constraint
      WHERE conrelid = 'public.sales'::regclass
        AND contype = 'u'
        AND conname LIKE '%lead_id%'
      LIMIT 1
    );
    RAISE NOTICE '✅ Constraint UNIQUE removida de lead_id (nome alternativo)';
  ELSE
    RAISE NOTICE 'ℹ️ Nenhuma constraint UNIQUE encontrada em lead_id';
  END IF;
END $$;

-- 3. VERIFICAR SE FOI REMOVIDA
SELECT 
  conname as constraint_name,
  contype as constraint_type
FROM pg_constraint
WHERE conrelid = 'public.sales'::regclass
  AND conname LIKE '%lead_id%';

-- ✅ Agora é possível ter múltiplas vendas do mesmo lead (recompra)!

