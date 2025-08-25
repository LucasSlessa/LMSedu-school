const { pool, executeQuery } = require('./server/config/database.cjs');
require('dotenv').config();

async function cleanDatabase() {
  try {
    console.log('🧹 Iniciando limpeza do banco de dados...');
    
    // Lista de tabelas para limpar (em ordem de dependência)
    const tablesToClean = [
      'certificates',
      'quiz_attempts',
      'quiz_questions',
      'lesson_progress',
      'course_lessons',
      'course_modules',
      'enrollments',
      'order_items',
      'orders',
      'cart_items',
      'stripe_customers'
    ];
    
    // Limpar cada tabela
    for (const table of tablesToClean) {
      try {
        console.log(`🗑️  Limpando tabela: ${table}`);
        await executeQuery(`DELETE FROM ${table};`);
        console.log(`✅ Tabela ${table} limpa`);
      } catch (error) {
        console.log(`⚠️  Erro ao limpar ${table}:`, error.message);
      }
    }
    
    // Resetar sequências (auto-increment)
    const sequences = [
      'certificates_id_seq',
      'quiz_attempts_id_seq',
      'quiz_questions_id_seq',
      'lesson_progress_id_seq',
      'course_lessons_id_seq',
      'course_modules_id_seq',
      'enrollments_id_seq',
      'order_items_id_seq',
      'orders_id_seq',
      'cart_items_id_seq'
    ];
    
    for (const sequence of sequences) {
      try {
        await executeQuery(`ALTER SEQUENCE ${sequence} RESTART WITH 1;`);
        console.log(`🔄 Sequência ${sequence} resetada`);
      } catch (error) {
        console.log(`⚠️  Erro ao resetar ${sequence}:`, error.message);
      }
    }
    
    // Verificar dados restantes
    const remainingData = await executeQuery(`
      SELECT 
        'users' as table_name, COUNT(*) as count FROM users
      UNION ALL
      SELECT 'categories', COUNT(*) FROM categories
      UNION ALL
      SELECT 'courses', COUNT(*) FROM courses
    `);
    
    console.log('\n📊 Dados restantes no banco:');
    remainingData.rows.forEach(row => {
      console.log(`   ${row.table_name}: ${row.count} registros`);
    });
    
    console.log('\n✅ Limpeza do banco concluída com sucesso!');
    console.log('💡 Mantidos: usuários, categorias e cursos');
    console.log('🗑️  Removidos: pedidos, matrículas, progresso, certificados, etc.');
    
  } catch (error) {
    console.error('❌ Erro durante a limpeza:', error);
  } finally {
    await pool.end();
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  cleanDatabase();
}

module.exports = { cleanDatabase };
