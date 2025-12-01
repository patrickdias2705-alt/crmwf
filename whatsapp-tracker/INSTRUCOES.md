# 🚀 INSTRUÇÕES DE SETUP - WhatsApp Tracker

## ✅ Passo a Passo Completo

### 1️⃣ Instalar Dependências

```bash
cd /Users/patrickdiasparis/Downloads/wa-flow-suite-main/whatsapp-tracker
npm install
```

Aguarde a instalação de todos os pacotes.

---

### 2️⃣ Configurar Variáveis de Ambiente

**Suas credenciais já estão pré-configuradas!**

O arquivo `.env` já foi criado com suas credenciais do Supabase:

```env
PORT=3000
WHATSAPP_NUMBER=5599999999999  # ALTERE PARA SEU NÚMERO
SUPABASE_URL=https://xqeqaagnnkilihlfjbrm.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**⚠️ AÇÕES NECESSÁRIAS:**

1. **Altere o `WHATSAPP_NUMBER`** para o seu número real (com DDI e DDD)
   ```
   Exemplo: 5511999999999
   ```

2. **Adicione sua `OPENAI_API_KEY`**
   - Acesse: https://platform.openai.com/api-keys
   - Crie uma nova chave
   - Cole no arquivo `.env`

3. **[OPCIONAL] Adicione a `SUPABASE_SERVICE_ROLE_KEY`**
   - Acesse: https://supabase.com/dashboard/project/xqeqaagnnkilihlfjbrm/settings/api
   - Copie a "service_role key" (secret)
   - Cole no arquivo `.env`

**Arquivo `.env` final deve ficar assim:**

```env
PORT=3000
WHATSAPP_NUMBER=5511988887777  # SEU NÚMERO AQUI
SUPABASE_URL=https://xqeqaagnnkilihlfjbrm.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhxZXFhYWdubmtpbGlobGZqYnJtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk1MjUwMDAsImV4cCI6MjA3NTEwMTAwMH0.98gOy6jKe_WYC0wTOBwM0j6SolYsWLOiB1Z-cm56gg0
SUPABASE_SERVICE_ROLE_KEY=sua-service-role-key-aqui
OPENAI_API_KEY=sk-proj-XXXXXXXX  # SUA CHAVE AQUI
```

---

### 3️⃣ Criar Tabela no Supabase

1. Acesse seu Supabase:
   https://supabase.com/dashboard/project/xqeqaagnnkilihlfjbrm

2. Vá em **SQL Editor** (menu lateral)

3. Clique em **New Query**

4. Copie TODO o conteúdo do arquivo `create-table.sql`

5. Cole no editor SQL

6. Clique em **Run** (ou pressione Cmd/Ctrl + Enter)

✅ A tabela `leads_whatsapp` será criada com índices e view de análises!

---

### 4️⃣ Iniciar o Servidor

```bash
npm start
```

Você verá:

```
🚀 ==========================================
   WhatsApp UTM Tracker rodando!
   http://localhost:3000
   ==========================================

📱 WhatsApp: 5511988887777
💾 Supabase: ✅ Conectado
🤖 OpenAI: ✅ Conectado

📚 Rotas disponíveis:
   GET  /go/whatsapp - Gerar link de tracking
   POST /webhook/whatsapp - Receber mensagem
   GET  /tracking/:code - Ver dados de tracking
   GET  /leads - Listar leads
   GET  /stats - Estatísticas
   GET  /health - Status do sistema

==========================================
```

---

### 5️⃣ Testar o Sistema

**Opção 1: Script de Teste Automatizado**

```bash
npm test
```

Este script vai:
- ✅ Verificar se o servidor está rodando
- ✅ Gerar um código de tracking
- ✅ Simular envio de mensagem
- ✅ Verificar se salvou no banco
- ✅ Mostrar estatísticas

**Opção 2: Teste Manual**

1. Abra o navegador em:
   ```
   http://localhost:3000/go/whatsapp?utm_source=instagram&utm_campaign=teste
   ```

2. Você será redirecionado para o WhatsApp com uma mensagem contendo um código

3. Copie o código da mensagem

4. Envie um POST para testar:

```bash
curl -X POST http://localhost:3000/webhook/whatsapp \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "5511999887766",
    "name": "João Teste",
    "message": "Oi! Quero saber do plano premium. Código: ABC12345"
  }'
