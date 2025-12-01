-- Script simples para verificar os dias da semana corretos
-- Execute este script para confirmar as correções aplicadas

-- 1. Verificar dias da semana corretos para as datas principais
select 
  'DIAS DA SEMANA CORRETOS' as verificacao,
  '10/10/2025' as data,
  to_char('2025-10-10'::date, 'Day') as dia_semana
union all
select 
  'DIAS DA SEMANA CORRETOS' as verificacao,
  '15/10/2025' as data,
  to_char('2025-10-15'::date, 'Day') as dia_semana
union all
select 
  'DIAS DA SEMANA CORRETOS' as verificacao,
  '13/10/2025' as data,
  to_char('2025-10-13'::date, 'Day') as dia_semana;

-- 2. Verificar dados dos leads por dia (top 3)
select 
  'DADOS DOS LEADS' as tipo,
  to_char(l.created_at::date, 'DD/MM') as dia,
  to_char(l.created_at::date, 'Day') as dia_semana,
  count(*)::text || ' leads' as total
from leads l
where l.tenant_id = '8bd69047-7533-42f3-a2f7-e3a60477f68c'
  and l.created_at >= '2025-10-07T00:00:00.000Z'
  and l.created_at <= '2025-10-17T23:59:59.999Z'
group by l.created_at::date
order by count(*) desc
limit 3;
