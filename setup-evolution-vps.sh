#!/bin/bash

# 🚀 Script de Configuração da Evolution API na VPS
# Execute como root: sudo bash setup-evolution-vps.sh

echo "🔍 Verificando sistema..."
uname -a

echo "📦 Atualizando sistema..."
apt update -y

echo "🐳 Instalando Docker..."
if ! command -v docker &> /dev/null; then
    curl -fsSL https://get.docker.com -o get-docker.sh
    sh get-docker.sh
    systemctl start docker
    systemctl enable docker
    echo "✅ Docker instalado!"
else
    echo "✅ Docker já instalado!"
fi

echo "🔧 Instalando Docker Compose..."
if ! command -v docker-compose &> /dev/null; then
    curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    chmod +x /usr/local/bin/docker-compose
    echo "✅ Docker Compose instalado!"
else
    echo "✅ Docker Compose já instalado!"
fi

echo "📁 Criando diretório da Evolution API..."
mkdir -p /opt/evolution-api
cd /opt/evolution-api

echo "📝 Criando docker-compose.yml..."
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
      - SERVER_URL=http://212.85.21.123:8080
      - AUTHENTICATION_API_KEY=KFZOm3Hc3GSNWwHBywEm67xYgjN8xGTH
      - WEBHOOK_GLOBAL_URL=http://212.85.21.123:8080/webhook
      - WEBHOOK_GLOBAL_ENABLED=true
      - WEBHOOK_GLOBAL_WEBHOOK_BY_EVENTS=true
      - WEBHOOK_GLOBAL_WEBHOOK_BASE64=true
      - CONFIG_SESSION_PHONE_VERSION=2.3000.1023204200
      - QRCODE_LIMIT=60
      - QRCODE_COUNT=3
      - LOG_LEVEL=ERROR
      - LOG_COLOR=false
      - LOG_BAILEYS=error
      - DATABASE_ENABLED=false
      - REDIS_ENABLED=false
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

echo "🚀 Iniciando Evolution API..."
docker-compose up -d

echo "⏳ Aguardando inicialização..."
sleep 30

echo "🔍 Verificando status..."
docker-compose ps

echo "🧪 Testando API..."
sleep 10
curl -X GET "http://localhost:8080/instance/fetchInstances" \
  -H "apikey: KFZOm3Hc3GSNWwHBywEm67xYgjN8xGTH" \
  -H "Content-Type: application/json" || echo "⚠️ API ainda inicializando..."

echo "📋 Configuração concluída!"
echo "🌐 Evolution API rodando em: http://212.85.21.123:8080"
echo "🔑 API Key: KFZOm3Hc3GSNWwHBywEm67xYgjN8xGTH"
echo ""
echo "📱 Para testar:"
echo "curl -X POST 'http://212.85.21.123:8080/instance/create' \\"
echo "  -H 'apikey: KFZOm3Hc3GSNWwHBywEm67xYgjN8xGTH' \\"
echo "  -H 'Content-Type: application/json' \\"
echo "  -d '{\"instanceName\":\"teste\",\"integration\":\"WHATSAPP-BAILEYS\",\"qrcode\":true}'"
echo ""
echo "✅ Pronto! Agora atualize o .env do CRM com:"
echo "VITE_EVOLUTION_API_URL=http://212.85.21.123:8080/"
