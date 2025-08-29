const { Pool } = require('pg');
require('dotenv').config();

// Usar a mesma configuração do database.cjs
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  },
  max: 5,
  idleTimeoutMillis: 10000,
  connectionTimeoutMillis: 10000,
});

async function fixDatabase() {
  let client;
  try {
    console.log('🔧 Conectando ao banco...');
    client = await pool.connect();
    
    console.log('✅ Conectado! Verificando estrutura...');
    
    // Verificar se a coluna quiz_questions existe
    const columnCheck = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'course_lessons' 
      AND column_name = 'quiz_questions'
    `);
    
    if (columnCheck.rows.length === 0) {
      console.log('❌ Coluna quiz_questions não existe. Adicionando...');
      await client.query('ALTER TABLE course_lessons ADD COLUMN quiz_questions jsonb');
      console.log('✅ Coluna quiz_questions adicionada!');
    } else {
      console.log('✅ Coluna quiz_questions já existe');
    }
    
    // Verificar constraint de content_type
    console.log('🔍 Verificando constraint de content_type...');
    const constraintCheck = await client.query(`
      SELECT constraint_name, check_clause
      FROM information_schema.check_constraints 
      WHERE constraint_name LIKE '%content_type%'
    `);
    
    if (constraintCheck.rows.length > 0) {
      console.log('📋 Constraints encontradas:', constraintCheck.rows);
      
      // Remover constraint antiga se existir
      try {
        await client.query('ALTER TABLE course_lessons DROP CONSTRAINT IF EXISTS course_lessons_content_type_check');
        console.log('🗑️ Constraint antiga removida');
      } catch (e) {
        console.log('ℹ️ Nenhuma constraint antiga para remover');
      }
    }
    
    // Adicionar nova constraint com pdf e pptx
    await client.query(`
      ALTER TABLE course_lessons 
      ADD CONSTRAINT course_lessons_content_type_check 
      CHECK (content_type IN ('video', 'text', 'quiz', 'file', 'pdf', 'pptx'))
    `);
    console.log('✅ Nova constraint adicionada com pdf e pptx');
    
    // Mostrar estrutura final
    const finalCheck = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'course_lessons'
      ORDER BY ordinal_position
    `);
    
    console.log('📊 Estrutura final da tabela course_lessons:');
    finalCheck.rows.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
    });
    
    console.log('🎉 Banco de dados corrigido com sucesso!');
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    if (client) {
      client.release();
    }
    await pool.end();
    process.exit(0);
  }
}

fixDatabase();
