# 🚀 Chatwoot Edge Function - Implementação Completa

## 📋 Resumo

Implementamos uma Edge Function do Supabase para fazer proxy das chamadas à API do Chatwoot, resolvendo problemas de CORS e mantendo o token seguro no servidor.

## ✨ O Que Foi Implementado

### 1. **Edge Function do Supabase**
- **Arquivo**: `supabase/functions/chatwoot-conversations/index.ts`
- **Função**: Proxy seguro para a API do Chatwoot
- **Vantagens**:
  - Elimina problemas de CORS
  - Mantém o token da API seguro no servidor
  - Suporta logs centralizados
  - Permite rate limiting

### 2. **Componente WhatsAppChat Atualizado**
- **Arquivo**: `src/components/WhatsAppChat.tsx`
- **Mudanças**:
  - Agora usa a Edge Function em vez de chamar a API diretamente
  - URL: `/functions/v1/chatwoot-conversations?inbox_id={id}`
  - Sem problemas de CORS

### 3. **Configuração do Vite**
- **Arquivo**: `vite.config.ts`
- **Proxy adicionado**:
  ```typescript
  '/functions/v1': {
    target: 'https://xqeqaagnnkilihlfjbrm.supabase.co',
    changeOrigin: true,
  }
  ```

## 🚀 Como Usar

### 1. Configurar Variável de Ambiente

No Supabase Dashboard:
1. Vá em **Edge Functions** → **Settings**
2. Adicione a variável:
   ```
   CHATWOOT_API_TOKEN=HUYUHnVUAunUeAWpcUS8VWeK
   ```

### 2. Fazer o Deploy

```bash
# Opção 1: Usar o script
./deploy-chatwoot-function.sh

# Opção 2: Comando direto
supabase functions deploy chatwoot-conversations
```

### 3. Testar

1. Acesse http://localhost:8080
2. Clique no botão "Chatwoot" na sidebar
3. As conversas devem aparecer

## 📡 Endpoint

```
GET /functions/v1/chatwoot-conversations?inbox_id={id}
```

### Parâmetros
- `inbox_id` (opcional): ID do inbox para filtrar conversas
- `account_id` (opcional): ID da conta (padrão: 1)

### Resposta
```json
{
  "payload": [
    {
      "id": 1,
      "status": "open",
      "contact": {
        "id": 1,
        "name": "João Silva",
        "phone_number": "+5511999999999",
        "email": "joao@example.com"
      },
      "created_at": "2024-01-01T00:00:00Z",
      "updated_at": "2024-01-01T00:00:00Z"
    }
  ]
}
```

## 🔧 Troubleshooting

### Problema: Erro 404
**Solução**: Verifique se a função foi deployada corretamente
```bash
supabase functions list
```

### Problema: Erro 500 (Token não configurado)
**Solução**: Configure a variável de ambiente no Supabase Dashboard

### Problema: Erro 401 (Token inválido)
**Solução**: Verifique se o token está correto no Supabase Dashboard

### Problema: CORS ainda aparece
**Solução**: Reinicie o servidor de desenvolvimento
```bash
pkill -f "vite" && npm run dev
```

## 📝 Arquivos Criados/Modificados

### Criados
- `supabase/functions/chatwoot-conversations/index.ts`
- `supabase/functions/chatwoot-conversations/README.md`
- `deploy-chatwoot-function.sh`

### Modificados
- `src/components/WhatsAppChat.tsx`
- `vite.config.ts`

## 🎯 Próximos Passos

1. ✅ Configurar variável de ambiente
2. ✅ Fazer deploy da função
3. ✅ Testar no navegador
4. ⏳ Adicionar funcionalidade de envio de mensagens via Edge Function
5. ⏳ Implementar rate limiting
6. ⏳ Adicionar cache das conversas

## 💡 Vantagens da Implementação

1. **Segurança**: Token não exposto no frontend
2. **Performance**: Possibilidade de cache no servidor
3. **Monitoramento**: Logs centralizados no Supabase
4. **Escalabilidade**: Rate limiting e autenticação
5. **Confiabilidade**: Sem problemas de CORS

## 📞 Suporte

Para mais informações, consulte:
- `supabase/functions/chatwoot-conversations/README.md`
- Dashboard do Supabase: https://app.supabase.com
