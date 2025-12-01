const express = require('express');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const helmet = require('helmet');

const app = express();
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'whatsapp-remote-secret-2024';

// Middleware
app.use(helmet());
app.use(cors({
  origin: ['http://localhost:8080', 'http://localhost:3000'],
  credentials: true
}));
app.use(express.json());

// Simular usuários (em produção, usar banco de dados)
const users = {
  'user_123': { id: 'user_123', name: 'Atendente 1', role: 'agent' },
  'user_456': { id: 'user_456', name: 'Atendente 2', role: 'agent' },
  'admin_789': { id: 'admin_789', name: 'Admin', role: 'admin' }
};

// Gerar token JWT
function generateToken(userId, sessionId) {
  return jwt.sign(
    { 
      userId, 
      sessionId, 
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24 horas
    },
    JWT_SECRET
  );
}

// Verificar token JWT
function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
}

// Rota de login
app.post('/login', (req, res) => {
  const { userId, sessionId } = req.body;
  
  if (!userId || !sessionId) {
    return res.status(400).json({ error: 'userId e sessionId são obrigatórios' });
  }

  if (!users[userId]) {
    return res.status(401).json({ error: 'Usuário não encontrado' });
  }

  const token = generateToken(userId, sessionId);
  const user = users[userId];

  res.json({
    success: true,
    token,
    user: {
      id: user.id,
      name: user.name,
      role: user.role
    },
    sessionId
  });
});

// Rota de verificação (usada pelo Nginx)
app.get('/verify', (req, res) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token não fornecido' });
  }

  const token = authHeader.substring(7);
  const decoded = verifyToken(token);

  if (!decoded) {
    return res.status(401).json({ error: 'Token inválido' });
  }

  // Verificar se o usuário ainda existe
  if (!users[decoded.userId]) {
    return res.status(401).json({ error: 'Usuário não encontrado' });
  }

  res.json({
    success: true,
    userId: decoded.userId,
    sessionId: decoded.sessionId
  });
});

// Rota de refresh token
app.post('/refresh', (req, res) => {
  const { token } = req.body;
  
  if (!token) {
    return res.status(400).json({ error: 'Token é obrigatório' });
  }

  const decoded = verifyToken(token);
  
  if (!decoded) {
    return res.status(401).json({ error: 'Token inválido' });
  }

  const newToken = generateToken(decoded.userId, decoded.sessionId);
  
  res.json({
    success: true,
    token: newToken
  });
});

// Rota de logout
app.post('/logout', (req, res) => {
  // Em produção, adicionar token à blacklist
  res.json({ success: true, message: 'Logout realizado' });
});

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Listar usuários (para debug)
app.get('/users', (req, res) => {
  res.json({
    users: Object.values(users).map(u => ({ id: u.id, name: u.name, role: u.role }))
  });
});

app.listen(PORT, () => {
  console.log(`🔐 Auth Server rodando na porta ${PORT}`);
  console.log(`📋 Usuários disponíveis:`, Object.keys(users).join(', '));
  console.log(`🔑 JWT Secret: ${JWT_SECRET.substring(0, 10)}...`);
});
