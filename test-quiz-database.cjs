const { executeQuery } = require('./server/config/database.cjs');

async function testQuizDatabase() {
  try {
    console.log('🔍 Verificando questões de quiz no banco de dados...\n');
    
    // Verificar aulas de quiz
    const quizLessons = await executeQuery(`
      SELECT id, title, content_type, quiz_questions 
      FROM course_lessons 
      WHERE content_type = 'quiz'
      ORDER BY id
    `);
    
    console.log(`📋 Encontradas ${quizLessons.rows.length} aulas de quiz no banco`);
    
    if (quizLessons.rows.length === 0) {
      console.log('❌ Nenhuma aula de quiz encontrada no banco!');
    } else {
      quizLessons.rows.forEach((lesson, i) => {
        console.log(`\n${i+1}. Aula: "${lesson.title}" (ID: ${lesson.id})`);
        console.log(`   Content Type: ${lesson.content_type}`);
        
        if (lesson.quiz_questions) {
          console.log(`   ✅ Quiz Questions: EXISTE`);
          try {
            const questions = JSON.parse(lesson.quiz_questions);
            console.log(`   📝 Número de perguntas: ${questions.length}`);
            
            questions.forEach((q, qIndex) => {
              console.log(`     ${qIndex+1}. "${q.question}"`);
              console.log(`        Opções: ${q.options?.length || 0}`);
              console.log(`        Resposta correta: ${q.correctAnswer}`);
            });
          } catch (e) {
            console.log(`   ❌ Erro ao parsear JSON: ${e.message}`);
            console.log(`   Raw data: ${lesson.quiz_questions.substring(0, 200)}...`);
          }
        } else {
          console.log(`   ❌ Quiz Questions: NULL/VAZIO`);
        }
      });
    }
    
    // Verificar todas as aulas para ver se há alguma com content_type = 'quiz'
    console.log('\n📊 Verificando todas as aulas por tipo:');
    const lessonTypes = await executeQuery(`
      SELECT content_type, COUNT(*) as count 
      FROM course_lessons 
      GROUP BY content_type
      ORDER BY count DESC
    `);
    
    lessonTypes.rows.forEach(type => {
      console.log(`   ${type.content_type}: ${type.count} aulas`);
    });
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Erro:', error.message);
    process.exit(1);
  }
}

testQuizDatabase();
