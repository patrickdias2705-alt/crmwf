-- ========================================
-- MIGRATION: Criar Tabela de Vendas
-- ========================================

-- 1. Criar tabela sales
CREATE TABLE IF NOT EXISTS public.sales (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  amount DECIMAL(15,2) NOT NULL DEFAULT 0,
  stage_id UUID REFERENCES public.stages(id),
  stage_name TEXT,
  sold_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  sold_by UUID REFERENCES auth.users(id),
  sold_by_name TEXT,
  budget_description TEXT,
  budget_file_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Criar índices
CREATE INDEX IF NOT EXISTS idx_sales_tenant_id ON public.sales(tenant_id);
CREATE INDEX IF NOT EXISTS idx_sales_lead_id ON public.sales(lead_id);
CREATE INDEX IF NOT EXISTS idx_sales_sold_at ON public.sales(sold_at);
CREATE INDEX IF NOT EXISTS idx_sales_amount ON public.sales(amount);

-- 3. Habilitar RLS
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;

-- 4. Criar políticas RLS
DROP POLICY IF EXISTS "Users can view sales from their tenant" ON public.sales;
CREATE POLICY "Users can view sales from their tenant" 
ON public.sales 
FOR SELECT 
TO authenticated
USING (
  tenant_id = get_user_tenant_id() 
  AND (
    has_role('admin'::app_role) 
    OR has_role('client_owner'::app_role) 
    OR has_role('manager'::app_role)
    OR has_role('supervisor'::app_role)
  )
);

DROP POLICY IF EXISTS "Users can insert sales for their tenant" ON public.sales;
CREATE POLICY "Users can insert sales for their tenant" 
ON public.sales 
FOR INSERT 
TO authenticated
WITH CHECK (
  tenant_id = get_user_tenant_id() 
  AND (
    has_role('admin'::app_role) 
    OR has_role('client_owner'::app_role) 
    OR has_role('manager'::app_role)
  )
);

-- 5. Inserir dados existentes de leads fechados
INSERT INTO public.sales (
  tenant_id,
  lead_id,
  amount,
  stage_id,
  stage_name,
  sold_by,
  sold_by_name,
  budget_description,
  budget_file_name,
  sold_at
)
SELECT 
  l.tenant_id,
  l.id as lead_id,
  COALESCE((l.fields->>'budget_amount')::DECIMAL, 0) as amount,
  l.stage_id,
  s.name as stage_name,
  l.owner_user_id as sold_by,
  COALESCE(u.raw_user_meta_data->>'name', u.email, 'Usuário') as sold_by_name,
  COALESCE(l.fields->>'budget_description', 'Venda existente') as budget_description,
  COALESCE(l.fields->>'budget_file_name', 'Orçamento') as budget_file_name,
  l.updated_at as sold_at
FROM public.leads l
JOIN public.stages s ON l.stage_id = s.id
LEFT JOIN auth.users u ON l.owner_user_id = u.id
WHERE l.fields->>'budget_amount' IS NOT NULL 
  AND (l.fields->>'budget_amount')::DECIMAL > 0
  AND (
    s.name ILIKE '%fechado%' OR 
    s.name ILIKE '%vendido%' OR 
    s.name ILIKE '%ganho%' OR 
    s.name ILIKE '%bolso%'
  )
ON CONFLICT (lead_id) DO NOTHING;

-- 6. Comentários
COMMENT ON TABLE public.sales IS 'Tabela dedicada para armazenar vendas realizadas';
COMMENT ON COLUMN public.sales.amount IS 'Valor da venda em R$';
COMMENT ON COLUMN public.sales.sold_at IS 'Data e hora da venda';
COMMENT ON COLUMN public.sales.sold_by IS 'ID do usuário que marcou como vendido';
COMMENT ON COLUMN public.sales.sold_by_name IS 'Nome do usuário que marcou como vendido';

-- ========================================
-- INSTRUÇÕES:
-- ========================================
-- 1. Copie todo este conteúdo
-- 2. Vá para o Supabase Dashboard
-- 3. Clique em "SQL Editor"
-- 4. Cole o conteúdo e execute
-- 5. Verifique se a tabela 'sales' foi criada
-- 6. Teste o botão "Marcar como Vendido"
