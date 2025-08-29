const { executeQuery } = require('./server/config/database.cjs');

async function debugQuizDirect() {
  try {
    console.log('🔍 Debug direto do quiz no banco...\n');
    
    // Verificar aulas de quiz específicas
    const result = await executeQuery(`
      SELECT cl.id, cl.title, cl.content_type, cl.quiz_questions,
             cm.title as module_title, c.title as course_title,
             LENGTH(cl.quiz_questions::text) as quiz_length
      FROM course_lessons cl
      JOIN course_modules cm ON cl.module_id = cm.id  
      JOIN courses c ON cm.course_id = c.id
      WHERE cl.content_type = 'quiz'
      ORDER BY cl.id DESC
      LIMIT 5
    `);
    
    console.log(`Encontradas ${result.rows.length} aulas de quiz:\n`);
    
    result.rows.forEach((row, i) => {
      console.log(`${i+1}. Aula: "${row.title}"`);
      console.log(`   Curso: ${row.course_title}`);
      console.log(`   Módulo: ${row.module_title}`);
      console.log(`   ID: ${row.id}`);
      console.log(`   Content Type: ${row.content_type}`);
      console.log(`   Quiz Questions Length: ${row.quiz_length || 0} caracteres`);
      
      if (row.quiz_questions) {
        console.log(`   Quiz Questions (raw): ${JSON.stringify(row.quiz_questions).substring(0, 200)}...`);
        
        try {
          const parsed = typeof row.quiz_questions === 'string' 
            ? JSON.parse(row.quiz_questions)
            : row.quiz_questions;
            
          if (Array.isArray(parsed)) {
            console.log(`   ✅ Parsed: ${parsed.length} perguntas`);
            parsed.forEach((q, qIndex) => {
              console.log(`      ${qIndex+1}. "${q.question || 'SEM PERGUNTA'}"`);
            });
          } else {
            console.log(`   ❌ Não é array: ${typeof parsed}`);
          }
        } catch (e) {
          console.log(`   ❌ Erro parse: ${e.message}`);
        }
      } else {
        console.log(`   ❌ quiz_questions é NULL`);
      }
      console.log('');
    });
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Erro:', error);
    process.exit(1);
  }
}

debugQuizDirect();
