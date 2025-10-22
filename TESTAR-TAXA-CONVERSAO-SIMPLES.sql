-- Script simples para testar a Taxa de Conversão
-- Verifica se todos os dias desde 07/10 estão sendo considerados

-- 1. Verificar leads por dia com conversões
select 
  to_char(l.created_at::date, 'DD/MM') as dia,
  count(*) as total_leads,
  count(case when l.status = 'closed' or (l.fields->>'sold') = 'true' then 1 end) as vendas,
  round(
    (count(case when l.status = 'closed' or (l.fields->>'sold') = 'true' then 1 end)::float / count(*)::float) * 100, 
    1
  ) as taxa_conversao_percent
from leads l
where l.tenant_id = '8bd69047-7533-42f3-a2f7-e3a60477f68c'
  and l.created_at >= '2025-10-07T00:00:00.000Z'
  and l.created_at <= '2025-10-17T23:59:59.999Z'
group by l.created_at::date
order by l.created_at::date;
