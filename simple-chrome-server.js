import express from 'express';
import puppeteer from 'puppeteer';

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

// Rota principal - retorna HTML com iframe
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Chrome WhatsApp Web</title>
      <style>
        body { margin: 0; padding: 0; overflow: hidden; }
        iframe { width: 100vw; height: 100vh; border: none; }
      </style>
    </head>
    <body>
      <iframe src="https://web.whatsapp.com/" allow="clipboard-read; clipboard-write; microphone; camera; fullscreen"></iframe>
    </body>
    </html>
  `);
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
