-- Função RPC para executar queries SQL via IA (se necessário)
-- Esta função permite que a IA execute queries SQL de forma segura

CREATE OR REPLACE FUNCTION execute_sql(sql_query text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result json;
BEGIN
    -- Log da query para auditoria
    INSERT INTO query_log (query, executed_at, executed_by)
    VALUES (sql_query, NOW(), current_user);
    
    -- Executar a query e retornar resultado
    EXECUTE 'SELECT json_agg(row_to_json(t)) FROM (' || sql_query || ') t' INTO result;
    
    RETURN COALESCE(result, '[]'::json);
EXCEPTION
    WHEN OTHERS THEN
        -- Retornar erro em formato JSON
        RETURN json_build_object(
            'error', true,
            'message', SQLERRM,
            'code', SQLSTATE
        );
END;
$$;

-- Tabela de log para auditoria (opcional)
CREATE TABLE IF NOT EXISTS query_log (
    id SERIAL PRIMARY KEY,
    query TEXT NOT NULL,
    executed_at TIMESTAMP DEFAULT NOW(),
    executed_by TEXT DEFAULT current_user
);

-- Comentário da função
COMMENT ON FUNCTION execute_sql(text) IS 'Função para executar queries SQL de forma segura via IA Database Manager';

-- Exemplo de uso (comentado):
-- SELECT execute_sql('SELECT * FROM leads WHERE tenant_id = ''8bd69047-7533-42f3-a2f7-e3a60477f68c'' LIMIT 5');
