# 🚀 Quick Start - Rastreamento Automático

Guia rápido para começar a rastrear a origem dos seus leads.

## ⚡ Setup em 5 Minutos

### 1️⃣ Rode a Migration

Execute a migration para adicionar os campos de tracking:

```bash
# No diretório do projeto
supabase migration up
```

Ou execute manualmente no SQL Editor do Supabase:

```sql
-- Copie e cole o conteúdo de:
supabase/migrations/20250108000000_add_lead_tracking_fields.sql
```

### 2️⃣ Deploy da Edge Function

```bash
# Deploy da função de captura de leads
supabase functions deploy lead-capture
```

### 3️⃣ Configure seu Formulário Web

Use o arquivo `exemplo-formulario-tracking.html` como base.

**Altere estas 3 variáveis:**

```javascript
const CONFIG = {
    SUPABASE_URL: 'https://seu-projeto.supabase.co',
    SUPABASE_ANON_KEY: 'sua-chave-anon-aqui',
    TENANT_ID: 'seu-tenant-id-aqui'
};
```

### 4️⃣ Adicione Parâmetros UTM aos seus Links

**Instagram Bio:**
```
https://seusite.com?utm_source=instagram&utm_medium=social&utm_campaign=bio_link
```

**Facebook Ads:**
```
https://seusite.com?utm_source=facebook&utm_medium=cpc&utm_campaign={{campaign.name}}&ad_id={{ad.id}}
```

**Google Ads (Modelo de Rastreamento):**
```
{lpurl}?utm_source=google&utm_medium=cpc&utm_campaign={campaignid}&utm_term={keyword}
```

## 📊 Ver os Resultados

Os leads agora aparecem no Kanban com badges coloridos indicando a origem:

- 🟣 Instagram
- 🔵 Facebook  
- 🟢 WhatsApp
- 🟡 Google Ads
- ⚪ Site

## 🔍 Análises Rápidas

```sql
-- Total de leads por origem
SELECT 
  origin,
  utm_campaign,
  COUNT(*) as total
FROM leads
WHERE created_at >= NOW() - INTERVAL '30 days'
GROUP BY origin, utm_campaign
ORDER BY total DESC;

-- Ou use a view pronta
SELECT * FROM lead_tracking_summary
WHERE tenant_id = 'seu-tenant-id';
```

## 📱 Exemplos de URLs Prontos

### Instagram Story/Post
```
https://seusite.com?utm_source=instagram&utm_medium=social&utm_campaign=promo_verao
```

### Facebook Orgânico
```
https://seusite.com?utm_source=facebook&utm_medium=social&utm_campaign=post_blog
```

### WhatsApp Status
```
https://seusite.com?utm_source=whatsapp&utm_medium=status&utm_campaign=lancamento
```

### Email Marketing
```
https://seusite.com?utm_source=email&utm_medium=newsletter&utm_campaign=ofertas_semanais
```

## 🧪 Testar

1. Acesse seu site com parâmetros UTM:
```
https://seusite.com?utm_source=teste&utm_campaign=verificacao
```

2. Preencha o formulário

3. Verifique no dashboard se o lead aparece com a origem "teste"

## 🆘 Problemas Comuns

### Lead não tem origem

✅ **Solução:** Verifique se os parâmetros UTM estão na URL ao acessar o formulário.

### Parâmetros somem ao navegar

✅ **Solução:** O código usa `sessionStorage` para persistir. Certifique-se de que o JavaScript está carregando.

### Erro 400 na API

✅ **Solução:** Verifique se `tenant_id`, `SUPABASE_URL` e `SUPABASE_ANON_KEY` estão corretos.

## 📚 Próximos Passos

- Leia a [documentação completa](./TRACKING-AUTOMATICO-LEADS.md)
- Configure integrações com Meta Ads
- Crie dashboards personalizados
- Configure alertas para leads de campanhas específicas

## 🎯 URLs de Teste

Use estas URLs para testar cada origem:

```bash
# Instagram
http://localhost:5173?utm_source=instagram&utm_campaign=teste_ig

# Facebook
http://localhost:5173?utm_source=facebook&utm_campaign=teste_fb

# Google Ads
http://localhost:5173?utm_source=google&utm_medium=cpc&utm_campaign=teste_google

# WhatsApp
http://localhost:5173?utm_source=whatsapp&utm_campaign=teste_wa
```

---

**Pronto!** Seus leads agora estão sendo rastreados automaticamente! 🎉

