const fetch = require('node-fetch');

// Configuração
const BASE_URL = 'http://localhost:3001/api';

// Função para fazer requisições HTTP
async function makeRequest(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    },
    ...options
  };

  try {
    console.log(`\n🔍 Testando: ${options.method || 'GET'} ${endpoint}`);
    const response = await fetch(url, config);
    
    let data;
    try {
      data = await response.json();
    } catch (e) {
      data = { message: 'Resposta não é JSON válido' };
    }
    
    console.log(`📊 Status: ${response.status}`);
    console.log(`📄 Resposta:`, JSON.stringify(data, null, 2));
    
    return { status: response.status, data };
  } catch (error) {
    console.log(`❌ Erro: ${error.message}`);
    return { status: 'ERROR', error: error.message };
  }
}

// Teste de Health Check
async function testHealthCheck() {
  console.log('\n🏥 ===== TESTANDO HEALTH CHECK =====');
  await makeRequest('/health');
}

// Teste de registro (sem autenticação)
async function testRegister() {
  console.log('\n🔐 ===== TESTANDO REGISTRO =====');
  await makeRequest('/auth/register', {
    method: 'POST',
    body: JSON.stringify({
      email: 'teste@exemplo.com',
      password: '123456',
      name: 'Usuário Teste',
      role: 'student'
    })
  });
}

// Teste de login
async function testLogin() {
  console.log('\n🔐 ===== TESTANDO LOGIN =====');
  await makeRequest('/auth/login', {
    method: 'POST',
    body: JSON.stringify({
      email: 'admin@lms.com',
      password: '123456'
    })
  });
}

// Teste de listar categorias (público)
async function testCategories() {
  console.log('\n📂 ===== TESTANDO LISTAR CATEGORIAS =====');
  await makeRequest('/categories');
}

// Teste de listar cursos (público)
async function testCourses() {
  console.log('\n📚 ===== TESTANDO LISTAR CURSOS =====');
  await makeRequest('/courses');
  
  // Teste de buscar curso específico
  await makeRequest('/courses/1');
}

// Função principal
async function runBasicTests() {
  console.log('🚀 Iniciando testes básicos das rotas da API...');
  console.log(`📍 URL Base: ${BASE_URL}`);
  
  try {
    // Teste de health check primeiro
    await testHealthCheck();
    
    // Testes de autenticação
    await testRegister();
    await testLogin();
    
    // Testes de dados públicos
    await testCategories();
    await testCourses();
    
    console.log('\n✅ Todos os testes básicos foram concluídos!');
    
  } catch (error) {
    console.error('❌ Erro durante os testes:', error);
  }
}

// Executar os testes
runBasicTests();

