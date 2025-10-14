-- Testar se as funções estão funcionando
SELECT public.get_sales_stats('8bd69047-7533-42f3-a2f7-e3a60477f68c');

-- Ver dados da tabela sales
SELECT * FROM sales;

-- Ver métricas atuais
SELECT * FROM metrics_daily ORDER BY date DESC LIMIT 1;
