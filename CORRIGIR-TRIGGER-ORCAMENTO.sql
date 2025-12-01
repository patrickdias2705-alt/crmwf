-- ========================================
-- CORRIGIR TRIGGER PARA ATUALIZAR ORÇAMENTO QUANDO VIRA VENDA
-- ========================================
-- Execute no SQL Editor do Supabase

-- 1. RECRIAR A FUNÇÃO COM LÓGICA MELHORADA
CREATE OR REPLACE FUNCTION public.update_budget_on_sale()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  budget_doc_id UUID;
BEGIN
  -- Quando uma venda é criada, atualizar o orçamento relacionado
  IF TG_OP = 'INSERT' THEN
    -- Buscar o orçamento mais recente do lead que ainda está aberto
    -- E que foi criado ANTES ou NO MOMENTO da venda
    SELECT id INTO budget_doc_id
    FROM public.budget_documents 
    WHERE lead_id = NEW.lead_id
      AND status = 'aberto'
      AND created_at <= COALESCE(NEW.sold_at, NOW())
    ORDER BY created_at DESC 
    LIMIT 1;
    
    -- Se encontrou um orçamento, atualizar
    IF budget_doc_id IS NOT NULL THEN
      UPDATE public.budget_documents
      SET 
        status = 'vendido',
        sale_id = NEW.id,
        updated_at = NOW()
      WHERE id = budget_doc_id;
      
      RAISE NOTICE '✅ Orçamento % atualizado para vendido (venda: %)', budget_doc_id, NEW.id;
    ELSE
      RAISE WARNING '⚠️ Nenhum orçamento aberto encontrado para o lead %', NEW.lead_id;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- 2. RECRIAR O TRIGGER
DROP TRIGGER IF EXISTS trigger_update_budget_on_sale ON public.sales;
CREATE TRIGGER trigger_update_budget_on_sale
  AFTER INSERT ON public.sales
  FOR EACH ROW
  EXECUTE FUNCTION public.update_budget_on_sale();

-- 3. VERIFICAR SE FOI CRIADO
SELECT 
  trigger_name,
  event_manipulation,
  event_object_table,
  action_timing
FROM information_schema.triggers
WHERE trigger_schema = 'public'
  AND trigger_name = 'trigger_update_budget_on_sale';

-- ✅ Trigger corrigido! Agora quando uma venda for criada, o orçamento será atualizado automaticamente

