-- Migration: Adicionar status aos orçamentos e criar sistema de orçamentos em aberto
-- Permite preservar dados de orçamentos antes de se tornarem vendas

-- 1. Tornar file_url e file_path opcionais (já que usamos base64)
ALTER TABLE public.budget_documents 
ALTER COLUMN file_url DROP NOT NULL,
ALTER COLUMN file_path DROP NOT NULL;

-- 2. Adicionar campo status na tabela budget_documents
ALTER TABLE public.budget_documents 
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'aberto' CHECK (status IN ('aberto', 'vendido', 'cancelado', 'expirado'));

-- 3. Adicionar campo sale_id para vincular à venda quando for convertido
ALTER TABLE public.budget_documents 
ADD COLUMN IF NOT EXISTS sale_id UUID REFERENCES public.sales(id) ON DELETE SET NULL;

-- 4. Adicionar campo file_base64 para armazenar o arquivo em base64 (compatibilidade)
ALTER TABLE public.budget_documents 
ADD COLUMN IF NOT EXISTS file_base64 TEXT;

-- 5. Criar índice para buscar orçamentos em aberto rapidamente
CREATE INDEX IF NOT EXISTS idx_budget_documents_status ON public.budget_documents(status);
CREATE INDEX IF NOT EXISTS idx_budget_documents_status_tenant ON public.budget_documents(tenant_id, status) WHERE status = 'aberto';

-- 6. Criar função para atualizar status quando vira venda
CREATE OR REPLACE FUNCTION public.update_budget_on_sale()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Quando uma venda é criada, atualizar o orçamento relacionado
  IF TG_OP = 'INSERT' THEN
    -- Buscar o orçamento mais recente do lead que ainda está aberto
    UPDATE public.budget_documents
    SET 
      status = 'vendido',
      sale_id = NEW.id,
      updated_at = NOW()
    WHERE 
      lead_id = NEW.lead_id
      AND status = 'aberto'
      AND id = (
        SELECT id 
        FROM public.budget_documents 
        WHERE lead_id = NEW.lead_id 
          AND status = 'aberto'
        ORDER BY created_at DESC 
        LIMIT 1
      );
  END IF;
  
  RETURN NEW;
END;
$$;

-- 7. Criar trigger para atualizar orçamento quando vira venda
DROP TRIGGER IF EXISTS trigger_update_budget_on_sale ON public.sales;
CREATE TRIGGER trigger_update_budget_on_sale
  AFTER INSERT ON public.sales
  FOR EACH ROW
  EXECUTE FUNCTION public.update_budget_on_sale();

-- 8. Comentários para documentação
COMMENT ON COLUMN public.budget_documents.status IS 'Status do orçamento: aberto, vendido, cancelado, expirado';
COMMENT ON COLUMN public.budget_documents.sale_id IS 'ID da venda quando o orçamento é convertido em venda';
COMMENT ON COLUMN public.budget_documents.file_base64 IS 'Arquivo do orçamento em base64 para preservação de dados';

-- 9. Atualizar orçamentos existentes sem status para 'aberto'
UPDATE public.budget_documents 
SET status = 'aberto' 
WHERE status IS NULL;

