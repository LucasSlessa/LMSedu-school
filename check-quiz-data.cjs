const { executeQuery } = require('./server/config/database.cjs');

async function checkQuizData() {
  try {
    console.log('🔍 Verificando dados de quiz no banco...');
    
    // Verificar todas as aulas de quiz
    const result = await executeQuery(`
      SELECT id, title, content_type, quiz_questions 
      FROM course_lessons 
      WHERE content_type = 'quiz'
    `);
    
    console.log(`📋 Encontradas ${result.rows.length} aulas de quiz`);
    
    result.rows.forEach((row, i) => {
      console.log(`\n${i+1}. Aula: "${row.title}"`);
      console.log(`   ID: ${row.id}`);
      console.log(`   Quiz Questions: ${row.quiz_questions ? 'EXISTE' : 'NULL'}`);
      
      if (row.quiz_questions) {
        try {
          const parsed = JSON.parse(row.quiz_questions);
          console.log(`   Número de perguntas: ${parsed.length}`);
          
          parsed.forEach((q, qIndex) => {
            console.log(`     ${qIndex+1}. "${q.question}"`);
            console.log(`        Opções: ${q.options?.length || 0}`);
            console.log(`        Resposta correta: ${q.correctAnswer}`);
          });
        } catch (e) {
          console.log(`   ❌ Erro ao parsear JSON: ${e.message}`);
        }
      }
    });
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Erro:', error.message);
    process.exit(1);
  }
}

checkQuizData();
