/**
 * Exemplos de uso da API do WhatsApp Tracker
 */

const BASE_URL = 'http://localhost:3000';

// ==========================================
// Exemplo 1: Gerar link de tracking
// ==========================================
function gerarLinkTracking() {
  const params = {
    utm_source: 'instagram',
    utm_medium: 'social',
    utm_campaign: 'promo_verao_2024',
    utm_content: 'post_001'
  };
  
  const queryString = new URLSearchParams(params).toString();
  const url = `${BASE_URL}/go/whatsapp?${queryString}`;
  
  console.log('🔗 Link de Tracking:');
  console.log(url);
  console.log('\nCompartilhe este link no Instagram, Facebook, etc.');
  console.log('Quando o usuário clicar, será redirecionado para o WhatsApp com código de rastreio.\n');
}

// ==========================================
// Exemplo 2: Simular recebimento de mensagem
// ==========================================
async function simularMensagem() {
  const payload = {
    phone: '5511999887766',
    name: 'Maria Silva',
    message: 'Olá! Vi no Instagram e quero saber mais sobre o produto premium. Código: abc12345'
  };
  
  console.log('📱 Simulando recebimento de mensagem...\n');
  
  try {
    const response = await fetch(`${BASE_URL}/webhook/whatsapp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });
    
    const data = await response.json();
    
    console.log('✅ Mensagem processada!');
    console.log('Lead ID:', data.lead_id);
    console.log('Origem:', data.tracking?.origem);
    console.log('Campanha:', data.tracking?.campanha);
    console.log('Interesse:', data.analise?.interesse);
    console.log('Produto:', data.analise?.produto);
    console.log('\nResposta sugerida pela IA:');
    console.log(data.resposta_sugerida);
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
  }
}

// ==========================================
// Exemplo 3: Consultar código de tracking
// ==========================================
async function consultarCodigo(code) {
  console.log(`🔍 Consultando código: ${code}\n`);
  
  try {
    const response = await fetch(`${BASE_URL}/tracking/${code}`);
    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ Código encontrado!');
      console.log('Origem:', data.tracking.utm_source);
      console.log('Meio:', data.tracking.utm_medium);
      console.log('Campanha:', data.tracking.utm_campaign);
      console.log('Criado em:', data.tracking.timestamp);
    } else {
      console.log('❌ Código não encontrado ou expirado');
    }
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
  }
}

// ==========================================
// Exemplo 4: Listar leads recentes
// ==========================================
async function listarLeadsRecentes() {
  console.log('📋 Listando leads recentes...\n');
  
  try {
    const response = await fetch(`${BASE_URL}/leads?limit=10`);
    const data = await response.json();
    
    console.log(`Total de leads: ${data.pagination.total}`);
    console.log(`Página ${data.pagination.page} de ${data.pagination.pages}\n`);
    
    data.data.forEach((lead, index) => {
      console.log(`${index + 1}. ${lead.nome} - ${lead.telefone}`);
      console.log(`   Origem: ${lead.utm_source} | Campanha: ${lead.utm_campaign}`);
      console.log(`   Interesse: ${lead.grau_interesse || 'N/A'} | Produto: ${lead.produto_interesse || 'N/A'}`);
      console.log('');
    });
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
  }
}

// ==========================================
// Exemplo 5: Ver estatísticas
// ==========================================
async function verEstatisticas() {
  console.log('📊 Carregando estatísticas...\n');
  
  try {
    const response = await fetch(`${BASE_URL}/stats`);
    const data = await response.json();
    
    console.log(`Total de leads: ${data.stats.total}\n`);
    
    console.log('Por origem:');
    Object.entries(data.stats.por_origem).forEach(([origem, total]) => {
      console.log(`  - ${origem}: ${total}`);
    });
    
    console.log('\nPor campanha:');
    Object.entries(data.stats.por_campanha)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .forEach(([campanha, total]) => {
        console.log(`  - ${campanha}: ${total}`);
      });
    
    console.log('\nPor grau de interesse:');
    console.log(`  - Alto: ${data.stats.por_interesse.alto || 0}`);
    console.log(`  - Médio: ${data.stats.por_interesse.médio || 0}`);
    console.log(`  - Baixo: ${data.stats.por_interesse.baixo || 0}`);
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
  }
}

// ==========================================
// Exemplo 6: Filtrar leads de interesse alto
// ==========================================
async function listarLeadsAltoInteresse() {
  console.log('🔥 Leads de Alto Interesse\n');
  
  try {
    const response = await fetch(`${BASE_URL}/leads?grau_interesse=alto&limit=20`);
    const data = await response.json();
    
    console.log(`Total de leads quentes: ${data.pagination.total}\n`);
    
    data.data.forEach((lead, index) => {
      console.log(`${index + 1}. ${lead.nome} - ${lead.telefone}`);
      console.log(`   🎯 ${lead.produto_interesse}`);
      console.log(`   📍 ${lead.utm_source} → ${lead.utm_campaign}`);
      console.log(`   🕐 ${new Date(lead.criado_em).toLocaleString('pt-BR')}`);
      console.log('');
    });
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
  }
}

// ==========================================
// Exemplo 7: Integração com Evolution API
// ==========================================
function exemploIntegracaoEvolution() {
  console.log('🔌 Exemplo de Integração com Evolution API\n');
  
  const codigoExemplo = `
// No seu webhook da Evolution API:

app.post('/evolution-webhook', async (req, res) => {
  try {
    const { key, message } = req.body;
    
    // Extrai dados da mensagem
    const phone = key.remoteJid.replace('@s.whatsapp.net', '');
    const name = key.pushName || 'Cliente';
    const text = message.conversation || 
                 message.extendedTextMessage?.text || 
                 '';
    
    // Envia para o tracker
    const response = await fetch('http://localhost:3000/webhook/whatsapp', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        phone: phone,
        name: name,
        message: text
      })
    });
    
    const result = await response.json();
    
    // Opcional: Enviar resposta automática
    if (result.resposta_sugerida) {
      // Use sua API do WhatsApp para enviar a resposta
      await enviarMensagemWhatsApp(phone, result.resposta_sugerida);
    }
    
    res.json({ success: true });
    
  } catch (error) {
    console.error('Erro:', error);
    res.status(500).json({ error: error.message });
  }
});
  `;
  
  console.log(codigoExemplo);
}

// ==========================================
// Menu interativo
// ==========================================
async function menu() {
  console.log('\n' + '='.repeat(60));
  console.log('📱 WhatsApp Tracker - Exemplos de Uso');
  console.log('='.repeat(60) + '\n');
  
  console.log('Escolha um exemplo:\n');
  console.log('1. Gerar link de tracking');
  console.log('2. Simular recebimento de mensagem');
  console.log('3. Consultar código de tracking');
  console.log('4. Listar leads recentes');
  console.log('5. Ver estatísticas');
  console.log('6. Listar leads de alto interesse');
  console.log('7. Ver exemplo de integração com Evolution API');
  console.log('0. Executar todos os exemplos\n');
  
  // Para executar, rode: node exemplo-uso.js
}

// ==========================================
// Executar todos os exemplos
// ==========================================
async function executarTodos() {
  console.log('\n🚀 Executando todos os exemplos...\n');
  
  // Exemplo 1
  gerarLinkTracking();
  await new Promise(r => setTimeout(r, 1000));
  
  // Exemplo 2
  await simularMensagem();
  await new Promise(r => setTimeout(r, 1000));
  
  // Exemplo 3
  await consultarCodigo('abc12345');
  await new Promise(r => setTimeout(r, 1000));
  
  // Exemplo 4
  await listarLeadsRecentes();
  await new Promise(r => setTimeout(r, 1000));
  
  // Exemplo 5
  await verEstatisticas();
  await new Promise(r => setTimeout(r, 1000));
  
  // Exemplo 6
  await listarLeadsAltoInteresse();
  await new Promise(r => setTimeout(r, 1000));
  
  // Exemplo 7
  exemploIntegracaoEvolution();
  
  console.log('\n✅ Todos os exemplos executados!\n');
}

// ==========================================
// Execução
// ==========================================
if (require.main === module) {
  menu();
  
  // Descomente para executar todos:
  // executarTodos();
  
  // Ou execute individualmente:
  // gerarLinkTracking();
  // simularMensagem();
  // consultarCodigo('abc12345');
  // listarLeadsRecentes();
  // verEstatisticas();
  // listarLeadsAltoInteresse();
  // exemploIntegracaoEvolution();
}

module.exports = {
  gerarLinkTracking,
  simularMensagem,
  consultarCodigo,
  listarLeadsRecentes,
  verEstatisticas,
  listarLeadsAltoInteresse,
  exemploIntegracaoEvolution
};



