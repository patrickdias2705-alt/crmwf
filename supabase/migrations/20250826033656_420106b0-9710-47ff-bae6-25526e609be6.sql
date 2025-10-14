-- Inserir dados de exemplo para métricas diárias
INSERT INTO metrics_daily (date, tenant_id, leads_in, leads_attended, closed, booked, lost, refused)
VALUES 
  (CURRENT_DATE - INTERVAL '7 days', '96b895f8-3769-41da-b8da-f41db62ed70d', 15, 12, 3, 2, 4, 3),
  (CURRENT_DATE - INTERVAL '6 days', '96b895f8-3769-41da-b8da-f41db62ed70d', 18, 15, 4, 3, 5, 3),
  (CURRENT_DATE - INTERVAL '5 days', '96b895f8-3769-41da-b8da-f41db62ed70d', 22, 18, 5, 4, 6, 3),
  (CURRENT_DATE - INTERVAL '4 days', '96b895f8-3769-41da-b8da-f41db62ed70d', 20, 16, 6, 2, 4, 4),
  (CURRENT_DATE - INTERVAL '3 days', '96b895f8-3769-41da-b8da-f41db62ed70d', 25, 20, 7, 5, 5, 3),
  (CURRENT_DATE - INTERVAL '2 days', '96b895f8-3769-41da-b8da-f41db62ed70d', 19, 17, 4, 3, 6, 4),
  (CURRENT_DATE - INTERVAL '1 day', '96b895f8-3769-41da-b8da-f41db62ed70d', 23, 19, 8, 4, 4, 3),
  (CURRENT_DATE, '96b895f8-3769-41da-b8da-f41db62ed70d', 16, 14, 5, 3, 3, 3)
ON CONFLICT (date, tenant_id) DO NOTHING;