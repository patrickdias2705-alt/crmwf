-- Script para testar as correções de datas no frontend
-- Verifica se os dados estão sendo agrupados corretamente por dia

-- 1. Verificar leads por data exata (comparar com frontend)
select 
  '=== LEADS POR DATA EXATA (FRONTEND) ===' as secao,
  '' as valor
union all
select 
  'Verificação de agrupamento por dia' as descricao,
  '' as valor
union all
select 
  to_char(l.created_at::date, 'DD/MM') || ' (' || to_char(l.created_at::date, 'Day') || ')' as secao,
  count(*)::text || ' leads' as valor
from leads l
where l.tenant_id = '8bd69047-7533-42f3-a2f7-e3a60477f68c'
  and l.created_at >= '2025-10-07T00:00:00.000Z'
  and l.created_at <= '2025-10-17T23:59:59.999Z'
group by l.created_at::date
order by l.created_at::date

union all

-- 2. Verificar especificamente o problema 12/10 vs 13/10
select 
  '=== VERIFICAÇÃO PROBLEMA 12/10 vs 13/10 ===' as secao,
  '' as valor
union all
select 
  'Dia 12/10/2025 (domingo)' as secao,
  count(*)::text || ' leads' as valor
from leads l
where l.tenant_id = '8bd69047-7533-42f3-a2f7-e3a60477f68c'
  and l.created_at::date = '2025-10-12'
union all
select 
  'Dia 13/10/2025 (segunda)' as secao,
  count(*)::text || ' leads' as valor
from leads l
where l.tenant_id = '8bd69047-7533-42f3-a2f7-e3a60477f68c'
  and l.created_at::date = '2025-10-13'

union all

-- 3. Verificar dias de maior performance (top 3)
select 
  '=== TOP 3 DIAS DE MAIOR PERFORMANCE ===' as secao,
  '' as valor
union all
select 
  'Top dias com mais leads' as secao,
  '' as valor
union all
select 
  to_char(l.created_at::date, 'DD/MM') || ' (' || to_char(l.created_at::date, 'Day') || ')' as secao,
  count(*)::text || ' leads' as valor
from leads l
where l.tenant_id = '8bd69047-7533-42f3-a2f7-e3a60477f68c'
  and l.created_at >= '2025-10-07T00:00:00.000Z'
  and l.created_at <= '2025-10-17T23:59:59.999Z'
group by l.created_at::date
order by count(*) desc
limit 3;
