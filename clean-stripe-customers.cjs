const { pool } = require('./server/config/database.cjs');

async function cleanStripeCustomers() {
  console.log('🧹 Limpando registros inválidos de clientes Stripe...');
  
  try {
    // Deletar todos os registros de stripe_customers para forçar recriação
    const result = await pool.query('DELETE FROM stripe_customers');
    console.log(`✅ Removidos ${result.rowCount} registros de stripe_customers`);
    console.log('💡 Novos clientes Stripe serão criados automaticamente na próxima compra');
  } catch (error) {
    console.error('❌ Erro ao limpar stripe_customers:', error);
  } finally {
    await pool.end();
  }
}

cleanStripeCustomers();