```

*(Substitua ABC12345 pelo código que você copiou)*

5. Verifique no Supabase se o lead foi salvo:
   - Vá em **Table Editor**
   - Selecione `leads_whatsapp`
   - Veja o registro criado!

---

## 📖 Como Usar em Produção

### Criar Link de Campanha

**Instagram:**
```
https://seudominio.com/go/whatsapp?utm_source=instagram&utm_medium=social&utm_campaign=promo_verao
```

**Facebook Ads:**
```
https://seudominio.com/go/whatsapp?utm_source=facebook&utm_medium=cpc&utm_campaign=black_friday
```

**Google Ads:**
```
https://seudominio.com/go/whatsapp?utm_source=google&utm_medium=cpc&utm_campaign=produto_x
```

### Integrar com Evolution API

Se você usa Evolution API para receber mensagens do WhatsApp:

```javascript
// No webhook da Evolution API
const evolutionWebhook = async (req, res) => {
  const { key, message } = req.body;
  
  // Extrai dados
  const phone = key.remoteJid.replace('@s.whatsapp.net', '');
  const text = message.conversation || message.extendedTextMessage?.text;
  
  // Envia para o tracker
  await fetch('http://localhost:3000/webhook/whatsapp', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      phone: phone,
      name: key.pushName || 'Cliente',
      message: text
    })
  });
};
```

---

## 📊 Ver Leads e Estatísticas

### No Navegador

```
http://localhost:3000/leads
http://localhost:3000/stats
```

### No Supabase

```sql
-- Ver todos os leads
SELECT * FROM leads_whatsapp ORDER BY criado_em DESC;

-- Leads de interesse alto
SELECT nome, telefone, produto_interesse, utm_source, utm_campaign
FROM leads_whatsapp
WHERE grau_interesse = 'alto'
ORDER BY criado_em DESC;

-- Análise por origem
SELECT * FROM leads_whatsapp_stats;
```

---

## 🐛 Problemas Comuns

### 1. "Cannot find module 'express'"

**Solução:**
```bash
npm install
```

### 2. "OPENAI_API_KEY is required"

**Solução:**
- Adicione sua chave da OpenAI no arquivo `.env`
- Reinicie o servidor

### 3. "relation 'leads_whatsapp' does not exist"

**Solução:**
- Execute o SQL do arquivo `create-table.sql` no Supabase
- Verifique se executou sem erros

### 4. "ECONNREFUSED Supabase"

**Solução:**
- Verifique se `SUPABASE_URL` está correto
- Teste acessando a URL no navegador
- Verifique sua conexão com internet

### 5. ChatGPT retorna erro 429

**Solução:**
- Você atingiu o limite de requisições
- Aguarde alguns minutos
- Ou use um modelo mais barato: `gpt-3.5-turbo`

---

## 🚀 Deploy em Produção

### Heroku (Recomendado)

```bash
# Login
heroku login

# Criar app
heroku create meu-whatsapp-tracker

# Configurar variáveis
heroku config:set PORT=3000
heroku config:set WHATSAPP_NUMBER=5511999999999
heroku config:set SUPABASE_URL=https://xqeqaagnnkilihlfjbrm.supabase.co
heroku config:set SUPABASE_ANON_KEY=eyJ...
heroku config:set OPENAI_API_KEY=sk-proj-...

# Deploy
git add .
git commit -m "Deploy WhatsApp Tracker"
git push heroku main

# Ver logs
heroku logs --tail
```

Seu app estará em: `https://meu-whatsapp-tracker.herokuapp.com`

### Railway

1. Acesse: https://railway.app
2. Conecte seu GitHub
3. Deploy this repository
4. Adicione as variáveis de ambiente
5. Deploy!

### VPS/Servidor Próprio

```bash
# Instalar PM2
npm install -g pm2

# Iniciar
pm2 start index.js --name whatsapp-tracker

# Salvar
pm2 save

# Auto-start no boot
pm2 startup
```

---

## 📱 URLs de Exemplo

Use estas URLs para seus links de marketing:

**Instagram Bio:**
```
https://seudominio.com/go/whatsapp?utm_source=instagram&utm_medium=bio&utm_campaign=perfil
```

**Instagram Stories:**
```
https://seudominio.com/go/whatsapp?utm_source=instagram&utm_medium=story&utm_campaign=promocao_verao&utm_content=story_001
```

**Facebook Post:**
```
https://seudominio.com/go/whatsapp?utm_source=facebook&utm_medium=post&utm_campaign=lancamento_produto
```

**Email Marketing:**
```
https://seudominio.com/go/whatsapp?utm_source=email&utm_medium=newsletter&utm_campaign=ofertas_janeiro
```

---

## ✅ Checklist Final

- [ ] `npm install` executado com sucesso
- [ ] Arquivo `.env` configurado com suas credenciais
- [ ] `WHATSAPP_NUMBER` alterado para seu número
- [ ] `OPENAI_API_KEY` adicionada
- [ ] Tabela criada no Supabase (executou `create-table.sql`)
- [ ] Servidor iniciado (`npm start`)
- [ ] Teste executado (`npm test`)
- [ ] Primeiro lead criado com sucesso
- [ ] Verificado no Supabase que o lead foi salvo

---

## 📞 Suporte

**Documentação completa:** `README.md`

**Testes:** `npm test`

**Health check:** http://localhost:3000/health

---

**Pronto! Seu sistema de rastreamento está funcionando!** 🎉

Agora você pode:
- ✅ Rastrear de onde cada lead veio
- ✅ Analisar mensagens com IA
- ✅ Gerar respostas automaticamente
- ✅ Ver estatísticas por campanha
- ✅ Otimizar seus investimentos em mídia

**Boas vendas!** 🚀



