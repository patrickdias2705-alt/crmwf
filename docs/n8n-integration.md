# Integração n8n - Documentação

## Visão Geral

A integração com n8n permite automatizar ações no CRM através de webhooks. O n8n pode enviar dados para o CRM para criar, atualizar leads, alterar status de pipeline e muito mais.

## Endpoint do Webhook

```
POST https://jcqsczbodsrfjthxjjxq.supabase.co/functions/v1/n8n-webhook
```

## Autenticação

O webhook utiliza autenticação via HMAC-SHA256. Configure o secret `N8N_WEBHOOK_SECRET` no Supabase e use no header:

```
X-Signature: sha256=<hash_hmac_sha256>
```

## Tipos de Ações Suportadas

### 1. Atualização de Status do Lead

Atualiza o status/estágio de um lead no pipeline.

**Ação:** `lead_status_update` ou `status_update`

**Payload:**
```json
{
  "action": "lead_status_update",
  "data": {
    "lead_id": "uuid-do-lead",
    "tenant_id": "uuid-do-tenant",
    "new_status": "Atendido",
    "old_status": "Lead novo",
    "reason": "Qualificação automática via IA",
    "metadata": {
      "fields": {
        "score": 85,
        "qualification_notes": "Lead qualificado automaticamente"
      }
    }
  }
}
```

### 2. Atualização de Dados do Lead

Atualiza informações do lead como nome, telefone, email, etc.

**Ação:** `lead_update` ou `update_lead`

**Payload:**
```json
{
  "action": "lead_update",
  "data": {
    "lead_id": "uuid-do-lead",
    "tenant_id": "uuid-do-tenant",
    "updates": {
      "name": "João Silva",
      "email": "joao@email.com",
      "phone": "11999999999",
      "fields": {
        "interesse": "Produto A",
        "budget": "R$ 5.000"
      }
    },
    "metadata": {
      "source": "chatbot_qualification",
      "updated_by": "ai_agent"
    }
  }
}
```

### 3. Criação de Novo Lead

Cria um novo lead no sistema.

**Ação:** `lead_create`, `create_lead` ou `new_lead`

**Payload:**
```json
{
  "action": "lead_create",
  "data": {
    "tenant_id": "uuid-do-tenant",
    "source": "n8n",
    "lead_data": {
      "name": "Maria Santos",
      "phone": "11888888888",
      "email": "maria@email.com",
      "fields": {
        "origem": "Landing Page",
        "interesse": "Consultoria"
      }
    },
    "metadata": {
      "campaign": "campanha_janeiro_2024",
      "utm_source": "google"
    }
  }
}
```

### 4. Agendamento de Lead

Agenda um compromisso para o lead.

**Ação:** `lead_schedule`, `schedule_lead` ou `appointment_booked`

**Payload:**
```json
{
  "action": "lead_schedule",
  "data": {
    "lead_id": "uuid-do-lead",
    "tenant_id": "uuid-do-tenant",
    "scheduled_date": "2024-02-15T14:30:00Z",
    "appointment_type": "Consulta inicial",
    "metadata": {
      "calendar_event_id": "google-calendar-123",
      "duration": 60,
      "location": "Online - Zoom"
    }
  }
}
```

## Status/Estágios Reconhecidos

O sistema reconhece os seguintes status por palavra-chave (case-insensitive):

- **Lead novo** - Status inicial para novos leads
- **Atendido** - Lead foi atendido/contatado
- **Agendado** - Lead agendou um compromisso
- **Fechado** - Lead convertido em cliente
- **Recusado** - Lead recusou proposta
- **Perdido** - Lead perdido por outros motivos

## Métricas Automáticas

O sistema atualiza automaticamente as métricas diárias baseado nas ações:

- `leads_in` - Novos leads criados
- `leads_attended` - Leads atendidos
- `booked` - Leads agendados
- `closed` - Leads fechados
- `refused` - Leads recusados  
- `lost` - Leads perdidos

## Eventos em Tempo Real

Todas as ações geram eventos em tempo real que são transmitidos para o frontend:

- `lead.created` - Novo lead criado
- `lead.updated` - Lead atualizado
- `lead.stage_changed` - Status alterado
- `lead.scheduled` - Lead agendado

## Exemplos de Uso no n8n

### Exemplo 1: Qualificação Automática via IA

```javascript
// No n8n, após processar resposta do lead via IA
const webhookData = {
  action: "lead_status_update",
  data: {
    lead_id: $('Trigger').item.json.lead_id,
    tenant_id: $('Trigger').item.json.tenant_id,
    new_status: $('AI Response').item.json.qualification === 'qualified' ? 'Atendido' : 'Recusado',
    old_status: 'Lead novo',
    reason: `Qualificação automática: ${$('AI Response').item.json.reason}`,
    metadata: {
      fields: {
        ai_score: $('AI Response').item.json.score,
        qualification_notes: $('AI Response').item.json.notes
      }
    }
  }
};
```

### Exemplo 2: Agendamento via Calendly

```javascript
// Quando lead agenda via Calendly
const webhookData = {
  action: "lead_schedule", 
  data: {
    lead_id: $('Find Lead').item.json.id,
    tenant_id: $('Find Lead').item.json.tenant_id,
    scheduled_date: $('Calendly Webhook').item.json.event.start_time,
    appointment_type: $('Calendly Webhook').item.json.event.event_type.name,
    metadata: {
      calendly_event_id: $('Calendly Webhook').item.json.event.uri,
      attendee_email: $('Calendly Webhook').item.json.invitee.email
    }
  }
};
```

## Logs e Debugging

Todos os eventos são logados no Supabase Edge Functions. Para debuggar:

1. Acesse o [Log do Edge Function](https://supabase.com/dashboard/project/jcqsczbodsrfjthxjjxq/functions/n8n-webhook/logs)
2. Verifique os logs de entrada e processamento
3. Confirme se os dados chegaram corretamente
4. Verifique se o HMAC está sendo validado

## Códigos de Resposta

- `200` - Sucesso
- `400` - JSON inválido
- `401` - Assinatura HMAC inválida
- `405` - Método não permitido (use POST)
- `500` - Erro interno do servidor

## Configuração no n8n

1. **HTTP Request Node**:
   - Method: POST
   - URL: `https://jcqsczbodsrfjthxjjxq.supabase.co/functions/v1/n8n-webhook`
   - Headers: `Content-Type: application/json`
   - Authentication: Use HMAC-SHA256 com o secret configurado

2. **HMAC Authentication**:
   ```javascript
   // Calcular assinatura HMAC
   const crypto = require('crypto');
   const secret = 'SEU_N8N_WEBHOOK_SECRET';
   const payload = JSON.stringify(webhookData);
   const signature = crypto.createHmac('sha256', secret).update(payload).digest('hex');
   
   // Adicionar header
   headers['X-Signature'] = `sha256=${signature}`;
   ```

## Exemplo Completo de Fluxo n8n

```json
{
  "nodes": [
    {
      "name": "Webhook Trigger",
      "type": "n8n-nodes-base.webhook"
    },
    {
      "name": "Process Lead",
      "type": "n8n-nodes-base.function",
      "code": "// Processar dados do lead aqui"
    },
    {
      "name": "Update CRM",
      "type": "n8n-nodes-base.httpRequest",
      "method": "POST",
      "url": "https://jcqsczbodsrfjthxjjxq.supabase.co/functions/v1/n8n-webhook",
      "body": "{{ $json.webhookData }}"
    }
  ]
}
```