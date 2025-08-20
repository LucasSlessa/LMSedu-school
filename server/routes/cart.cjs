const express = require('express');
const { pool, executeQuery } = require('../config/database.cjs');
const { authenticateToken } = require('../middleware/auth.cjs');

const router = express.Router();

// Obter itens do carrinho
router.get('/', authenticateToken, async (req, res) => {
  try {
    const result = await executeQuery(`
      SELECT 
        ci.*,
        c.title,
        c.description,
        c.short_description,
        c.price,
        c.duration_hours,
        c.image_url,
        c.level,
        cat.name as category_name,
        u.name as instructor_name
      FROM cart_items ci
      JOIN courses c ON ci.course_id = c.id
      LEFT JOIN categories cat ON c.category_id = cat.id
      LEFT JOIN users u ON c.instructor_id = u.id
      WHERE ci.user_id = $1
      ORDER BY ci.added_at DESC
    `, [req.user.id]);

    const cartItems = result.rows.map(row => ({
      id: row.id,
      quantity: row.quantity,
      addedAt: row.added_at,
      course: {
        id: row.course_id,
        title: row.title,
        description: row.description,
        shortDescription: row.short_description,
        price: parseFloat(row.price),
        duration: row.duration_hours,
        image: row.image_url,
        level: row.level,
        category: row.category_name,
        instructor: row.instructor_name
      }
    }));

    res.json(cartItems);
  } catch (error) {
    console.error('Erro ao buscar carrinho:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Adicionar item ao carrinho
router.post('/add', authenticateToken, async (req, res) => {
  try {
    const { courseId } = req.body;

    // Verificar se o curso existe e está publicado
    const courseCheck = await executeQuery(
      'SELECT id, title, price FROM courses WHERE id = $1 AND status = $2',
      [courseId, 'published']
    );

    if (courseCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Curso não encontrado ou não disponível' });
    }

    // Verificar se o usuário já possui este curso
    const enrollmentCheck = await executeQuery(
      'SELECT id FROM enrollments WHERE user_id = $1 AND course_id = $2',
      [req.user.id, courseId]
    );

    if (enrollmentCheck.rows.length > 0) {
      return res.status(400).json({ error: 'Você já possui este curso' });
    }

    // Verificar se já está no carrinho
    const cartCheck = await executeQuery(
      'SELECT id FROM cart_items WHERE user_id = $1 AND course_id = $2',
      [req.user.id, courseId]
    );

    if (cartCheck.rows.length > 0) {
      return res.status(400).json({ error: 'Curso já está no carrinho' });
    }

    // Adicionar ao carrinho
    const result = await executeQuery(
      'INSERT INTO cart_items (user_id, course_id) VALUES ($1, $2) RETURNING *',
      [req.user.id, courseId]
    );

    res.status(201).json({
      message: 'Curso adicionado ao carrinho',
      cartItem: result.rows[0]
    });
  } catch (error) {
    console.error('Erro ao adicionar ao carrinho:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Remover item do carrinho
router.delete('/:courseId', authenticateToken, async (req, res) => {
  try {
    const { courseId } = req.params;

    const result = await executeQuery(
      'DELETE FROM cart_items WHERE user_id = $1 AND course_id = $2 RETURNING *',
      [req.user.id, courseId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Item não encontrado no carrinho' });
    }

    res.json({ message: 'Item removido do carrinho' });
  } catch (error) {
    console.error('Erro ao remover do carrinho:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Limpar carrinho
router.delete('/', authenticateToken, async (req, res) => {
  try {
    await executeQuery('DELETE FROM cart_items WHERE user_id = $1', [req.user.id]);
    res.json({ message: 'Carrinho limpo com sucesso' });
  } catch (error) {
    console.error('Erro ao limpar carrinho:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Obter total do carrinho
router.get('/total', authenticateToken, async (req, res) => {
  try {
    const result = await executeQuery(`
      SELECT 
        COUNT(ci.id) as item_count,
        COALESCE(SUM(c.price * ci.quantity), 0) as total_amount
      FROM cart_items ci
      JOIN courses c ON ci.course_id = c.id
      WHERE ci.user_id = $1
    `, [req.user.id]);

    const { item_count, total_amount } = result.rows[0];

    res.json({
      itemCount: parseInt(item_count),
      totalAmount: parseFloat(total_amount)
    });
  } catch (error) {
    console.error('Erro ao calcular total do carrinho:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

module.exports = router;