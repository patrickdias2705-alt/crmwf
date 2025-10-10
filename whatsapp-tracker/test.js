/**
 * Script de teste para o WhatsApp Tracker
 * Execute: node test.js
 */

const BASE_URL = 'http://localhost:3000';

console.log('🧪 Iniciando testes do WhatsApp Tracker\n');

// ==========================================
// Teste 1: Health Check
// ==========================================
async function testeHealthCheck() {
  console.log('📊 Teste 1: Health Check');
  
  try {
    const response = await fetch(`${BASE_URL}/health`);
    const data = await response.json();
    
    console.log('✅ Status:', data.status);
    console.log('   Supabase:', data.env.has_supabase ? '✅' : '❌');
    console.log('   OpenAI:', data.env.has_openai ? '✅' : '❌');
    console.log('   WhatsApp:', data.env.whatsapp_number);
    console.log('   Códigos em cache:', data.codes_cache);
    console.log('');
    
    return true;
  } catch (error) {
    console.error('❌ Erro:', error.message);
    console.log('');
    return false;
  }
}

// ==========================================
// Teste 2: Gerar Link de Tracking
// ==========================================
async function testeGerarLink() {
  console.log('🔗 Teste 2: Gerar Link de Tracking');
  
  try {
    const params = new URLSearchParams({
      utm_source: 'instagram',
      utm_medium: 'social',
      utm_campaign: 'teste_automatizado',
      utm_content: 'post_001'
    });
    
    const url = `${BASE_URL}/go/whatsapp?${params}`;
    console.log('   URL:', url);
    
    const response = await fetch(url, { 
      redirect: 'manual' // Não seguir redirect
    });
    
    if (response.status === 302) {
      const location = response.headers.get('location');
      console.log('✅ Redirecionamento criado');
      console.log('   Destino:', location);
      
      // Extrai o código da URL
      const match = location.match(/C[oó]digo%3A%20([a-zA-Z0-9]+)/i);
      if (match) {
        const code = match[1];
        console.log('   Código extraído:', code);
        console.log('');
        return code;
      }
    }
    
    console.log('⚠️  Redirecionamento não funcionou como esperado');
    console.log('');
    return null;
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
    console.log('');
    return null;
  }
}

// ==========================================
// Teste 3: Consultar Tracking
// ==========================================
async function testeConsultarTracking(code) {
  console.log('🔍 Teste 3: Consultar Tracking');
  
  try {
    const response = await fetch(`${BASE_URL}/tracking/${code}`);
    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ Tracking encontrado');
      console.log('   Origem:', data.tracking.utm_source);
      console.log('   Campanha:', data.tracking.utm_campaign);
      console.log('   Status:', data.status);
    } else {
      console.log('❌ Tracking não encontrado:', data.error);
    }
    console.log('');
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
    console.log('');
  }
}

// ==========================================
// Teste 4: Enviar Webhook
// ==========================================
async function testeEnviarWebhook(code) {
  console.log('📩 Teste 4: Enviar Webhook');
  
  try {
    const payload = {
      phone: '5511999887766',
      name: 'João Teste',
      message: `Olá! Quero saber mais sobre o produto premium. Código: ${code}`
    };
    
    console.log('   Payload:', JSON.stringify(payload, null, 2));
    
    const response = await fetch(`${BASE_URL}/webhook/whatsapp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });
    
    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ Webhook processado com sucesso');
      console.log('   Lead ID:', data.lead_id);
      console.log('   Origem:', data.tracking?.origem);
      console.log('   Campanha:', data.tracking?.campanha);
      console.log('   Interesse:', data.analise?.interesse);
      console.log('   Produto:', data.analise?.produto);
      console.log('   Resposta IA:', data.resposta_sugerida?.substring(0, 100) + '...');
    } else {
      console.log('❌ Erro no webhook:', data.error);
      console.log('   Detalhes:', data.details);
    }
    console.log('');
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
    console.log('');
  }
}

// ==========================================
// Teste 5: Listar Leads
// ==========================================
async function testeListarLeads() {
  console.log('📋 Teste 5: Listar Leads');
  
  try {
    const response = await fetch(`${BASE_URL}/leads?limit=5`);
    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ Leads encontrados:', data.pagination.total);
      console.log('   Página:', data.pagination.page);
      console.log('   Total de páginas:', data.pagination.pages);
      
      if (data.data && data.data.length > 0) {
        console.log('\n   Últimos 3 leads:');
        data.data.slice(0, 3).forEach((lead, i) => {
          console.log(`   ${i + 1}. ${lead.nome} - ${lead.telefone}`);
          console.log(`      Origem: ${lead.utm_source} | Campanha: ${lead.utm_campaign}`);
          console.log(`      Interesse: ${lead.grau_interesse || 'N/A'}`);
        });
      }
    } else {
      console.log('❌ Erro ao listar leads:', data.error);
    }
    console.log('');
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
    console.log('');
  }
}

// ==========================================
// Teste 6: Estatísticas
// ==========================================
async function testeEstatisticas() {
  console.log('📈 Teste 6: Estatísticas');
  
  try {
    const response = await fetch(`${BASE_URL}/stats`);
    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ Estatísticas carregadas');
      console.log('   Total de leads:', data.stats.total);
      console.log('\n   Por origem:');
      Object.entries(data.stats.por_origem).forEach(([origem, total]) => {
        console.log(`   - ${origem}: ${total}`);
      });
      console.log('\n   Por interesse:');
      console.log(`   - Alto: ${data.stats.por_interesse.alto || 0}`);
      console.log(`   - Médio: ${data.stats.por_interesse.médio || 0}`);
      console.log(`   - Baixo: ${data.stats.por_interesse.baixo || 0}`);
    } else {
      console.log('❌ Erro ao carregar stats:', data.error);
    }
    console.log('');
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
    console.log('');
  }
}

// ==========================================
// Executar todos os testes
// ==========================================
async function executarTestes() {
  console.log('='.repeat(50));
  console.log('🧪 WhatsApp Tracker - Suite de Testes');
  console.log('='.repeat(50));
  console.log('');
  
  // Teste 1: Health Check
  const healthOk = await testeHealthCheck();
  
  if (!healthOk) {
    console.log('❌ Servidor não está rodando. Inicie com: npm start');
    return;
  }
  
  // Aguarda um pouco
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // Teste 2: Gerar Link
  const code = await testeGerarLink();
  
  if (!code) {
    console.log('⚠️  Não foi possível extrair o código. Continuando outros testes...');
  } else {
    // Aguarda um pouco
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Teste 3: Consultar Tracking
    await testeConsultarTracking(code);
    
    // Aguarda um pouco
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Teste 4: Enviar Webhook
    await testeEnviarWebhook(code);
  }
  
  // Aguarda um pouco
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Teste 5: Listar Leads
  await testeListarLeads();
  
  // Aguarda um pouco
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // Teste 6: Estatísticas
  await testeEstatisticas();
  
  console.log('='.repeat(50));
  console.log('✅ Testes concluídos!');
  console.log('='.repeat(50));
}

// Executar
executarTestes().catch(console.error);



