-- ========================================
-- CORREÇÃO: Verificar e Corrigir Erro nas Métricas
-- ========================================

-- 1. Verificar se as colunas existem
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'metrics_daily' 
  AND table_schema = 'public'
  AND column_name IN ('total_sold', 'avg_ticket');

-- 2. Verificar dados atuais
SELECT 
  tenant_id,
  date,
  leads_in,
  leads_attended,
  qualified,
  closed,
  refused,
  lost,
  total_sold,
  avg_ticket
FROM metrics_daily 
WHERE tenant_id = '8bd69047-7533-42f3-a2f7-e3a60477f68c' 
ORDER BY date DESC 
LIMIT 3;

-- 3. Se as colunas não existirem, adicioná-las
ALTER TABLE public.metrics_daily 
ADD COLUMN IF NOT EXISTS total_sold DECIMAL(15,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS avg_ticket DECIMAL(15,2) DEFAULT 0;

-- 4. Atualizar dados existentes
UPDATE metrics_daily 
SET 
  total_sold = (
    SELECT COALESCE(SUM(amount), 0) 
    FROM sales 
    WHERE tenant_id = metrics_daily.tenant_id
  ),
  avg_ticket = (
    SELECT CASE 
      WHEN COUNT(*) > 0 THEN COALESCE(SUM(amount), 0) / COUNT(*) 
      ELSE 0 
    END
    FROM sales 
    WHERE tenant_id = metrics_daily.tenant_id
  ),
  closed = (
    SELECT COUNT(*) 
    FROM sales 
    WHERE tenant_id = metrics_daily.tenant_id
  )
WHERE tenant_id = '8bd69047-7533-42f3-a2f7-e3a60477f68c';

-- 5. Verificar resultado
SELECT 
  tenant_id,
  date,
  total_sold,
  avg_ticket,
  closed
FROM metrics_daily 
WHERE tenant_id = '8bd69047-7533-42f3-a2f7-e3a60477f68c' 
ORDER BY date DESC LIMIT 1;
