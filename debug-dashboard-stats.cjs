const { pool, executeQuery } = require('./server/config/database.cjs');

async function debugDashboardStats() {
  try {
    console.log('🔍 Verificando estatísticas do dashboard...\n');

    // 1. Verificar total de cursos
    console.log('📚 CURSOS:');
    const coursesResult = await executeQuery(`
      SELECT COUNT(*) as total_courses, status
      FROM courses 
      GROUP BY status
    `);
    console.log('Por status:', coursesResult.rows);

    const allCoursesResult = await executeQuery(`
      SELECT COUNT(*) as total_courses
      FROM courses 
    `);
    console.log('Total geral:', allCoursesResult.rows[0]);

    // 2. Verificar total de alunos
    console.log('\n👥 ALUNOS:');
    const studentsResult = await executeQuery(`
      SELECT COUNT(*) as total_students, role, status
      FROM users 
      GROUP BY role, status
    `);
    console.log('Por role/status:', studentsResult.rows);

    // 3. Verificar enrollments
    console.log('\n📝 MATRÍCULAS:');
    const enrollmentsResult = await executeQuery(`
      SELECT COUNT(*) as total_enrollments, status
      FROM enrollments 
      GROUP BY status
    `);
    console.log('Por status:', enrollmentsResult.rows);

    // 4. Verificar orders
    console.log('\n💰 PEDIDOS:');
    const ordersResult = await executeQuery(`
      SELECT COUNT(*) as total_orders, status
      FROM orders 
      GROUP BY status
    `);
    console.log('Por status:', ordersResult.rows);

    // 5. Verificar se há dados de receita
    console.log('\n💵 RECEITA:');
    try {
      const revenueResult = await executeQuery(`
        SELECT 
          COUNT(o.id) as total_orders,
          COUNT(oi.id) as total_items,
          COALESCE(SUM(oi.price), 0) as total_revenue
        FROM orders o
        LEFT JOIN order_items oi ON o.id = oi.order_id
        WHERE o.status = 'completed'
      `);
      console.log('Receita total:', revenueResult.rows[0]);
    } catch (error) {
      console.log('Erro ao calcular receita:', error.message);
    }

    // 6. Verificar estrutura das tabelas
    console.log('\n🏗️ ESTRUTURA DAS TABELAS:');
    const tablesResult = await executeQuery(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `);
    console.log('Tabelas existentes:', tablesResult.rows.map(r => r.table_name));

  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    process.exit(0);
  }
}

debugDashboardStats();
