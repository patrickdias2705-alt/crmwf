-- Script para demonstrar como usar as funções util no frontend
-- Substitui as datas hardcoded por funções dinâmicas

-- 1. Exemplo de como buscar dados usando as funções util
-- Em vez de usar '2025-10-07T00:00:00.000Z' hardcoded, usar:
-- util.start_date()::timestamptz

-- 2. Exemplo de query que o frontend pode usar:
select 
  l.id,
  l.created_at,
  l.status,
  l.fields,
  -- Calcular dias desde o início
  (l.created_at::date - util.start_date()) as dias_desde_inicio,
  -- Verificar se é hoje
  case when l.created_at::date = util.today_sp() then true else false end as eh_hoje
from leads l
where l.tenant_id = '8bd69047-7533-42f3-a2f7-e3a60477f68c'
  and l.created_at >= util.start_date()::timestamptz
  and l.created_at <= (util.today_sp() + interval '1 day')::timestamptz
order by l.created_at desc
limit 10;

-- 3. Exemplo de contagem por dia usando as funções
select 
  l.created_at::date as data,
  count(*) as total_leads,
  count(case when l.status = 'closed' or (l.fields->>'sold') = 'true' then 1 end) as vendas
from leads l
where l.tenant_id = '8bd69047-7533-42f3-a2f7-e3a60477f68c'
  and l.created_at >= util.start_date()::timestamptz
  and l.created_at <= (util.today_sp() + interval '1 day')::timestamptz
group by l.created_at::date
order by l.created_at::date;
