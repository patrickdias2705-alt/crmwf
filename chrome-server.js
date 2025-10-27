import express from 'express';
import puppeteer from 'puppeteer';
import path from 'path';

const app = express();
const PORT = 3001;

let browser = null;
let page = null;

// Inicializar Chrome
async function initChrome() {
  try {
    console.log('🚀 Iniciando Chrome...');
    
    browser = await puppeteer.launch({
      headless: false,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-web-security',
        '--disable-features=VizDisplayCompositor',
        '--window-size=1200,800'
      ]
    });

    page = await browser.newPage();
    await page.setViewport({ width: 1200, height: 800 });
    
    // Navegar para WhatsApp Web
    console.log('📱 Carregando WhatsApp Web...');
    await page.goto('https://web.whatsapp.com/', { 
      waitUntil: 'networkidle2',
      timeout: 30000 
    });

    console.log('✅ Chrome iniciado com WhatsApp Web!');
  } catch (error) {
    console.error('❌ Erro ao iniciar Chrome:', error);
  }
}

// Rota principal - retorna a página do Chrome
app.get('/', async (req, res) => {
  try {
    if (!page) {
      await initChrome();
    }

    // Capturar screenshot da página atual
    const screenshot = await page.screenshot({ 
      fullPage: true,
      type: 'png'
    });

    res.setHeader('Content-Type', 'image/png');
    res.send(screenshot);
  } catch (error) {
    console.error('❌ Erro ao capturar screenshot:', error);
    res.status(500).send('Erro ao carregar Chrome');
  }
});

// Rota para interagir com a página
app.post('/click', async (req, res) => {
  try {
    const { x, y } = req.body;
    await page.mouse.click(x, y);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Rota para digitar
app.post('/type', async (req, res) => {
  try {
    const { text } = req.body;
    await page.keyboard.type(text);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Rota para refresh
app.post('/refresh', async (req, res) => {
  try {
    await page.reload();
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    chrome: browser ? 'Running' : 'Stopped',
    whatsapp: page ? 'Loaded' : 'Not loaded'
  });
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`🌐 Chrome Server rodando na porta ${PORT}`);
  console.log(`📱 Acesse: http://localhost:${PORT}`);
  
  // Inicializar Chrome automaticamente
  initChrome();
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('🛑 Fechando Chrome...');
  if (browser) {
    await browser.close();
  }
  process.exit(0);
});
