# Chatwoot Conversations - Edge Function

Esta Edge Function do Supabase atua como um proxy seguro para a API do Chatwoot, resolvendo problemas de CORS e mantendo o token da API seguro no servidor.

## 📋 Configuração

### 1. Configurar Variável de Ambiente

No Supabase Dashboard:
1. Vá em **Edge Functions** → **Settings**
2. Adicione a variável de ambiente:
   ```
   CHATWOOT_API_TOKEN=HUYUHnVUAunUeAWpcUS8VWeK
   ```

### 2. Fazer o Deploy

```bash
# Na raiz do projeto
supabase functions deploy chatwoot-conversations
```

## 🚀 Uso

### Endpoint

```
GET https://{seu-projeto}.supabase.co/functions/v1/chatwoot-conversations
```

### Query Parameters

- `inbox_id` (opcional): ID do inbox para filtrar conversas
- `account_id` (opcional): ID da conta (padrão: 1)

### Exemplo de Requisição

```javascript
const response = await fetch(
  'https://xqeqaagnnkilihlfjbrm.supabase.co/functions/v1/chatwoot-conversations?inbox_id=1',
  {
    headers: {
      'Content-Type': 'application/json',
    },
  }
);

const data = await response.json();
console.log(data);
```

## ✨ Vantagens

1. **Sem CORS**: Não há problemas de CORS pois a requisição é feita para o mesmo domínio (Supabase)
2. **Token Seguro**: O token da API do Chatwoot fica armazenado no Supabase, não exposto no frontend
3. **Rate Limiting**: Você pode implementar rate limiting no Supabase
4. **Logs**: Todos os logs ficam centralizados no Supabase

## 🔧 Troubleshooting

### Erro 500: CHATWOOT_API_TOKEN not configured
- Verifique se a variável de ambiente foi configurada no Supabase Dashboard
- Certifique-se de que o deploy foi feito corretamente

### Erro 401: Token inválido
- Verifique se o token está correto no Supabase Dashboard
- Confirme que o token tem as permissões necessárias no Chatwoot

## 📝 Notas

- Esta função usa o header `api_access_token` correto para autenticar na API do Chatwoot
- Os logs ficam disponíveis no Supabase Dashboard em **Edge Functions** → **Logs**
