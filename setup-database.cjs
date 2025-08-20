const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function setupDatabase() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    console.log('🔌 Conectando ao banco de dados Neon...');
    
    // Ler o arquivo SQL
    const sqlFile = path.join(__dirname, 'supabase/migrations/20250805163717_white_forest.sql');
    const sqlContent = fs.readFileSync(sqlFile, 'utf8');
    
    console.log('📝 Aplicando schema do banco de dados...');
    
    // Executar o SQL
    await pool.query(sqlContent);
    
    console.log('✅ Schema aplicado com sucesso!');
    console.log('🎉 Banco de dados configurado e pronto para uso!');
    
  } catch (error) {
    console.error('❌ Erro ao aplicar schema:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

setupDatabase(); 