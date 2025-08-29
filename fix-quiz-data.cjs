const { executeQuery } = require('./server/config/database.cjs');

async function fixQuizData() {
  try {
    console.log('🔧 Corrigindo dados do quiz...\n');
    
    // 1. Verificar aula específica que está com problema
    const lessonId = '05487554-c6e9-4035-a47d-6d39c2ab642f';
    
    const lessonCheck = await executeQuery(`
      SELECT id, title, content_type, quiz_questions 
      FROM course_lessons 
      WHERE id = $1
    `, [lessonId]);
    
    if (lessonCheck.rows.length === 0) {
      console.log('❌ Aula não encontrada');
      return;
    }
    
    const lesson = lessonCheck.rows[0];
    console.log('📋 Aula atual:', {
      id: lesson.id,
      title: lesson.title,
      type: lesson.content_type,
      hasQuizData: !!lesson.quiz_questions,
      quizData: lesson.quiz_questions
    });
    
    // 2. Adicionar perguntas de teste se estiver vazio
    if (!lesson.quiz_questions || JSON.stringify(lesson.quiz_questions) === '[]') {
      console.log('\n🔧 Adicionando perguntas de teste...');
      
      const testQuestions = [
        {
          id: 'q1',
          question: 'Qual é a capital do Brasil?',
          options: ['São Paulo', 'Rio de Janeiro', 'Brasília', 'Belo Horizonte'],
          correctAnswer: 2,
          type: 'multiple-choice',
          explanation: 'Brasília é a capital federal do Brasil desde 1960.',
          required: true,
          points: 1
        },
        {
          id: 'q2',
          question: 'Quanto é 2 + 2?',
          options: ['3', '4', '5', '6'],
          correctAnswer: 1,
          type: 'multiple-choice',
          explanation: '2 + 2 = 4 é uma operação básica de adição.',
          required: true,
          points: 1
        }
      ];
      
      const updateResult = await executeQuery(`
        UPDATE course_lessons 
        SET quiz_questions = $1 
        WHERE id = $2
        RETURNING quiz_questions
      `, [JSON.stringify(testQuestions), lessonId]);
      
      console.log('✅ Perguntas adicionadas:', updateResult.rows[0].quiz_questions);
    }
    
    // 3. Verificar se foi corrigido
    const finalCheck = await executeQuery(`
      SELECT id, title, quiz_questions 
      FROM course_lessons 
      WHERE id = $1
    `, [lessonId]);
    
    const updatedLesson = finalCheck.rows[0];
    console.log('\n📊 Estado final:');
    console.log('- Quiz Questions existe:', !!updatedLesson.quiz_questions);
    
    if (updatedLesson.quiz_questions) {
      try {
        const parsed = JSON.parse(updatedLesson.quiz_questions);
        console.log('- Número de perguntas:', Array.isArray(parsed) ? parsed.length : 'não é array');
        if (Array.isArray(parsed) && parsed.length > 0) {
          console.log('- Primeira pergunta:', parsed[0].question);
        }
      } catch (e) {
        console.log('- Erro no parse:', e.message);
      }
    }
    
    console.log('\n✅ Correção concluída! Teste novamente no frontend.');
    
  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    process.exit(0);
  }
}

fixQuizData();
