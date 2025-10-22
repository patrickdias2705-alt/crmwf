-- ========================================
-- TRIGGER AUTOMÁTICO PARA CRIAR CLUSTERS POR DIA
-- ========================================
-- Execute este script no Supabase SQL Editor

-- 1. Criar tabela para armazenar os clusters de leads por dia
CREATE TABLE IF NOT EXISTS leads_daily_clusters (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    date DATE NOT NULL,
    tenant_id UUID NOT NULL,
    total_leads INTEGER DEFAULT 0,
    leads_attended INTEGER DEFAULT 0,
    leads_closed INTEGER DEFAULT 0,
    leads_vendidos INTEGER DEFAULT 0,
    total_revenue DECIMAL(10,2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(date, tenant_id)
);

-- 2. Criar índice para performance
CREATE INDEX IF NOT EXISTS idx_leads_daily_clusters_date_tenant 
ON leads_daily_clusters(date, tenant_id);

-- 3. Função para atualizar cluster quando lead é inserido
CREATE OR REPLACE FUNCTION update_daily_cluster_on_lead_insert()
RETURNS TRIGGER AS $$
BEGIN
    -- Extrair a data do lead
    DECLARE
        lead_date DATE := DATE(NEW.created_at);
    BEGIN
        -- Inserir ou atualizar o cluster do dia
        INSERT INTO leads_daily_clusters (date, tenant_id, total_leads, leads_attended, leads_closed, leads_vendidos, total_revenue, updated_at)
        VALUES (
            lead_date,
            NEW.tenant_id,
            1, -- +1 lead
            CASE WHEN NEW.status IN ('attended', 'qualified', 'closed', 'refused', 'lost') THEN 1 ELSE 0 END,
            CASE WHEN NEW.status = 'closed' OR (NEW.fields->>'sold' = 'true') THEN 1 ELSE 0 END,
            CASE WHEN NEW.fields->>'sold' = 'true' THEN 1 ELSE 0 END,
            CASE WHEN NEW.fields->>'sold' = 'true' THEN COALESCE(CAST(NEW.fields->>'sold_amount' AS DECIMAL), 0) ELSE 0 END,
            NOW()
        )
        ON CONFLICT (date, tenant_id)
        DO UPDATE SET
            total_leads = leads_daily_clusters.total_leads + 1,
            leads_attended = leads_daily_clusters.leads_attended + CASE WHEN NEW.status IN ('attended', 'qualified', 'closed', 'refused', 'lost') THEN 1 ELSE 0 END,
            leads_closed = leads_daily_clusters.leads_closed + CASE WHEN NEW.status = 'closed' OR (NEW.fields->>'sold' = 'true') THEN 1 ELSE 0 END,
            leads_vendidos = leads_daily_clusters.leads_vendidos + CASE WHEN NEW.fields->>'sold' = 'true' THEN 1 ELSE 0 END,
            total_revenue = leads_daily_clusters.total_revenue + CASE WHEN NEW.fields->>'sold' = 'true' THEN COALESCE(CAST(NEW.fields->>'sold_amount' AS DECIMAL), 0) ELSE 0 END,
            updated_at = NOW();
    END;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. Função para atualizar cluster quando lead é atualizado
CREATE OR REPLACE FUNCTION update_daily_cluster_on_lead_update()
RETURNS TRIGGER AS $$
BEGIN
    -- Extrair as datas (antiga e nova)
    DECLARE
        old_date DATE := DATE(OLD.created_at);
        new_date DATE := DATE(NEW.created_at);
        old_attended INTEGER := CASE WHEN OLD.status IN ('attended', 'qualified', 'closed', 'refused', 'lost') THEN 1 ELSE 0 END;
        new_attended INTEGER := CASE WHEN NEW.status IN ('attended', 'qualified', 'closed', 'refused', 'lost') THEN 1 ELSE 0 END;
        old_closed INTEGER := CASE WHEN OLD.status = 'closed' OR (OLD.fields->>'sold' = 'true') THEN 1 ELSE 0 END;
        new_closed INTEGER := CASE WHEN NEW.status = 'closed' OR (NEW.fields->>'sold' = 'true') THEN 1 ELSE 0 END;
        old_vendido INTEGER := CASE WHEN OLD.fields->>'sold' = 'true' THEN 1 ELSE 0 END;
        new_vendido INTEGER := CASE WHEN NEW.fields->>'sold' = 'true' THEN 1 ELSE 0 END;
        old_revenue DECIMAL := CASE WHEN OLD.fields->>'sold' = 'true' THEN COALESCE(CAST(OLD.fields->>'sold_amount' AS DECIMAL), 0) ELSE 0 END;
        new_revenue DECIMAL := CASE WHEN NEW.fields->>'sold' = 'true' THEN COALESCE(CAST(NEW.fields->>'sold_amount' AS DECIMAL), 0) ELSE 0 END;
    BEGIN
        -- Se a data mudou, remover do cluster antigo e adicionar ao novo
        IF old_date != new_date THEN
            -- Remover do cluster antigo
            UPDATE leads_daily_clusters SET
                total_leads = total_leads - 1,
                leads_attended = leads_attended - old_attended,
                leads_closed = leads_closed - old_closed,
                leads_vendidos = leads_vendidos - old_vendido,
                total_revenue = total_revenue - old_revenue,
                updated_at = NOW()
            WHERE date = old_date AND tenant_id = OLD.tenant_id;
            
            -- Adicionar ao cluster novo
            INSERT INTO leads_daily_clusters (date, tenant_id, total_leads, leads_attended, leads_closed, leads_vendidos, total_revenue, updated_at)
            VALUES (
                new_date,
                NEW.tenant_id,
                1,
                new_attended,
                new_closed,
                new_vendido,
                new_revenue,
                NOW()
            )
            ON CONFLICT (date, tenant_id)
            DO UPDATE SET
                total_leads = leads_daily_clusters.total_leads + 1,
                leads_attended = leads_daily_clusters.leads_attended + new_attended,
                leads_closed = leads_daily_clusters.leads_closed + new_closed,
                leads_vendidos = leads_daily_clusters.leads_vendidos + new_vendido,
                total_revenue = leads_daily_clusters.total_revenue + new_revenue,
                updated_at = NOW();
        ELSE
            -- Se a data não mudou, apenas atualizar os contadores
            UPDATE leads_daily_clusters SET
                leads_attended = leads_attended - old_attended + new_attended,
                leads_closed = leads_closed - old_closed + new_closed,
                leads_vendidos = leads_vendidos - old_vendido + new_vendido,
                total_revenue = total_revenue - old_revenue + new_revenue,
                updated_at = NOW()
            WHERE date = old_date AND tenant_id = OLD.tenant_id;
        END IF;
    END;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 5. Função para atualizar cluster quando lead é deletado
CREATE OR REPLACE FUNCTION update_daily_cluster_on_lead_delete()
RETURNS TRIGGER AS $$
BEGIN
    DECLARE
        lead_date DATE := DATE(OLD.created_at);
        old_attended INTEGER := CASE WHEN OLD.status IN ('attended', 'qualified', 'closed', 'refused', 'lost') THEN 1 ELSE 0 END;
        old_closed INTEGER := CASE WHEN OLD.status = 'closed' OR (OLD.fields->>'sold' = 'true') THEN 1 ELSE 0 END;
        old_vendido INTEGER := CASE WHEN OLD.fields->>'sold' = 'true' THEN 1 ELSE 0 END;
        old_revenue DECIMAL := CASE WHEN OLD.fields->>'sold' = 'true' THEN COALESCE(CAST(OLD.fields->>'sold_amount' AS DECIMAL), 0) ELSE 0 END;
    BEGIN
        -- Remover do cluster
        UPDATE leads_daily_clusters SET
            total_leads = total_leads - 1,
            leads_attended = leads_attended - old_attended,
            leads_closed = leads_closed - old_closed,
            leads_vendidos = leads_vendidos - old_vendido,
            total_revenue = total_revenue - old_revenue,
            updated_at = NOW()
        WHERE date = lead_date AND tenant_id = OLD.tenant_id;
    END;
    
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- 6. Criar os triggers
DROP TRIGGER IF EXISTS trigger_update_daily_cluster_on_lead_insert ON leads;
CREATE TRIGGER trigger_update_daily_cluster_on_lead_insert
    AFTER INSERT ON leads
    FOR EACH ROW
    EXECUTE FUNCTION update_daily_cluster_on_lead_insert();

DROP TRIGGER IF EXISTS trigger_update_daily_cluster_on_lead_update ON leads;
CREATE TRIGGER trigger_update_daily_cluster_on_lead_update
    AFTER UPDATE ON leads
    FOR EACH ROW
    EXECUTE FUNCTION update_daily_cluster_on_lead_update();

DROP TRIGGER IF EXISTS trigger_update_daily_cluster_on_lead_delete ON leads;
CREATE TRIGGER trigger_update_daily_cluster_on_lead_delete
    AFTER DELETE ON leads
    FOR EACH ROW
    EXECUTE FUNCTION update_daily_cluster_on_lead_delete();

-- 7. Popular a tabela com dados existentes
INSERT INTO leads_daily_clusters (date, tenant_id, total_leads, leads_attended, leads_closed, leads_vendidos, total_revenue)
SELECT 
    DATE(created_at) as date,
    tenant_id,
    COUNT(*) as total_leads,
    COUNT(CASE WHEN status IN ('attended', 'qualified', 'closed', 'refused', 'lost') THEN 1 END) as leads_attended,
    COUNT(CASE WHEN status = 'closed' OR (fields->>'sold' = 'true') THEN 1 END) as leads_closed,
    COUNT(CASE WHEN fields->>'sold' = 'true' THEN 1 END) as leads_vendidos,
    SUM(CASE WHEN fields->>'sold' = 'true' THEN COALESCE(CAST(fields->>'sold_amount' AS DECIMAL), 0) ELSE 0 END) as total_revenue
FROM leads
WHERE tenant_id = '8bd69047-7533-42f3-a2f7-e3a60477f68c'
GROUP BY DATE(created_at), tenant_id
ON CONFLICT (date, tenant_id) DO NOTHING;

-- 8. Verificar se os clusters foram criados corretamente
SELECT 
    'CLUSTERS_CRIADOS' as status,
    date,
    total_leads,
    leads_attended,
    leads_closed,
    leads_vendidos,
    total_revenue
FROM leads_daily_clusters
WHERE tenant_id = '8bd69047-7533-42f3-a2f7-e3a60477f68c'
ORDER BY date;
