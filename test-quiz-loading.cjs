const { executeQuery } = require('./server/config/database.cjs');

async function testQuizLoading() {
  try {
    console.log('🔍 Testando carregamento de quiz...\n');
    
    // 1. Verificar se existem aulas de quiz
    console.log('1. Verificando aulas de quiz no banco:');
    const quizLessons = await executeQuery(`
      SELECT cl.id, cl.title, cl.content_type, cl.quiz_questions,
             cm.title as module_title, c.title as course_title
      FROM course_lessons cl
      JOIN course_modules cm ON cl.module_id = cm.id
      JOIN courses c ON cm.course_id = c.id
      WHERE cl.content_type = 'quiz'
      ORDER BY c.id, cm.sort_order, cl.sort_order
    `);
    
    console.log(`   Encontradas ${quizLessons.rows.length} aulas de quiz\n`);
    
    if (quizLessons.rows.length === 0) {
      console.log('❌ Nenhuma aula de quiz encontrada!');
      process.exit(1);
    }
    
    // 2. Testar cada aula de quiz
    for (let i = 0; i < quizLessons.rows.length; i++) {
      const lesson = quizLessons.rows[i];
      console.log(`${i+1}. Testando aula: "${lesson.title}"`);
      console.log(`   Curso: ${lesson.course_title}`);
      console.log(`   Módulo: ${lesson.module_title}`);
      console.log(`   ID da aula: ${lesson.id}`);
      
      // Verificar se quiz_questions existe
      if (!lesson.quiz_questions) {
        console.log('   ❌ quiz_questions é NULL ou vazio');
        continue;
      }
      
      // Tentar fazer parse
      try {
        const questions = typeof lesson.quiz_questions === 'string' 
          ? JSON.parse(lesson.quiz_questions) 
          : lesson.quiz_questions;
          
        if (!Array.isArray(questions)) {
          console.log('   ❌ quiz_questions não é um array');
          console.log(`   Tipo: ${typeof questions}`);
          console.log(`   Valor: ${JSON.stringify(questions).substring(0, 100)}...`);
          continue;
        }
        
        console.log(`   ✅ ${questions.length} perguntas encontradas`);
        
        // Mostrar detalhes das perguntas
        questions.forEach((q, qIndex) => {
          console.log(`      ${qIndex+1}. "${q.question || 'SEM PERGUNTA'}"`);
          console.log(`         Opções: ${q.options?.length || 0}`);
          console.log(`         Resposta correta: ${q.correctAnswer}`);
          console.log(`         Tipo: ${q.type || 'não definido'}`);
        });
        
        // 3. Simular o que a API retorna
        console.log('\n   📡 Simulando retorno da API:');
        const apiResponse = {
          id: lesson.id,
          title: lesson.title,
          contentType: lesson.content_type,
          quizQuestions: questions
        };
        
        console.log(`   API retornaria: quizQuestions com ${apiResponse.quizQuestions.length} perguntas`);
        
      } catch (parseError) {
        console.log(`   ❌ Erro ao fazer parse: ${parseError.message}`);
        console.log(`   Raw data (primeiros 200 chars): ${lesson.quiz_questions.substring(0, 200)}...`);
      }
      
      console.log(''); // linha em branco
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Erro:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

testQuizLoading();
