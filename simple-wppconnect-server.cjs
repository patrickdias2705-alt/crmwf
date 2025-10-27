const http = require('http');
const PORT = 3003;

const server = http.createServer((req, res) => {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  const url = req.url;
  const method = req.method;

  // Health check
  if (url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      status: 'OK',
      timestamp: new Date().toISOString(),
      uptime: process.uptime()
    }));
    return;
  }

  // Root endpoint
  if (url === '/') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      message: 'WPPConnect Mock Server',
      version: '1.0.0',
      status: 'running'
    }));
    return;
  }

  // Start session
  if (url === '/api/session/start' && method === 'POST') {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    req.on('end', () => {
      try {
        const data = JSON.parse(body);
        console.log(`🚀 Iniciando sessão: ${data.session}`);
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: true,
          session: data.session,
          message: 'Sessão iniciada com sucesso'
        }));
      } catch (error) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid JSON' }));
      }
    });
    return;
  }

  // Get QR Code
  if (url.match(/^\/api\/session\/.+\/qrcode$/)) {
    const session = url.split('/')[3];
    console.log(`📱 Gerando QR Code para sessão: ${session}`);
    
    // QR Code real para WhatsApp Web
    const mockQRCode = 'iVBORw0KGgoAAAANSUhEUgAAAfQAAAH0CAYAAADL1t+KAAAAAklEQVR4AewaftIAAAqfSURBVO3BUYosB5IEQI+g73/lWP2J5sEMbJaG9JKZzf0lAEC1DQBQbwMA1NsAAPU2AEC9DQBQbwMA1NsAAPU2AEC9DQBQbwMA1NsAAPU2AEC9DQBQbwMA1NsAAPU2AEC9DQBQbwMA1NsAAPU2AEC9DQBQbwMA1NsAAPU2AEC9DQBQbwMA1NsAAPU2AEC9DQBQbwMA1NsAAPU2AEC9DQBQbwMA1PvJi8xM+G53lzeYmTx1d+G9ZiZP3V2empnw3e4ub7ABAOptAIB6GwCg3gYAqLcBAOptAIB6GwCg3gYAqLcBAOptAIB6GwCg3gYAqLcBAOptAIB6GwCg3gYAqPeTL3N34fNmJt/k7sJ7zUz47e7C581MvsUGAKi3AQDqbQCAehsAoN4GAKi3AQDqbQCAehsAoN4GAKi3AQDqbQCAehsAoN4GAKi3AQDqbQCAehsAoN5P+MPM5JvcXb7JzITf7i5vMDP5hLsLnzcz+SZ3F/62AQDqbQCAehsAoN4GAKi3AQDqbQCAehsAoN4GAKi3AQDqbQCAehsAoN4GAKi3AQDqbQCAehsAoN4GAKi3AQDq/QT+he4u/DYzeYuZyRvcXaDFBgCotwEA6m0AgHobAKDeBgCotwEA6m0AgHobAKDeBgCotwEA6m0AgHobAKDeBgCotwEA6m0AgHobAKDeT4D/l5nJJ9xd3uDu8tTM5BPuLk/NTODfZAMA1NsAAPU2AEC9DQBQbwMA1NsAAPU2AEC9DQBQbwMA1NsAAPU2AEC9DQBQbwMA1NsAAPU2AEC9DQBQ7yf84e7Cd5uZPHV34be7yyfMTJ66u/Db3YXvtQEA6m0AgHobAKDeBgCotwEA6m0AgHobAKDeBgCotwEA6m0AgHobAKDeBgCotwEA6m0AgHobAKDeBgCo95MvMzOB/+bu8tTM5BPuLk/NTJ66uzw1M/mEu8tTM5On7i5vMTOB/2QDANTbAAD1NgBAvQ0AUG8DANTbAAD1NgBAvQ0AUG8DANTbAAD1NgBAvQ0AUG8DANTbAAD1NgBAvQ0AUG8DANT7yYvcXeB/YWby1N2F3+4unzAz+RZ3F/hf2AAA9TYAQL0NAFBvAwDU2wAA9TYAQL0NAFBvAwDU2wAA9TYAQL0NAFBvAwDU2wAA9TYAQL0NAFBvAwDU+8mLzEyeurs8NTPhn3F3eeru8tTMhN9mJnzezIR/xt2Fv20AgHobAKDeBgCotwEA6m0AgHobAKDeBgCotwEA6m0AgHobAKDeBgCotwEA6m0AgHobAKDeBgCotwEA6v3ky8xM3uLuwjvdXd5iZvLU3eUNZiafcHd5ambyBneXT5iZfIuZyVvcXd5gZvIWMxN+m5k8dXd5gw0AUG8DANTbAAD1NgBAvQ0AUG8DANTbAAD1NgBAvQ0AUG8DANTbAAD1NgBAvQ0AUG8DANTbAAD1NgBAvQ0AUO8n/GFm8gl3l29xd/kmd5dvcnf5JjOTb3F3+YSZyRvcXd7i7vLUzORbbACAehsAoN4GAKi3AQDqbQCAehsAoN4GAKi3AQDqbQCAehsAoN4GAKi3AQDqbQCAehsAoN4GAKi3AQDq/YR/zMzkqbvLUzOTt7i7PDUzeeru8k1mJt/k7vLUzIR3mpl8wt3lqbvLt9gAAPU2AEC9DQBQbwMA1NsAAPU2AEC9DQBQbwMA1NsAAPU2AEC9DQBQbwMA1NsAAPU2AEC9DQBQbwMA1Jv7S6DIzOSpu8tTM5NPuLs8NTN56u7yFjOTN7i7fJOZyRvcXfi8DQBQbwMA1NsAAPU2AEC9DQBQbwMA1NsAAPU2AEC9DQBQbwMA1NsAAPU2AEC9DQBQbwMA1NsAAPU2AEC9ub/kJWYmfLe7C+80M3nq7vIWM5On7i5PzUw+4e7y1MzkqbvLUzOTb3J3eYMNAFBvAwDU2wAA9TYAQL0NAFBvAwDU2wAA9TYAQL0NAFBvAwDU2wAA9TYAQL0NAFBvAwDU2wAA9TYAQL0NAFDvJ1/m7sLnzUzeYmby1N3lqZnJW9xdnrq7PDUz+YS7y7e4u3yTmclTd5dPmJnwtw0AUG8DANTbAAD1NgBAvQ0AUG8DANTbAAD1NgBAvQ0AUG8DANTbAAD1NgBAvQ0AUG8DANTbAAD1NgBAvZ/wh5nJN7m78NvM5JvMTL7JzOQNZib8dnd5ambyCXcX/rYBAOptAIB6GwCg3gYAqLcBAOptAIB6GwCg3gYAqLcBAOptAIB6GwCg3gYAqLcBAOptAIB6GwCg3gYAqPcTgA+5u7zFzOSpu8tTM5NPuLs8NTN56u7yFjOTN7i7vMEGAKi3AQDqbQCAehsAoN4GAKi3AQDqbQCAehsAoN4GAKi3AQDqbQCAehsAoN4GAKi3AQDqbQCAehsAoN5P4F/o7vLUzOQT7i5vMDN5ambyCXeXp+4ub3B3eYu7y1Mzk7e4uzw1M/kWGwCg3gYAqLcBAOptAIB6GwCg3gYAqLcBAOptAIB6GwCg3gYAqLcBAOptAIB6GwCg3gYAqLcBAOptAIB6GwCg3k/4w92F97q78Hl3l6dmJm8xM3mDu8snzEy+xd2Fz9sAAPU2AEC9DQBQbwMA1NsAAPU2AEC9DQBQbwMA1NsAAPU2AEC9DQBQbwMA1NsAAPU2AEC9DQBQbwMA1PvJl5mZ8N1mJk/dXd5iZsLn3V14p5kJn7cBAOptAIB6GwCg3gYAqLcBAOptAIB6GwCg3gYAqLcBAOptAIB6GwCg3gYAqLcBAOptAIB6GwCg3gYAqDf3lwAA1TYAQL0NAFBvAwDU2wAA9TYAQL0NAFBvAwDU2wAA9TYAQL0NAFBvAwDU2wAA9TYAQL0NAFBvAwDU2wAA9TYAQL0NAFBvAwDU2wAA9TYAQL0NAFBvAwDU2wAA9TYAQL0NAFBvAwDU2wAA9TYAQL0NAFBvAwDU2wAA9TYAQL3/Ayebi/z7I4qNAAAAAElFTkSuQmCC';
    
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      success: true,
      session: session,
      qrcode: mockQRCode,
      message: 'QR Code gerado com sucesso'
    }));
    return;
  }

  // Session status
  if (url.match(/^\/api\/session\/.+\/status$/)) {
    const session = url.split('/')[3];
    console.log(`🔍 Verificando status da sessão: ${session}`);
    
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      success: true,
      session: session,
      status: 'disconnected',
      message: 'Sessão desconectada'
    }));
    return;
  }

  // 404
  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Not Found' }));
});

server.listen(PORT, () => {
  console.log(`🌐 WPPConnect Mock Server rodando na porta ${PORT}`);
  console.log(`📱 Acesse: http://localhost:${PORT}`);
  console.log(`🔗 API: http://localhost:${PORT}/api`);
});
