const express = require('express');
const app = express();
const PORT = 3003;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

// Mock QR Code (base64 de um QR Code de exemplo)
const mockQRCode = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';

// Rotas da API WPPConnect
app.get('/', (req, res) => {
  res.json({
    message: 'WPPConnect Mock Server',
    version: '1.0.0',
    status: 'running'
  });
});

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Iniciar sessão
app.post('/api/session/start', (req, res) => {
  const { session } = req.body;
  console.log(`🚀 Iniciando sessão: ${session}`);
  
  res.json({
    success: true,
    session: session,
    message: 'Sessão iniciada com sucesso',
    qrcode: mockQRCode
  });
});

// Obter QR Code
app.get('/api/session/:session/qrcode', (req, res) => {
  const { session } = req.params;
  console.log(`📱 Gerando QR Code para sessão: ${session}`);
  
  res.json({
    success: true,
    session: session,
    qrcode: mockQRCode,
    message: 'QR Code gerado com sucesso'
  });
});

// Status da sessão
app.get('/api/session/:session/status', (req, res) => {
  const { session } = req.params;
  console.log(`🔍 Verificando status da sessão: ${session}`);
  
  res.json({
    success: true,
    session: session,
    status: 'disconnected', // Simular desconectado
    message: 'Sessão desconectada'
  });
});

// Listar sessões
app.get('/api/session/list', (req, res) => {
  res.json({
    success: true,
    sessions: [],
    message: 'Nenhuma sessão ativa'
  });
});

// Fechar sessão
app.delete('/api/session/:session', (req, res) => {
  const { session } = req.params;
  console.log(`🗑️ Fechando sessão: ${session}`);
  
  res.json({
    success: true,
    session: session,
    message: 'Sessão fechada com sucesso'
  });
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`🌐 WPPConnect Mock Server rodando na porta ${PORT}`);
  console.log(`📱 Acesse: http://localhost:${PORT}`);
  console.log(`🔗 API: http://localhost:${PORT}/api`);
});
