const { executeQuery } = require('./server/config/database.cjs');

async function testDatabase() {
  try {
    console.log('🔍 Testando conexão com banco...');
    
    // Testar conexão básica
    const result = await executeQuery('SELECT NOW() as current_time');
    console.log('✅ Conexão OK:', result.rows[0]);
    
    // Verificar se tabela course_lessons existe
    const tableCheck = await executeQuery(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_name = 'course_lessons'
    `);
    console.log('📋 Tabela course_lessons existe:', tableCheck.rows.length > 0);
    
    // Verificar colunas da tabela
    const columnsCheck = await executeQuery(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'course_lessons'
      ORDER BY ordinal_position
    `);
    console.log('📊 Colunas da tabela course_lessons:');
    columnsCheck.rows.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
    });
    
    // Verificar especificamente a coluna quiz_questions
    const quizColumnCheck = await executeQuery(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'course_lessons' 
      AND column_name = 'quiz_questions'
    `);
    
    if (quizColumnCheck.rows.length === 0) {
      console.log('❌ Coluna quiz_questions NÃO existe! Adicionando...');
      await executeQuery('ALTER TABLE course_lessons ADD COLUMN quiz_questions jsonb');
      console.log('✅ Coluna quiz_questions adicionada!');
    } else {
      console.log('✅ Coluna quiz_questions já existe:', quizColumnCheck.rows[0]);
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Erro no teste:', error);
    process.exit(1);
  }
}

testDatabase();
