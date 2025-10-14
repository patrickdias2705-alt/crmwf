-- ============================================================================
-- LIMPAR TODOS OS DADOS DO BANCO
-- ============================================================================
-- ATENÇÃO: Este script APAGA TODOS OS DADOS mas mantém a estrutura
-- Use com cuidado!
-- ============================================================================

-- Desabilitar triggers temporariamente para evitar problemas
SET session_replication_role = replica;

-- Limpar dados de todas as tabelas (ordem importa por causa das FKs)
TRUNCATE TABLE public.messages CASCADE;
TRUNCATE TABLE public.conversations CASCADE;
TRUNCATE TABLE public.lead_events CASCADE;
TRUNCATE TABLE public.activities CASCADE;
TRUNCATE TABLE public.budgets CASCADE;
TRUNCATE TABLE public.leads CASCADE;
TRUNCATE TABLE public.stages CASCADE;
TRUNCATE TABLE public.pipelines CASCADE;
TRUNCATE TABLE public.metrics_daily CASCADE;
TRUNCATE TABLE public.whatsapp_connections CASCADE;
TRUNCATE TABLE public.users CASCADE;
TRUNCATE TABLE public.tenants CASCADE;

-- Reabilitar triggers
SET session_replication_role = DEFAULT;

-- Mensagem de confirmação (será exibida nos logs)
DO $$
BEGIN
  RAISE NOTICE '✅ Todos os dados foram apagados com sucesso!';
  RAISE NOTICE '📋 A estrutura do banco foi mantida.';
  RAISE NOTICE '🔒 As políticas RLS estão ativas e protegidas.';
END $$;





