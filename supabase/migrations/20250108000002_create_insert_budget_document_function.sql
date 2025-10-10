-- Criar função para inserir documento de orçamento
CREATE OR REPLACE FUNCTION public.insert_budget_document(
  p_lead_id UUID,
  p_tenant_id UUID,
  p_file_name VARCHAR(255),
  p_file_url TEXT,
  p_file_path TEXT,
  p_file_size BIGINT,
  p_description TEXT,
  p_amount DECIMAL(10,2),
  p_uploaded_by UUID
)
RETURNS UUID AS $$
DECLARE
  new_document_id UUID;
BEGIN
  -- Inserir o documento
  INSERT INTO public.budget_documents (
    lead_id,
    tenant_id,
    file_name,
    file_url,
    file_path,
    file_size,
    description,
    amount,
    uploaded_by
  ) VALUES (
    p_lead_id,
    p_tenant_id,
    p_file_name,
    p_file_url,
    p_file_path,
    p_file_size,
    p_description,
    p_amount,
    p_uploaded_by
  ) RETURNING id INTO new_document_id;
  
  RETURN new_document_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;




