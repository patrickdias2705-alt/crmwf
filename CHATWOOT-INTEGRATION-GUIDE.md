# 🚀 Guia de Integração com Chatwoot

## 📋 Visão Geral

Este guia te ajudará a integrar seu CRM com o Chatwoot para centralizar todas as conversas do WhatsApp em um só lugar.

## 🎯 Benefícios da Integração

- ✅ **Centralização**: Todas as conversas em um só lugar
- ✅ **Interface Unificada**: Responda mensagens diretamente do CRM
- ✅ **Histórico Completo**: Mantenha o histórico de todas as conversas
- ✅ **Automação**: Webhooks para sincronizar dados automaticamente
- ✅ **Multi-canal**: Suporte a WhatsApp, Telegram, Facebook, etc.

## 🛠️ Configuração Passo a Passo

### 1. **Configurar Chatwoot**

#### 1.1 Acesse seu Chatwoot
- Vá para `https://seu-chatwoot.com`
- Faça login na sua conta

#### 1.2 Obter Credenciais
1. Vá em **Settings** → **API Tokens**
2. Clique em **Add New Token**
3. Dê um nome (ex: "CRM Integration")
4. Copie o **Access Token**
5. Anote o **Account ID** (está na URL ou em Settings → Account)

### 2. **Configurar o CRM**

#### 2.1 Atualizar Configurações
Edite o arquivo `src/components/ChatwootIntegration.tsx`:

```typescript
// Linha 25-27
const CHATWOOT_URL = 'https://seu-chatwoot.com'; // URL do seu Chatwoot
const ACCOUNT_ID = 'SEU_ACCOUNT_ID'; // ID da sua conta
const ACCESS_TOKEN = 'SEU_ACCESS_TOKEN'; // Token de acesso
```

#### 2.2 Executar Migração do Banco
Execute a migração no Supabase:

```sql
-- Execute este SQL no Supabase SQL Editor
-- Arquivo: supabase/migrations/20241224_chatwoot_integration.sql
```

### 3. **Configurar Webhook no Chatwoot**

#### 3.1 Criar Webhook
1. No Chatwoot, vá em **Settings** → **Webhooks**
2. Clique em **Add New Webhook**
3. URL do webhook: `https://seu-projeto.supabase.co/functions/v1/chatwoot-webhook`
4. Eventos selecionados:
   - ✅ `conversation.created`
   - ✅ `conversation.updated`
   - ✅ `message.created`

#### 3.2 Testar Webhook
- Envie uma mensagem de teste no Chatwoot
- Verifique os logs do Supabase Functions

### 4. **Configurar WhatsApp no Chatwoot**

#### 4.1 Adicionar Canal WhatsApp
1. No Chatwoot, vá em **Settings** → **Channels**
2. Clique em **Add Channel** → **WhatsApp**
3. Siga as instruções para conectar sua conta WhatsApp
4. Escaneie o QR Code com seu WhatsApp

#### 4.2 Verificar Conexão
- Teste enviando uma mensagem
- Verifique se aparece no Chatwoot

## 🎮 Como Usar

### 1. **Acessar Integração**
1. Vá para a página **WhatsApp** no seu CRM
2. Clique no botão **Chatwoot** (primeiro botão)
3. Configure as credenciais se necessário

### 2. **Gerenciar Conversas**
- **Ver conversas**: Lista todas as conversas abertas
- **Selecionar conversa**: Clique em uma conversa para ver mensagens
- **Responder**: Digite e envie mensagens
- **Alterar status**: Marcar como resolvida/pendente

### 3. **Funcionalidades Disponíveis**
- ✅ Listar conversas por status
- ✅ Ver histórico de mensagens
- ✅ Enviar mensagens
- ✅ Atualizar status da conversa
- ✅ Ver informações do contato
- ✅ Abrir Chatwoot em nova aba

## 🔧 Configurações Avançadas

### 1. **Personalizar Interface**
Edite `src/components/ChatwootIntegration.tsx` para:
- Alterar cores e estilos
- Adicionar novos campos
- Modificar layout

### 2. **Webhooks Personalizados**
Edite `supabase/functions/chatwoot-webhook/index.ts` para:
- Processar eventos específicos
- Adicionar lógica de negócio
- Integrar com outros sistemas

### 3. **Campos Customizados**
Adicione campos personalizados no Chatwoot:
- Vá em **Settings** → **Custom Attributes**
- Crie campos específicos para seu negócio
- Eles aparecerão automaticamente no CRM

## 📊 Estrutura do Banco de Dados

### Tabelas Criadas:
- `chatwoot_conversations`: Armazena conversas
- `chatwoot_messages`: Armazena mensagens
- `tenants`: Adicionada coluna `chatwoot_account_id`
- `leads`: Adicionada coluna `chatwoot_contact_id`

### Relacionamentos:
- Conversas → Leads (1:1)
- Conversas → Mensagens (1:N)
- Tenants → Conversas (1:N)

## 🚨 Solução de Problemas

### 1. **Erro de Conexão**
- Verifique se a URL do Chatwoot está correta
- Confirme se o Account ID e Access Token estão corretos
- Teste a conexão diretamente na API

### 2. **Webhook Não Funciona**
- Verifique se a URL do webhook está acessível
- Confirme se os eventos estão selecionados
- Verifique os logs do Supabase Functions

### 3. **Mensagens Não Aparecem**
- Verifique se o WhatsApp está conectado no Chatwoot
- Confirme se o webhook está funcionando
- Verifique os logs de erro

## 📈 Próximos Passos

### 1. **Automações**
- Configurar respostas automáticas
- Criar regras de roteamento
- Implementar chatbots

### 2. **Relatórios**
- Criar dashboards de conversas
- Métricas de atendimento
- Análise de performance

### 3. **Integrações Adicionais**
- Telegram
- Facebook Messenger
- Instagram
- Email

## 🆘 Suporte

Se precisar de ajuda:
1. Verifique os logs do console
2. Teste a API do Chatwoot diretamente
3. Verifique a documentação do Chatwoot
4. Entre em contato com o suporte

## 🎉 Conclusão

Com essa integração, você terá:
- ✅ Todas as conversas centralizadas
- ✅ Interface unificada no CRM
- ✅ Histórico completo de mensagens
- ✅ Sincronização automática
- ✅ Escalabilidade para múltiplos canais

**Agora você pode gerenciar todas as suas conversas do WhatsApp diretamente do seu CRM!** 🚀
