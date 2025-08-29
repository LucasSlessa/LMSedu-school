const { executeQuery } = require('./server/config/database.cjs');

async function findQuizLesson() {
  try {
    const quizLessonId = '05487554-c6e9-4035-a47d-6d39c2ab642f';
    
    console.log('🔍 Procurando aula de quiz:', quizLessonId);
    
    // Buscar a aula de quiz específica
    const lessonResult = await executeQuery(`
      SELECT 
        cl.id, cl.title, cl.content_type, cl.module_id,
        cm.title as module_title, cm.course_id,
        c.title as course_title,
        cl.quiz_questions,
        LENGTH(cl.quiz_questions::text) as quiz_length
      FROM course_lessons cl
      JOIN course_modules cm ON cl.module_id = cm.id
      JOIN courses c ON cm.course_id = c.id
      WHERE cl.id = $1
    `, [quizLessonId]);
    
    if (lessonResult.rows.length === 0) {
      console.log('❌ Aula de quiz não encontrada!');
      return;
    }
    
    const lesson = lessonResult.rows[0];
    console.log('\n📋 Dados da aula de quiz:');
    console.log('- Lesson ID:', lesson.id);
    console.log('- Título:', lesson.title);
    console.log('- Content Type:', lesson.content_type);
    console.log('- Module ID:', lesson.module_id);
    console.log('- Module Title:', lesson.module_title);
    console.log('- Course ID:', lesson.course_id);
    console.log('- Course Title:', lesson.course_title);
    console.log('- Quiz Questions existe:', !!lesson.quiz_questions);
    console.log('- Quiz Questions tamanho:', lesson.quiz_length, 'chars');
    
    if (lesson.quiz_questions) {
      console.log('\n📄 Quiz Questions (raw):');
      console.log(lesson.quiz_questions);
      
      try {
        const parsed = typeof lesson.quiz_questions === 'string' 
          ? JSON.parse(lesson.quiz_questions)
          : lesson.quiz_questions;
          
        console.log('\n✅ Quiz Questions (parsed):');
        console.log('- Tipo:', typeof parsed);
        console.log('- É array:', Array.isArray(parsed));
        console.log('- Length:', Array.isArray(parsed) ? parsed.length : 'N/A');
        
        if (Array.isArray(parsed) && parsed.length > 0) {
          console.log('\n📝 Perguntas encontradas:');
          parsed.forEach((q, i) => {
            console.log(`${i+1}. ${q.question || 'SEM PERGUNTA'}`);
          });
        }
      } catch (e) {
        console.log('\n❌ Erro no parse:', e.message);
      }
    } else {
      console.log('\n❌ quiz_questions é null/undefined');
    }
    
    // Agora buscar todas as aulas do mesmo módulo
    console.log('\n🔍 Buscando todas as aulas do módulo:', lesson.module_id);
    
    const allLessonsResult = await executeQuery(`
      SELECT id, title, content_type, sort_order
      FROM course_lessons
      WHERE module_id = $1
      ORDER BY sort_order ASC, created_at ASC
    `, [lesson.module_id]);
    
    console.log(`\n📚 ${allLessonsResult.rows.length} aulas no módulo:`);
    allLessonsResult.rows.forEach((l, i) => {
      const isTarget = l.id === quizLessonId;
      console.log(`${i+1}. ${isTarget ? '🎯' : '  '} "${l.title}" (${l.content_type}) - ID: ${l.id}`);
    });
    
  } catch (error) {
    console.error('❌ Erro:', error);
  }
}

findQuizLesson();
