# Sistema de Visualização de Agentes para Supervisores

## 📋 Visão Geral

Sistema implementado que permite **supervisores** e **administradores** alternarem entre diferentes agentes para visualizar seus dashboards, leads, pipelines e métricas em **tempo real** e de forma **isolada**.

---

## ✨ Funcionalidades Implementadas

### 1. **Seletor de Agente no Header**
- Dropdown no cabeçalho para trocar rapidamente entre agentes
- Lista todos os agentes ativos do sistema
- Mostra avatar, nome e tenant de cada agente
- Indica visualmente qual agente está sendo visualizado
- Opção para voltar à própria conta
- Acesso rápido ao painel supervisor

**Localização:** Componente `AgentSwitcher` no header principal

### 2. **Banner de Visualização**
- Banner destacado quando está visualizando um agente
- Mostra claramente: "Visualizando painel do agente: [Nome]"
- Badge "Tempo Real" para indicar atualização em tempo real
- Navegação rápida entre páginas (Dashboard, Leads, Pipeline)
- Botão para voltar ao painel supervisor

**Localização:** Componente `TenantViewBanner` no topo das páginas

### 3. **Painel Supervisor Aprimorado**
- Acesso rápido aos painéis dos agentes
- Botões individuais para cada agente
- Métricas consolidadas em tempo real
- Filtros por agente específico
- Tabs: Métricas e Pipeline

**Localização:** Página `/supervisor`

### 4. **Filtros Automáticos por Agente**

Todas as páginas principais agora filtram automaticamente pelos dados do agente quando em modo de visualização:

#### **Dashboard (`/`)**
- Total de leads do agente
- Leads atendidos, agendados, fechados
- Taxa de conversão individual
- Gráficos filtrados por agente
- Leads recentes do agente
- Atividades recentes

#### **Leads (`/leads`)**
- Lista de leads atribuídos ao agente
- Filtros e buscas aplicados apenas aos leads do agente
- Orçamentos relacionados aos leads do agente
- Exportação de dados do agente

#### **Pipelines (`/pipelines`)**
- Kanban com apenas os leads do agente
- Estatísticas de estágios do agente
- Drag & drop funciona apenas com leads do agente
- Atualização em tempo real

#### **Metrics (`/metrics`)**
- Métricas financeiras do agente:
  - Total de leads
  - Taxa de conversão
  - Mensagens enviadas
  - Qualificados
  - Ticket médio
  - Leads fechados
- Gráficos de performance diária
- Distribuição por fonte
- Funil de conversão
- Métricas financeiras (CAC, LTV, ROI)

---

## 🎯 Como Usar

### Para Supervisores:

1. **Acesso ao Painel Supervisor**
   ```
   Navegue para: /supervisor
   ```

2. **Selecionar um Agente**
   - Método 1: Clique em um dos botões de "Acesso Rápido" no painel supervisor
   - Método 2: Use o dropdown "Trocar Agente" no header (disponível em qualquer página)

3. **Visualizar Dados do Agente**
   - Você será redirecionado para o dashboard
   - Banner no topo indica qual agente está visualizando
   - Todos os dados são filtrados automaticamente
   - Navegue livremente entre as páginas

4. **Trocar para Outro Agente**
   - Use o dropdown "Trocar Agente" no header
   - Selecione outro agente da lista
   - Os dados são atualizados instantaneamente

5. **Voltar ao Painel Supervisor**
   - Clique em "Voltar ao Supervisor" no banner
   - Ou use o dropdown e selecione "Painel Supervisor"
   - Ou navegue manualmente para `/supervisor`

---

## 🔒 Permissões

### Quem pode usar:
- ✅ **Admin** - Acesso total
- ✅ **Supervisor** - Acesso a todos os agentes
- ❌ **Manager** - Sem acesso (pode ser adicionado se necessário)
- ❌ **Agent** - Sem acesso
- ❌ **Viewer** - Sem acesso

### Verificação de Permissão:
```typescript
const { canSwitchTenant } = useTenantView();
// Retorna true para admin e supervisor
```

---

## 🔄 Tempo Real

Todas as visualizações são atualizadas em **tempo real** usando Supabase Realtime:

