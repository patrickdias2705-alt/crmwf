// Script para inicializar Chrome com WhatsApp Web
const puppeteer = require('puppeteer');

async function initChromeWithWhatsApp() {
  console.log('🚀 Inicializando Chrome com WhatsApp Web...');
  
  const browser = await puppeteer.launch({
    headless: false, // Para debug
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--no-first-run',
      '--no-zygote',
      '--disable-gpu',
      '--window-size=1920,1080'
    ]
  });

  const page = await browser.newPage();
  
  // Configurar viewport
  await page.setViewport({ width: 1920, height: 1080 });
  
  // Configurar user agent
  await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
  
  // Navegar para WhatsApp Web
  console.log('📱 Carregando WhatsApp Web...');
  await page.goto('https://web.whatsapp.com/', { 
    waitUntil: 'networkidle2',
    timeout: 30000 
  });
  
  console.log('✅ WhatsApp Web carregado!');
  console.log('🔗 URL: https://web.whatsapp.com/');
  
  // Manter o browser aberto
  console.log('⏳ Mantendo Chrome aberto...');
  
  // Aguardar indefinidamente
  await new Promise(() => {});
}

initChromeWithWhatsApp().catch(console.error);
