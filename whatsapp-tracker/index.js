require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
const { OpenAI } = require('openai');
const { createClient } = require('@supabase/supabase-js');

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Configurações
const PORT = process.env.PORT || 3000;
const WHATSAPP_NUMBER = process.env.WHATSAPP_NUMBER;
const DEFAULT_TENANT_ID = process.env.DEFAULT_TENANT_ID;

// Clientes
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY
);

const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY 
});

// Armazenamento temporário de UTMs (em produção, use Redis)
const origemUTMs = {};

// Função para limpar UTMs antigas (evita memory leak)
setInterval(() => {
  const now = Date.now();
  const expirationTime = 24 * 60 * 60 * 1000; // 24 horas
  
  Object.keys(origemUTMs).forEach(code => {
    const timestamp = new Date(origemUTMs[code].timestamp).getTime();
    if (now - timestamp > expirationTime) {
      delete origemUTMs[code];
    }
  });
}, 60 * 60 * 1000); // Roda a cada 1 hora

// ==========================================
// ROTA 1: GET /go/whatsapp
// Gera código único e redireciona para WhatsApp
// ==========================================
app.get('/go/whatsapp', (req, res) => {
  try {
    const { 
      utm_source = 'desconhecido', 
      utm_medium = 'direct',
      utm_campaign = 'sem_campanha',
      utm_term,
      utm_content,
      redirect_url // URL personalizada de redirecionamento
    } = req.query;

    // Gera código único (primeiros 8 caracteres do UUID)
    const code = uuidv4().split('-')[0];

    // Salva os dados UTM temporariamente
    origemUTMs[code] = {
      utm_source,
      utm_medium,
      utm_campaign,
      utm_term: utm_term || null,
      utm_content: utm_content || null,
      timestamp: new Date().toISOString(),
      ip: req.ip,
      user_agent: req.headers['user-agent'],
      referrer: req.headers['referer'] || req.headers['referrer']
    };

    console.log(`✅ Código gerado: ${code}`, origemUTMs[code]);

    // Monta a mensagem do WhatsApp
    const mensagem = `Olá! Quero saber mais. Código: ${code}`;
    const mensagemEncoded = encodeURIComponent(mensagem);

    // URL do WhatsApp
    const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${mensagemEncoded}`;

    // Se tiver URL customizada, redireciona para ela com o código
    if (redirect_url) {
      const separator = redirect_url.includes('?') ? '&' : '?';
      return res.redirect(`${redirect_url}${separator}tracking_code=${code}`);
    }

    // Redireciona para o WhatsApp
    return res.redirect(whatsappUrl);

  } catch (error) {
    console.error('❌ Erro em /go/whatsapp:', error.message);
    return res.status(500).json({ 
      error: 'Erro ao gerar link de rastreamento',
      details: error.message 
    });
  }
});

// ==========================================
// ROTA 2: POST /webhook/whatsapp
// Recebe mensagem e processa com IA
// ==========================================
app.post('/webhook/whatsapp', async (req, res) => {
  try {
    const { 
      phone, 
      name = 'Desconhecido', 
      message,
      tenant_id = DEFAULT_TENANT_ID 
    } = req.body;

    // Validação básica
    if (!phone || !message) {
      return res.status(400).json({ 
        error: 'Dados ausentes',
        required: ['phone', 'message']
      });
    }

    console.log(`\n📱 Mensagem recebida de ${name} (${phone})`);
    console.log(`💬 Mensagem: ${message}`);

    // Extrai o código da mensagem (aceita variações)
    const codeMatch = message.match(/c[oó]digo[:\s]*([a-zA-Z0-9]+)/i);
    const code = codeMatch ? codeMatch[1] : null;

    console.log(`🔍 Código extraído: ${code || 'Nenhum'}`);

    // Busca dados de origem pelo código
    const origem = code && origemUTMs[code] 
      ? origemUTMs[code] 
      : {
          utm_source: 'desconhecido',
          utm_medium: 'direct',
          utm_campaign: 'sem_campanha',
          utm_term: null,
          utm_content: null,
          timestamp: new Date().toISOString()
        };

    console.log(`🎯 Origem detectada:`, origem);

    // Se encontrou o código, remove do cache
    if (code && origemUTMs[code]) {
      delete origemUTMs[code];
    }

    // ==========================================
    // Análise com ChatGPT
    // ==========================================
    console.log(`🤖 Enviando para ChatGPT...`);

    const prompt = `
Analise a seguinte mensagem de um potencial cliente e extraia as informações:

Mensagem: "${message}"
Nome informado: "${name}"

Responda APENAS em formato JSON estruturado com:
{
  "nome_extraido": "Nome do cliente se mencionado na mensagem, senão use '${name}'",
  "produto_interesse": "Produto ou serviço mencionado, ou 'Não especificado'",
  "grau_interesse": "alto, médio ou baixo",
  "intencao": "compra, dúvida, reclamação ou outro",
  "resposta_sugerida": "Uma resposta educada e profissional para o lead"
}

Seja objetivo e preciso.
`;

    let analiseIA = {
      nome_extraido: name,
      produto_interesse: 'Não especificado',
      grau_interesse: 'médio',
      intencao: 'dúvida',
      resposta_sugerida: 'Obrigado pelo contato! Em breve retornaremos.'
    };

    try {
      const chatCompletion = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'Você é um assistente que analisa mensagens de leads e extrai informações importantes. Sempre responda em JSON válido.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.5,
        max_tokens: 500
      });

      const respostaIA = chatCompletion.choices[0].message.content;
      console.log(`✅ Resposta IA:`, respostaIA);

      // Tenta fazer parse do JSON
      try {
        // Remove markdown code blocks se existir
        const jsonText = respostaIA.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        analiseIA = JSON.parse(jsonText);
      } catch (parseError) {
        console.warn('⚠️  Resposta da IA não é JSON válido, usando resposta completa');
        analiseIA.resposta_sugerida = respostaIA;
      }

    } catch (aiError) {
      console.error('❌ Erro ao chamar OpenAI:', aiError.message);
      // Continua mesmo se a IA falhar
    }

    // ==========================================
    // Salvar no Supabase
    // ==========================================
    console.log(`💾 Salvando no Supabase...`);

    const leadData = {
      nome: analiseIA.nome_extraido || name,
      telefone: phone,
      mensagem: message,
      codigo: code,
      utm_source: origem.utm_source,
      utm_medium: origem.utm_medium,
      utm_campaign: origem.utm_campaign,
      utm_term: origem.utm_term,
      utm_content: origem.utm_content,
      resposta_ia: JSON.stringify(analiseIA),
      produto_interesse: analiseIA.produto_interesse,
      grau_interesse: analiseIA.grau_interesse,
      intencao: analiseIA.intencao,
      dados_origem: JSON.stringify({
        ip: origem.ip,
        user_agent: origem.user_agent,
        referrer: origem.referrer,
        timestamp_origem: origem.timestamp
      })
    };

    // Se tiver tenant_id, adiciona
    if (tenant_id) {
      leadData.tenant_id = tenant_id;
    }

    const { data: leadSalvo, error: supabaseError } = await supabase
      .from('leads_whatsapp')
      .insert([leadData])
      .select()
      .single();

    if (supabaseError) {
      console.error('❌ Erro ao salvar no Supabase:', supabaseError.message);
      
      // Se a tabela não existe, tenta criar
      if (supabaseError.message.includes('relation "leads_whatsapp" does not exist')) {
        console.log('⚠️  Tabela leads_whatsapp não existe. Execute o script de criação primeiro!');
      }

      return res.status(500).json({ 
        error: 'Erro ao salvar no Supabase',
        details: supabaseError.message 
      });
    }

    console.log(`✅ Lead salvo com ID: ${leadSalvo.id}`);

    // ==========================================
    // Resposta de Sucesso
    // ==========================================
    return res.status(200).json({
      success: true,
      message: 'Lead processado com sucesso',
      lead_id: leadSalvo.id,
      tracking: {
        codigo: code,
        origem: origem.utm_source,
        campanha: origem.utm_campaign
      },
      analise: {
        interesse: analiseIA.grau_interesse,
        produto: analiseIA.produto_interesse,
        intencao: analiseIA.intencao
      },
      resposta_sugerida: analiseIA.resposta_sugerida
    });

  } catch (error) {
    console.error('❌ Erro em /webhook/whatsapp:', error);
    return res.status(500).json({ 
      error: 'Erro interno do servidor',
      details: error.message 
    });
  }
});

// ==========================================
// ROTA 3: GET /tracking/:code
// Consulta dados de um código de tracking
// ==========================================
app.get('/tracking/:code', (req, res) => {
  const { code } = req.params;
  
  const tracking = origemUTMs[code];
  
  if (!tracking) {
    return res.status(404).json({
      error: 'Código não encontrado ou expirado',
      code: code
    });
  }

  return res.json({
    code: code,
    tracking: tracking,
    status: 'ativo'
  });
});

// ==========================================
// ROTA 4: GET /leads
// Lista leads salvos (com paginação)
// ==========================================
app.get('/leads', async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 50,
      utm_source,
      utm_campaign,
      grau_interesse 
    } = req.query;

    const offset = (page - 1) * limit;

    let query = supabase
      .from('leads_whatsapp')
      .select('*', { count: 'exact' })
      .order('criado_em', { ascending: false })
      .range(offset, offset + limit - 1);

    // Filtros opcionais
    if (utm_source) {
      query = query.eq('utm_source', utm_source);
    }
    if (utm_campaign) {
      query = query.eq('utm_campaign', utm_campaign);
    }
    if (grau_interesse) {
      query = query.eq('grau_interesse', grau_interesse);
    }

    const { data, error, count } = await query;

    if (error) {
      throw error;
    }

    return res.json({
      success: true,
      data: data,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        pages: Math.ceil(count / limit)
      }
    });

  } catch (error) {
    console.error('❌ Erro ao buscar leads:', error);
    return res.status(500).json({ 
      error: 'Erro ao buscar leads',
      details: error.message 
    });
  }
});

// ==========================================
// ROTA 5: GET /stats
// Estatísticas de origem
// ==========================================
app.get('/stats', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('leads_whatsapp')
      .select('utm_source, utm_campaign, grau_interesse');

    if (error) throw error;

    // Agrupa por origem
    const stats = {
      total: data.length,
      por_origem: {},
      por_campanha: {},
      por_interesse: {
        alto: 0,
        médio: 0,
        baixo: 0
      }
    };

    data.forEach(lead => {
      // Por origem
      stats.por_origem[lead.utm_source] = (stats.por_origem[lead.utm_source] || 0) + 1;
      
      // Por campanha
      stats.por_campanha[lead.utm_campaign] = (stats.por_campanha[lead.utm_campaign] || 0) + 1;
      
      // Por interesse
      if (lead.grau_interesse) {
        stats.por_interesse[lead.grau_interesse] = (stats.por_interesse[lead.grau_interesse] || 0) + 1;
      }
    });

    return res.json({
      success: true,
      stats: stats
    });

  } catch (error) {
    console.error('❌ Erro ao buscar estatísticas:', error);
    return res.status(500).json({ 
      error: 'Erro ao buscar estatísticas',
      details: error.message 
    });
  }
});

// ==========================================
// ROTA 6: GET /health
// Health check
// ==========================================
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    env: {
      node_version: process.version,
      has_supabase: !!process.env.SUPABASE_URL,
      has_openai: !!process.env.OPENAI_API_KEY,
      whatsapp_number: process.env.WHATSAPP_NUMBER ? 'configurado' : 'não configurado'
    },
    codes_cache: Object.keys(origemUTMs).length
  });
});

// ==========================================
// Rota raiz
// ==========================================
app.get('/', (req, res) => {
  res.json({
    name: 'WhatsApp UTM Tracker com IA',
    version: '1.0.0',
    endpoints: {
      tracking: 'GET /go/whatsapp?utm_source=X&utm_campaign=Y',
      webhook: 'POST /webhook/whatsapp',
      tracking_info: 'GET /tracking/:code',
      leads: 'GET /leads',
      stats: 'GET /stats',
      health: 'GET /health'
    },
    documentation: 'https://github.com/seu-usuario/whatsapp-tracker'
  });
});

// ==========================================
// Iniciar servidor
// ==========================================
app.listen(PORT, () => {
  console.log('\n🚀 ==========================================');
  console.log(`   WhatsApp UTM Tracker rodando!`);
  console.log(`   http://localhost:${PORT}`);
  console.log('   ==========================================\n');
  console.log(`📱 WhatsApp: ${WHATSAPP_NUMBER || '⚠️  NÃO CONFIGURADO'}`);
  console.log(`💾 Supabase: ${process.env.SUPABASE_URL ? '✅ Conectado' : '❌ Não configurado'}`);
  console.log(`🤖 OpenAI: ${process.env.OPENAI_API_KEY ? '✅ Conectado' : '❌ Não configurado'}`);
  console.log('\n📚 Rotas disponíveis:');
  console.log(`   GET  /go/whatsapp - Gerar link de tracking`);
  console.log(`   POST /webhook/whatsapp - Receber mensagem`);
  console.log(`   GET  /tracking/:code - Ver dados de tracking`);
  console.log(`   GET  /leads - Listar leads`);
  console.log(`   GET  /stats - Estatísticas`);
  console.log(`   GET  /health - Status do sistema`);
  console.log('\n==========================================\n');
});

// Tratamento de erros não capturados
process.on('unhandledRejection', (error) => {
  console.error('❌ Unhandled Rejection:', error);
});

process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  process.exit(1);
});



