# CRM SaaS Multi-tenant - Zaptro

Sistema de CRM SaaS multi-tenant para WhatsApp + n8n com alto padrão de engenharia.

## Arquitetura

- **Frontend**: React 18 + TypeScript + Vite
- **UI**: Shadcn/ui + Tailwind CSS + Lucide React
- **Backend**: Supabase (Postgres + RLS + Auth + Realtime + Edge Functions)
- **Autenticação**: Supabase Auth com RBAC
- **Realtime**: Supabase Realtime para Kanban e chat

## Estrutura do Banco de Dados

### Tabelas Principais (com tenant_id em todas)

1. **tenants** - Organizações/clientes
2. **users** - Usuários com roles RBAC
3. **whatsapp_connections** - Conexões WhatsApp (Evolution API)
4. **pipelines** - Funis de vendas
5. **stages** - Etapas dos funis
6. **leads** - Leads/contatos
7. **lead_events** - Histórico de eventos dos leads
8. **conversations** - Conversas por canal
9. **messages** - Mensagens das conversas
10. **metrics_daily** - Métricas diárias agregadas

### Roles RBAC

- **admin** - Administrador do sistema
- **client_owner** - Dono da conta do cliente
- **manager** - Gerente de vendas
- **agent** - Agente de vendas
- **viewer** - Visualizador apenas

### RLS (Row Level Security)

Todas as tabelas possuem políticas RLS que filtram automaticamente por `tenant_id` do usuário autenticado através da função `get_user_tenant_id()`.

## Scripts de Desenvolvimento

### Banco de Dados

As migrations já foram aplicadas automaticamente via Supabase. Os dados de demonstração incluem:

- **Tenant Demo**: "Zaptro" com ID estático
- **Usuários**: admin@demo.com (admin) e owner@demo.com (client_owner)
- **Pipeline Padrão** com 6 stages: "Lead novo", "Sendo tratado", "Agendado", "Fechado", "Recusado", "Perdido"
- **Dados de exemplo**: leads, conversas, mensagens e métricas

### Comandos Úteis

```bash
# Desenvolvimento
npm run dev

# Build de produção
npm run build

# Lint
npm run lint

# Preview da build
npm run preview
```

## Funcionalidades Implementadas

### ✅ Base de Dados
- [x] Schema completo com RLS por tenant
- [x] Índices para performance
- [x] Triggers para updated_at
- [x] Seeds com dados de demonstração
- [x] Helper functions para assertTenant() e requireRole()

### 🔄 Próximos Passos
- [ ] API REST em /api/v1 com Zod + OpenAPI
- [ ] Autenticação JWT/Supabase Auth
- [ ] UI: Dashboard (BI), WhatsApp, Kanban, Inbox, Configurações
- [ ] Integração Evolution API (WhatsApp)
- [ ] Integração n8n (webhooks)
- [ ] Realtime para Kanban e chat
- [ ] Testes (Vitest + Playwright)

## Segurança

- **RLS**: Todas as queries são automaticamente filtradas por tenant_id
- **RBAC**: Sistema de roles com verificação de permissões
- **JWT**: Tokens seguros para autenticação
- **Validação**: Zod para validação de dados
- **Rate Limiting**: Em endpoints sensíveis
- **HMAC**: Verificação de assinatura em webhooks

## 🎯 Rastreamento Automático de Leads

Sistema completo de tracking automático de origem de leads com suporte a:

### Recursos
- **Parâmetros UTM** - Captura automática de utm_source, utm_medium, utm_campaign, etc
- **Multi-origem** - Instagram, Facebook, Google Ads, WhatsApp, Site e mais
- **Meta Ads Integration** - Suporte a parâmetros dinâmicos do Facebook/Instagram Ads
- **Google Ads Integration** - Tracking de campanhas com gclid e keywords
- **First-touch Attribution** - Mantém a origem inicial do lead
- **Análises Integradas** - View SQL para analytics de origem
- **UI Visual** - Badges coloridos no Kanban indicando origem de cada lead

### Campos de Tracking
- `origin` - Origem principal (instagram, facebook, site, etc)
- `utm_source`, `utm_medium`, `utm_campaign` - Parâmetros UTM padrão
- `utm_term`, `utm_content` - Para testes A/B e keywords
- `referrer_url`, `landing_page` - URLs de origem
- `ad_id`, `ad_name` - Identificação de anúncios
- `platform_data` - Dados adicionais específicos da plataforma (JSON)

### Quick Start

```bash
# 1. Rodar migration
supabase migration up

# 2. Deploy da Edge Function
supabase functions deploy lead-capture

# 3. Configurar links com UTM
https://seusite.com?utm_source=instagram&utm_medium=social&utm_campaign=promo
```

### Documentação

- 📖 [Documentação Completa](./docs/TRACKING-AUTOMATICO-LEADS.md)
- 🚀 [Quick Start Guide](./docs/QUICK-START-TRACKING.md)
- 💻 [Exemplo de Formulário](./docs/exemplo-formulario-tracking.html)

### API Endpoint

```
POST /functions/v1/lead-capture
```

Aceita leads com tracking completo incluindo UTM parameters, ad IDs e platform data.

## Integração WhatsApp (Evolution API)

- Conexão via QR Code
- Envio e recebimento de mensagens
- Status de conexão em tempo real
- Suporte a múltiplas instâncias
- **Tracking automático** - Detecção de origem via parâmetros UTM

## Integração n8n

- Webhooks de entrada para automações
- Webhooks de saída com assinatura HMAC
- Processamento assíncrono de dados
- **Lead enrichment** - Adiciona dados de tracking aos leads

## Observabilidade

- Logs estruturados (console no frontend)
- ID de correlação por request
- Métricas de performance
- Monitoramento de erros

## Deploy

O projeto está configurado para deploy automático no Supabase com:
- Migrations automáticas
- Edge Functions
- Realtime habilitado
- RLS configurado
