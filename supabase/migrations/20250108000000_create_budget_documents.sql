-- Criar tabela para documentos de orçamento
CREATE TABLE IF NOT EXISTS public.budget_documents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  file_name VARCHAR(255) NOT NULL,
  file_url TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  description TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  uploaded_by UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_budget_documents_lead_id ON public.budget_documents(lead_id);
CREATE INDEX IF NOT EXISTS idx_budget_documents_tenant_id ON public.budget_documents(tenant_id);
CREATE INDEX IF NOT EXISTS idx_budget_documents_uploaded_by ON public.budget_documents(uploaded_by);

-- RLS Policies para budget_documents
ALTER TABLE public.budget_documents ENABLE ROW LEVEL SECURITY;

-- Política para SELECT: usuários podem ver documentos de leads do seu tenant
CREATE POLICY "budget_documents_select_policy" ON public.budget_documents
  FOR SELECT
  USING (
    tenant_id = public.get_user_tenant_id()
  );

-- Política para INSERT: usuários podem criar documentos para leads do seu tenant
CREATE POLICY "budget_documents_insert_policy" ON public.budget_documents
  FOR INSERT
  WITH CHECK (
    tenant_id = public.get_user_tenant_id()
    AND uploaded_by = auth.uid()
  );

-- Política para UPDATE: apenas quem enviou o documento pode editar
CREATE POLICY "budget_documents_update_policy" ON public.budget_documents
  FOR UPDATE
  USING (
    tenant_id = public.get_user_tenant_id()
    AND uploaded_by = auth.uid()
  )
  WITH CHECK (
    tenant_id = public.get_user_tenant_id()
  );

-- Política para DELETE: apenas quem enviou o documento pode deletar
CREATE POLICY "budget_documents_delete_policy" ON public.budget_documents
  FOR DELETE
  USING (
    tenant_id = public.get_user_tenant_id()
    AND uploaded_by = auth.uid()
  );

-- Criar bucket para documentos se não existir
INSERT INTO storage.buckets (id, name, public) 
VALUES ('documents', 'documents', true)
ON CONFLICT (id) DO NOTHING;

-- Política para storage: usuários podem fazer upload de documentos
CREATE POLICY "documents_upload_policy" ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'documents'
    AND auth.role() = 'authenticated'
  );

-- Política para storage: usuários podem visualizar documentos
CREATE POLICY "documents_view_policy" ON storage.objects
  FOR SELECT
  USING (
    bucket_id = 'documents'
    AND auth.role() = 'authenticated'
  );

-- Política para storage: usuários podem deletar documentos que enviaram
CREATE POLICY "documents_delete_policy" ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'documents'
    AND auth.role() = 'authenticated'
  );




