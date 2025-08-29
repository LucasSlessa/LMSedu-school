const { Pool } = require('pg');

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost', 
  database: process.env.DB_NAME || 'lms_db',
  password: process.env.DB_PASSWORD || 'postgres',
  port: process.env.DB_PORT || 5432,
});

async function simpleTest() {
  try {
    console.log('🔍 Teste simples de quiz...');
    
    const result = await pool.query(`
      SELECT id, title, content_type, quiz_questions 
      FROM course_lessons 
      WHERE content_type = 'quiz' 
      LIMIT 3
    `);
    
    console.log(`Encontradas ${result.rows.length} aulas de quiz:`);
    
    result.rows.forEach(row => {
      console.log(`- ${row.title} (ID: ${row.id})`);
      console.log(`  Quiz data exists: ${!!row.quiz_questions}`);
      if (row.quiz_questions) {
        console.log(`  Quiz data length: ${JSON.stringify(row.quiz_questions).length} chars`);
      }
    });
    
    await pool.end();
  } catch (error) {
    console.error('Erro:', error.message);
  }
}

simpleTest();
