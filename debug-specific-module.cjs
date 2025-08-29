const { pool, executeQuery } = require('./server/config/database.cjs');

async function debugSpecificModule() {
  try {
    const moduleId = '1b51069d-bee8-4c1a-b951-a80ae5d94a76';
    
    console.log('🔍 Investigando módulo específico:', moduleId);
    
    // 1. Verificar se o módulo existe
    console.log('\n📋 VERIFICANDO MÓDULO:');
    const moduleResult = await executeQuery(`
      SELECT * FROM course_modules WHERE id = $1
    `, [moduleId]);
    
    if (moduleResult.rows.length === 0) {
      console.log('❌ Módulo não encontrado!');
      return;
    }
    
    console.log('✅ Módulo encontrado:', moduleResult.rows[0]);
    
    // 2. Verificar aulas deste módulo
    console.log('\n📚 VERIFICANDO AULAS:');
    const lessonsResult = await executeQuery(`
      SELECT 
        id, title, content_type, 
        LENGTH(quiz_questions::text) as quiz_length,
        quiz_questions
      FROM course_lessons 
      WHERE module_id = $1
      ORDER BY sort_order ASC, created_at ASC
    `, [moduleId]);
    
    console.log(`Total de aulas: ${lessonsResult.rows.length}`);
    
    lessonsResult.rows.forEach((lesson, index) => {
      console.log(`\nAula ${index + 1}:`, {
        id: lesson.id,
        title: lesson.title,
        contentType: lesson.content_type,
        hasQuizData: !!lesson.quiz_questions,
        quizDataLength: lesson.quiz_length
      });
      
      // Tentar fazer parse do quiz_questions se existir
      if (lesson.quiz_questions) {
        try {
          const parsed = JSON.parse(lesson.quiz_questions);
          console.log('  ✅ Quiz JSON válido:', {
            questionsCount: Array.isArray(parsed) ? parsed.length : 'não é array',
            firstQuestion: Array.isArray(parsed) && parsed[0] ? parsed[0].question : 'N/A'
          });
        } catch (parseError) {
          console.log('  ❌ Quiz JSON inválido:', parseError.message);
          console.log('  📄 Dados problemáticos:', lesson.quiz_questions.substring(0, 200) + '...');
        }
      }
    });
    
    // 3. Simular a query exata do endpoint
    console.log('\n🔄 SIMULANDO ENDPOINT:');
    try {
      const result = await executeQuery(`
        SELECT 
          cl.*
        FROM course_lessons cl
        WHERE cl.module_id = $1
        ORDER BY cl.sort_order ASC, cl.created_at ASC
      `, [moduleId]);
      
      const lessons = result.rows.map(row => {
        let quizQuestions = null;
        
        if (row.quiz_questions) {
          try {
            quizQuestions = JSON.parse(row.quiz_questions);
          } catch (parseError) {
            console.error('❌ Erro no parse:', parseError.message);
            console.error('📄 Dados:', row.quiz_questions.substring(0, 100));
            quizQuestions = null;
          }
        }
        
        return {
          id: row.id,
          title: row.title,
          contentType: row.content_type,
          quizQuestions
        };
      });
      
      console.log('✅ Simulação bem-sucedida! Aulas processadas:', lessons.length);
      
    } catch (endpointError) {
      console.error('❌ Erro na simulação do endpoint:', endpointError);
    }

  } catch (error) {
    console.error('❌ Erro geral:', error);
  } finally {
    process.exit(0);
  }
}

debugSpecificModule();
