# 📱 Exemplos de Integração por Plataforma

Guia visual com exemplos práticos para cada plataforma.

---

## 🟣 Instagram

### 1. Link na Bio

✅ **Quando usar:** Para direcionar seguidores do perfil

```
👉 Acesse: link.seunegocio.com

URL real:
https://seusite.com?utm_source=instagram&utm_medium=social&utm_campaign=bio_link&utm_content=perfil
```

**Resultado no Sistema:**
- Origin: `instagram` 🟣
- Campaign: `bio_link`
- Badge: Gradiente roxo/rosa

---

### 2. Stories com Link

✅ **Quando usar:** Promoções temporárias, lançamentos

```
🔥 PROMOÇÃO 24H
Arraste para cima!

URL:
https://seusite.com?utm_source=instagram&utm_medium=social&utm_campaign=promo_24h&utm_content=story_{{data}}
```

**Dica:** Mude `utm_content` para cada story diferente para saber qual performou melhor.

---

### 3. Anúncios (Instagram Ads)

✅ **Setup no Gerenciador de Anúncios:**

**Localização:** Anúncio > Configuração > Parâmetros de URL

```
utm_source=instagram&utm_medium=cpc&utm_campaign={{campaign.name}}&utm_content={{ad.name}}&ad_id={{ad.id}}&adset={{adset.name}}
```

**Exemplo de URL Final:**
```
https://seusite.com?utm_source=instagram&utm_medium=cpc&utm_campaign=Campanha_Verao_2024&utm_content=Criativo_Banner_Azul&ad_id=23851234567890&adset=Publico_Feminino_25_35
```

**Resultado no Sistema:**
- Origin: `instagram` 🟣
- Medium: `Anúncio Pago`
- Campaign: `Campanha_Verao_2024`
- Ad Name: `Criativo_Banner_Azul`
- Ad ID: `23851234567890`

---

### 4. Reels/Posts com Link

✅ **Use encurtadores com UTM:**

```
Original:
https://seusite.com?utm_source=instagram&utm_medium=social&utm_campaign=reel_tutorial&utm_content=reel_001

Encurtado (bit.ly ou similar):
https://bit.ly/tutorial-001
```

---

## 🔵 Facebook

### 1. Posts Orgânicos

✅ **Exemplo:**

```
📢 Novidade! 
Confira nosso novo serviço: 
👉 https://seusite.com?utm_source=facebook&utm_medium=social&utm_campaign=lancamento_servico&utm_content=post_01
```

---

### 2. Facebook Ads

✅ **Setup no Gerenciador de Anúncios:**

**Localização:** Anúncio > Rastreamento > Parâmetros de URL

```
utm_source=facebook&utm_medium=cpc&utm_campaign={{campaign.name}}&utm_content={{ad.name}}&ad_id={{ad.id}}&placement={{placement}}
```

**Exemplo Real:**
```
https://seusite.com?utm_source=facebook&utm_medium=cpc&utm_campaign=Black_Friday_2024&utm_content=Video_30s&ad_id=6789012345&placement=feed
```

**Parâmetros Especiais do Facebook:**
- `{{campaign.name}}` - Nome da campanha
- `{{ad.name}}` - Nome do anúncio
- `{{ad.id}}` - ID do anúncio
- `{{adset.name}}` - Nome do conjunto de anúncios
- `{{placement}}` - Onde o anúncio apareceu (feed, stories, etc)
- `{{site_source_name}}` - Nome do site/app

---

### 3. Messenger com Chatbot

✅ **Integração via API:**

Quando o lead inicia conversa no Messenger:

```javascript
// Webhook recebe mensagem do Messenger
{
  "sender": {"id": "123456789"},
  "message": {"text": "Olá!"},
  "ref": "promo_verao" // Parâmetro do link que iniciou conversa
}

// Envia para API de captura
POST /functions/v1/lead-capture
{
  "tenant_id": "...",
  "phone": "5511999999999",
  "name": "Lead do Messenger",
  "utm_source": "facebook",
  "utm_medium": "messenger",
  "utm_campaign": "promo_verao"
}
```

