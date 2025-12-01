import axios from 'axios';

const EVOLUTION_URL = 'https://evolutionapi.dentechia.shop';
const API_KEY = 'KFZOm3Hc3GSNWwHBywEm67xYgjN8xGTH';

async function testEvolutionVPS() {
  console.log('🔍 Testando Evolution API na VPS...');
  console.log('🌐 URL:', EVOLUTION_URL);
  
  try {
    // 1. Testar conectividade básica
    console.log('📡 Testando conectividade...');
    try {
      const response = await axios.get(`${EVOLUTION_URL}/`, { timeout: 5000 });
      console.log('✅ Conectividade OK!');
    } catch (error) {
      console.log('❌ Erro de conectividade:', error.message);
      return;
    }

    // 2. Listar instâncias existentes
    console.log('📋 Listando instâncias...');
    try {
      const instancesResponse = await axios.get(`${EVOLUTION_URL}/instance/fetchInstances`, {
        headers: {
          'apikey': API_KEY,
          'Content-Type': 'application/json'
        },
        timeout: 10000
      });
      console.log('✅ Instâncias encontradas:', instancesResponse.data.length);
    } catch (error) {
      console.log('❌ Erro ao listar instâncias:', error.message);
    }

    // 3. Criar instância de teste
    console.log('🔧 Criando instância de teste...');
    const instanceName = `crm-test-${Date.now()}`;
    const payload = {
      instanceName,
      integration: 'WHATSAPP-BAILEYS',
      qrcode: true
    };

    try {
      const createResponse = await axios.post(`${EVOLUTION_URL}/instance/create`, payload, {
        headers: {
          'apikey': API_KEY,
          'Content-Type': 'application/json'
        },
        timeout: 15000
      });
      
      console.log('✅ Instância criada com sucesso!');
      console.log('📊 Response:', JSON.stringify(createResponse.data, null, 2));
      
      const instanceId = createResponse.data?.instance?.instanceId;
      
      if (instanceId) {
        // 4. Verificar se tem QR Code
        if (createResponse.data?.qrcode?.base64) {
          console.log('🎯 QR Code encontrado!');
          console.log('📊 QR Code info:', {
            hasBase64: !!createResponse.data.qrcode.base64,
            hasCode: !!createResponse.data.qrcode.code,
            count: createResponse.data.qrcode.count
          });
          
          // Salvar QR Code para análise
          const fs = require('fs');
          const qrCodeBase64 = createResponse.data.qrcode.base64;
          const qrCodeBuffer = Buffer.from(qrCodeBase64.split(',')[1], 'base64');
          fs.writeFileSync(`qr-code-vps-${instanceId}.png`, qrCodeBuffer);
          console.log('💾 QR Code salvo como arquivo PNG!');
        } else {
          console.log('⚠️ QR Code não encontrado na resposta');
        }

        // 5. Limpeza
        try {
          await axios.delete(`${EVOLUTION_URL}/instance/delete/${instanceId}`, {
            headers: {
              'apikey': API_KEY,
              'Content-Type': 'application/json'
            }
          });
          console.log('🧹 Instância de teste removida!');
        } catch (deleteError) {
          console.log('⚠️ Erro ao remover instância:', deleteError.message);
        }
      }
      
    } catch (error) {
      console.log('❌ Erro ao criar instância:', error.message);
      if (error.response) {
        console.log('❌ Status:', error.response.status);
        console.log('❌ Response:', JSON.stringify(error.response.data, null, 2));
      }
    }

    console.log('✅ Teste concluído!');
    console.log('🌐 Evolution API funcionando em:', EVOLUTION_URL);
    
  } catch (error) {
    console.log('❌ Erro geral:', error.message);
  }
}

testEvolutionVPS();
