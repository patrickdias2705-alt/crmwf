-- Atualizar funções de tempo no schema util
-- Adiciona contagem de dias e tempo detalhado desde o início

-- 1.1 Dias (inteiro) desde 2025-10-07 (zera na virada local SP)
create or replace function util.days_since_start() returns integer
language sql stable as $$
  select greatest(0, (util.today_sp() - util.start_date())::int)
$$;

-- 1.2 Elapsed detalhado em tempo real
create type util.elapsed_parts as (
  days bigint,
  hours bigint,
  minutes bigint,
  seconds bigint,
  total_seconds bigint
);

create or replace function util.elapsed_since_start() returns util.elapsed_parts
language plpgsql stable as $$
declare
  start_ts timestamptz := (util.start_date()::timestamptz at time zone 'America/Sao_Paulo');
  now_ts   timestamptz := util.now_sp();
  diff_ms  bigint := greatest(0, extract(epoch from (now_ts - start_ts))::bigint * 1000);
  d bigint; h bigint; m bigint; s bigint;
begin
  d := diff_ms / 86400000;
  h := (diff_ms % 86400000) / 3600000;
  m := (diff_ms % 3600000) / 60000;
  s := (diff_ms % 60000) / 1000;
  return (d, h, m, s, diff_ms/1000);
end;
$$;

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
