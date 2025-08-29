const { executeQuery } = require('./server/config/database.cjs');

async function testQuizSimple() {
  try {
    const lessonId = '05487554-c6e9-4035-a47d-6d39c2ab642f';
    
    console.log('🔍 Testando quiz diretamente no banco...');
    console.log('Lesson ID:', lessonId);
    
    // Buscar a lesson específica
    const result = await executeQuery(`
      SELECT id, title, content_type, quiz_questions, module_id
      FROM course_lessons 
      WHERE id = $1
    `, [lessonId]);
    
    if (result.rows.length === 0) {
      console.log('❌ Lesson não encontrada');
      return;
    }
    
    const lesson = result.rows[0];
    console.log('\n📋 Dados da lesson no banco:');
    console.log('- ID:', lesson.id);
    console.log('- Title:', lesson.title);
    console.log('- Content Type:', lesson.content_type);
    console.log('- Module ID:', lesson.module_id);
    console.log('- Quiz Questions existe:', !!lesson.quiz_questions);
    console.log('- Quiz Questions tipo:', typeof lesson.quiz_questions);
    
    if (lesson.quiz_questions) {
      console.log('\n📄 Raw quiz_questions:');
      console.log(lesson.quiz_questions);
      
      try {
        const parsed = typeof lesson.quiz_questions === 'string' 
          ? JSON.parse(lesson.quiz_questions)
          : lesson.quiz_questions;
          
        console.log('\n✅ Parsed quiz_questions:');
        console.log('- Tipo:', typeof parsed);
        console.log('- É array:', Array.isArray(parsed));
        console.log('- Length:', Array.isArray(parsed) ? parsed.length : 'N/A');
        
        if (Array.isArray(parsed) && parsed.length > 0) {
          console.log('\n📝 Perguntas encontradas:');
          parsed.forEach((q, i) => {
            console.log(`${i+1}. ${q.question || 'SEM PERGUNTA'}`);
            console.log(`   Opções: ${q.options ? q.options.length : 0}`);
            console.log(`   Resposta correta: ${q.correctAnswer}`);
          });
        } else {
          console.log('\n⚠️ Array vazio ou não é array');
        }
        
      } catch (e) {
        console.log('\n❌ Erro no parse:', e.message);
      }
    } else {
      console.log('\n❌ quiz_questions é null/undefined');
    }
    
    // Agora simular a API
    console.log('\n🌐 Simulando chamada da API...');
    const moduleId = lesson.module_id;
    
    const apiResult = await executeQuery(`
      SELECT *
      FROM course_lessons cl
      WHERE cl.module_id = $1
      ORDER BY cl.sort_order ASC, cl.created_at ASC
    `, [moduleId]);
    
    console.log(`📚 API retornaria ${apiResult.rows.length} aulas`);
    
    const targetLesson = apiResult.rows.find(row => row.id === lessonId);
    
    if (targetLesson) {
      console.log('\n✅ Lesson encontrada na simulação da API');
      console.log('- Content Type:', targetLesson.content_type);
      console.log('- Quiz Questions existe:', !!targetLesson.quiz_questions);
      console.log('- Quiz Questions tipo:', typeof targetLesson.quiz_questions);
      
      if (targetLesson.quiz_questions) {
        try {
          let quizQuestions;
          if (typeof targetLesson.quiz_questions === 'string') {
            quizQuestions = JSON.parse(targetLesson.quiz_questions);
          } else {
            quizQuestions = targetLesson.quiz_questions;
          }
          
          console.log('\n📊 API processaria quiz_questions:');
          console.log('- Tipo:', typeof quizQuestions);
          console.log('- É array:', Array.isArray(quizQuestions));
          console.log('- Length:', Array.isArray(quizQuestions) ? quizQuestions.length : 'N/A');
          
          if (Array.isArray(quizQuestions) && quizQuestions.length > 0) {
            console.log('\n📝 Perguntas que a API retornaria:');
            quizQuestions.forEach((q, i) => {
              console.log(`${i+1}. ${q.question || 'SEM PERGUNTA'}`);
            });
          } else {
            console.log('\n⚠️ API retornaria array vazio');
          }
          
        } catch (e) {
          console.log('\n❌ API falharia no parse:', e.message);
        }
      } else {
        console.log('\n❌ API não encontraria quiz_questions');
      }
    } else {
      console.log('\n❌ Lesson NÃO encontrada na simulação da API');
    }
    
  } catch (error) {
    console.error('❌ Erro:', error);
  }
}

testQuizSimple();
