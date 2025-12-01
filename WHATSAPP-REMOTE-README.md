# 🚀 WhatsApp Remote WebView - Arquitetura Completa

## 📋 Visão Geral

Esta implementação cria uma **arquitetura de Remote WebView** que permite integrar o WhatsApp Web diretamente no seu CRM através de containers Docker, mantendo a interface oficial do WhatsApp.

## 🏗️ Arquitetura

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   CRM (Web)     │    │   Gateway Nginx  │    │  Chrome Headless │
│                 │    │                  │    │                 │
│  ┌───────────┐  │    │  ┌─────────────┐ │    │  ┌─────────────┐ │
│  │<iframe>   │──┼────┼──│  Auth JWT   │ │    │  │WhatsApp Web │ │
│  │WhatsApp   │  │    │  │  + Proxy    │─┼────┼──│  + noVNC     │ │
│  │Remote     │  │    │  │  + CORS     │ │    │  │  + Session  │ │
│  └───────────┘  │    │  └─────────────┘ │    │  └─────────────┘ │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

## 🚀 Setup Rápido

### 1. Executar Setup
```bash
./setup-whatsapp-remote.sh
```

### 2. Iniciar Containers
```bash
docker-compose up -d
```

### 3. Verificar Status
```bash
docker-compose ps
```

## 🌐 URLs de Acesso

| Serviço | URL | Descrição |
|---------|-----|-----------|
| **Gateway** | `https://localhost/whatsapp` | Interface principal (com auth) |
| **Auth Server** | `http://localhost:3001` | Servidor de autenticação JWT |
| **Chrome VNC** | `http://localhost:6901` | Acesso direto ao Chrome (debug) |

## 🔐 Autenticação

### Usuários de Teste
- **user_123** - Atendente 1
- **user_456** - Atendente 2  
- **admin_789** - Administrador

### Fluxo de Auth
1. **Login**: `POST /auth/login` com `{userId, sessionId}`
2. **Token JWT**: Retornado com expiração de 24h
3. **Verificação**: Nginx valida token automaticamente
4. **Acesso**: iframe carrega WhatsApp Web autenticado

## 📱 Como Usar no CRM

### 1. Botão WhatsApp
- Clique no botão "WhatsApp Web" na sidebar
- Modal abre com iframe do gateway
- Login automático via JWT

### 2. Controles Disponíveis
- **Reconectar**: Reestabelece conexão
- **Reset Sessão**: Limpa dados do Chrome
- **Abrir Externo**: Abre WhatsApp Web em nova aba

### 3. Persistência
- **Sessão mantida** entre reconexões
- **Perfil do Chrome** salvo em volume persistente
- **QR Code** não precisa ser escaneado novamente

## 🔧 Configurações

### Variáveis de Ambiente
```env
# Gateway
VITE_WHATSAPP_GATEWAY_URL=https://localhost/whatsapp
VITE_AUTH_SERVER_URL=http://localhost:3001

# Docker
VNC_PW=whatsapp123
JWT_SECRET=whatsapp-remote-secret-2024
```

### Portas
- **80/443**: Gateway Nginx
- **3001**: Auth Server
- **6901**: Chrome VNC (noVNC)
- **5901**: Chrome VNC (VNC direto)

## 🛠️ Desenvolvimento

### Logs dos Containers
```bash
# Todos os serviços
docker-compose logs -f

# Serviço específico
docker-compose logs -f chrome
docker-compose logs -f gateway
docker-compose logs -f auth-server
```

### Reiniciar Serviço
```bash
docker-compose restart chrome
```

### Limpar Dados
```bash
docker-compose down -v
```

## 🔒 Segurança

### Implementado
- ✅ **JWT Authentication** - Tokens seguros
- ✅ **HTTPS/SSL** - Comunicação criptografada
- ✅ **CORS** - Controle de origem
- ✅ **Rate Limiting** - Proteção contra spam
- ✅ **Headers de Segurança** - XSS, CSRF protection

### Recomendações
- 🔐 **Alterar senhas padrão** em produção
- 🔐 **Usar certificados SSL reais**
- 🔐 **Configurar firewall** (fechar porta 5901)
- 🔐 **Monitorar logs** de acesso

## 📊 Monitoramento

### Health Checks
```bash
# Gateway
curl https://localhost/health

# Auth Server
curl http://localhost:3001/health

# Chrome (via VNC)
curl http://localhost:6901
```

### Métricas
- **Conexões ativas** por usuário
- **Tempo de resposta** do gateway
- **Uso de recursos** do Chrome
- **Logs de autenticação**

## 🚨 Troubleshooting

### Problema: iframe não carrega
**Solução**: Verificar certificados SSL e CORS

### Problema: WhatsApp não conecta
**Solução**: Verificar se Chrome está rodando e acessível

### Problema: Token inválido
**Solução**: Verificar JWT_SECRET e expiração do token

### Problema: Sessão perdida
**Solução**: Verificar volumes persistentes do Chrome

## 🎯 Próximos Passos

1. **Escalabilidade**: Múltiplos containers por usuário
2. **Load Balancer**: Distribuição de carga
3. **Database**: Persistência de usuários e sessões
4. **Monitoring**: Prometheus + Grafana
5. **CI/CD**: Deploy automatizado

## 📞 Suporte

Para dúvidas ou problemas:
1. Verificar logs: `docker-compose logs -f`
2. Testar conectividade: `curl https://localhost/health`
3. Reiniciar serviços: `docker-compose restart`
4. Limpar e recriar: `docker-compose down -v && docker-compose up -d`
