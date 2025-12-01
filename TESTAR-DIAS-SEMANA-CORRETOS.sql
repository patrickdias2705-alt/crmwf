-- Script para verificar os dias da semana corretos
-- Compara com o que deve aparecer no frontend após as correções

-- 1. Verificar dias da semana corretos para as datas principais
select 
  '=== DIAS DA SEMANA CORRETOS ===' as secao,
  '' as valor
union all
select 
  'Verificação de dias da semana' as descricao,
  '' as valor
union all
select 
  '10/10/2025' as data,
  to_char('2025-10-10'::date, 'Day') as dia_semana_sql
union all
select 
  '15/10/2025' as data,
  to_char('2025-10-15'::date, 'Day') as dia_semana_sql
union all
select 
  '13/10/2025' as data,
  to_char('2025-10-13'::date, 'Day') as dia_semana_sql
union all
select 
  '07/10/2025' as data,
  to_char('2025-10-07'::date, 'Day') as dia_semana_sql
union all
select 
  '14/10/2025' as data,
  to_char('2025-10-14'::date, 'Day') as dia_semana_sql
union all
select 
  '16/10/2025' as data,
  to_char('2025-10-16'::date, 'Day') as dia_semana_sql
union all
select 
  '17/10/2025' as data,
  to_char('2025-10-17'::date, 'Day') as dia_semana_sql;

-- 2. Verificar se os dados estão corretos (separado para evitar erro UNION)
select 
  '=== DADOS CORRETOS ESPERADOS ===' as secao,
  '' as valor
union all
select 
  'Dias com mais leads' as descricao,
  '' as valor;

-- 3. Consulta separada para dados dos leads (sem UNION)
select 
  to_char(l.created_at::date, 'DD/MM') as dia,
  to_char(l.created_at::date, 'Day') as dia_semana,
  count(*)::text || ' leads' as total_leads
from leads l
where l.tenant_id = '8bd69047-7533-42f3-a2f7-e3a60477f68c'
  and l.created_at >= '2025-10-07T00:00:00.000Z'
  and l.created_at <= '2025-10-17T23:59:59.999Z'
group by l.created_at::date
order by count(*) desc;
