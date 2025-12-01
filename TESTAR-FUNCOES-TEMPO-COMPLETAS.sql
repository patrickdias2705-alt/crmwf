-- Teste completo das funções de tempo do schema util
-- Verifica todas as funcionalidades implementadas

-- 1. Teste das funções básicas
select 
  '=== FUNÇÕES BÁSICAS ===' as secao,
  '' as valor
union all
select 
  'Data de início' as descricao,
  util.start_date()::text as valor
union all
select 
  'Data atual SP' as descricao,
  util.today_sp()::text as valor
union all
select 
  'Hora atual SP' as descricao,
  util.now_sp()::text as valor

union all

-- 2. Teste das novas funções de contagem
select 
  '=== CONTAGEM DE TEMPO ===' as secao,
  '' as valor
union all
select 
  'Dias desde início' as descricao,
  util.days_since_start()::text as valor
union all
select 
  'Tempo detalhado' as descricao,
  (util.elapsed_since_start()).days::text || 'd ' || 
  (util.elapsed_since_start()).hours::text || 'h ' ||
  (util.elapsed_since_start()).minutes::text || 'm ' ||
  (util.elapsed_since_start()).seconds::text || 's' as valor
union all
select 
  'Total segundos' as descricao,
  (util.elapsed_since_start()).total_seconds::text as valor

union all

-- 3. Teste prático com dados de leads
select 
  '=== APLICAÇÃO PRÁTICA ===' as secao,
  '' as valor
union all
select 
  'Leads criados hoje' as descricao,
  count(*)::text as valor
from leads l
where l.tenant_id = '8bd69047-7533-42f3-a2f7-e3a60477f68c'
  and l.created_at::date = util.today_sp()
union all
select 
  'Leads desde início' as descricao,
  count(*)::text as valor
from leads l
where l.tenant_id = '8bd69047-7533-42f3-a2f7-e3a60477f68c'
  and l.created_at >= util.start_date()::timestamptz
union all
select 
  'Média leads/dia' as descricao,
  case 
    when util.days_since_start() > 0 then 
      round((count(*)::decimal / util.days_since_start()), 2)::text
    else '0' 
  end as valor
from leads l
where l.tenant_id = '8bd69047-7533-42f3-a2f7-e3a60477f68c'
  and l.created_at >= util.start_date()::timestamptz;
