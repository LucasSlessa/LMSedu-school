const { executeQuery } = require('./server/config/database.cjs');

async function debugSpecificQuiz() {
  try {
    console.log('🔍 Debug específico do quiz ID 05487554-c6e5-4035-a47d-6d39c2ab642f...\n');
    
    // Buscar a aula específica
    const lessonResult = await executeQuery(`
      SELECT cl.*, cm.title as module_title, c.title as course_title
      FROM course_lessons cl
      JOIN course_modules cm ON cl.module_id = cm.id
      JOIN courses c ON cm.course_id = c.id
      WHERE cl.id = $1
    `, ['05487554-c6e5-4035-a47d-6d39c2ab642f']);
    
    if (lessonResult.rows.length === 0) {
      console.log('❌ Aula não encontrada!');
      process.exit(1);
    }
    
    const lesson = lessonResult.rows[0];
    console.log('📋 Dados da aula:');
    console.log(`   ID: ${lesson.id}`);
    console.log(`   Título: ${lesson.title}`);
    console.log(`   Tipo: ${lesson.content_type}`);
    console.log(`   Curso: ${lesson.course_title}`);
    console.log(`   Módulo: ${lesson.module_title}`);
    console.log(`   Quiz Questions existe: ${!!lesson.quiz_questions}`);
    
    if (lesson.quiz_questions) {
      console.log(`   Quiz Questions tipo: ${typeof lesson.quiz_questions}`);
      console.log(`   Quiz Questions tamanho: ${JSON.stringify(lesson.quiz_questions).length} chars`);
      console.log(`   Quiz Questions (raw): ${JSON.stringify(lesson.quiz_questions)}`);
      
      try {
        const parsed = typeof lesson.quiz_questions === 'string' 
          ? JSON.parse(lesson.quiz_questions)
          : lesson.quiz_questions;
          
        console.log(`   Quiz Questions parsed tipo: ${typeof parsed}`);
        console.log(`   É array: ${Array.isArray(parsed)}`);
        
        if (Array.isArray(parsed)) {
          console.log(`   Número de perguntas: ${parsed.length}`);
          parsed.forEach((q, i) => {
            console.log(`      ${i+1}. "${q.question || 'SEM PERGUNTA'}"`);
            console.log(`         Opções: ${q.options?.length || 0}`);
            console.log(`         Resposta: ${q.correctAnswer}`);
          });
        } else {
          console.log(`   ❌ Não é array: ${JSON.stringify(parsed)}`);
        }
      } catch (e) {
        console.log(`   ❌ Erro ao fazer parse: ${e.message}`);
      }
    } else {
      console.log('   ❌ quiz_questions é NULL/undefined');
    }
    
    // Testar a API simulando o que o frontend faz
    console.log('\n🌐 Testando API...');
    console.log(`   Módulo ID: ${lesson.module_id}`);
    console.log(`   Curso ID: ${lesson.course_id}`);
    
    // Simular a consulta da API
    const apiResult = await executeQuery(`
      SELECT 
        cl.*
      FROM course_lessons cl
      WHERE cl.module_id = $1
      ORDER BY cl.sort_order ASC, cl.created_at ASC
    `, [lesson.module_id]);
    
    console.log(`   API retornaria ${apiResult.rows.length} aulas`);
    
    const targetLesson = apiResult.rows.find(row => row.id === lesson.id);
    if (targetLesson) {
      console.log('   ✅ Aula encontrada na consulta da API');
      console.log(`   Quiz Questions na API: ${!!targetLesson.quiz_questions}`);
      
      if (targetLesson.quiz_questions) {
        try {
          const apiParsed = typeof targetLesson.quiz_questions === 'string' 
            ? JSON.parse(targetLesson.quiz_questions)
            : targetLesson.quiz_questions;
          console.log(`   API parsed: ${Array.isArray(apiParsed) ? apiParsed.length + ' perguntas' : 'não é array'}`);
        } catch (e) {
          console.log(`   ❌ API parse error: ${e.message}`);
        }
      }
    } else {
      console.log('   ❌ Aula NÃO encontrada na consulta da API');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Erro:', error);
    process.exit(1);
  }
}

debugSpecificQuiz();
