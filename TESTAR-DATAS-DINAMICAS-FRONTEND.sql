-- Script para testar se as datas dinâmicas estão funcionando corretamente
-- Verifica se os dados estão sendo buscados corretamente no período 07/10 a 17/10

-- 1. Verificar leads no período dinâmico
select 
  '=== LEADS NO PERÍODO DINÂMICO ===' as secao,
  '' as valor
union all
select 
  'Total de leads no período' as descricao,
  count(*)::text as valor
from leads l
where l.tenant_id = '8bd69047-7533-42f3-a2f7-e3a60477f68c'
  and l.created_at >= util.start_date()::timestamptz
  and l.created_at <= util.today_sp()::timestamptz
union all
select 
  'Leads por dia (07/10 a 17/10)' as descricao,
  '' as valor
union all
select 
  l.created_at::date::text as dia,
  count(*)::text || ' leads' as valor
from leads l
where l.tenant_id = '8bd69047-7533-42f3-a2f7-e3a60477f68c'
  and l.created_at >= util.start_date()::timestamptz
  and l.created_at <= util.today_sp()::timestamptz
group by l.created_at::date
order by l.created_at::date

union all

-- 2. Verificar vendas no período dinâmico
select 
  '=== VENDAS NO PERÍODO DINÂMICO ===' as secao,
  '' as valor
union all
select 
  'Total de vendas no período' as descricao,
  count(*)::text as valor
from leads l
where l.tenant_id = '8bd69047-7533-42f3-a2f7-e3a60477f68c'
  and l.created_at >= util.start_date()::timestamptz
  and l.created_at <= util.today_sp()::timestamptz
  and (l.status = 'closed' or (l.fields->>'sold') = 'true')
union all
select 
  'Vendas por dia' as descricao,
  '' as valor
union all
select 
  l.created_at::date::text as dia,
  count(*)::text || ' vendas' as valor
from leads l
where l.tenant_id = '8bd69047-7533-42f3-a2f7-e3a60477f68c'
  and l.created_at >= util.start_date()::timestamptz
  and l.created_at <= util.today_sp()::timestamptz
  and (l.status = 'closed' or (l.fields->>'sold') = 'true')
group by l.created_at::date
order by l.created_at::date;
