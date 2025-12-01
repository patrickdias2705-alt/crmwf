# 🎯 Rastreamento Automático de Origem de Leads

Este documento explica como configurar o rastreamento automático de leads vindos de diferentes fontes como Instagram, Facebook, Google Ads, Site e outras plataformas.

## 📋 Índice

1. [Visão Geral](#visão-geral)
2. [Como Funciona](#como-funciona)
3. [Configuração por Plataforma](#configuração-por-plataforma)
4. [Exemplos Práticos](#exemplos-práticos)
5. [API de Captura de Leads](#api-de-captura-de-leads)
6. [Dashboard e Análises](#dashboard-e-análises)

---

## 🎯 Visão Geral

O sistema agora rastreia automaticamente a origem de cada lead através de:

- **Parâmetros UTM** - Para links de campanhas
- **Detecção automática** - Para mensagens do WhatsApp/Instagram/Facebook
- **API de captura** - Para formulários web e integrações
- **Webhook enrichment** - Para plataformas integradas

### Campos de Tracking

O sistema armazena os seguintes dados para cada lead:

| Campo | Descrição | Exemplo |
|-------|-----------|---------|
| `origin` | Origem principal do lead | `instagram`, `facebook`, `site` |
| `utm_source` | Fonte do tráfego | `instagram`, `google`, `facebook` |
| `utm_medium` | Tipo de mídia | `social`, `cpc`, `organic` |
| `utm_campaign` | Nome da campanha | `black_friday_2024` |
| `utm_term` | Termos de busca (Google Ads) | `cirurgia plastica sp` |
| `utm_content` | Variação do anúncio | `banner_azul`, `video_1` |
| `referrer_url` | URL de origem | `https://instagram.com/p/abc123` |
| `landing_page` | Primeira página visitada | `https://seusite.com/promo` |
| `ad_id` | ID do anúncio (Meta/Google) | `23850123456789` |
| `ad_name` | Nome do anúncio | `Anúncio Promoção Verão` |

---

## ⚙️ Como Funciona

### 1. Detecção Automática

O sistema detecta automaticamente a origem do lead baseado em:

```javascript
// Regras de detecção
utm_source = "instagram" → origin = "instagram"
utm_source = "facebook" → origin = "facebook"
utm_source = "google" → origin = "google_ads"
utm_source = "whatsapp" → origin = "whatsapp"

// Se não houver utm_source, usa o valor de origin fornecido
// Se nenhum dos dois, o padrão é "site"
```

### 2. Fluxo de Captura

```
Lead entra em contato
    ↓
Sistema captura dados UTM/tracking
    ↓
Identifica origem automaticamente
    ↓
Armazena no banco de dados
    ↓
Exibe no dashboard com badges coloridos
```

---

## 🔧 Configuração por Plataforma

### 📱 Instagram

#### Opção 1: Link na Bio

Adicione parâmetros UTM ao link na sua bio:

```
https://seusite.com?utm_source=instagram&utm_medium=social&utm_campaign=bio_link
```

#### Opção 2: Stories/Posts

Para stories e posts com link, use:

```
https://seusite.com?utm_source=instagram&utm_medium=social&utm_campaign=story_promo&utm_content=historia_1
```

#### Opção 3: Anúncios Meta (Instagram Ads)

Configure os parâmetros de URL no Gerenciador de Anúncios:

```
https://seusite.com?utm_source=instagram&utm_medium=cpc&utm_campaign={{campaign.name}}&utm_content={{ad.name}}&ad_id={{ad.id}}
```

**Parâmetros dinâmicos do Meta:**
- `{{campaign.name}}` - Nome da campanha
- `{{ad.name}}` - Nome do anúncio
- `{{ad.id}}` - ID do anúncio
- `{{adset.name}}` - Nome do conjunto de anúncios

#### Opção 4: Direct do Instagram via Evolution API

Quando mensagens chegam via Direct do Instagram integrado com Evolution API:

```json
{
  "lead_phone": "5511999999999",
  "text": "Oi, quero saber mais!",
  "tracking": {
    "utm_source": "instagram",
    "utm_medium": "social",
    "utm_campaign": "campanha_verao"
  }
}
```

---

### 👥 Facebook

#### Facebook Posts/Página

Links em posts ou na página:

```
https://seusite.com?utm_source=facebook&utm_medium=social&utm_campaign=post_organico
```

#### Facebook Ads

No Gerenciador de Anúncios, adicione aos parâmetros de URL:

```
https://seusite.com?utm_source=facebook&utm_medium=cpc&utm_campaign={{campaign.name}}&utm_content={{ad.name}}&ad_id={{ad.id}}&adset={{adset.name}}
```

#### Facebook Messenger

Para mensagens via Messenger integradas:

```json
{
  "lead_phone": "5511999999999",
  "text": "Olá!",
  "tracking": {
    "utm_source": "facebook",
    "utm_medium": "messenger",
    "utm_campaign": "atendimento_automatico"
  }
}
```

---

### 🌐 Site (Formulários Web)

#### Formulário HTML

Adicione um script para capturar parâmetros UTM e enviar via API:

```html
<!DOCTYPE html>
<html>
<head>
    <title>Formulário de Contato</title>
</head>
<body>
    <form id="leadForm">
        <input type="text" name="name" placeholder="Nome" required>
        <input type="email" name="email" placeholder="Email" required>
        <input type="tel" name="phone" placeholder="Telefone" required>
        <textarea name="message" placeholder="Mensagem"></textarea>
        <button type="submit">Enviar</button>
    </form>

    <script>
        // Capturar parâmetros UTM da URL
        function getUTMParams() {
            const urlParams = new URLSearchParams(window.location.search);
            return {
                utm_source: urlParams.get('utm_source'),
                utm_medium: urlParams.get('utm_medium'),
                utm_campaign: urlParams.get('utm_campaign'),
                utm_term: urlParams.get('utm_term'),
                utm_content: urlParams.get('utm_content'),
                ad_id: urlParams.get('ad_id'),
                referrer_url: document.referrer,
                landing_page: window.location.href
            };
        }

        // Salvar UTM em localStorage para persistir na navegação
        const utmParams = getUTMParams();
        if (utmParams.utm_source) {
            localStorage.setItem('utmParams', JSON.stringify(utmParams));
        }

        // Enviar formulário
        document.getElementById('leadForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const formData = new FormData(e.target);
            const savedUTM = JSON.parse(localStorage.getItem('utmParams') || '{}');
            
            const payload = {
                tenant_id: 'SEU_TENANT_ID', // Substitua pelo seu tenant_id
                name: formData.get('name'),
                email: formData.get('email'),
                phone: formData.get('phone'),
                message: formData.get('message'),
                ...savedUTM
            };

            try {
                const response = await fetch('https://seu-projeto.supabase.co/functions/v1/lead-capture', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'apikey': 'SUA_SUPABASE_ANON_KEY'
                    },
                    body: JSON.stringify(payload)
                });

                if (response.ok) {
                    alert('Obrigado! Entraremos em contato em breve.');
                    e.target.reset();
                    localStorage.removeItem('utmParams');
                } else {
                    alert('Erro ao enviar. Tente novamente.');
                }
            } catch (error) {
                console.error('Erro:', error);
                alert('Erro ao enviar. Tente novamente.');
            }
        });
    </script>
</body>
</html>
```

---

### 🔍 Google Ads

#### Configuração de Rastreamento

1. No Google Ads, vá em **Configurações de Campanha**
2. Em **Opções de URL**, adicione o **Modelo de rastreamento**:

```
{lpurl}?utm_source=google&utm_medium=cpc&utm_campaign={campaignid}&utm_term={keyword}&utm_content={creative}&gclid={gclid}
```

**Parâmetros dinâmicos do Google:**
- `{campaignid}` - ID da campanha
- `{keyword}` - Palavra-chave que acionou o anúncio
- `{creative}` - ID do criativo
- `{gclid}` - Google Click ID
- `{lpurl}` - URL da página de destino

#### Exemplo de URL final:

```
https://seusite.com?utm_source=google&utm_medium=cpc&utm_campaign=123456&utm_term=clinica+estetica&utm_content=789&gclid=abc123xyz
```

---

### 💬 WhatsApp

O WhatsApp já é detectado automaticamente quando as mensagens chegam via webhook da Evolution API.

Para adicionar tracking adicional (ex: de onde veio o número), envie via webhook:

```json
{
  "lead_phone": "5511999999999",
  "text": "Olá, vim pelo Instagram!",
  "tracking": {
    "utm_source": "whatsapp",
    "utm_medium": "direct",
    "utm_campaign": "link_instagram_bio",
    "referrer_url": "https://instagram.com/seuperfil"
  }
}
```

---

## 💻 API de Captura de Leads

### Endpoint

```
POST https://seu-projeto.supabase.co/functions/v1/lead-capture
```

### Headers

```
Content-Type: application/json
apikey: SUA_SUPABASE_ANON_KEY
```

### Payload Completo

```json
{
  "tenant_id": "uuid-do-tenant",
  
  // Dados básicos do lead
  "name": "João Silva",
  "phone": "5511999999999",
  "email": "joao@email.com",
  
  // Origem (opcional, será detectada automaticamente se não fornecida)
  "origin": "instagram",
  
  // Parâmetros UTM
  "utm_source": "instagram",
  "utm_medium": "social",
  "utm_campaign": "black_friday_2024",
  "utm_term": "produto_x",
  "utm_content": "banner_azul",
  
  // Tracking adicional
  "referrer_url": "https://instagram.com/p/abc123",
  "landing_page": "https://seusite.com/promocao",
  "ad_id": "23850123456789",
  "ad_name": "Anúncio Promoção Verão",
  
  // Dados adicionais
  "message": "Mensagem do lead",
  "segment": "varejo",
  "category": "varejo",
  "order_number": "PED-2024-001",
  
  // Dados específicos da plataforma
  "platform_data": {
    "ip_address": "192.168.1.1",
    "user_agent": "Mozilla/5.0...",
    "custom_field": "valor"
  }
}
```

### Resposta de Sucesso

```json
{
  "success": true,
  "lead": {
    "id": "uuid-do-lead",
    "name": "João Silva",
    "origin": "instagram",
    "utm_source": "instagram",
    "utm_campaign": "black_friday_2024",
    ...
  },
  "message": "Lead captured successfully",
  "is_new": true
}
```

### Exemplo com cURL

```bash
curl -X POST https://seu-projeto.supabase.co/functions/v1/lead-capture \
  -H "Content-Type: application/json" \
  -H "apikey: sua-chave-anon" \
  -d '{
    "tenant_id": "seu-tenant-id",
    "name": "Maria Santos",
    "phone": "5511988888888",
    "email": "maria@email.com",
    "utm_source": "facebook",
    "utm_medium": "cpc",
    "utm_campaign": "lancamento_produto",
    "ad_id": "123456789",
    "message": "Quero saber mais sobre o produto"
  }'
```

---

## 📊 Dashboard e Análises

### Visualização no Kanban

Os leads agora exibem badges coloridos indicando a origem:

- 🟣 **Instagram** - Gradiente roxo/rosa
- 🔵 **Facebook** - Azul
- 🟢 **WhatsApp** - Verde
- 🟡 **Google Ads** - Amarelo
- ⚪ **Site** - Cinza

### View de Analytics

Uma view SQL foi criada para análises:

```sql
SELECT * FROM lead_tracking_summary
WHERE tenant_id = 'seu-tenant-id'
ORDER BY lead_count DESC;
```

Retorna:
- Total de leads por origem
- Leads nos últimos 7 dias
- Leads nos últimos 30 dias
- Data do primeiro e último lead

### Query Personalizada

Para análises mais detalhadas:

```sql
SELECT 
  origin,
  utm_campaign,
  COUNT(*) as total_leads,
  COUNT(CASE WHEN created_at >= NOW() - INTERVAL '7 days' THEN 1 END) as last_week,
  COUNT(CASE WHEN created_at >= NOW() - INTERVAL '30 days' THEN 1 END) as last_month
FROM leads
WHERE tenant_id = 'seu-tenant-id'
  AND created_at >= '2024-01-01'
GROUP BY origin, utm_campaign
ORDER BY total_leads DESC;
```

---

## 🎓 Exemplos Práticos

### Exemplo 1: Campanha no Instagram

**Objetivo:** Rastrear leads da campanha de Black Friday no Instagram

**Setup:**
1. Crie o link:
```
https://seusite.com/promo?utm_source=instagram&utm_medium=social&utm_campaign=black_friday_2024&utm_content=carrossel_1
```

2. Use no link do anúncio ou Story

3. O lead será automaticamente categorizado como `instagram` com campanha `black_friday_2024`

---

### Exemplo 2: Múltiplas Variações de Anúncio

**Objetivo:** Testar qual criativo converte melhor

**Setup:**

Anúncio A (Banner Azul):
```
?utm_source=facebook&utm_medium=cpc&utm_campaign=verao_2024&utm_content=banner_azul
```

Anúncio B (Banner Vermelho):
```
?utm_source=facebook&utm_medium=cpc&utm_campaign=verao_2024&utm_content=banner_vermelho
```

**Análise:**
```sql
SELECT 
  utm_content as variacao,
  COUNT(*) as leads,
  AVG(EXTRACT(EPOCH FROM (updated_at - created_at))/3600) as tempo_medio_conversao_horas
FROM leads
WHERE utm_campaign = 'verao_2024'
GROUP BY utm_content;
```

---

### Exemplo 3: Formulário Web com Persistência

```html
<script>
// Captura UTM no primeiro acesso e salva
(function() {
  const params = new URLSearchParams(window.location.search);
  const tracking = {
    utm_source: params.get('utm_source'),
    utm_medium: params.get('utm_medium'),
    utm_campaign: params.get('utm_campaign'),
    utm_term: params.get('utm_term'),
    utm_content: params.get('utm_content'),
    first_page: window.location.href,
    first_referrer: document.referrer,
    timestamp: new Date().toISOString()
  };
  
  // Só salva se tiver parâmetros UTM
  if (tracking.utm_source && !sessionStorage.getItem('tracking')) {
    sessionStorage.setItem('tracking', JSON.stringify(tracking));
  }
  
  // Atualiza página atual
  sessionStorage.setItem('current_page', window.location.href);
})();

// Ao submeter formulário, envia o tracking salvo
async function submitLead(formData) {
  const tracking = JSON.parse(sessionStorage.getItem('tracking') || '{}');
  
  await fetch('https://seu-projeto.supabase.co/functions/v1/lead-capture', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': 'sua-chave'
    },
    body: JSON.stringify({
      tenant_id: 'seu-tenant-id',
      ...formData,
      ...tracking,
      landing_page: tracking.first_page,
      referrer_url: tracking.first_referrer
    })
  });
}
</script>
```

---

## 🔐 Segurança

- Sempre use HTTPS
- Mantenha sua `apikey` segura
- Valide dados no backend
- Use CORS apropriadamente
- Implemente rate limiting se necessário

---

## 🆘 Troubleshooting

### Problema: Origin não está sendo detectado

**Solução:** Certifique-se de que:
1. Os parâmetros UTM estão na URL
2. O formulário está capturando os parâmetros
3. O payload está enviando `utm_source` ou `origin`

### Problema: Parâmetros UTM são perdidos na navegação

**Solução:** Use `sessionStorage` ou `localStorage` para persistir:

```javascript
// Ao carregar a primeira página
const utmParams = new URLSearchParams(window.location.search);
if (utmParams.has('utm_source')) {
  sessionStorage.setItem('utm_params', JSON.stringify(Object.fromEntries(utmParams)));
}
```

### Problema: Anúncios do Meta não estão enviando dados

**Solução:** Verifique se:
1. Os parâmetros estão no campo "Parâmetros de URL" no Gerenciador de Anúncios
2. Use `{{campaign.name}}` (com chaves duplas)
3. Teste a URL completa antes de publicar

---

## 📚 Recursos Adicionais

- [Documentação UTM do Google](https://support.google.com/analytics/answer/1033863)
- [Parâmetros de URL do Meta](https://www.facebook.com/business/help/1016122818401732)
- [URL Builder do Google](https://ga-dev-tools.google/campaign-url-builder/)

---

## 🤝 Suporte

Se precisar de ajuda com a implementação:

1. Verifique os logs no Supabase
2. Teste a API com Postman/cURL
3. Consulte a documentação técnica
4. Entre em contato com o suporte

---

**Última atualização:** Janeiro 2025



