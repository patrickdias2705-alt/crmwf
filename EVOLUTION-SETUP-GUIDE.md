# 🚀 Guia de Configuração da Evolution API

## 🔍 **Problema Identificado**

A Evolution API atual não está configurada corretamente para gerar QR Codes válidos do WhatsApp. Precisamos configurar uma instância própria na sua VPS.

## 🛠️ **Solução: Configurar Evolution API na VPS**

### 1. **Instalar Docker na VPS**
```bash
# Ubuntu/Debian
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Instalar Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

### 2. **Criar Projeto Evolution API**
```bash
# Criar diretório
mkdir evolution-api
cd evolution-api

# Criar docker-compose.yml
cat > docker-compose.yml << 'EOF'
version: '3.8'
services:
  evolution-api:
    image: atendai/evolution-api:latest
    container_name: evolution-api
    restart: always
    ports:
      - "8080:8080"
    environment:
      - SERVER_URL=https://sua-vps.com
      - AUTHENTICATION_API_KEY=KFZOm3Hc3GSNWwHBywEm67xYgjN8xGTH
      - WEBHOOK_GLOBAL_URL=https://sua-vps.com/webhook
      - WEBHOOK_GLOBAL_ENABLED=true
      - WEBHOOK_GLOBAL_WEBHOOK_BY_EVENTS=true
      - WEBHOOK_GLOBAL_WEBHOOK_BASE64=true
      - CONFIG_SESSION_PHONE_VERSION=2.3000.1023204200
      - QRCODE_LIMIT=60
      - QRCODE_COUNT=3
      - LOG_LEVEL=ERROR
      - LOG_COLOR=false
      - LOG_BAILEYS=error
    volumes:
      - evolution_instances:/evolution/instances
      - evolution_store:/evolution/store
    networks:
      - evolution

volumes:
  evolution_instances:
  evolution_store:

networks:
  evolution:
    driver: bridge
EOF

# Iniciar Evolution API
docker-compose up -d
```

### 3. **Configurar Nginx (Opcional)**
```bash
# Instalar Nginx
sudo apt update
sudo apt install nginx

# Configurar proxy reverso
sudo nano /etc/nginx/sites-available/evolution-api

# Conteúdo do arquivo:
server {
    listen 80;
    server_name sua-vps.com;

    location / {
        proxy_pass http://localhost:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}

# Ativar configuração
sudo ln -s /etc/nginx/sites-available/evolution-api /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 4. **Configurar SSL (Opcional)**
```bash
# Instalar Certbot
sudo apt install certbot python3-certbot-nginx

# Obter certificado SSL
sudo certbot --nginx -d sua-vps.com
```

## 🔧 **Configuração do CRM**

### 1. **Atualizar .env**
```env
VITE_EVOLUTION_API_URL=https://sua-vps.com/
VITE_EVOLUTION_API_KEY=KFZOm3Hc3GSNWwHBywEm67xYgjN8xGTH
VITE_WEBHOOK_SECRET=crm-webhook-secret-2024
VITE_PUBLIC_BASE_URL=https://seu-crm.com
```

### 2. **Configurar Webhook**
Criar endpoint `/webhook` no seu CRM para receber eventos da Evolution API.

## 🎯 **Alternativa: Usar API Externa**

Se não quiser configurar na VPS, podemos usar uma API externa como:
- **Baileys API** (gratuita)
- **WhatsApp Business API** (oficial)
- **Evolution API** hospedada

## 📱 **Teste da Configuração**

Após configurar, teste com:
```bash
curl -X POST "https://sua-vps.com/instance/create" \
  -H "apikey: KFZOm3Hc3GSNWwHBywEm67xYgjN8xGTH" \
  -H "Content-Type: application/json" \
  -d '{
    "instanceName": "teste",
    "integration": "WHATSAPP-BAILEYS",
    "qrcode": true
  }'
```

## ✅ **Resultado Esperado**

Com a configuração correta, você deve receber:
- QR Code válido do WhatsApp
- Conexão automática quando escaneado
- Webhooks funcionando
- Status de conexão em tempo real

## 🆘 **Suporte**

Se precisar de ajuda com a configuração, me avise que posso:
1. Ajudar com comandos específicos
2. Criar scripts de instalação
3. Configurar webhook no CRM
4. Testar a integração
