const { executeQuery, pool } = require('./server/config/database.cjs');

async function testDeleteCourse() {
  try {
    console.log('🔍 Testando exclusão de curso...');
    
    // Verificar cursos existentes
    const courses = await executeQuery('SELECT id, title, status FROM courses ORDER BY created_at DESC LIMIT 3');
    console.log('\n📚 Cursos disponíveis para teste:');
    courses.rows.forEach((course, index) => {
      console.log(`${index + 1}. ID: ${course.id}`);
      console.log(`   Título: ${course.title}`);
      console.log(`   Status: ${course.status}`);
      console.log('---');
    });
    
    // Verificar se há matrículas
    const enrollments = await executeQuery('SELECT COUNT(*) as count FROM enrollments');
    console.log(`\n📊 Total de matrículas: ${enrollments.rows[0].count}`);
    
    if (enrollments.rows[0].count > 0) {
      console.log('⚠️  Existem matrículas ativas. A exclusão pode falhar.');
    } else {
      console.log('✅ Não há matrículas ativas. A exclusão deve funcionar.');
    }
    
  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await pool.end();
  }
}

testDeleteCourse();
