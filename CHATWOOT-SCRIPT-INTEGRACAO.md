# Script de Integração Chatwoot - CRM

Este script permite que o botão "Voltar para WhatsApp" no CRM comunique-se com o Chatwoot para abrir a aba de conversas.

## 📋 Passo 2 — No Chatwoot (pai, crm.wfcirurgicos.com.br)

Adicione o seguinte script no seu servidor Chatwoot (via Easypanel).

### Opções de instalação:

1. **No painel do Chatwoot:**
   - Configurações → Integrações → Aplicativo
   - Adicione o script no modo custom script do Chatwoot

2. **Ou no container:**
   - Acesse `/public/index.html` antes de `</body>`
   - Cole o script abaixo

### 📝 Script completo:

```html
<script>
window.addEventListener("message", (event) => {
  // Garante que a mensagem veio do painel
  if (event.origin !== "https://painel.wfcirurgicos.com.br") return;

  // Verifica a ação solicitada
  if (event.data.action === "abrir_conversas_chatwoot") {
    // Procura o link "Conversas" na sidebar
    const linkConversas = document.querySelector(
      'a[href="/app/accounts/3/inbox-view"]'
    );
    
    if (linkConversas) {
      linkConversas.click(); // simula o clique
      console.log("✅ Painel do Chatwoot: redirecionado para Conversas");
    } else {
      console.warn("⚠️ Link de Conversas não encontrado no Chatwoot.");
    }
  }
});
</script>
```

## 🔒 Segurança

A linha abaixo garante que só o seu painel (`painel.wfcirurgicos.com.br`) pode controlar o Chatwoot:

```javascript
if (event.origin !== "https://painel.wfcirurgicos.com.br") return;
```

## 💡 Como funciona

1. **CRM (iframe):** O botão "Voltar para WhatsApp" envia uma mensagem via `window.parent.postMessage()`
2. **Chatwoot (pai):** Escuta a mensagem com `window.addEventListener("message")`
3. **Ação:** Quando recebe `{ action: 'abrir_conversas_chatwoot' }`, simula um clique no link de "Conversas"
4. **Resultado:** O Chatwoot muda de aba instantaneamente, sem abrir nova guia

## 🚀 Resultado esperado

- Clicar no botão → Chatwoot muda para aba de conversas
- Sem abrir novas abas
- Integração suave entre CRM e Chatwoot

