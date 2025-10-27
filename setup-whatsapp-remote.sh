#!/bin/bash

echo "🚀 Configurando WhatsApp Remote WebView..."

# Criar diretórios necessários
echo "📁 Criando diretórios..."
mkdir -p chrome-profiles chrome-data nginx/ssl nginx/auth

# Gerar certificados SSL auto-assinados
echo "🔐 Gerando certificados SSL..."
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout nginx/ssl/key.pem \
  -out nginx/ssl/cert.pem \
  -subj "/C=BR/ST=SP/L=SaoPaulo/O=CRM/OU=IT/CN=localhost"

# Instalar dependências do auth-server
echo "📦 Instalando dependências do auth-server..."
cd auth-server
npm install
cd ..

# Criar arquivo .env se não existir
if [ ! -f .env ]; then
  echo "📝 Criando arquivo .env..."
  cp docker.env .env
fi

echo "✅ Setup concluído!"
echo ""
echo "🎯 Para iniciar:"
echo "   docker-compose up -d"
echo ""
echo "🌐 URLs:"
echo "   - Gateway: https://localhost/whatsapp"
echo "   - Auth: http://localhost:3001"
echo "   - Chrome VNC: http://localhost:6901"
echo ""
echo "🔑 Usuários de teste:"
echo "   - user_123 (Atendente 1)"
echo "   - user_456 (Atendente 2)"
echo "   - admin_789 (Admin)"
