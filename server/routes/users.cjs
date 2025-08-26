const express = require('express');
const { pool, executeQuery } = require('../config/database.cjs');
const { authenticateToken, requireRole } = require('../middleware/auth.cjs');

const router = express.Router();

// Middleware para verificar se é admin
router.use(authenticateToken);
router.use(requireRole(['admin']));

// Listar todos os usuários (apenas para admins)
router.get('/', async (req, res) => {
  try {
    const result = await executeQuery(`
      SELECT 
        id,
        email,
        name,
        role,
        status,
        avatar_url,
        created_at,
        last_login
      FROM users 
      ORDER BY created_at DESC
    `);

    const users = result.rows.map(row => ({
      id: row.id,
      email: row.email,
      name: row.name,
      role: row.role,
      status: row.status,
      avatar_url: row.avatar_url,
      created_at: row.created_at,
      last_login: row.last_login
    }));

    res.json(users);
  } catch (error) {
    console.error('Erro ao buscar usuários:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Obter usuário por ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await executeQuery(`
      SELECT 
        id,
        email,
        name,
        role,
        status,
        avatar_url,
        created_at,
        last_login
      FROM users 
      WHERE id = $1
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    const user = result.rows[0];
    res.json({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      status: user.status,
      avatar_url: user.avatar_url,
      created_at: user.created_at,
      last_login: user.last_login
    });
  } catch (error) {
    console.error('Erro ao buscar usuário:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Atualizar usuário
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, role, status } = req.body;

    // Impedir alterar o próprio papel (role)
    if (role && req.user && String(req.user.id) === String(id)) {
      return res.status(403).json({ error: 'Você não pode alterar o seu próprio papel' });
    }

    const result = await executeQuery(`
      UPDATE users 
      SET 
        name = COALESCE($1, name),
        email = COALESCE($2, email),
        role = COALESCE($3, role),
        status = COALESCE($4, status),
        updated_at = NOW()
      WHERE id = $5
      RETURNING *
    `, [name, email, role, status, id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    res.json({
      message: 'Usuário atualizado com sucesso',
      user: result.rows[0]
    });
  } catch (error) {
    console.error('Erro ao atualizar usuário:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Desativar/ativar usuário
router.patch('/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['active', 'inactive', 'suspended'].includes(status)) {
      return res.status(400).json({ error: 'Status inválido' });
    }

    const result = await executeQuery(`
      UPDATE users 
      SET status = $1, updated_at = NOW()
      WHERE id = $2
      RETURNING *
    `, [status, id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    res.json({
      message: 'Status do usuário atualizado com sucesso',
      user: result.rows[0]
    });
  } catch (error) {
    console.error('Erro ao atualizar status do usuário:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

module.exports = router;
