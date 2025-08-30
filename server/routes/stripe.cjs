const express = require('express');
const Stripe = require('stripe');
const { pool, executeQuery } = require('../config/database.cjs');
const { authenticateToken } = require('../middleware/auth.cjs');

const router = express.Router();

// Inicializar Stripe (ou mock se não houver chave)
let stripe;
console.log('🔍 Verificando configuração do Stripe...');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('STRIPE_SECRET_KEY existe:', !!process.env.STRIPE_SECRET_KEY);
console.log('STRIPE_SECRET_KEY valor:', process.env.STRIPE_SECRET_KEY ? process.env.STRIPE_SECRET_KEY.substring(0, 20) + '...' : 'UNDEFINED');

if (process.env.STRIPE_SECRET_KEY && process.env.STRIPE_SECRET_KEY !== 'sk_test_sua_chave_secreta_stripe') {
  try {
    stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    console.log('✅ Stripe configurado com chave:', process.env.STRIPE_SECRET_KEY.substring(0, 20) + '...');
  } catch (error) {
    console.error('❌ Erro ao inicializar Stripe:', error.message);
    stripe = null;
  }
} else {
  console.log('⚠️  Stripe não configurado ou usando chave placeholder, usando modo mock');
  stripe = null;
}

// Criar sessão de checkout
router.post('/create-checkout-session', authenticateToken, async (req, res) => {
  try {
    const { courseId } = req.body;

    console.log('🔍 Criando sessão de checkout para curso:', courseId);
    console.log('👤 Usuário:', req.user.id, req.user.email);

    if (!stripe) {
      return res.status(500).json({ error: 'Stripe não está configurado' });
    }

    // Buscar curso
    const courseResult = await executeQuery(
      'SELECT * FROM courses WHERE id = $1 AND status = $2',
      [courseId, 'published']
    );

    if (courseResult.rows.length === 0) {
      return res.status(404).json({ error: 'Curso não encontrado' });
    }

    const course = courseResult.rows[0];
    console.log('📚 Curso encontrado:', course.title, 'Preço:', course.price);

    // Verificar se usuário já possui o curso
    const enrollmentCheck = await executeQuery(
      'SELECT id FROM enrollments WHERE user_id = $1 AND course_id = $2',
      [req.user.id, courseId]
    );

    if (enrollmentCheck.rows.length > 0) {
      return res.status(400).json({ error: 'Você já possui este curso' });
    }

    // Buscar ou criar cliente Stripe
    let stripeCustomer;
    try {
      const customerResult = await executeQuery(
        'SELECT customer_id FROM stripe_customers WHERE user_id = $1',
        [req.user.id]
      );

      if (customerResult.rows.length > 0) {
        console.log('🔍 Cliente Stripe existente encontrado');
        stripeCustomer = await stripe.customers.retrieve(customerResult.rows[0].customer_id);
      } else {
        console.log('🆕 Criando novo cliente Stripe');
        // Criar novo cliente no Stripe
        stripeCustomer = await stripe.customers.create({
          email: req.user.email,
          name: req.user.name,
          metadata: {
            userId: req.user.id
          }
        });

        // Salvar no banco
        await executeQuery(
          'INSERT INTO stripe_customers (user_id, customer_id) VALUES ($1, $2)',
          [req.user.id, stripeCustomer.id]
        );
        console.log('✅ Cliente Stripe criado:', stripeCustomer.id);
      }
    } catch (error) {
      console.error('❌ Erro ao gerenciar cliente Stripe:', error);
      return res.status(500).json({ error: 'Erro ao configurar cliente de pagamento' });
    }

    // Criar sessão de checkout
    console.log('🛒 Criando sessão de checkout...');
    const session = await stripe.checkout.sessions.create({
      customer: stripeCustomer.id,
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'brl',
            product_data: {
              name: course.title,
              description: course.short_description,
              images: course.image_url ? [course.image_url] : [],
            },
            unit_amount: Math.round(course.price * 100), // Converter para centavos
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/payment/success?session_id={CHECKOUT_SESSION_ID}&course_id=${courseId}`,
      cancel_url: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/payment/cancel?course_id=${courseId}`,
      metadata: {
        userId: req.user.id,
        courseId: courseId,
      },
    });

    console.log('✅ Sessão de checkout criada:', session.id);
    console.log('🔗 URL de pagamento:', session.url);

    // Criar pedido no banco
    const orderResult = await executeQuery(`
      INSERT INTO orders (user_id, total_amount, status, payment_method, stripe_session_id, payment_url, expires_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `, [
      req.user.id,
      course.price,
      'pending',
      'stripe',
      session.id,
      session.url,
      new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 horas
    ]);

    const order = orderResult.rows[0];

    // Criar item do pedido
    await executeQuery(`
      INSERT INTO order_items (order_id, course_id, price, quantity)
      VALUES ($1, $2, $3, $4)
    `, [order.id, courseId, course.price, 1]);

    res.json({
      sessionId: session.id,
      url: session.url,
      orderId: order.id
    });

  } catch (error) {
    console.error('❌ Erro ao criar sessão de checkout:', error);
    
    // Log detalhado do erro
    if (error.type) {
      console.error('Tipo de erro Stripe:', error.type);
    }
    if (error.message) {
      console.error('Mensagem de erro:', error.message);
    }
    
    res.status(500).json({ 
      error: 'Erro ao processar pagamento',
      details: error.message || 'Erro desconhecido'
    });
  }
});

