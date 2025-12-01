-- ========================================
-- CRIAR/CORRIGIR SISTEMA DE VENDEDORES
-- ========================================
-- Execute no SQL Editor do Supabase
-- Este script garante que cada lead e orçamento tenha um vendedor identificado

-- 1. VERIFICAR SE O CAMPO assigned_to EXISTE NA TABELA leads
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'leads'
      AND column_name = 'assigned_to'
  ) THEN
    -- Criar coluna assigned_to
    ALTER TABLE public.leads
    ADD COLUMN assigned_to UUID REFERENCES public.users(id) ON DELETE SET NULL;
    
    RAISE NOTICE '✅ Coluna assigned_to criada na tabela leads';
  ELSE
    -- Verificar se tem foreign key
    IF NOT EXISTS (
      SELECT FROM information_schema.table_constraints tc
      JOIN information_schema.key_column_usage kcu 
        ON tc.constraint_name = kcu.constraint_name
      WHERE tc.table_schema = 'public'
        AND tc.table_name = 'leads'
        AND kcu.column_name = 'assigned_to'
        AND tc.constraint_type = 'FOREIGN KEY'
    ) THEN
      -- Criar foreign key se não existir
      ALTER TABLE public.leads
      ADD CONSTRAINT leads_assigned_to_fkey 
      FOREIGN KEY (assigned_to) 
      REFERENCES public.users(id) 
      ON DELETE SET NULL;
      
      RAISE NOTICE '✅ Foreign key criada para assigned_to';
    ELSE
      RAISE NOTICE 'ℹ️ Coluna assigned_to já existe com foreign key na tabela leads';
    END IF;
  END IF;
END $$;

-- 2. VERIFICAR SE O CAMPO uploaded_by EXISTE NA TABELA budget_documents
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'budget_documents'
      AND column_name = 'uploaded_by'
  ) THEN
    -- Criar coluna uploaded_by
    ALTER TABLE public.budget_documents
    ADD COLUMN uploaded_by UUID REFERENCES public.users(id) ON DELETE SET NULL;
    
    RAISE NOTICE '✅ Coluna uploaded_by criada na tabela budget_documents';
  ELSE
    RAISE NOTICE 'ℹ️ Coluna uploaded_by já existe na tabela budget_documents';
  END IF;
END $$;

-- 3. CRIAR ÍNDICES PARA PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_leads_assigned_to ON public.leads(assigned_to);
CREATE INDEX IF NOT EXISTS idx_leads_assigned_to_tenant ON public.leads(tenant_id, assigned_to);
CREATE INDEX IF NOT EXISTS idx_budget_documents_uploaded_by ON public.budget_documents(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_budget_documents_uploaded_by_tenant ON public.budget_documents(tenant_id, uploaded_by);

-- 4. ATUALIZAR LEADS SEM VENDEDOR (atribuir ao primeiro usuário do tenant)
DO $$
DECLARE
  lead_record RECORD;
  default_user_id UUID;
BEGIN
  FOR lead_record IN 
    SELECT DISTINCT tenant_id 
    FROM leads 
    WHERE assigned_to IS NULL
  LOOP
    -- Buscar primeiro usuário ativo do tenant
    SELECT id INTO default_user_id
    FROM users
    WHERE tenant_id = lead_record.tenant_id
      AND active = true
      AND role IN ('agent', 'admin', 'manager')
    ORDER BY created_at ASC
    LIMIT 1;
    
    -- Atualizar leads sem vendedor
    IF default_user_id IS NOT NULL THEN
      UPDATE leads
      SET assigned_to = default_user_id
      WHERE tenant_id = lead_record.tenant_id
        AND assigned_to IS NULL;
      
      RAISE NOTICE '✅ Atualizados leads do tenant % para o vendedor %', lead_record.tenant_id, default_user_id;
    ELSE
      RAISE WARNING '⚠️ Nenhum vendedor encontrado para o tenant %', lead_record.tenant_id;
    END IF;
  END LOOP;
END $$;

-- 5. ATUALIZAR ORÇAMENTOS SEM VENDEDOR (atribuir ao vendedor do lead)
DO $$
DECLARE
  budget_record RECORD;
BEGIN
  FOR budget_record IN 
    SELECT 
      bd.id,
      bd.lead_id,
      l.assigned_to,
      l.tenant_id
    FROM budget_documents bd
    INNER JOIN leads l ON bd.lead_id = l.id
    WHERE bd.uploaded_by IS NULL
      AND l.assigned_to IS NOT NULL
  LOOP
    UPDATE budget_documents
    SET uploaded_by = budget_record.assigned_to
    WHERE id = budget_record.id;
  END LOOP;
  
  RAISE NOTICE '✅ Orçamentos sem vendedor atualizados com base no lead';
END $$;

-- 6. VERIFICAR RESULTADO FINAL
SELECT 
  'Leads sem vendedor' as tipo,
  COUNT(*) as quantidade
FROM leads
WHERE assigned_to IS NULL
UNION ALL
SELECT 
  'Orçamentos sem vendedor' as tipo,
  COUNT(*) as quantidade
FROM budget_documents
WHERE uploaded_by IS NULL;

-- ✅ Sistema de vendedores configurado!
-- Agora cada lead e orçamento está vinculado a um vendedor único por tenant

