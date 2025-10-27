# 🚀 Comandos Supabase - Guia Rápido

## 📋 Checklist

### 1. Instalar CLI (se necessário)
```bash
# macOS
brew install supabase/tap/supabase

# Verificar instalação
supabase --version
```

### 2. Login no Supabase
```bash
supabase login
```

### 3. Configurar Secret
```bash
# Adicionar token do Chatwoot
supabase secrets set CHATWOOT_API_TOKEN=HUYUHnVUAunUeAWpcUS8VWeK

# Verificar se foi adicionado
supabase secrets list
```

### 4. Deploy da Função
```bash
# Opção 1: Usar script
./deploy-chatwoot-function.sh

# Opção 2: Comando direto
supabase functions deploy chatwoot-conversations
```

### 5. Verificar Deploy
```bash
# Listar funções
supabase functions list

# Ver logs
supabase functions logs chatwoot-conversations --limit 50
```

## 🔍 Verificar Status

### Listar projetos
```bash
supabase projects list
```

### Linkar com projeto
```bash
supabase link --project-ref xqeqaagnnkilihlfjbrm
```

### Ver informações do projeto
```bash
supabase status
```

## 🐛 Troubleshooting

### Erro: "not logged in"
```bash
supabase login
```

### Erro: "project not linked"
```bash
supabase link --project-ref xqeqaagnnkilihlfjbrm
```

### Erro: "function not found"
```bash
# Verificar se está no diretório correto
pwd
# Deve mostrar: /Users/patrickdiasparis/crmwf-main

# Listar funções
ls -la supabase/functions/
```

### Ver logs de erro
```bash
# Logs em tempo real
supabase functions logs chatwoot-conversations --tail

# Últimos logs
supabase functions logs chatwoot-conversations --limit 100
```

## 🧪 Testar Função

### Via curl
```bash
curl https://xqeqaagnnkilihlfjbrm.supabase.co/functions/v1/chatwoot-conversations
```

### Via curl com parametros
```bash
curl "https://xqeqaagnnkilihlfjbrm.supabase.co/functions/v1/chatwoot-conversations?inbox_id=1"
```

## 📝 Comandos Úteis

### Ver todas as funções
```bash
supabase functions list
```

### Remover função
```bash
supabase functions delete chatwoot-conversations
```

### Atualizar secret
```bash
supabase secrets set CHATWOOT_API_TOKEN=novo_token_aqui
```

### Ver secret
```bash
# Não é possível ver o valor, apenas listar
supabase secrets list
```

## 🔗 Links Úteis

- **Dashboard**: https://app.supabase.com
- **Documentação**: https://supabase.com/docs/guides/functions
- **CLI Reference**: https://supabase.com/docs/reference/cli
