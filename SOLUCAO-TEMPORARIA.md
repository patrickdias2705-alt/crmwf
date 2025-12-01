🔧 SOLUÇÃO TEMPORÁRIA:

Para resolver o erro nas métricas, vamos usar uma versão simplificada:

1. BACKUP do arquivo original:
   cp src/pages/Metrics.tsx src/pages/Metrics.tsx.backup

2. SUBSTITUIR pela versão simplificada:
   cp METRICS-SIMPLIFICADO.tsx src/pages/Metrics.tsx

3. TESTAR:
   - Vá para http://localhost:8080/metrics
   - Deve carregar sem erros
   - Ticket médio deve mostrar R$ 3.500,00

4. RESTAURAR original (quando quiser):
   cp src/pages/Metrics.tsx.backup src/pages/Metrics.tsx

🎯 A versão simplificada:
- Remove dependências problemáticas
- Busca apenas dados essenciais
- Calcula ticket médio diretamente da tabela sales
- Funciona mesmo se outras tabelas tiverem problemas

Execute os comandos acima para testar!
