-- Schema util para organização e constantes do sistema
-- Permite mudanças futuras sem refatorar código

-- 0. Cria schema util (organização)
create schema if not exists util;

-- 0.1 Constante da data oficial de início (permite trocar no futuro sem refatorar código)
create table if not exists util.app_constants (
  key text primary key,
  value text not null
);

insert into util.app_constants (key, value)
values ('start_date_iso', '2025-10-07')
on conflict (key) do update set value = excluded.value;

-- 0.2 Helpers de tempo no fuso de São Paulo
create or replace function util.start_date() returns date
language sql stable as $$
  select value::date from util.app_constants where key = 'start_date_iso'
$$;

create or replace function util.now_sp() returns timestamptz
language sql stable as $$
  -- now() é timestamptz; "AT TIME ZONE" converte para time local; reanexa tz -03:00
  select (now() at time zone 'America/Sao_Paulo')::timestamptz
$$;

create or replace function util.today_sp() returns date
language sql stable as $$
  select (util.now_sp())::date
$$;

-- 0.3 Teste das funções criadas
select 
  'Data de início do sistema' as descricao,
  util.start_date() as valor
union all
select 
  'Data atual SP' as descricao,
  util.now_sp()::date as valor
union all
select 
  'Hoje SP' as descricao,
  util.today_sp() as valor;