---

## 🌐 Google Ads

### Configuração do Modelo de Rastreamento

✅ **Localização:** Campanha > Configurações > Opções de URL > Modelo de rastreamento

```
{lpurl}?utm_source=google&utm_medium=cpc&utm_campaign={campaignid}&utm_term={keyword}&utm_content={creative}&gclid={gclid}&device={device}
```

**Parâmetros Dinâmicos:**
- `{lpurl}` - URL da página de destino
- `{campaignid}` - ID da campanha
- `{keyword}` - Palavra-chave que acionou o anúncio
- `{creative}` - ID do criativo
- `{gclid}` - Google Click ID (importante!)
- `{device}` - Dispositivo (mobile, desktop, tablet)
- `{adgroupid}` - ID do grupo de anúncios
- `{targetid}` - ID do segmento

### Exemplo Real

**URL de Destino:** `https://seusite.com/servicos`

**URL Final com Tracking:**
```
https://seusite.com/servicos?utm_source=google&utm_medium=cpc&utm_campaign=12345678&utm_term=clinica+estetica+sp&utm_content=98765&gclid=EAIaIQobChMI...&device=mobile
```

**Resultado no Sistema:**
- Origin: `google_ads` 🟡
- Medium: `Anúncio Pago`
- Campaign: `12345678`
- Term: `clinica+estetica+sp`
- Badge: Amarelo

---

## 🌐 Site/Formulário Web

### Landing Page com Tracking

✅ **HTML Completo:**

```html
<!DOCTYPE html>
<html>
<head>
    <title>Promoção Especial</title>
</head>
<body>
    <h1>Aproveite nossa promoção!</h1>
    <form id="leadForm">
        <input type="text" name="name" placeholder="Nome" required>
        <input type="email" name="email" placeholder="Email" required>
        <input type="tel" name="phone" placeholder="Telefone" required>
        <button type="submit">Quero Saber Mais</button>
    </form>

    <script>
        // Captura UTM automaticamente
        const urlParams = new URLSearchParams(window.location.search);
        const tracking = {
            utm_source: urlParams.get('utm_source') || 'site',
            utm_medium: urlParams.get('utm_medium') || 'direct',
            utm_campaign: urlParams.get('utm_campaign'),
            utm_content: urlParams.get('utm_content'),
            referrer: document.referrer,
            landing: window.location.href
        };

        // Salva para usar depois
        sessionStorage.setItem('tracking', JSON.stringify(tracking));

        // Ao submeter
        document.getElementById('leadForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            const savedTracking = JSON.parse(sessionStorage.getItem('tracking'));

            await fetch('https://seu-projeto.supabase.co/functions/v1/lead-capture', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'apikey': 'sua-chave'
                },
                body: JSON.stringify({
                    tenant_id: 'seu-tenant-id',
                    name: formData.get('name'),
                    email: formData.get('email'),
                    phone: formData.get('phone'),
                    ...savedTracking
                })
            });
        });
    </script>
</body>
</html>
```

### Link de Email Marketing

✅ **Exemplo:**

```html
<a href="https://seusite.com?utm_source=email&utm_medium=newsletter&utm_campaign=ofertas_janeiro&utm_content=banner_topo">
    Clique aqui!
</a>
```

---

## 💬 WhatsApp

### WhatsApp Status

✅ **Link no Status:**

```
🎉 Promoção especial!
Clique aqui: link.seunegocio.com

URL real:
https://seusite.com?utm_source=whatsapp&utm_medium=status&utm_campaign=promo_status&utm_content=status_{{data}}
```

### Mensagens Diretas

✅ **Via Evolution API:**

Quando alguém inicia conversa no WhatsApp, adicione tracking:

```json
{
  "lead_phone": "5511999999999",
  "text": "Oi, vim pelo Instagram!",
  "tracking": {
    "utm_source": "whatsapp",
    "utm_medium": "direct",
    "utm_campaign": "organic_message",
    "referrer_url": "https://instagram.com/seuperfil"
  }
}
```

### Link em Grupo

✅ **Compartilhado em grupos:**

