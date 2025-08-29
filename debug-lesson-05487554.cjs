const { executeQuery } = require('./server/config/database.cjs');

async function debugSpecificLesson() {
  try {
    const lessonId = '05487554-c6e9-4035-a47d-6d39c2ab642f';
    
    console.log('🔍 Debug da aula específica:', lessonId);
    
    // Buscar a aula diretamente
    const lessonResult = await executeQuery(`
      SELECT 
        id, title, content_type, quiz_questions,
        LENGTH(quiz_questions::text) as quiz_length,
        module_id
      FROM course_lessons 
      WHERE id = $1
    `, [lessonId]);
    
    if (lessonResult.rows.length === 0) {
      console.log('❌ Aula não encontrada!');
      return;
    }
    
    const lesson = lessonResult.rows[0];
    console.log('\n📋 Dados da aula:');
    console.log('- ID:', lesson.id);
    console.log('- Título:', lesson.title);
    console.log('- Tipo:', lesson.content_type);
    console.log('- Módulo ID:', lesson.module_id);
    console.log('- Quiz Questions existe:', !!lesson.quiz_questions);
    console.log('- Quiz Questions tipo:', typeof lesson.quiz_questions);
    console.log('- Quiz Questions tamanho:', lesson.quiz_length, 'chars');
    
    if (lesson.quiz_questions) {
      console.log('\n📄 Raw quiz_questions:');
      console.log(JSON.stringify(lesson.quiz_questions, null, 2));
      
      try {
        const parsed = typeof lesson.quiz_questions === 'string' 
          ? JSON.parse(lesson.quiz_questions)
          : lesson.quiz_questions;
          
        console.log('\n✅ Parsed quiz_questions:');
        console.log('- Tipo após parse:', typeof parsed);
        console.log('- É array:', Array.isArray(parsed));
        console.log('- Length:', Array.isArray(parsed) ? parsed.length : 'N/A');
        
        if (Array.isArray(parsed)) {
          console.log('- Conteúdo:', JSON.stringify(parsed, null, 2));
        } else {
          console.log('- Conteúdo (não array):', parsed);
        }
      } catch (e) {
        console.log('\n❌ Erro no parse:', e.message);
      }
    }
    
    // Simular exatamente o que a API faz
    console.log('\n🌐 Simulando API...');
    const moduleId = lesson.module_id;
    
    const apiResult = await executeQuery(`
      SELECT 
        cl.*
      FROM course_lessons cl
      WHERE cl.module_id = $1
      ORDER BY cl.sort_order ASC, cl.created_at ASC
    `, [moduleId]);
    
    const targetLesson = apiResult.rows.find(row => row.id === lessonId);
    
    if (targetLesson) {
      console.log('✅ Aula encontrada na API');
      
      let quizQuestions = null;
      if (targetLesson.quiz_questions) {
        try {
          if (typeof targetLesson.quiz_questions === 'string') {
            quizQuestions = JSON.parse(targetLesson.quiz_questions);
          } else {
            quizQuestions = targetLesson.quiz_questions;
          }
          
          console.log('📊 API processou quiz_questions:');
          console.log('- Tipo:', typeof quizQuestions);
          console.log('- É array:', Array.isArray(quizQuestions));
          console.log('- Length:', Array.isArray(quizQuestions) ? quizQuestions.length : 'N/A');
          console.log('- Conteúdo:', JSON.stringify(quizQuestions, null, 2));
          
        } catch (e) {
          console.log('❌ API falhou no parse:', e.message);
        }
      } else {
        console.log('❌ API não encontrou quiz_questions');
      }
    } else {
      console.log('❌ Aula NÃO encontrada na consulta da API');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Erro:', error);
    process.exit(1);
  }
}

debugSpecificLesson();
