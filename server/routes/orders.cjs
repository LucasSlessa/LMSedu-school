const express = require('express');
const { pool, executeQuery } = require('../config/database.cjs');
const { authenticateToken } = require('../middleware/auth.cjs');

const router = express.Router();

// Criar pedido a partir do carrinho
router.post('/create', authenticateToken, async (req, res) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');

    // Buscar itens do carrinho
    const cartResult = await client.query(`
      SELECT 
        ci.course_id,
        ci.quantity,
        c.price,
        c.title
      FROM cart_items ci
      JOIN courses c ON ci.course_id = c.id
      WHERE ci.user_id = $1 AND c.status = 'published'
    `, [req.user.id]);

    if (cartResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Carrinho vazio ou cursos indisponíveis' });
    }

    // Calcular total
    const totalAmount = cartResult.rows.reduce((sum, item) => {
      return sum + (parseFloat(item.price) * item.quantity);
    }, 0);

    // Criar pedido
    const orderResult = await client.query(`
      INSERT INTO orders (user_id, total_amount, status, payment_method, expires_at)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `, [
      req.user.id,
      totalAmount,
      'pending',
      'mock', // Para demonstração
      new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 horas
    ]);

    const order = orderResult.rows[0];

    // Criar itens do pedido
    for (const item of cartResult.rows) {
      await client.query(`
        INSERT INTO order_items (order_id, course_id, price, quantity)
        VALUES ($1, $2, $3, $4)
      `, [order.id, item.course_id, item.price, item.quantity]);
    }

    // Limpar carrinho
    await client.query('DELETE FROM cart_items WHERE user_id = $1', [req.user.id]);

    await client.query('COMMIT');

    // Simular URL de pagamento
    const paymentUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/payment/mock?order_id=${order.id}&amount=${totalAmount}`;

    res.status(201).json({
      message: 'Pedido criado com sucesso',
      order: {
        id: order.id,
        totalAmount: parseFloat(order.total_amount),
        status: order.status,
        paymentUrl,
        expiresAt: order.expires_at
      }
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Erro ao criar pedido:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  } finally {
    client.release();
  }
});

// Confirmar pagamento (simulado)
router.post('/:orderId/confirm', authenticateToken, async (req, res) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');

    const { orderId } = req.params;

    // Buscar pedido
    const orderResult = await client.query(
      'SELECT * FROM orders WHERE id = $1 AND user_id = $2',
      [orderId, req.user.id]
    );

    if (orderResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Pedido não encontrado' });
    }

    const order = orderResult.rows[0];

    if (order.status !== 'pending') {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Pedido já foi processado' });
    }

    // Atualizar status do pedido
    await client.query(
      'UPDATE orders SET status = $1, paid_at = NOW() WHERE id = $2',
      ['completed', orderId]
    );

    // Buscar itens do pedido
    const itemsResult = await client.query(
      'SELECT course_id FROM order_items WHERE order_id = $1',
      [orderId]
    );

    // Criar matrículas
    for (const item of itemsResult.rows) {
      // Verificar se já não está matriculado
      const enrollmentCheck = await client.query(
        'SELECT id FROM enrollments WHERE user_id = $1 AND course_id = $2',
        [req.user.id, item.course_id]
      );

      if (enrollmentCheck.rows.length === 0) {
        await client.query(`
          INSERT INTO enrollments (user_id, course_id, order_id, status, started_at)
          VALUES ($1, $2, $3, $4, NOW())
        `, [req.user.id, item.course_id, orderId, 'active']);

        // Atualizar contador de alunos do curso
        await client.query(
          'UPDATE courses SET students_count = students_count + 1 WHERE id = $1',
          [item.course_id]
        );
      }
    }

    await client.query('COMMIT');

    res.json({
      message: 'Pagamento confirmado e matrículas criadas',
      order: {
        id: order.id,
        status: 'completed',
        paidAt: new Date()
      }
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Erro ao confirmar pagamento:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  } finally {
    client.release();
  }
});

// Listar pedidos do usuário
router.get('/', authenticateToken, async (req, res) => {
  try {
    const result = await executeQuery(`
      SELECT 
        o.*,
        json_agg(
          json_build_object(
            'course_id', oi.course_id,
            'title', c.title,
            'price', oi.price,
            'quantity', oi.quantity
          )
        ) as items
      FROM orders o
      LEFT JOIN order_items oi ON o.id = oi.order_id
      LEFT JOIN courses c ON oi.course_id = c.id
      WHERE o.user_id = $1
      GROUP BY o.id
      ORDER BY o.created_at DESC
    `, [req.user.id]);

    const orders = result.rows.map(row => ({
      id: row.id,
      totalAmount: parseFloat(row.total_amount),
      currency: row.currency,
      status: row.status,
      paymentMethod: row.payment_method,
      paidAt: row.paid_at,
      createdAt: row.created_at,
      items: row.items || []
    }));

    res.json(orders);
  } catch (error) {
    console.error('Erro ao buscar pedidos:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Obter pedido específico
router.get('/:orderId', authenticateToken, async (req, res) => {
  try {
    const { orderId } = req.params;

    const result = await executeQuery(`
      SELECT 
        o.*,
        json_agg(
          json_build_object(
            'course_id', oi.course_id,
            'title', c.title,
            'price', oi.price,
            'quantity', oi.quantity,
            'image_url', c.image_url
          )
        ) as items
      FROM orders o
      LEFT JOIN order_items oi ON o.id = oi.order_id
      LEFT JOIN courses c ON oi.course_id = c.id
      WHERE o.id = $1 AND o.user_id = $2
      GROUP BY o.id
    `, [orderId, req.user.id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Pedido não encontrado' });
    }

    const row = result.rows[0];
    const order = {
      id: row.id,
      totalAmount: parseFloat(row.total_amount),
      currency: row.currency,
      status: row.status,
      paymentMethod: row.payment_method,
      paymentUrl: row.payment_url,
      expiresAt: row.expires_at,
      paidAt: row.paid_at,
      createdAt: row.created_at,
      items: row.items || []
    };

    res.json(order);
  } catch (error) {
    console.error('Erro ao buscar pedido:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

module.exports = router;