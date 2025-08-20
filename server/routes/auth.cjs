const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { pool, executeQuery } = require('../config/database.cjs');
const { authenticateToken } = require('../middleware/auth.cjs');

const router = express.Router();

// Gerar token JWT
const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  });
};

// Registro
router.post('/register', async (req, res) => {
  const { email, password, name, role = 'student' } = req.body;

  try {
    // Verificar se usuário já existe
    const existingUser = await executeQuery(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );

    if (existingUser.rows.length > 0) {
      return res.status(400).json({ error: 'Email já está em uso' });
    }

    // Hash da senha
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Criar usuário
    const result = await executeQuery(
      `INSERT INTO users (email, password_hash, name, role, email_verified) 
       VALUES ($1, $2, $3, $4, $5) 
       RETURNING id, email, name, role, created_at`,
      [email, passwordHash, name, role, true]
    );

    const user = result.rows[0];
    const token = generateToken(user.id);

    res.status(201).json({
      message: 'Usuário criado com sucesso',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        createdAt: user.created_at
      },
      token
    });
  } catch (error) {
    console.error('Erro no registro:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  
  console.log('🔐 Tentativa de login:', { email });

  // Modo de desenvolvimento com dados mock
  if (process.env.NODE_ENV === 'development') {
    console.log('🛠️ Usando modo de desenvolvimento com dados mock');
    
    // Verificar credenciais mock
    if (email === 'admin@lms.com' && password === '123456') {
      const mockUser = {
        id: '00000000-0000-0000-0000-000000000001',
        email: 'admin@lms.com',
        name: 'Administrador',
        role: 'admin'
      };
      
      const token = generateToken(mockUser.id);
      console.log('✅ Login mock bem-sucedido:', { userId: mockUser.id, role: mockUser.role });
      
      return res.json({
        message: 'Login realizado com sucesso',
        user: mockUser,
        token
      });
    }
    
    if (email === 'aluno@lms.com' && password === '123456') {
      const mockUser = {
        id: '00000000-0000-0000-0000-000000000002',
        email: 'aluno@lms.com',
        name: 'Aluno Demonstração',
        role: 'student'
      };
      
      const token = generateToken(mockUser.id);
      console.log('✅ Login mock bem-sucedido:', { userId: mockUser.id, role: mockUser.role });
      
      return res.json({
        message: 'Login realizado com sucesso',
        user: mockUser,
        token
      });
    }
    
    console.log('❌ Credenciais mock inválidas');
    return res.status(401).json({ error: 'Credenciais inválidas' });
  }

  try {
    // Buscar usuário
    const result = await executeQuery(
      'SELECT id, email, password_hash, name, role, status FROM users WHERE email = $1',
      [email]
    );

    console.log('📊 Resultado da busca:', { 
      found: result.rows.length > 0,
      userCount: result.rows.length 
    });

    if (result.rows.length === 0) {
      console.log('❌ Usuário não encontrado:', email);
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }

    const user = result.rows[0];
    console.log('👤 Usuário encontrado:', { 
      id: user.id, 
      email: user.email, 
      role: user.role, 
      status: user.status 
    });

    // Verificar status do usuário
    if (user.status !== 'active') {
      console.log('❌ Usuário inativo:', user.status);
      return res.status(401).json({ error: 'Conta inativa ou suspensa' });
    }

    // Verificar senha
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    console.log('🔑 Verificação de senha:', { isValid: isValidPassword });
    
    if (!isValidPassword) {
      console.log('❌ Senha inválida');
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }

    // Atualizar último login
    await executeQuery(
      'UPDATE users SET last_login = NOW() WHERE id = $1',
      [user.id]
    );

    const token = generateToken(user.id);
    console.log('✅ Login bem-sucedido:', { userId: user.id, role: user.role });

    res.json({
      message: 'Login realizado com sucesso',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      },
      token
    });
  } catch (error) {
    console.error('❌ Erro no login:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Login com Google
router.post('/google', async (req, res) => {
  const { email, name, picture } = req.body;
  
  console.log('🔐 Tentativa de login com Google:', { email, name });

  try {
    // Verificar se o usuário já existe
    const result = await executeQuery(
      'SELECT id, email, name, role, status FROM users WHERE email = $1',
      [email]
    );

    let user;

    if (result.rows.length === 0) {
      // Criar novo usuário
      const newUser = await executeQuery(`
        INSERT INTO users (email, name, role, status, avatar_url, auth_provider)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING id, email, name, role, status
      `, [email, name, 'student', 'active', picture, 'google']);
      
      user = newUser.rows[0];
      console.log('✅ Novo usuário Google criado:', user);
    } else {
      user = result.rows[0];
      
      // Verificar status do usuário
      if (user.status !== 'active') {
        console.log('❌ Usuário Google inativo:', user.status);
        return res.status(401).json({ error: 'Conta inativa ou suspensa' });
      }
      
      // Atualizar avatar se fornecido
      if (picture) {
        await executeQuery(
          'UPDATE users SET avatar_url = $1 WHERE id = $2',
          [picture, user.id]
        );
      }
      
      console.log('✅ Usuário Google encontrado:', user);
    }

    // Atualizar último login
    await executeQuery(
      'UPDATE users SET last_login = NOW() WHERE id = $1',
      [user.id]
    );

    const token = generateToken(user.id);
    console.log('✅ Login Google bem-sucedido:', { userId: user.id, role: user.role });

    res.json({
      message: 'Login com Google realizado com sucesso',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      },
      token
    });
  } catch (error) {
    console.error('❌ Erro no login Google:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Login com GitHub
router.post('/github', async (req, res) => {
  const { email, name, picture } = req.body;
  
  console.log('🔐 Tentativa de login com GitHub:', { email, name });

  try {
    // Verificar se o usuário já existe
    const result = await executeQuery(
      'SELECT id, email, name, role, status FROM users WHERE email = $1',
      [email]
    );

    let user;

    if (result.rows.length === 0) {
      // Criar novo usuário
      const newUser = await executeQuery(`
        INSERT INTO users (email, name, role, status, avatar_url, auth_provider)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING id, email, name, role, status
      `, [email, name, 'student', 'active', picture, 'github']);
      
      user = newUser.rows[0];
      console.log('✅ Novo usuário GitHub criado:', user);
    } else {
      user = result.rows[0];
      
      // Verificar status do usuário
      if (user.status !== 'active') {
        console.log('❌ Usuário GitHub inativo:', user.status);
        return res.status(401).json({ error: 'Conta inativa ou suspensa' });
      }
      
      // Atualizar avatar se fornecido
      if (picture) {
        await executeQuery(
          'UPDATE users SET avatar_url = $1 WHERE id = $2',
          [picture, user.id]
        );
      }
      
      console.log('✅ Usuário GitHub encontrado:', user);
    }

    // Atualizar último login
    await executeQuery(
      'UPDATE users SET last_login = NOW() WHERE id = $1',
      [user.id]
    );

    const token = generateToken(user.id);
    console.log('✅ Login GitHub bem-sucedido:', { userId: user.id, role: user.role });

    res.json({
      message: 'Login com GitHub realizado com sucesso',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      },
      token
    });
  } catch (error) {
    console.error('❌ Erro no login GitHub:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Obter usuário atual
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const result = await executeQuery(
      'SELECT id, email, name, role, avatar_url, created_at, last_login FROM users WHERE id = $1',
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    res.json({ user: result.rows[0] });
  } catch (error) {
    console.error('Erro ao buscar usuário:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Atualizar perfil
router.put('/profile', authenticateToken, async (req, res) => {
  const { name, avatar_url } = req.body;

  try {
    const result = await executeQuery(
      'UPDATE users SET name = $1, avatar_url = $2, updated_at = NOW() WHERE id = $3 RETURNING id, email, name, role, avatar_url',
      [name, avatar_url, req.user.id]
    );

    res.json({
      message: 'Perfil atualizado com sucesso',
      user: result.rows[0]
    });
  } catch (error) {
    console.error('Erro ao atualizar perfil:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

module.exports = router;