// Webhook do Stripe
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  console.log('🔔 Webhook recebido:', req.headers['stripe-signature'] ? 'Assinado' : 'Não assinado');
  
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    if (!process.env.STRIPE_WEBHOOK_SECRET) {
      console.log('⚠️  STRIPE_WEBHOOK_SECRET não configurado, processando sem verificação');
      event = JSON.parse(req.body);
    } else {
      event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
    }
    
    console.log('📦 Evento Stripe:', event.type);
  } catch (err) {
    console.error('❌ Erro na verificação do webhook:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Processar evento
  try {
    switch (event.type) {
      case 'checkout.session.completed':
        console.log('✅ Processando checkout.session.completed');
        await handleCheckoutCompleted(event.data.object);
        break;
      case 'payment_intent.succeeded':
        console.log('✅ Processando payment_intent.succeeded');
        await handlePaymentSucceeded(event.data.object);
        break;
      default:
        console.log(`ℹ️  Evento não tratado: ${event.type}`);
    }

    res.json({ received: true });
  } catch (error) {
    console.error('❌ Erro ao processar webhook:', error);
    res.status(500).json({ error: 'Erro ao processar webhook' });
  }
});

// Rota para forçar criação de matrícula (desenvolvimento)
router.post('/force-enrollment', authenticateToken, async (req, res) => {
  try {
    const { sessionId } = req.body;
    
    if (!sessionId) {
      return res.status(400).json({ error: 'Session ID é obrigatório' });
    }

    console.log('🔄 Forçando criação de matrícula para sessão:', sessionId);

    // Buscar sessão no Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    
    if (session.payment_status !== 'paid') {
      return res.status(400).json({ error: 'Pagamento não foi confirmado' });
    }

    // Processar matrícula
    await handleCheckoutCompleted(session);
    
    res.json({ 
      message: 'Matrícula criada com sucesso',
      sessionId: session.id,
      paymentStatus: session.payment_status
    });

  } catch (error) {
    console.error('❌ Erro ao forçar matrícula:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Processar checkout completado
async function handleCheckoutCompleted(session) {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');

    // Buscar pedido
    const orderResult = await client.query(
      'SELECT * FROM orders WHERE stripe_session_id = $1',
      [session.id]
    );

    if (orderResult.rows.length === 0) {
      console.error('Pedido não encontrado para sessão:', session.id);
      await client.query('ROLLBACK');
      return;
    }

    const order = orderResult.rows[0];

    // Atualizar status do pedido
    await client.query(
      'UPDATE orders SET status = $1, payment_intent_id = $2, paid_at = NOW() WHERE id = $3',
      ['completed', session.payment_intent, order.id]
    );

    // Buscar itens do pedido
    const itemsResult = await client.query(
      'SELECT course_id FROM order_items WHERE order_id = $1',
      [order.id]
    );

    // Criar matrículas
    for (const item of itemsResult.rows) {
      // Verificar se já não está matriculado
      const enrollmentCheck = await client.query(
        'SELECT id FROM enrollments WHERE user_id = $1 AND course_id = $2',
        [order.user_id, item.course_id]
      );

      if (enrollmentCheck.rows.length === 0) {
        await client.query(`
          INSERT INTO enrollments (user_id, course_id, order_id, status, started_at)
          VALUES ($1, $2, $3, $4, NOW())
        `, [order.user_id, item.course_id, order.id, 'active']);

        // Atualizar contador de alunos do curso
        await client.query(
          'UPDATE courses SET students_count = students_count + 1 WHERE id = $1',
          [item.course_id]
        );
      }
    }

    // Se for uma compra do carrinho, limpar o carrinho
    if (session.metadata && session.metadata.cart === 'true') {
      console.log('🛒 Limpando carrinho após compra bem-sucedida');
      await client.query(
        'DELETE FROM cart_items WHERE user_id = $1 AND course_id = ANY($2)',
        [order.user_id, itemsResult.rows.map(item => item.course_id)]
      );
    }

    await client.query('COMMIT');
    console.log('✅ Checkout processado com sucesso:', session.id);

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Erro ao processar checkout:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Processar pagamento bem-sucedido
async function handlePaymentSucceeded(paymentIntent) {
  console.log('Pagamento bem-sucedido:', paymentIntent.id);
  
  // Aqui você pode adicionar lógica adicional se necessário
  // Por exemplo, enviar email de confirmação, etc.
}

// Verificar status de pagamento
router.get('/payment-status/:sessionId', authenticateToken, async (req, res) => {
  try {
    const { sessionId } = req.params;

    // Buscar sessão no Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    // Buscar pedido no banco
    const orderResult = await executeQuery(
      'SELECT * FROM orders WHERE stripe_session_id = $1 AND user_id = $2',
      [sessionId, req.user.id]
    );

    if (orderResult.rows.length === 0) {
      return res.status(404).json({ error: 'Pedido não encontrado' });
    }

    const order = orderResult.rows[0];

    res.json({
      sessionId: session.id,
      paymentStatus: session.payment_status,
      orderStatus: order.status,
      amount: session.amount_total / 100, // Converter de centavos
      currency: session.currency,
      customerEmail: session.customer_details?.email,
    });

  } catch (error) {
    console.error('Erro ao verificar status:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// ============================================
// ROTAS MOCK PARA DESENVOLVIMENTO
// ============================================

// Mock: Criar sessão de pagamento
router.post('/mock-payment', authenticateToken, async (req, res) => {
  try {
    const { courseId, amount, currency, customerEmail, customerName } = req.body;

    // Criar pedido mock
    const orderResult = await executeQuery(`
      INSERT INTO orders (user_id, total_amount, status, payment_method, payment_url, expires_at)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `, [
      req.user.id,
      amount,
      'pending',
      'mock',
      `${process.env.FRONTEND_URL}/payment/mock?order_id={ORDER_ID}&amount=${amount}&course_id=${courseId}`,
      new Date(Date.now() + 24 * 60 * 60 * 1000) // 24h
    ]);

    const order = orderResult.rows[0];

    res.json({
      paymentId: order.id,
      paymentUrl: `${process.env.FRONTEND_URL}/payment/mock?order_id=${order.id}&amount=${amount}&course_id=${courseId}`,
      status: 'pending',
      expiresAt: order.expires_at
    });

  } catch (error) {
    console.error('Erro ao criar pagamento mock:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Mock: Verificar pagamento
router.get('/mock-verify/:paymentId', authenticateToken, async (req, res) => {
  try {
    const { paymentId } = req.params;

    // Buscar pedido
    const orderResult = await executeQuery(
      'SELECT * FROM orders WHERE id = $1 AND user_id = $2',
      [paymentId, req.user.id]
    );

    if (orderResult.rows.length === 0) {
      return res.status(404).json({ error: 'Pagamento não encontrado' });
    }

    const order = orderResult.rows[0];

    // Para mock, sempre aprovar após verificação
    if (order.status === 'pending') {
      await executeQuery(
        'UPDATE orders SET status = $1, paid_at = NOW() WHERE id = $2',
        ['completed', paymentId]
      );

      // Criar matrícula
      await executeQuery(`
        INSERT INTO enrollments (user_id, course_id, order_id, status, started_at)
        VALUES ($1, $2, $3, $4, NOW())
      `, [req.user.id, order.course_id || 'mock-course', order.id, 'active']);
    }

    res.json({
      id: order.id,
      status: 'completed',
      amount: order.total_amount,
      paidAt: new Date(),
      metadata: { courseId: order.course_id }
    });

  } catch (error) {
    console.error('Erro ao verificar pagamento mock:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Mock: Criar sessão de checkout
router.post('/create-session', authenticateToken, async (req, res) => {
  try {
    const { courseId, amount, currency, customerEmail, customerName, successUrl, cancelUrl, metadata } = req.body;

    // Criar pedido mock
    const orderResult = await executeQuery(`
      INSERT INTO orders (user_id, total_amount, status, payment_method, payment_url, expires_at)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `, [
      req.user.id,
      amount,
      'pending',
      'mock',
      `${process.env.FRONTEND_URL}/payment/mock?order_id={ORDER_ID}&amount=${amount}&course_id=${courseId}`,
      new Date(Date.now() + 24 * 60 * 60 * 1000) // 24h
    ]);

    const order = orderResult.rows[0];

    res.json({
      paymentId: order.id,
      paymentUrl: `${process.env.FRONTEND_URL}/payment/mock?order_id=${order.id}&amount=${amount}&course_id=${courseId}`,
      status: 'pending',
      expiresAt: order.expires_at
    });

  } catch (error) {
    console.error('Erro ao criar sessão mock:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Mock: Verificar sessão
router.get('/verify-session/:paymentId', authenticateToken, async (req, res) => {
  try {
    const { paymentId } = req.params;

    // Buscar pedido
    const orderResult = await executeQuery(
      'SELECT * FROM orders WHERE id = $1 AND user_id = $2',
      [paymentId, req.user.id]
    );

    if (orderResult.rows.length === 0) {
      return res.status(404).json({ error: 'Pagamento não encontrado' });
    }

    const order = orderResult.rows[0];

    res.json({
      id: order.id,
      status: order.status,
      amount: order.total_amount,
      paidAt: order.paid_at,
      metadata: { courseId: order.course_id }
    });

  } catch (error) {
    console.error('Erro ao verificar sessão mock:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

module.exports = router;