-- Script para verificar as datas reais no Supabase e comparar com o frontend
-- Identifica inconsistências entre datas dos leads e tooltips

-- 1. Verificar todos os leads com suas datas reais
select 
  '=== LEADS COM DATAS REAIS ===' as secao,
  '' as valor
union all
select 
  'Leads por data real' as descricao,
  '' as valor
union all
select 
  l.created_at::date::text as data_real,
  count(*)::text || ' leads' as valor
from leads l
where l.tenant_id = '8bd69047-7533-42f3-a2f7-e3a60477f68c'
  and l.created_at >= '2025-10-07T00:00:00.000Z'
  and l.created_at <= '2025-10-17T23:59:59.999Z'
group by l.created_at::date
order by l.created_at::date

union all

-- 2. Verificar leads por dia da semana
select 
  '=== LEADS POR DIA DA SEMANA ===' as secao,
  '' as valor
union all
select 
  to_char(l.created_at::date, 'DD/MM dddd') as data_formatada,
  count(*)::text || ' leads' as valor
from leads l
where l.tenant_id = '8bd69047-7533-42f3-a2f7-e3a60477f68c'
  and l.created_at >= '2025-10-07T00:00:00.000Z'
  and l.created_at <= '2025-10-17T23:59:59.999Z'
group by l.created_at::date, to_char(l.created_at::date, 'DD/MM dddd')
order by l.created_at::date

union all

-- 3. Verificar especificamente o dia 13/10 vs 12/10
select 
  '=== VERIFICAÇÃO DIA 12/10 vs 13/10 ===' as secao,
  '' as valor
union all
select 
  'Leads em 12/10/2025' as descricao,
  count(*)::text as valor
from leads l
where l.tenant_id = '8bd69047-7533-42f3-a2f7-e3a60477f68c'
  and l.created_at::date = '2025-10-12'
union all
select 
  'Leads em 13/10/2025' as descricao,
  count(*)::text as valor
from leads l
where l.tenant_id = '8bd69047-7533-42f3-a2f7-e3a60477f68c'
  and l.created_at::date = '2025-10-13'
union all
select 
  'Dia da semana 12/10' as descricao,
  to_char('2025-10-12'::date, 'dddd') as valor
union all
select 
  'Dia da semana 13/10' as descricao,
  to_char('2025-10-13'::date, 'dddd') as valor;
