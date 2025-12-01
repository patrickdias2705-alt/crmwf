#!/bin/bash

echo "🚀 Fazendo deploy da Edge Function chatwoot-conversations..."

# Fazer o deploy da função
supabase functions deploy chatwoot-conversations

echo ""
echo "✅ Deploy concluído!"
echo ""
echo "⚠️  IMPORTANTE: Configure a variável de ambiente no Supabase Dashboard:"
echo "   1. Vá em Edge Functions → Settings"
echo "   2. Adicione: CHATWOOT_API_TOKEN=HUYUHnVUAunUeAWpcUS8VWeK"
echo ""
