require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function checkQuizDB() {
  try {
    const lessonId = '05487554-c6e9-4035-a47d-6d39c2ab642f';
    
    console.log('🔍 Verificando quiz no banco para lesson:', lessonId);
    
    const result = await pool.query(`
      SELECT id, title, content_type, quiz_questions, 
             LENGTH(quiz_questions::text) as quiz_length
      FROM course_lessons 
      WHERE id = $1
    `, [lessonId]);
    
    if (result.rows.length === 0) {
      console.log('❌ Lesson não encontrada');
      return;
    }
    
    const lesson = result.rows[0];
    console.log('\n📋 Dados da lesson:');
    console.log('ID:', lesson.id);
    console.log('Title:', lesson.title);
    console.log('Content Type:', lesson.content_type);
    console.log('Quiz Questions existe:', !!lesson.quiz_questions);
    console.log('Quiz Questions tipo:', typeof lesson.quiz_questions);
    console.log('Quiz Questions tamanho:', lesson.quiz_length, 'chars');
    
    if (lesson.quiz_questions) {
      console.log('\n📄 Raw quiz_questions:');
      console.log(lesson.quiz_questions);
      
      try {
        const parsed = typeof lesson.quiz_questions === 'string' 
          ? JSON.parse(lesson.quiz_questions)
          : lesson.quiz_questions;
          
        console.log('\n✅ Parsed quiz_questions:');
        console.log('Tipo:', typeof parsed);
        console.log('É array:', Array.isArray(parsed));
        console.log('Length:', Array.isArray(parsed) ? parsed.length : 'N/A');
        
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
    
    await pool.end();
    
  } catch (error) {
    console.error('❌ Erro:', error);
    await pool.end();
  }
}

checkQuizDB();
