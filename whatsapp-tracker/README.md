# 📱 WhatsApp UTM Tracker com IA

Sistema backend Node.js para rastreamento automático de leads do WhatsApp com parâmetros UTM e análise por inteligência artificial (ChatGPT).

## 🎯 Funcionalidades

- ✅ Geração de códigos únicos de rastreamento
- ✅ Redirecionamento automático para WhatsApp
- ✅ Captura de parâmetros UTM (source, medium, campaign, term, content)
- ✅ Análise inteligente de mensagens com ChatGPT
- ✅ Extração automática de: nome, produto, grau de interesse
- ✅ Geração de respostas sugeridas pela IA
- ✅ Salvamento no Supabase
- ✅ API REST completa
- ✅ Estatísticas e relatórios
- ✅ Suporte multi-tenant

---

## 🚀 Quick Start

### 1. Instalação

```bash
cd whatsapp-tracker
npm install
```

### 2. Configuração

Crie o arquivo `.env` com suas credenciais:

```env
PORT=3000
WHATSAPP_NUMBER=5511999999999
SUPABASE_URL=https://xqeqaagnnkilihlfjbrm.supabase.co
SUPABASE_ANON_KEY=sua-anon-key
SUPABASE_SERVICE_ROLE_KEY=sua-service-role-key
OPENAI_API_KEY=sk-proj-xxxxx
```

### 3. Criar Tabela no Supabase

Execute o SQL do arquivo `create-table.sql` no Supabase SQL Editor.

### 4. Iniciar o Servidor

```bash
npm start
```

O servidor estará rodando em `http://localhost:3000`

### 5. Testar

```bash
npm test
```

---

## 📚 API Endpoints

### 1. GET `/go/whatsapp` - Gerar Link de Tracking

Cria um código único e redireciona para o WhatsApp.

**Parâmetros:**
- `utm_source` - Origem (instagram, facebook, google, etc)
- `utm_medium` - Meio (social, cpc, email, etc)
- `utm_campaign` - Nome da campanha
- `utm_term` - Termo de busca (opcional)
- `utm_content` - Conteúdo/variação (opcional)

**Exemplo:**
```
GET /go/whatsapp?utm_source=instagram&utm_medium=social&utm_campaign=promo_verao
```

**Resposta:**
Redireciona para:
```
https://wa.me/5511999999999?text=Olá! Quero saber mais. Código: abc12345
```

---

### 2. POST `/webhook/whatsapp` - Receber Mensagem

Processa mensagem recebida do WhatsApp, analisa com IA e salva no banco.

**Body:**
```json
{
  "phone": "5511999887766",
  "name": "João Silva",
  "message": "Oi! Quero saber do plano premium. Código: abc12345"
}
```

**Resposta:**
```json
{
  "success": true,
  "lead_id": "uuid-do-lead",
  "tracking": {
    "codigo": "abc12345",
    "origem": "instagram",
    "campanha": "promo_verao"
  },
  "analise": {
    "interesse": "alto",
    "produto": "plano premium",
    "intencao": "compra"
  },
  "resposta_sugerida": "Olá João! Que ótimo..."
}
```

---

### 3. GET `/tracking/:code` - Consultar Código

Verifica dados de um código de tracking.

**Exemplo:**
```
GET /tracking/abc12345
```

**Resposta:**
```json
{
  "code": "abc12345",
  "tracking": {
    "utm_source": "instagram",
    "utm_medium": "social",
    "utm_campaign": "promo_verao",
    "timestamp": "2025-01-08T10:30:00Z"
  },
  "status": "ativo"
}
```

---

### 4. GET `/leads` - Listar Leads

Lista leads com paginação e filtros.

**Parâmetros:**
- `page` - Número da página (padrão: 1)
- `limit` - Itens por página (padrão: 50)
- `utm_source` - Filtrar por origem
- `utm_campaign` - Filtrar por campanha
- `grau_interesse` - Filtrar por interesse (alto, médio, baixo)

**Exemplo:**
```
GET /leads?page=1&limit=20&utm_source=instagram&grau_interesse=alto
```

