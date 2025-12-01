const http = require('http');
const PORT = 3002;

const server = http.createServer((req, res) => {
  if (req.url === '/') {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(`
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
            z-index: 1000;
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
  } else if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ 
      status: 'OK',
      message: 'WhatsApp Web Server running'
    }));
  } else {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not Found');
  }
});

server.listen(PORT, () => {
  console.log(`🌐 WhatsApp Web Server rodando na porta ${PORT}`);
  console.log(`📱 Acesse: http://localhost:${PORT}`);
});
