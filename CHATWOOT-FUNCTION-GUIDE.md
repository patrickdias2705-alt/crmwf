# 🚀 Guia - Chatwoot Edge Function

## 📋 Visão Geral

Esta função permite buscar conversas do Chatwoot através do inbox_id, resolvendo problemas de CORS e fornecendo uma API limpa para o frontend.

## 🔧 Configuração

### 1. Configurar a variável de ambiente

No Supabase Dashboard:
1. Vá em **Edge Functions** → **Settings**
2. Adicione a variável de ambiente:

```bash
CHATWOOT_API_TOKEN=HUYUHnVUAunUeAWpcUS8VWeK
```

### 2. Deploy da função

```bash
# Deploy da função no Supabase
supabase functions deploy get-chatwoot-conversations
```

## 📡 Como Usar

### Endpoint

```
GET /functions/v1/get-chatwoot-conversations?inbox_id={inbox_id}
```

### Parâmetros

- `inbox_id` (obrigatório): ID do inbox do Chatwoot

### Exemplo de Requisição

```typescript
// No seu componente React
const fetchChatwootConversations = async (inboxId: string) => {
  const supabase = createClient(...)
  
  const { data, error } = await supabase.functions.invoke('get-chatwoot-conversations', {
    body: {}, // Parâmetros vão no query string
  })
  
  // Ou usando fetch diretamente
  const response = await fetch(
    `${supabaseUrl}/functions/v1/get-chatwoot-conversations?inbox_id=${inboxId}`
  )
  const result = await response.json()
}
```

### Resposta

```json
{
  "data": [
    {
      "id": 123,
      "status": "open",
      "account_id": 1,
      "contact": {
        "id": 456,
        "name": "João Silva",
        "phone_number": "5511999999999",
        "email": "joao@example.com"
      },
      "created_at": "2025-01-15T10:00:00Z",
      "updated_at": "2025-01-15T11:00:00Z"
    }
  ]
}
```

## 🎯 Vantagens desta Abordagem

1. **Sem CORS**: A função roda no servidor, evitando problemas de CORS
2. **Token Seguro**: O token fica apenas no servidor
3. **Header Correto**: Usa `api_access_token` como esperado pelo Chatwoot
4. **Centralizada**: Uma única função para todas as chamadas ao Chatwoot

## 🧪 Testar Localmente

```bash
# 1. Start Supabase local
supabase start

# 2. Set environment variable
export CHATWOOT_API_TOKEN=HUYUHnVUAunUeAWpcUS8VWeK

# 3. Serve a função
supabase functions serve get-chatwoot-conversations

# 4. Testar
curl "http://localhost:54321/functions/v1/get-chatwoot-conversations?inbox_id=1"
```

## 🔐 Segurança

- ✅ Token armazenado como variável de ambiente
- ✅ CORS configurado corretamente
- ✅ Validação de parâmetros
- ✅ Tratamento de erros

## 📝 Próximos Passos

1. Configurar variável de ambiente no Supabase
2. Fazer deploy da função
3. Atualizar o frontend para usar esta função
4. Remover chamadas diretas à API do Chatwoot
