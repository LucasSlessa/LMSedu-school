const { pool, executeQuery } = require('./server/config/database.cjs');

async function testQuizSave() {
  try {
    console.log('🧪 Testando salvamento de quiz...\n');
    
    // 1. Buscar um módulo existente
    const moduleResult = await executeQuery(`
      SELECT id, title FROM course_modules LIMIT 1
    `);
    
    if (moduleResult.rows.length === 0) {
      console.log('❌ Nenhum módulo encontrado');
      return;
    }
    
    const moduleId = moduleResult.rows[0].id;
    console.log('📋 Usando módulo:', moduleResult.rows[0].title, '(', moduleId, ')');
    
    // 2. Criar dados de teste para quiz
    const testQuizData = [
      {
        id: 'test-question-1',
        question: 'Qual é a capital do Brasil?',
        options: ['São Paulo', 'Rio de Janeiro', 'Brasília', 'Belo Horizonte'],
        correctAnswer: 2
      },
      {
        id: 'test-question-2', 
        question: 'Quanto é 2 + 2?',
        options: ['3', '4', '5', '6'],
        correctAnswer: 1
      }
    ];
    
    console.log('📝 Dados do quiz de teste:', testQuizData);
    
    // 3. Tentar inserir aula com quiz
    const quizQuestionsJson = JSON.stringify(testQuizData);
    console.log('💾 JSON para salvar:', quizQuestionsJson);
    
    const insertResult = await executeQuery(`
      INSERT INTO course_lessons (module_id, title, description, content_type, content_url, quiz_questions, duration_minutes, sort_order, is_free)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `, [
      moduleId,
      'Teste Quiz - ' + Date.now(),
      'Aula de teste para quiz',
      'quiz',
      '',
      quizQuestionsJson,
      15,
      999,
      false
    ]);
    
    console.log('✅ Aula criada com ID:', insertResult.rows[0].id);
    
    // 4. Verificar se foi salvo corretamente
    const checkResult = await executeQuery(`
      SELECT id, title, quiz_questions FROM course_lessons WHERE id = $1
    `, [insertResult.rows[0].id]);
    
    if (checkResult.rows.length > 0) {
      const savedData = checkResult.rows[0];
      console.log('\n📖 Dados salvos no banco:');
      console.log('- ID:', savedData.id);
      console.log('- Título:', savedData.title);
      console.log('- Quiz Questions (tipo):', typeof savedData.quiz_questions);
      console.log('- Quiz Questions (conteúdo):', savedData.quiz_questions);
      
      // Tentar fazer parse
      if (savedData.quiz_questions) {
        try {
          const parsed = typeof savedData.quiz_questions === 'string' 
            ? JSON.parse(savedData.quiz_questions)
            : savedData.quiz_questions;
          console.log('✅ Parse bem-sucedido:', parsed);
        } catch (error) {
          console.log('❌ Erro no parse:', error.message);
        }
      }
    }
    
    // 5. Limpar dados de teste
    await executeQuery('DELETE FROM course_lessons WHERE id = $1', [insertResult.rows[0].id]);
    console.log('\n🧹 Dados de teste removidos');
    
  } catch (error) {
    console.error('❌ Erro no teste:', error);
  } finally {
    process.exit(0);
  }
}

testQuizSave();
