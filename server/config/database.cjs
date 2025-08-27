const { Pool } = require('pg');
require('dotenv').config();

// Configuração para Neon PostgreSQL com melhor tratamento de conexões
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  },
  max: 10, // Reduzir o número máximo de conexões
  idleTimeoutMillis: 10000, // Reduzir timeout de idle
  connectionTimeoutMillis: 5000, // Aumentar timeout de conexão
  acquireTimeoutMillis: 10000, // Timeout para adquirir conexão
  reapIntervalMillis: 1000, // Verificar conexões a cada 1 segundo
});

// Teste de conexão
pool.on('connect', () => {
  console.log('✅ Conectado ao Neon PostgreSQL');
});

pool.on('error', (err) => {
  console.error('❌ Erro na conexão com Neon PostgreSQL:', err);
});

// Função para executar queries com retry
// Aceita uma query simples ou um array de queries (transação)
const executeQuery = async (query, params = []) => {
  let retries = 3;

  while (retries > 0) {
    try {
      if (Array.isArray(query)) {
        const client = await pool.connect();
        try {
          await client.query('BEGIN');
          const results = [];
          for (const q of query) {
            const text = q.text || q.query;
            const values = q.values || q.params || [];
            results.push(await client.query(text, values));
          }
          await client.query('COMMIT');
          return results;
        } catch (err) {
          await client.query('ROLLBACK');
          throw err;
        } finally {
          client.release();
        }
      }

      const result = await pool.query(query, params);
      return result;
    } catch (error) {
      retries--;
      console.error(`❌ Erro na query (tentativas restantes: ${retries}):`, error.message);

      if (retries === 0) {
        throw error;
      }

      // Aguardar um pouco antes de tentar novamente
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
};

module.exports = { pool, executeQuery };
