const { executeQuery } = require('./server/config/database.cjs');

async function debugQuizIssues() {
  try {
    console.log('🔍 Investigando problemas com quiz e indicadores...\n');
    
    // 1. Verificar estrutura da tabela course_lessons
    console.log('📋 1. Estrutura da tabela course_lessons:');
    const tableStructure = await executeQuery(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'course_lessons'
      ORDER BY ordinal_position
    `);
    
    tableStructure.rows.forEach(col => {
      console.log(`   - ${col.column_name}: ${col.data_type} (${col.is_nullable === 'YES' ? 'nullable' : 'not null'})`);
    });
    
    // 2. Verificar aulas de quiz existentes
    console.log('\n📋 2. Aulas de quiz no banco:');
    const quizLessons = await executeQuery(`
      SELECT cl.id, cl.title, cl.content_type, cl.quiz_questions,
             cm.title as module_title, c.title as course_title
      FROM course_lessons cl
      JOIN course_modules cm ON cl.module_id = cm.id
      JOIN courses c ON cm.course_id = c.id
      WHERE cl.content_type = 'quiz'
      ORDER BY c.title, cm.sort_order, cl.sort_order
    `);
    
    console.log(`   Encontradas ${quizLessons.rows.length} aulas de quiz`);
    
    quizLessons.rows.forEach((lesson, i) => {
      console.log(`\n   ${i+1}. "${lesson.title}" (${lesson.course_title} > ${lesson.module_title})`);
      console.log(`      ID: ${lesson.id}`);
      console.log(`      Quiz Questions: ${lesson.quiz_questions ? 'EXISTE' : 'NULL/VAZIO'}`);
      
      if (lesson.quiz_questions) {
        try {
          const questions = typeof lesson.quiz_questions === 'string' 
            ? JSON.parse(lesson.quiz_questions) 
            : lesson.quiz_questions;
          console.log(`      Número de perguntas: ${Array.isArray(questions) ? questions.length : 'Formato inválido'}`);
          
          if (Array.isArray(questions) && questions.length > 0) {
            questions.forEach((q, qIndex) => {
              console.log(`        ${qIndex+1}. "${q.question || 'Sem pergunta'}"`);
              console.log(`           Opções: ${q.options?.length || 0} | Resposta: ${q.correctAnswer}`);
            });
          }
        } catch (e) {
          console.log(`      ❌ Erro ao parsear: ${e.message}`);
          console.log(`      Raw data: ${lesson.quiz_questions.substring(0, 100)}...`);
        }
      }
    });
    
    // 3. Verificar indicadores do dashboard
    console.log('\n📊 3. Verificando indicadores do dashboard:');
    
    // Total de cursos
    const totalCourses = await executeQuery('SELECT COUNT(*) as count FROM courses');
    console.log(`   Total de cursos: ${totalCourses.rows[0].count}`);
    
    // Cursos ativos (assumindo que são cursos publicados)
    const activeCourses = await executeQuery(`
      SELECT COUNT(*) as count FROM courses 
      WHERE created_at IS NOT NULL
    `);
    console.log(`   Cursos ativos: ${activeCourses.rows[0].count}`);
    
    // Total de alunos
    const totalStudents = await executeQuery(`
      SELECT COUNT(*) as count FROM users WHERE role = 'student'
    `);
    console.log(`   Total de alunos: ${totalStudents.rows[0].count}`);
    
    // Total de vendas
    const totalSales = await executeQuery(`
      SELECT COUNT(*) as count FROM user_courses
    `);
    console.log(`   Total de vendas: ${totalSales.rows[0].count}`);
    
    // 4. Verificar dados de progresso
    console.log('\n📈 4. Verificando dados de progresso:');
    const progressData = await executeQuery(`
      SELECT COUNT(*) as count FROM user_progress
    `);
    console.log(`   Registros de progresso: ${progressData.rows[0].count}`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Erro:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

debugQuizIssues();
