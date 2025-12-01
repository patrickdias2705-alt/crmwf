import express from 'express';

const app = express();
const PORT = 3001;

// Rota principal - retorna HTML com iframe do WhatsApp Web
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>WhatsApp Web</title>
      <style>
        body { 
          margin: 0; 
          padding: 0; 
          overflow: hidden; 
          background: #000;
        }
        iframe { 
          width: 100vw; 
          height: 100vh; 
          border: none; 
        }
        .loading {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          color: white;
          font-family: Arial, sans-serif;
        }
      </style>
    </head>
    <body>
      <div class="loading">Carregando WhatsApp Web...</div>
      <iframe 
        src="https://web.whatsapp.com/" 
        allow="clipboard-read; clipboard-write; microphone; camera; fullscreen"
        onload="document.querySelector('.loading').style.display='none'"
      ></iframe>
    </body>
    </html>
  `);
});

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK',
    message: 'WhatsApp Web Server running'
  });
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`🌐 WhatsApp Web Server rodando na porta ${PORT}`);
  console.log(`📱 Acesse: http://localhost:${PORT}`);
});
