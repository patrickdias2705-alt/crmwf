-- Migration: Migrar orçamentos existentes dos fields dos leads para a tabela budget_documents
-- Esta migration popula a tabela budget_documents com dados existentes

-- Função para migrar orçamentos dos fields para a tabela
CREATE OR REPLACE FUNCTION public.migrate_budgets_from_fields()
RETURNS TABLE(
  migrated_count INTEGER,
  errors_count INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  lead_record RECORD;
  doc_record JSONB;
  migrated INTEGER := 0;
  errors INTEGER := 0;
  base64_content TEXT;
  file_url_content TEXT;
BEGIN
  -- Iterar sobre todos os leads que têm orçamentos nos fields
  FOR lead_record IN 
    SELECT 
      id,
      tenant_id,
      fields
    FROM leads
    WHERE fields IS NOT NULL
      AND (
        fields->>'budget_file_base64' IS NOT NULL 
        OR fields->'budget_documents' IS NOT NULL
      )
  LOOP
    BEGIN
      -- Verificar se tem array de documentos (novo formato)
      IF lead_record.fields->'budget_documents' IS NOT NULL 
         AND jsonb_typeof(lead_record.fields->'budget_documents') = 'array' THEN
        
        -- Migrar cada documento do array
        FOR doc_record IN SELECT * FROM jsonb_array_elements(lead_record.fields->'budget_documents')
        LOOP
          -- Verificar se já existe na tabela (evitar duplicatas)
          IF NOT EXISTS (
            SELECT 1 FROM budget_documents 
            WHERE lead_id = lead_record.id 
              AND file_name = COALESCE(doc_record->>'file_name', 'Documento')
              AND created_at::date = COALESCE(
                (doc_record->>'uploaded_at')::timestamp::date,
                (doc_record->>'created_at')::timestamp::date,
                CURRENT_DATE
              )
          ) THEN
            -- Extrair base64
            base64_content := COALESCE(
              doc_record->>'file_base64',
              doc_record->>'file_url'
            );
            
            -- Criar URL data se necessário
            IF base64_content NOT LIKE 'data:%' THEN
              file_url_content := 'data:application/pdf;base64,' || base64_content;
            ELSE
              file_url_content := base64_content;
            END IF;
            
            -- Inserir na tabela
            INSERT INTO budget_documents (
              lead_id,
              tenant_id,
              file_name,
              file_url,
              file_path,
              file_size,
              file_base64,
              description,
              amount,
              uploaded_by,
              status,
              created_at
            ) VALUES (
              lead_record.id,
              lead_record.tenant_id,
              COALESCE(doc_record->>'file_name', 'Documento'),
              file_url_content,
              'budgets/' || lead_record.id::text || '/' || COALESCE(doc_record->>'file_name', 'documento.pdf'),
              COALESCE((doc_record->>'file_size')::bigint, 0),
              CASE 
                WHEN base64_content LIKE 'data:%,%' THEN split_part(base64_content, ',', 2)
                ELSE base64_content
              END,
              COALESCE(doc_record->>'description', ''),
              COALESCE((doc_record->>'amount')::numeric, 0),
              -- Tentar encontrar o usuário pelo email ou usar um usuário padrão do tenant
              COALESCE(
                (SELECT id FROM users WHERE tenant_id = lead_record.tenant_id LIMIT 1),
                (SELECT id FROM auth.users LIMIT 1)
              ),
              'aberto',
              COALESCE(
                (doc_record->>'uploaded_at')::timestamp,
                (doc_record->>'created_at')::timestamp,
                NOW()
              )
            );
            
            migrated := migrated + 1;
          END IF;
        END LOOP;
        
      -- Formato antigo (um único documento)
      ELSIF lead_record.fields->>'budget_file_base64' IS NOT NULL THEN
        
        -- Verificar se já existe na tabela
        IF NOT EXISTS (
          SELECT 1 FROM budget_documents 
          WHERE lead_id = lead_record.id 
            AND file_name = COALESCE(lead_record.fields->>'budget_file_name', 'Documento')
        ) THEN
          -- Extrair base64
          base64_content := lead_record.fields->>'budget_file_base64';
          
          -- Criar URL data se necessário
          IF base64_content NOT LIKE 'data:%' THEN
            file_url_content := 'data:application/pdf;base64,' || base64_content;
          ELSE
            file_url_content := base64_content;
          END IF;
          
          -- Inserir na tabela
          INSERT INTO budget_documents (
            lead_id,
            tenant_id,
            file_name,
            file_url,
            file_path,
            file_size,
            file_base64,
            description,
            amount,
            uploaded_by,
            status,
            created_at
          ) VALUES (
            lead_record.id,
            lead_record.tenant_id,
            COALESCE(lead_record.fields->>'budget_file_name', 'Documento'),
            file_url_content,
            'budgets/' || lead_record.id::text || '/' || COALESCE(lead_record.fields->>'budget_file_name', 'documento.pdf'),
            COALESCE((lead_record.fields->>'budget_file_size')::bigint, 0),
            CASE 
              WHEN base64_content LIKE 'data:%,%' THEN split_part(base64_content, ',', 2)
              ELSE base64_content
            END,
            COALESCE(lead_record.fields->>'budget_description', ''),
            COALESCE((lead_record.fields->>'budget_amount')::numeric, 0),
            -- Tentar encontrar o usuário pelo email ou usar um usuário padrão do tenant
            COALESCE(
              (SELECT id FROM users WHERE tenant_id = lead_record.tenant_id LIMIT 1),
              (SELECT id FROM auth.users LIMIT 1)
            ),
            'aberto',
            COALESCE(
              (lead_record.fields->>'budget_uploaded_at')::timestamp,
              NOW()
            )
          );
          
          migrated := migrated + 1;
        END IF;
      END IF;
      
    EXCEPTION WHEN OTHERS THEN
      errors := errors + 1;
      RAISE WARNING 'Erro ao migrar orçamento do lead %: %', lead_record.id, SQLERRM;
    END;
  END LOOP;
  
  RETURN QUERY SELECT migrated, errors;
END;
$$;

-- Executar a migração
DO $$
DECLARE
  result RECORD;
BEGIN
  SELECT * INTO result FROM public.migrate_budgets_from_fields();
  RAISE NOTICE 'Migração concluída: % orçamentos migrados, % erros', result.migrated_count, result.errors_count;
END $$;

-- Comentário
COMMENT ON FUNCTION public.migrate_budgets_from_fields() IS 'Migra orçamentos existentes dos fields dos leads para a tabela budget_documents';

