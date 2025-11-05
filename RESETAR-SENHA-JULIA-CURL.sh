#!/bin/bash
# =====================================================
# Script para Resetar Senha da Julia via API
# =====================================================
# Execute: bash RESETAR-SENHA-JULIA-CURL.sh
# Ou: chmod +x RESETAR-SENHA-JULIA-CURL.sh && ./RESETAR-SENHA-JULIA-CURL.sh
# =====================================================

# Configurações
SUPABASE_URL="https://xqeqaagnnkilihlfjbrm.supabase.co"
USER_ID="a0cc209f-4c08-49a9-ba14-7f0c5f3e850e"
EMAIL="julia@wfcirurgicos.com.br"
NOVA_SENHA="Test@1234"

# IMPORTANTE: Substitua pela sua Service Role Key
# Você encontra em: Supabase Dashboard > Settings > API > service_role key
SERVICE_ROLE_KEY="SUA_SERVICE_ROLE_KEY_AQUI"

# Verificar se a Service Role Key foi configurada
if [ "$SERVICE_ROLE_KEY" = "SUA_SERVICE_ROLE_KEY_AQUI" ]; then
  echo "❌ ERRO: Configure a SERVICE_ROLE_KEY no script!"
  echo ""
  echo "Como obter a Service Role Key:"
  echo "1. Acesse: https://app.supabase.com"
  echo "2. Selecione seu projeto"
  echo "3. Vá em: Settings > API"
  echo "4. Copie a 'service_role key' (secret)"
  echo "5. Cole no lugar de 'SUA_SERVICE_ROLE_KEY_AQUI' neste script"
  exit 1
fi

echo "🔐 Resetando senha para: $EMAIL"
echo ""

# Resetar senha via API
RESPONSE=$(curl -s -w "\n%{http_code}" -X PUT "$SUPABASE_URL/auth/v1/admin/users/$USER_ID" \
  -H "apikey: $SERVICE_ROLE_KEY" \
  -H "Authorization: Bearer $SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d "{
    \"password\": \"$NOVA_SENHA\",
    \"email_confirm\": true
  }")

# Separar resposta e código HTTP
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

# Verificar resultado
if [ "$HTTP_CODE" = "200" ]; then
  echo "✅ Senha resetada com sucesso!"
  echo ""
  echo "📧 Email: $EMAIL"
  echo "🔑 Nova senha: $NOVA_SENHA"
  echo ""
  echo "⚠️  IMPORTANTE: Avise o usuário para mudar a senha após o primeiro login!"
else
  echo "❌ Erro ao resetar senha"
  echo "Código HTTP: $HTTP_CODE"
  echo "Resposta: $BODY"
  exit 1
fi