```
Pessoal, olhem isso! 👇
https://seusite.com?utm_source=whatsapp&utm_medium=group&utm_campaign=grupo_{{nome_grupo}}&utm_content=compartilhamento
```

---

## 🎯 Teste A/B de Criativos

### Exemplo: Testar 3 Banners Diferentes

**Banner Azul:**
```
?utm_campaign=promo_verao&utm_content=banner_azul
```

**Banner Vermelho:**
```
?utm_campaign=promo_verao&utm_content=banner_vermelho
```

**Banner Verde:**
```
?utm_campaign=promo_verao&utm_content=banner_verde
```

### Análise no SQL:

```sql
SELECT 
    utm_content as banner,
    COUNT(*) as leads,
    COUNT(*) * 100.0 / SUM(COUNT(*)) OVER () as percentual
FROM leads
WHERE utm_campaign = 'promo_verao'
GROUP BY utm_content
ORDER BY leads DESC;
```

**Resultado:**
```
banner          | leads | percentual
----------------|-------|------------
banner_vermelho |   156 |   52.0%
banner_azul     |    89 |   29.7%
banner_verde    |    55 |   18.3%
```

---

## 📊 Dashboard de Análises

### Query: Top 5 Origens

```sql
SELECT 
    origin,
    COUNT(*) as total_leads,
    COUNT(CASE WHEN created_at >= NOW() - INTERVAL '7 days' THEN 1 END) as last_7_days,
    ROUND(AVG(EXTRACT(EPOCH FROM (updated_at - created_at))/3600), 2) as avg_hours_to_update
FROM leads
WHERE tenant_id = 'seu-tenant-id'
  AND created_at >= '2024-01-01'
GROUP BY origin
ORDER BY total_leads DESC
LIMIT 5;
```

### Query: Campanhas Mais Efetivas

```sql
SELECT 
    utm_campaign,
    origin,
    COUNT(*) as leads,
    COUNT(CASE WHEN stage_id IN (
        SELECT id FROM stages WHERE name = 'Fechado'
    ) THEN 1 END) as convertidos,
    ROUND(
        COUNT(CASE WHEN stage_id IN (
            SELECT id FROM stages WHERE name = 'Fechado'
        ) THEN 1 END) * 100.0 / COUNT(*),
        2
    ) as taxa_conversao
FROM leads
WHERE utm_campaign IS NOT NULL
GROUP BY utm_campaign, origin
HAVING COUNT(*) >= 10
ORDER BY taxa_conversao DESC;
```

---

## 🚀 Dicas Profissionais

### 1. Nomenclatura Consistente

❌ **Evite:**
- `utm_campaign=promo`, `utm_campaign=Promocao`, `utm_campaign=PROMO`

✅ **Use:**
- `utm_campaign=promo_verao_2024`
- Sempre minúsculo
- Use underscores
- Seja descritivo

### 2. Estrutura de Campanhas

```
utm_campaign = {periodo}_{tipo}_{detalhe}

Exemplos:
- 2024_q1_lancamento_produto
- black_friday_2024_50off
- natal_2024_kit_presente
```

### 3. Use Encurtadores

Para redes sociais, use encurtadores que preservam UTM:
- bit.ly
- tinyurl.com
- seu-dominio.com/l/

### 4. Documentação Interna

Mantenha uma planilha:

| Campanha | Origem | Período | Links | Observações |
|----------|--------|---------|-------|-------------|
| promo_verao_2024 | Instagram | Jan-Mar | [link] | Banner azul performou melhor |
| black_friday_2024 | Facebook | Nov | [link] | Taxa conversão: 12% |

---

## 🔗 Links Úteis

- [Construtor de URL do Google](https://ga-dev-tools.google/campaign-url-builder/)
- [Parâmetros UTM - Guia Completo](https://support.google.com/analytics/answer/1033863)
- [Meta Ads - Parâmetros Dinâmicos](https://www.facebook.com/business/help/1016122818401732)

---

**Pronto para começar!** 🎉

Escolha sua plataforma acima e implemente o tracking hoje mesmo.



