-- Script corrigido para testar as funções de tempo
-- Corrige o erro "UNION types integer and text cannot be matched"

-- Teste das novas funções (todos os valores como text para compatibilidade com UNION)
select 
  'Dias desde início' as descricao,
  util.days_since_start()::text as valor
union all
select 
  'Tempo detalhado' as descricao,
  (util.elapsed_since_start()).days::text || 'd ' || 
  (util.elapsed_since_start()).hours::text || 'h ' ||
  (util.elapsed_since_start()).minutes::text || 'm' as valor
union all
select 
  'Total segundos' as descricao,
  (util.elapsed_since_start()).total_seconds::text as valor;

-- Teste adicional: informações detalhadas
select 
  '=== INFORMAÇÕES DETALHADAS ===' as secao,
  '' as valor
union all
select 
  'Data de início do sistema' as descricao,
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
select 
  'Dias desde início' as descricao,
  util.days_since_start()::text as valor
union all
select 
  'Tempo detalhado' as descricao,
  (util.elapsed_since_start()).days::text || 'd ' || 
  (util.elapsed_since_start()).hours::text || 'h ' ||
  (util.elapsed_since_start()).minutes::text || 'm ' ||
  (util.elapsed_since_start()).seconds::text || 's' as valor;
