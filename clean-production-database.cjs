const mysql = require('mysql2/promise');
require('dotenv').config();

async function cleanProductionDatabase() {
  let connection;
  
  try {
    // Conectar ao banco de dados
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'lms_database',
      multipleStatements: true
    });

    console.log('🔗 Conectado ao banco de dados');
    console.log('⚠️  ATENÇÃO: Este script irá remover TODOS os cursos, pagamentos e matrículas!');
    console.log('✅ Usuários e categorias serão mantidos');
    
    // Desabilitar verificações de chave estrangeira
    await connection.execute('SET foreign_key_checks = 0');
    
    console.log('\n🧹 Iniciando limpeza do banco de dados...');
    
    // Remover dados de progresso e certificados
    console.log('📊 Removendo progresso e certificados...');
    await connection.execute('DELETE FROM lesson_progress');
    await connection.execute('DELETE FROM certificates');
    
    // Remover dados de quiz
    console.log('❓ Removendo dados de quiz...');
    await connection.execute('DELETE FROM quiz_answers');
    await connection.execute('DELETE FROM quiz_questions');
    
    // Remover dados de aulas e módulos
    console.log('📚 Removendo aulas e módulos...');
    await connection.execute('DELETE FROM course_lessons');
    await connection.execute('DELETE FROM course_modules');
    
    // Remover dados de matrículas
    console.log('🎓 Removendo matrículas...');
    await connection.execute('DELETE FROM enrollments');
    
    // Remover dados de pagamentos e pedidos
    console.log('💳 Removendo pagamentos e pedidos...');
    await connection.execute('DELETE FROM order_items');
    await connection.execute('DELETE FROM orders');
    await connection.execute('DELETE FROM stripe_customers');
    
    // Remover dados de cursos
    console.log('🎯 Removendo cursos...');
    await connection.execute('DELETE FROM courses');
    
    // Reabilitar verificações de chave estrangeira
    await connection.execute('SET foreign_key_checks = 1');
    
    // Verificar dados mantidos
    console.log('\n📋 Verificando dados mantidos:');
    
    const [users] = await connection.execute('SELECT COUNT(*) as total FROM users');
    console.log(`👥 Usuários mantidos: ${users[0].total}`);
    
    const [categories] = await connection.execute('SELECT COUNT(*) as total FROM categories');
    console.log(`📂 Categorias mantidas: ${categories[0].total}`);
    
    const [courses] = await connection.execute('SELECT COUNT(*) as total FROM courses');
    console.log(`🎯 Cursos restantes: ${courses[0].total}`);
    
    const [orders] = await connection.execute('SELECT COUNT(*) as total FROM orders');
    console.log(`🛒 Pedidos restantes: ${orders[0].total}`);
    
    const [enrollments] = await connection.execute('SELECT COUNT(*) as total FROM enrollments');
    console.log(`🎓 Matrículas restantes: ${enrollments[0].total}`);
    
    console.log('\n✅ Limpeza do banco de dados concluída com sucesso!');
    console.log('🔄 O sistema está pronto para testes em produção');
    
  } catch (error) {
    console.error('❌ Erro durante a limpeza do banco:', error);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 Conexão com banco de dados encerrada');
    }
  }
}

// Executar apenas se chamado diretamente
if (require.main === module) {
  cleanProductionDatabase();
}

module.exports = { cleanProductionDatabase };
