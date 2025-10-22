-- Script para testar a Taxa de Conversão completa desde o primeiro lead
-- Verifica se todos os dias desde 07/10 estão sendo considerados

-- 1. Verificar todos os leads desde o início com suas conversões
select 
  to_char(l.created_at::date, 'DD/MM') as dia,
  count(*)::text || ' leads, ' || 
  count(case when l.status = 'closed' or (l.fields->>'sold') = 'true' then 1 end)::text || ' vendas' as info
from leads l
where l.tenant_id = '8bd69047-7533-42f3-a2f7-e3a60477f68c'
  and l.created_at >= '2025-10-07T00:00:00.000Z'
  and l.created_at <= '2025-10-17T23:59:59.999Z'
group by l.created_at::date
order by l.created_at::date;

-- 2. Verificar taxa de conversão por dia (incluindo dias com 0 leads)
select 
  to_char(l.created_at::date, 'DD/MM') as dia,
  case 
    when count(*) = 0 then '0 leads - 0%'
    else 
      count(*)::text || ' leads, ' ||
      count(case when l.status = 'closed' or (l.fields->>'sold') = 'true' then 1 end)::text || ' vendas, ' ||
      round((count(case when l.status = 'closed' or (l.fields->>'sold') = 'true' then 1 end)::float / count(*)::float) * 100, 1)::text || '%'
  end as taxa_conversao
from leads l
where l.tenant_id = '8bd69047-7533-42f3-a2f7-e3a60477f68c'
  and l.created_at >= '2025-10-07T00:00:00.000Z'
  and l.created_at <= '2025-10-17T23:59:59.999Z'
group by l.created_at::date
order by l.created_at::date;

-- 3. Verificar especificamente os dias problemáticos
select 
  '07/10' as dia,
  case when exists(select 1 from leads l where l.tenant_id = '8bd69047-7533-42f3-a2f7-e3a60477f68c' and l.created_at::date = '2025-10-07') 
       then 'TEM LEADS' 
       else 'SEM LEADS' 
  end as status
union all
select 
  '08/10' as dia,
  case when exists(select 1 from leads l where l.tenant_id = '8bd69047-7533-42f3-a2f7-e3a60477f68c' and l.created_at::date = '2025-10-08') 
       then 'TEM LEADS' 
       else 'SEM LEADS' 
  end as status
union all
select 
  '09/10' as dia,
  case when exists(select 1 from leads l where l.tenant_id = '8bd69047-7533-42f3-a2f7-e3a60477f68c' and l.created_at::date = '2025-10-09') 
       then 'TEM LEADS' 
       else 'SEM LEADS' 
  end as status
union all
select 
  '10/10' as dia,
  case when exists(select 1 from leads l where l.tenant_id = '8bd69047-7533-42f3-a2f7-e3a60477f68c' and l.created_at::date = '2025-10-10') 
       then 'TEM LEADS' 
       else 'SEM LEADS' 
  end as status
union all
select 
  '11/10' as dia,
  case when exists(select 1 from leads l where l.tenant_id = '8bd69047-7533-42f3-a2f7-e3a60477f68c' and l.created_at::date = '2025-10-11') 
       then 'TEM LEADS' 
       else 'SEM LEADS' 
  end as status
union all
select 
  '12/10' as dia,
  case when exists(select 1 from leads l where l.tenant_id = '8bd69047-7533-42f3-a2f7-e3a60477f68c' and l.created_at::date = '2025-10-12') 
       then 'TEM LEADS' 
       else 'SEM LEADS' 
  end as status;
