const express = require('express');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./routes/auth.cjs');
const coursesRoutes = require('./routes/courses.cjs');
const categoriesRoutes = require('./routes/categories.cjs');
const cartRoutes = require('./routes/cart.cjs');
const ordersRoutes = require('./routes/orders.cjs');
const enrollmentsRoutes = require('./routes/enrollments.cjs');
const stripeRoutes = require('./routes/stripe.cjs');
const reportsRoutes = require('./routes/reports.cjs');
// Safe require for users routes
let usersRoutes;
try {
  usersRoutes = require('./routes/users.cjs');
  console.log('✅ Users routes loaded successfully');
} catch (error) {
  console.error('❌ Failed to load users routes:', error.message);
  usersRoutes = null;
}

const app = express();
const PORT = process.env.PORT || 3001;

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
  const path = require('path');
  app.use(express.static(path.join(__dirname, '../dist')));
}

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));

// Middleware especial para webhook do Stripe (deve vir antes do express.json)
app.use('/api/stripe/webhook', express.raw({ type: 'application/json' }));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Middleware de log
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  if (req.method === 'POST' || req.method === 'PUT') {
    console.log('📝 Request headers:', req.headers);
    console.log('📝 Request body type:', typeof req.body);
    console.log('📝 Request body:', req.body);
  }
  next();
});

// Rotas
app.use('/api/auth', authRoutes);
app.use('/api/courses', coursesRoutes);
app.use('/api/categories', categoriesRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', ordersRoutes);
app.use('/api/enrollments', enrollmentsRoutes);
app.use('/api/stripe', stripeRoutes);
app.use('/api/reports', reportsRoutes);
if (usersRoutes) {
  app.use('/api/users', usersRoutes);
}

// Rota de health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Middleware de erro global
app.use((err, req, res, next) => {
  console.error('Erro não tratado:', err);
  res.status(500).json({ 
    error: 'Erro interno do servidor',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Handle React Router - deve vir APÓS todas as rotas API
if (process.env.NODE_ENV === 'production') {
  const path = require('path');
  app.get('*', (req, res) => {
    if (!req.path.startsWith('/api')) {
      res.sendFile(path.join(__dirname, '../dist/index.html'));
    } else {
      res.status(404).json({ error: 'Rota da API não encontrada' });
    }
  });
} else {
  // Rota 404 para desenvolvimento
  app.use('*', (req, res) => {
    res.status(404).json({ error: 'Rota não encontrada' });
  });
}

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
  console.log(`📱 Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:5173'}`);
  console.log(`🔗 API URL: http://localhost:${PORT}/api`);
});

module.exports = app;