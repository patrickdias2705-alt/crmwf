-- Adicionar campo order_number à tabela leads
ALTER TABLE public.leads 
ADD COLUMN IF NOT EXISTS order_number VARCHAR(50);

-- Criar índice para performance em buscas por número do pedido
CREATE INDEX IF NOT EXISTS idx_leads_order_number ON public.leads(order_number);

-- Comentário para documentar o campo
COMMENT ON COLUMN public.leads.order_number IS 'Número do pedido do lead para rastreamento e identificação';