- Novos leads aparecem instantaneamente
- Mudanças de estágio são refletidas imediatamente
- Métricas são recalculadas automaticamente
- Múltiplos supervisores podem visualizar o mesmo agente simultaneamente

---

## 🗂️ Arquivos Modificados/Criados

### Novos Arquivos:
1. `src/components/AgentSwitcher.tsx` - Seletor de agente no header
2. `docs/SUPERVISOR-AGENT-VIEW.md` - Esta documentação

### Arquivos Modificados:
1. `src/components/Layout.tsx` - Adicionado AgentSwitcher
2. `src/components/TenantViewBanner.tsx` - Melhorado banner com navegação
3. `src/pages/Index.tsx` - Já tinha filtro, mantido
4. `src/pages/Leads.tsx` - Adicionado filtro por agente
5. `src/pages/Pipelines.tsx` - Adicionado filtro por agente
6. `src/pages/Metrics.tsx` - Adicionado filtros completos por agente

### Arquivos Existentes (Não modificados):
1. `src/contexts/TenantViewContext.tsx` - Já estava preparado
2. `src/pages/Supervisor.tsx` - Já tinha funcionalidade básica

---

## 🧪 Testando

### Cenário 1: Supervisor visualiza agente
```
1. Login como supervisor
2. Ir para /supervisor
3. Clicar em "Acesso Rápido" de um agente
4. Verificar que dashboard mostra apenas dados daquele agente
5. Navegar para /leads e verificar filtro
6. Navegar para /pipelines e verificar filtro
7. Navegar para /metrics e verificar filtro
```

### Cenário 2: Trocar entre agentes
```
1. Estando em visualização de agente
2. Clicar no dropdown "Trocar Agente" no header
3. Selecionar outro agente
4. Verificar que todos os dados mudam instantaneamente
```

### Cenário 3: Voltar ao supervisor
```
1. Estando em visualização de agente
2. Clicar em "Voltar ao Supervisor" no banner
3. Verificar que retorna para /supervisor
4. Verificar que banner desaparece
```

---

## 🐛 Debugging

### Console Logs:
O sistema imprime logs úteis no console do navegador:

```javascript
// Quando troca de agente:
🎯 Trocando para agente: [Nome]

// Quando carrega dados:
📊 Index - Loading dashboard for: { viewingAgentId, isViewingAgent }
📊 Leads - Loading for: { viewingAgentId, isViewingAgent }
📊 Pipelines - Loading for: { viewingAgentId, isViewingAgent }
📊 Metrics - Loading for: { viewingAgentId, isViewingAgent }
```

### Verificar Estado:
```typescript
// No contexto TenantView:
const {
  viewingAgentId,        // ID do agente sendo visualizado
  viewingAgentName,      // Nome do agente
  isViewingAgent,        // true se está visualizando um agente
  canSwitchTenant        // true se tem permissão
} = useTenantView();
```

---

## 🚀 Melhorias Futuras (Opcional)

1. **Histórico de visualizações**
   - Salvar quais agentes foram visualizados
   - Acesso rápido aos últimos visualizados

2. **Comparação entre agentes**
   - Ver métricas de 2+ agentes lado a lado

3. **Notificações**
   - Alertar supervisor quando agente atinge meta
   - Notificar quando agente precisa ajuda

4. **Anotações**
   - Supervisor pode adicionar notas privadas sobre performance

5. **Relatórios automatizados**
   - Gerar relatório semanal de performance por agente
   - Exportar dados consolidados

---

## 📞 Suporte

Se encontrar algum problema:

1. Verificar logs no console do navegador
2. Verificar se usuário tem role `admin` ou `supervisor`
3. Verificar se agentes estão com `active = true`
4. Verificar conexão com Supabase Realtime

---

## ✅ Checklist de Funcionalidades

- [x] Dropdown de seleção de agente no header
- [x] Banner de visualização com navegação
- [x] Filtro automático no Dashboard
- [x] Filtro automático em Leads
- [x] Filtro automático em Pipelines
- [x] Filtro automático em Metrics
- [x] Acesso rápido no painel Supervisor
- [x] Permissões corretas (admin/supervisor)
- [x] Atualização em tempo real
- [x] Isolamento de dados por agente
- [x] Indicadores visuais claros
- [x] Documentação completa

---

**Implementado em:** Outubro 2025
**Status:** ✅ Completo e funcional





