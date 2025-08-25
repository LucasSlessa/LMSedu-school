const { pool, executeQuery } = require('./server/config/database.cjs');
const bcrypt = require('bcrypt');
require('dotenv').config();

async function createAdmin() {
  try {
    console.log('👨‍💼 Criando conta de administrador...');
    
    // Dados do admin
    const adminData = {
      name: 'Administrador',
      email: 'admin@example.com',
      password: 'admin123',
      role: 'admin'
    };
    
    // Verificar se o admin já existe
    const existingAdmin = await executeQuery(
      'SELECT id FROM users WHERE email = $1',
      [adminData.email]
    );
    
    if (existingAdmin.rows.length > 0) {
      console.log('⚠️  Admin já existe no banco de dados');
      console.log('📧 Email:', adminData.email);
      console.log('🔑 Senha:', adminData.password);
      return;
    }
    
    // Hash da senha
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(adminData.password, saltRounds);
    
    // Inserir admin no banco
    const result = await executeQuery(`
      INSERT INTO users (name, email, password_hash, role, status, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
      RETURNING id, name, email, role
    `, [
      adminData.name,
      adminData.email,
      hashedPassword,
      adminData.role,
      'active'
    ]);
    
    const admin = result.rows[0];
    
    console.log('✅ Admin criado com sucesso!');
    console.log('📋 Detalhes da conta:');
    console.log('   ID:', admin.id);
    console.log('   Nome:', admin.name);
    console.log('   Email:', admin.email);
    console.log('   Role:', admin.role);
    console.log('   Senha:', adminData.password);
    console.log('');
    console.log('🔐 Use essas credenciais para fazer login como administrador');
    console.log('💡 Recomendamos alterar a senha após o primeiro login');
    
  } catch (error) {
    console.error('❌ Erro ao criar admin:', error);
  } finally {
    await pool.end();
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  createAdmin();
}

module.exports = { createAdmin };
