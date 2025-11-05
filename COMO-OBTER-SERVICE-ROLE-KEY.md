# 🔑 Como Obter a Service Role Key do Supabase

## 📍 Localização da Service Role Key

1. **Acesse o Dashboard do Supabase**
   - Vá para: https://app.supabase.com
   - Faça login com sua conta

2. **Selecione seu Projeto**
   - Clique no projeto: **CRM Pro** (ou o nome do seu projeto)

3. **Vá em Settings**
   - No menu lateral esquerdo, clique em **Settings**
   - Depois clique em **API**

4. **Copie a Service Role Key**
   - Role até a seção **Project API keys**
   - Encontre a chave **service_role** (secret)
   - Clique no ícone de **copiar** ou **revelar** para ver a chave completa
   - ⚠️ **ATENÇÃO**: Esta chave dá acesso total ao seu banco. Não compartilhe!

## 🔐 Como Usar a Service Role Key

### No SQL:
```sql
-- Substitua 'SUA_SERVICE_ROLE_KEY_AQUI' pela chave real
DO $$
DECLARE
  v_service_role_key TEXT := 'SUA_CHAVE_AQUI';  -- COLE A CHAVE AQUI
  -- ... resto do código
```

### No Código (TypeScript/JavaScript):
```typescript
const serviceRoleKey = 'SUA_CHAVE_AQUI';
```

### No Código (Python):
```python
service_role_key = 'SUA_CHAVE_AQUI'
```

## ⚠️ Segurança

- **NUNCA** compartilhe a Service Role Key publicamente
- **NUNCA** commite a chave no Git
- Use variáveis de ambiente em produção
- A Service Role Key dá acesso total ao banco de dados

## 🎯 Alternativa Mais Segura

Se preferir não usar a Service Role Key diretamente no SQL, use o Dashboard do Supabase para resetar a senha manualmente (mais seguro e mais fácil).

