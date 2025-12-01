🔧 CORREÇÃO APLICADA:

✅ O que foi corrigido:
1. Adicionado tratamento robusto de erros
2. Prioriza busca na tabela 'sales' (mais confiável)
3. Fallback para 'metrics_daily' se necessário
4. Valores padrão se ambas falharem

📊 Agora o sistema:
- Busca primeiro na tabela 'sales' (R$ 7.000,00 total)
- Calcula ticket médio automaticamente (R$ 3.500,00)
- Tem fallback robusto para evitar erros
- Logs detalhados para debug

🎯 TESTE AGORA:
1. Vá para http://localhost:8080/metrics
2. Abra o Console do Browser (F12)
3. Recarregue a página (Ctrl+F5)
4. Veja os logs no console
5. Ticket médio deve mostrar R$ 3.500,00

Se ainda der erro, execute no Supabase SQL Editor:
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