**Resposta:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "nome": "João Silva",
      "telefone": "5511999887766",
      "mensagem": "...",
      "utm_source": "instagram",
      "utm_campaign": "promo_verao",
      "grau_interesse": "alto",
      "produto_interesse": "plano premium",
      "criado_em": "2025-01-08T10:30:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "pages": 8
  }
}
```

---

### 5. GET `/stats` - Estatísticas

Retorna estatísticas agregadas de leads.

**Exemplo:**
```
GET /stats
```

**Resposta:**
```json
{
  "success": true,
  "stats": {
    "total": 156,
    "por_origem": {
      "instagram": 89,
      "facebook": 45,
      "google": 22
    },
    "por_campanha": {
      "promo_verao": 67,
      "black_friday": 89
    },
    "por_interesse": {
      "alto": 45,
      "médio": 78,
      "baixo": 33
    }
  }
}
```

---

### 6. GET `/health` - Health Check

Verifica status do sistema.

**Exemplo:**
```
GET /health
```

**Resposta:**
```json
{
  "status": "OK",
  "timestamp": "2025-01-08T10:30:00Z",
  "uptime": 3600,
  "env": {
    "has_supabase": true,
    "has_openai": true,
    "whatsapp_number": "configurado"
  },
  "codes_cache": 5
}
```

---

## 🔄 Fluxo Completo

### 1. Usuário Clica no Link

```
https://seusite.com/go/whatsapp?utm_source=instagram&utm_campaign=promo
```

↓

### 2. Sistema Gera Código

```javascript
código: "abc12345"
utm_source: "instagram"
utm_campaign: "promo"
```

↓

### 3. Redireciona para WhatsApp

```
https://wa.me/5511999999999?text=Olá! Quero saber mais. Código: abc12345
```

↓

### 4. Lead Envia Mensagem

```
"Oi! Quero saber do plano premium. Código: abc12345"
```

↓

### 5. Webhook Recebe

```javascript
{
  phone: "5511999887766",
  name: "João",
  message: "Oi! Quero saber do plano premium. Código: abc12345"
}
```

↓

### 6. Sistema Busca UTMs pelo Código

```javascript
origemUTMs["abc12345"] = {
  utm_source: "instagram",
  utm_campaign: "promo"
}
```

↓

### 7. Envia para ChatGPT

```
Prompt: "Analise a mensagem: 'Oi! Quero saber do plano premium...'"
```

↓

### 8. IA Responde

```json
{
  "nome_extraido": "João",
  "produto_interesse": "plano premium",
  "grau_interesse": "alto",
  "intencao": "compra",
  "resposta_sugerida": "Olá João! Que ótimo..."
}
```

↓

### 9. Salva no Supabase

```sql
INSERT INTO leads_whatsapp (
  nome, telefone, mensagem, codigo,
  utm_source, utm_campaign,
  grau_interesse, produto_interesse,
  resposta_ia
) VALUES (...)
```

---

## 📊 Análises SQL

### Top Campanhas

```sql
SELECT 
  utm_campaign,
  utm_source,
  COUNT(*) as total_leads,
  COUNT(CASE WHEN grau_interesse = 'alto' THEN 1 END) as interesse_alto,
  ROUND(
    COUNT(CASE WHEN grau_interesse = 'alto' THEN 1 END) * 100.0 / COUNT(*),
    2
  ) as taxa_interesse_alto
FROM leads_whatsapp
WHERE criado_em >= NOW() - INTERVAL '30 days'
GROUP BY utm_campaign, utm_source
ORDER BY total_leads DESC;
```

### Performance por Origem

```sql
SELECT 
  utm_source,
  COUNT(*) as total,
  AVG(CASE 
    WHEN grau_interesse = 'alto' THEN 3
    WHEN grau_interesse = 'médio' THEN 2
    WHEN grau_interesse = 'baixo' THEN 1
  END) as score_medio
FROM leads_whatsapp
GROUP BY utm_source
ORDER BY score_medio DESC;
```

### Leads Quentes (últimas 24h)

```sql
SELECT 
  nome,
  telefone,
  produto_interesse,
  utm_source,
  utm_campaign,
  criado_em
FROM leads_whatsapp
WHERE grau_interesse = 'alto'
  AND criado_em >= NOW() - INTERVAL '24 hours'
ORDER BY criado_em DESC;
```

---

## 🔧 Configuração Avançada

### Redis para Cache (Recomendado em Produção)

```javascript
const redis = require('redis');
const client = redis.createClient({
  host: 'localhost',
  port: 6379
});

// Salvar código
await client.setex(`utm:${code}`, 86400, JSON.stringify(tracking));

// Buscar código
const data = await client.get(`utm:${code}`);
```

### Variáveis de Ambiente Completas

```env
# Servidor
PORT=3000
NODE_ENV=production

# WhatsApp
WHATSAPP_NUMBER=5511999999999

# Supabase
SUPABASE_URL=https://xqeqaagnnkilihlfjbrm.supabase.co
SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# OpenAI
OPENAI_API_KEY=sk-proj-...
OPENAI_MODEL=gpt-4
OPENAI_MAX_TOKENS=500

# Multi-tenant
DEFAULT_TENANT_ID=uuid-tenant

# Redis (opcional)
REDIS_URL=redis://localhost:6379

# Logs
LOG_LEVEL=info
```

---

## 🐛 Troubleshooting

### Erro: "Tabela leads_whatsapp não existe"

**Solução:** Execute o SQL em `create-table.sql` no Supabase.

### Erro: "OpenAI API error"

**Solução:** Verifique se `OPENAI_API_KEY` está correto e tem créditos.

### Código não encontrado

**Solução:** Os códigos expiram após 24 horas. Use Redis para persistência maior.

### WhatsApp não redireciona

**Solução:** Verifique se `WHATSAPP_NUMBER` está no formato correto (DDI + DDD + número).

---

## 📦 Deploy

### Heroku

```bash
heroku create whatsapp-tracker
heroku config:set SUPABASE_URL=...
heroku config:set OPENAI_API_KEY=...
git push heroku main
```

### Docker

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
```

### PM2 (Produção)

```bash
npm install -g pm2
pm2 start index.js --name whatsapp-tracker
pm2 save
pm2 startup
```

---

## 📝 Licença

MIT

---

## 🤝 Contribuindo

Pull requests são bem-vindos!

---

## 📞 Suporte

- Documentação: Este README
- Issues: GitHub Issues
- Email: suporte@seudominio.com

---

**Desenvolvido com ❤️ para rastreamento inteligente de leads do WhatsApp**



