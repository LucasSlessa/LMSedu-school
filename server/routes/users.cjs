const express = require('express');
const { pool, executeQuery } = require('../config/database.cjs');
const { authenticateToken, requireRole } = require('../middleware/auth.cjs');
const bcrypt = require('bcrypt');

const router = express.Router();

// Middleware para verificar se é admin
router.use(authenticateToken);
router.use(requireRole(['admin']));

// Redefinir senha temporária (admin)
router.post('/:id/reset-password-temp', async (req, res) => {
  try {
    const { id } = req.params;

    // Impedir redefinir a própria senha por este endpoint (use fluxo de perfil)
    if (req.user && String(req.user.id) === String(id)) {
      return res.status(403).json({ error: 'Use o fluxo de perfil para alterar sua própria senha' });
    }

    // Gerar senha temporária
    const tempPassword = Math.random().toString(36).slice(-10);
    const hash = await bcrypt.hash(tempPassword, 12);

    const result = await executeQuery(
      `UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2 RETURNING id, email, name`,
      [hash, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    return res.json({ message: 'Senha temporária gerada', tempPassword });
  } catch (error) {
    console.error('Erro ao gerar senha temporária:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

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

// Criar novo usuário (apenas para admins)
router.post('/', async (req, res) => {
  try {
    const { name, email, role, password } = req.body;

    // Validar dados obrigatórios
    if (!name || !email || !role || !password) {
      return res.status(400).json({ error: 'Todos os campos são obrigatórios' });
    }

    // Verificar se o email já existe
    const existingUser = await executeQuery(
      'SELECT id FROM users WHERE LOWER(email) = LOWER($1)',
      [email]
    );

    if (existingUser.rows.length > 0) {
      return res.status(400).json({ error: 'Email já está em uso' });
    }

    // Hash da senha
    const bcrypt = require('bcrypt');
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Inserir novo usuário
    const result = await executeQuery(`
      INSERT INTO users (name, email, password_hash, role, status)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, name, email, role, status, created_at
    `, [name, email.toLowerCase(), passwordHash, role, 'active']);

    const newUser = result.rows[0];

    res.status(201).json({
      message: 'Usuário criado com sucesso',
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        status: newUser.status,
        created_at: newUser.created_at
      }
    });
  } catch (error) {
    console.error('Erro ao criar usuário:', error);
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

    // Verificar se o usuário existe
    const existingUser = await executeQuery(
      'SELECT id FROM users WHERE id = $1',
      [id]
    );

    if (existingUser.rows.length === 0) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    // Verificar se o email já está em uso por outro usuário
    if (email) {
      const emailCheck = await executeQuery(
        'SELECT id FROM users WHERE LOWER(email) = LOWER($1) AND id != $2',
        [email, id]
      );

      if (emailCheck.rows.length > 0) {
        return res.status(400).json({ error: 'Email já está em uso por outro usuário' });
      }
    }

    // Atualizar usuário
    const result = await executeQuery(`
      UPDATE users 
      SET name = COALESCE($1, name),
          email = COALESCE($2, email),
          role = COALESCE($3, role),
          status = COALESCE($4, status),
          updated_at = NOW()
      WHERE id = $5
      RETURNING id, name, email, role, status, created_at, updated_at
    `, [name, email?.toLowerCase(), role, status, id]);

    const updatedUser = result.rows[0];

    res.json({
      message: 'Usuário atualizado com sucesso',
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
        status: updatedUser.status,
        created_at: updatedUser.created_at,
        updated_at: updatedUser.updated_at
      }
    });
  } catch (error) {
    console.error('Erro ao atualizar usuário:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Deletar usuário
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Verificar se o usuário existe
    const existingUser = await executeQuery(
      'SELECT id FROM users WHERE id = $1',
      [id]
    );

    if (existingUser.rows.length === 0) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    // Não permitir deletar o próprio usuário
    if (id === req.user.id) {
      return res.status(400).json({ error: 'Não é possível deletar sua própria conta' });
    }

    // Deletar usuário
    await executeQuery('DELETE FROM users WHERE id = $1', [id]);

    res.json({ message: 'Usuário deletado com sucesso' });
  } catch (error) {
    console.error('Erro ao deletar usuário:', error);
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
