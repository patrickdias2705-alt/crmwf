-- Script para testar a automatização de leads por dia

-- 1. Verificar se a tabela foi criada
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'leads_daily_summary'
) as tabela_existe;

-- 2. Verificar estrutura da tabela
SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'leads_daily_summary' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 3. Verificar dados criados
SELECT 
  data,
  total_leads,
  leads_vendidos,
  valor_total_vendido,
  jsonb_array_length(leads_data) as leads_count,
  leads_data
FROM leads_daily_summary 
WHERE tenant_id = '8bd69047-7533-42f3-a2f7-e3a60477f68c'
ORDER BY data DESC;

-- 4. Verificar triggers
SELECT 
  trigger_name,
  event_manipulation,
  action_timing,
  action_statement
FROM information_schema.triggers 
WHERE trigger_name = 'trigger_update_daily_leads_summary';

-- 5. Testar inserção de um lead (simular)
-- Este comando vai acionar o trigger automaticamente
INSERT INTO leads (
  tenant_id,
  name,
  fields,
  status,
  created_at
) VALUES (
  '8bd69047-7533-42f3-a2f7-e3a60477f68c',
  'Teste Automatização',
  '{"name": "Dr. João Silva", "email": "joao@dentista.com", "phone": "11999999999", "orcamento": "1500.00", "sold": "true"}'::jsonb,
  'closed',
  NOW()
);

-- 6. Verificar se o lead foi adicionado automaticamente ao resumo diário
SELECT 
  data,
  total_leads,
  leads_vendidos,
  valor_total_vendido,
  leads_data
FROM leads_daily_summary 
WHERE tenant_id = '8bd69047-7533-42f3-a2f7-e3a60477f68c'
AND data = CURRENT_DATE
ORDER BY data DESC;

-- 7. Limpar o lead de teste
DELETE FROM leads 
WHERE tenant_id = '8bd69047-7533-42f3-a2f7-e3a60477f68c'
AND name = 'Teste Automatização';

-- 8. Verificar resumo final
SELECT 
  COUNT(*) as total_dias,
  SUM(total_leads) as total_leads_geral,
  SUM(leads_vendidos) as total_vendas_geral,
  SUM(valor_total_vendido) as valor_total_geral
FROM leads_daily_summary 
WHERE tenant_id = '8bd69047-7533-42f3-a2f7-e3a60477f68c';
