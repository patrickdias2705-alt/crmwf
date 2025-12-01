-- Script simples para verificar datas reais no Supabase
-- Compara com os dados que devem aparecer no frontend

-- 1. Verificar todos os leads por data (formato que aparece no frontend)
select 
  to_char(l.created_at::date, 'DD/MM') as dia_frontend,
  to_char(l.created_at::date, 'Day') as dia_semana,
  count(*) as total_leads
from leads l
where l.tenant_id = '8bd69047-7533-42f3-a2f7-e3a60477f68c'
  and l.created_at >= '2025-10-07T00:00:00.000Z'
  and l.created_at <= '2025-10-17T23:59:59.999Z'
group by l.created_at::date
order by l.created_at::date;

-- 2. Verificar especificamente o problema 12/10 vs 13/10
select 
  'PROBLEMA 12/10 vs 13/10' as verificacao,
  '12/10/2025' as data,
  count(*) as leads_12_10
from leads l
where l.tenant_id = '8bd69047-7533-42f3-a2f7-e3a60477f68c'
  and l.created_at::date = '2025-10-12'
union all
select 
  'PROBLEMA 12/10 vs 13/10' as verificacao,
  '13/10/2025' as data,
  count(*) as leads_13_10
from leads l
where l.tenant_id = '8bd69047-7533-42f3-a2f7-e3a60477f68c'
  and l.created_at::date = '2025-10-13';

-- 3. Top 3 dias com mais leads (para verificar "dias de maior performance")
select 
  'TOP 3 DIAS' as tipo,
  to_char(l.created_at::date, 'DD/MM') as dia,
  to_char(l.created_at::date, 'Day') as dia_semana,
  count(*) as total_leads
from leads l
where l.tenant_id = '8bd69047-7533-42f3-a2f7-e3a60477f68c'
  and l.created_at >= '2025-10-07T00:00:00.000Z'
  and l.created_at <= '2025-10-17T23:59:59.999Z'
group by l.created_at::date
order by count(*) desc
limit 3;
