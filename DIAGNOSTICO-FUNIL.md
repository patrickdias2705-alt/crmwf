🔍 DIAGNÓSTICO COMPLETO - FUNIL NÃO ATUALIZA

## 📊 O QUE FAZER AGORA:

### 1. **EXECUTAR SQL NO SUPABASE:**
   - Abra o SQL Editor no Supabase
   - Copie o conteúdo do arquivo `TESTAR-EVENTOS-FUNIL.sql`
   - Execute e me envie os resultados

### 2. **TESTAR NO NAVEGADOR:**
   - Vá para `http://localhost:8080/metrics`
   - Abra o Console (F12)
   - Recarregue a página (Ctrl+F5)
   - Me envie TODOS os logs que aparecerem, especialmente:
     - `🔍 Buscando dados do funil...`
     - `👤 Tenant ID: ...`
     - `📊 Estágios encontrados: ...`
     - `📊 Total de eventos 'stage_moved' no tenant: ...`
     - `✅ [NORMAL] Nome: TOTAL = X`

### 3. **TESTAR MOVIMENTAÇÃO DE LEAD:**
   - Com o console aberto (F12)
   - Vá para a página de Pipelines/Kanban
   - Mova um lead de um estágio para outro
   - Veja se aparece algo no console
   - Volte para Métricas
   - Veja se aparece `📊 Evento detectado! Atualizando funil...`

### 4. **VERIFICAR ESTRUTURA DO EVENTO:**
   - O SQL mostrará a estrutura exata do campo `data`
   - Precisamos confirmar se está assim:
   ```json
   {
     "from": { "stage_id": "...", "stage_name": "..." },
     "to": { "stage_id": "...", "stage_name": "..." },
     "reason": "..."
   }
   ```

---

## 🎯 POSSÍVEIS PROBLEMAS:

1. **Nenhum evento sendo criado:**
   - SQL mostrará 0 eventos
   - Problema na função `leads-move`

2. **Eventos com estrutura diferente:**
   - SQL mostrará estrutura do `data`
   - Precisaremos ajustar o filtro

3. **Tenant ID incorreto:**
   - Logs mostrarão o tenant_id usado
   - Verificar se está correto

4. **Realtime não funcionando:**
   - Funil não atualiza quando move lead
   - Subscription não está conectada

---

**AGUARDANDO SEUS RESULTADOS PARA DIAGNOSTICAR!** 🔍
