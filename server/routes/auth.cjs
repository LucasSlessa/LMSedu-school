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
  console.log('📝 Registro recebido:', {
    body: req.body,
    headers: req.headers['content-type'],
    bodyType: typeof req.body
  });
  
  const emailInput = (req.body.email || '').toString().trim().toLowerCase();
  const passwordInput = (req.body.password || '').toString();
  const name = (req.body.name || '').toString();
  const role = (req.body.role || 'student').toString();

  try {
    // Verificar se usuário já existe
    const existingUser = await executeQuery(
      'SELECT id FROM users WHERE LOWER(email) = LOWER($1)',
      [emailInput]
    );

    if (existingUser.rows.length > 0) {
      return res.status(400).json({ error: 'Email já está em uso' });
    }

    // Hash da senha
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(passwordInput, saltRounds);

    // Criar usuário
    const result = await executeQuery(
      `INSERT INTO users (email, password_hash, name, role, email_verified) 
       VALUES ($1, $2, $3, $4, $5) 
       RETURNING id, email, name, role, created_at`,
      [emailInput, passwordHash, name, role, true]
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
  const emailInput = (req.body.email || '').toString().trim().toLowerCase();
  const passwordInput = (req.body.password || '').toString();
  
  console.log('🔐 Tentativa de login:', { email: emailInput });

  try {
    // Buscar usuário
    const result = await executeQuery(
      'SELECT id, email, password_hash, name, role, status FROM users WHERE LOWER(email) = LOWER($1)',
      [emailInput]
    );

    console.log('📊 Resultado da busca:', { 
      found: result.rows.length > 0,
      userCount: result.rows.length 
    });

    if (result.rows.length === 0) {
      console.log('❌ Usuário não encontrado:', emailInput);
      return res.status(401).json({ error: 'Usuário não encontrado' });
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
    const isValidPassword = await bcrypt.compare(passwordInput, user.password_hash);
    console.log('🔑 Verificação de senha:', { isValid: isValidPassword });
    
    if (!isValidPassword) {
      console.log('❌ Senha inválida');
      return res.status(401).json({ error: 'Senha incorreta' });
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
  const emailInput = (req.body.email || '').toString().trim().toLowerCase();
  const name = (req.body.name || '').toString();
  const picture = req.body.picture;
  
  console.log('🔐 Tentativa de login com Google:', { email: emailInput, name });

  try {
    // Verificar se o usuário já existe
    const result = await executeQuery(
      'SELECT id, email, name, role, status FROM users WHERE LOWER(email) = LOWER($1)',
      [emailInput]
    );

    let user;

    if (result.rows.length === 0) {
      // Criar novo usuário
      const newUser = await executeQuery(`
        INSERT INTO users (email, name, role, status, avatar_url, auth_provider)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING id, email, name, role, status
      `, [emailInput, name, 'student', 'active', picture, 'google']);
      
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
  const emailInput = (req.body.email || '').toString().trim().toLowerCase();
  const name = (req.body.name || '').toString();
  const picture = req.body.picture;
  
  console.log('🔐 Tentativa de login com GitHub:', { email: emailInput, name });

  try {
    // Verificar se o usuário já existe
    const result = await executeQuery(
      'SELECT id, email, name, role, status FROM users WHERE LOWER(email) = LOWER($1)',
      [emailInput]
    );

    let user;

    if (result.rows.length === 0) {
      // Criar novo usuário
      const newUser = await executeQuery(`
        INSERT INTO users (email, name, role, status, avatar_url, auth_provider)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING id, email, name, role, status
      `, [emailInput, name, 'student', 'active', picture, 'github']);
      
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

// Esqueceu a senha
router.post('/forgot-password', async (req, res) => {
  const { email } = req.body;
  
  console.log('🔐 Solicitação de reset de senha:', { email });

  try {
    // Verificar se o usuário existe
    const result = await executeQuery(
      'SELECT id, email, name FROM users WHERE email = $1 AND status = $2',
      [email, 'active']
    );

    if (result.rows.length === 0) {
      console.log('❌ Usuário não encontrado ou inativo:', email);
      // Por segurança, não revelamos se o email existe ou não
      return res.json({ 
        message: 'Se o email estiver cadastrado, você receberá um link para resetar sua senha' 
      });
    }

    const user = result.rows[0];
    
    // Gerar token único para reset
    const resetToken = require('crypto').randomBytes(32).toString('hex');
    const resetTokenHash = await bcrypt.hash(resetToken, 10);
    
    // Salvar token no banco com expiração (24 horas)
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 horas
    
    await executeQuery(
      `INSERT INTO password_reset_tokens (user_id, token_hash, expires_at) 
       VALUES ($1, $2, $3) 
       ON CONFLICT (user_id) 
       DO UPDATE SET token_hash = $2, expires_at = $3, created_at = NOW()`,
      [user.id, resetTokenHash, expiresAt]
    );

    // Em produção, aqui seria enviado um email real
    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password?token=${resetToken}`;
    
    console.log('✅ Token de reset gerado:', { 
      userId: user.id, 
      resetUrl: resetUrl,
      expiresAt: expiresAt 
    });

    // TODO: Implementar envio de email real em produção
    // Por enquanto, retornar o token para desenvolvimento
    res.json({
      message: 'Token de reset gerado com sucesso',
      resetUrl: resetUrl,
      token: resetToken,
      expiresAt: expiresAt
    });

  } catch (error) {
    console.error('❌ Erro ao gerar token de reset:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Reset de senha
router.post('/reset-password', async (req, res) => {
  const { token, newPassword } = req.body;
  
  console.log('🔐 Tentativa de reset de senha com token');

  try {
    // Buscar token válido
    const result = await executeQuery(
      `SELECT prt.user_id, prt.expires_at, u.email, u.name 
       FROM password_reset_tokens prt 
       JOIN users u ON prt.user_id = u.id 
       WHERE prt.expires_at > NOW()`,
      []
    );

    if (result.rows.length === 0) {
      console.log('❌ Nenhum token válido encontrado');
      return res.status(400).json({ error: 'Token inválido ou expirado' });
    }

    // Verificar se algum token corresponde
    let validToken = null;
    for (const row of result.rows) {
      const isValid = await bcrypt.compare(token, row.token_hash);
      if (isValid) {
        validToken = row;
        break;
      }
    }

    if (!validToken) {
      console.log('❌ Token inválido');
      return res.status(400).json({ error: 'Token inválido ou expirado' });
    }

    console.log('✅ Token válido encontrado:', { 
      userId: validToken.user_id, 
      email: validToken.email 
    });

    // Hash da nova senha
    const saltRounds = 12;
    const newPasswordHash = await bcrypt.hash(newPassword, saltRounds);

    // Atualizar senha do usuário
    await executeQuery(
      'UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2',
      [newPasswordHash, validToken.user_id]
    );

    // Remover token usado
    await executeQuery(
      'DELETE FROM password_reset_tokens WHERE user_id = $1',
      [validToken.user_id]
    );

    console.log('✅ Senha atualizada com sucesso:', { userId: validToken.user_id });

    res.json({
      message: 'Senha atualizada com sucesso',
      user: {
        email: validToken.email,
        name: validToken.name
      }
    });

  } catch (error) {
    console.error('❌ Erro ao resetar senha:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Verificar token de reset (para validação no frontend)
router.get('/verify-reset-token/:token', async (req, res) => {
  const { token } = req.params;
  
  console.log('🔐 Verificando token de reset');

  try {
    // Buscar token válido
    const result = await executeQuery(
      `SELECT prt.user_id, prt.expires_at, u.email, u.name 
       FROM password_reset_tokens prt 
       JOIN users u ON prt.user_id = u.id 
       WHERE prt.expires_at > NOW()`,
      []
    );

    if (result.rows.length === 0) {
      return res.json({ valid: false, message: 'Token expirado' });
    }

    // Verificar se algum token corresponde
    let validToken = null;
    for (const row of result.rows) {
      const isValid = await bcrypt.compare(token, row.token_hash);
      if (isValid) {
        validToken = row;
        break;
      }
    }

    if (!validToken) {
      return res.json({ valid: false, message: 'Token inválido' });
    }

    res.json({
      valid: true,
      message: 'Token válido',
      user: {
        email: validToken.email,
        name: validToken.name
      }
    });

  } catch (error) {
    console.error('❌ Erro ao verificar token:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

module.exports = router;