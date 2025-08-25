const fetch = require('node-fetch');

// Configuração
const BASE_URL = 'http://localhost:3001/api';
const TEST_EMAIL = 'admin@lms.com';
const TEST_PASSWORD = '123456';

// Variáveis globais
let authToken = null;
let testUserId = null;

// Função para fazer requisições HTTP
async function makeRequest(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...(authToken && { 'Authorization': `Bearer ${authToken}` }),
      ...options.headers
    },
    ...options
  };

  try {
    console.log(`\n🔍 Testando: ${options.method || 'GET'} ${endpoint}`);
    const response = await fetch(url, config);
    const data = await response.json();
    
    console.log(`📊 Status: ${response.status}`);
    console.log(`📄 Resposta:`, JSON.stringify(data, null, 2));
    
    return { status: response.status, data };
  } catch (error) {
    console.log(`❌ Erro: ${error.message}`);
    return { status: 'ERROR', error: error.message };
  }
}

// Testes de Autenticação
async function testAuthRoutes() {
  console.log('\n🔐 ===== TESTANDO ROTAS DE AUTENTICAÇÃO =====');
  
  // Teste de registro
  await makeRequest('/auth/register', {
    method: 'POST',
    body: JSON.stringify({
      email: 'teste@exemplo.com',
      password: '123456',
      name: 'Usuário Teste',
      role: 'student'
    })
  });
  
  // Teste de login
  const loginResult = await makeRequest('/auth/login', {
    method: 'POST',
    body: JSON.stringify({
      email: TEST_EMAIL,
      password: TEST_PASSWORD
    })
  });
  
  if (loginResult.status === 200 && loginResult.data.token) {
    authToken = loginResult.data.token;
    testUserId = loginResult.data.user.id;
    console.log('✅ Token de autenticação obtido com sucesso');
  }
  
  // Teste de perfil do usuário
  await makeRequest('/auth/me');
  
  // Teste de atualização de perfil
  await makeRequest('/auth/profile', {
    method: 'PUT',
    body: JSON.stringify({
      name: 'Nome Atualizado',
      bio: 'Biografia de teste'
    })
  });
}

// Testes de Categorias
async function testCategoriesRoutes() {
  console.log('\n📂 ===== TESTANDO ROTAS DE CATEGORIAS =====');
  
  // Listar categorias
  await makeRequest('/categories');
  
  // Criar categoria (requer admin)
  await makeRequest('/categories', {
    method: 'POST',
    body: JSON.stringify({
      name: 'Categoria Teste',
      description: 'Descrição da categoria teste'
    })
  });
  
  // Atualizar categoria (requer admin)
  await makeRequest('/categories/1', {
    method: 'PUT',
    body: JSON.stringify({
      name: 'Categoria Atualizada',
      description: 'Descrição atualizada'
    })
  });
  
  // Deletar categoria (requer admin)
  await makeRequest('/categories/1', {
    method: 'DELETE'
  });
}

// Testes de Cursos
async function testCoursesRoutes() {
  console.log('\n📚 ===== TESTANDO ROTAS DE CURSOS =====');
  
  // Listar cursos
  await makeRequest('/courses');
  
  // Buscar curso específico
  await makeRequest('/courses/1');
  
  // Criar curso (requer admin/instructor)
  await makeRequest('/courses', {
    method: 'POST',
    body: JSON.stringify({
      title: 'Curso Teste',
      description: 'Descrição do curso teste',
      price: 99.99,
      category_id: 1,
      instructor_id: testUserId,
      content: 'Conteúdo do curso',
      duration: 120,
      level: 'beginner'
    })
  });
  
  // Atualizar curso (requer admin/instructor)
  await makeRequest('/courses/1', {
    method: 'PUT',
    body: JSON.stringify({
      title: 'Curso Atualizado',
      description: 'Descrição atualizada',
      price: 149.99
    })
  });
  
  // Deletar curso (requer admin/instructor)
  await makeRequest('/courses/1', {
    method: 'DELETE'
  });
}

// Testes de Carrinho
async function testCartRoutes() {
  console.log('\n🛒 ===== TESTANDO ROTAS DO CARRINHO =====');
  
  // Ver carrinho
  await makeRequest('/cart');
  
  // Adicionar item ao carrinho
  await makeRequest('/cart/add', {
    method: 'POST',
    body: JSON.stringify({
      courseId: 1
    })
  });
  
  // Ver total do carrinho
  await makeRequest('/cart/total');
  
  // Remover item do carrinho
  await makeRequest('/cart/1', {
    method: 'DELETE'
  });
  
  // Limpar carrinho
  await makeRequest('/cart', {
    method: 'DELETE'
  });
}

// Testes de Pedidos
async function testOrdersRoutes() {
  console.log('\n📦 ===== TESTANDO ROTAS DE PEDIDOS =====');
  
  // Criar pedido
  await makeRequest('/orders/create', {
    method: 'POST',
    body: JSON.stringify({
      items: [{ courseId: 1, price: 99.99 }],
      total: 99.99
    })
  });
  
  // Listar pedidos
  await makeRequest('/orders');
  
  // Ver pedido específico
  await makeRequest('/orders/1');
  
  // Confirmar pedido
  await makeRequest('/orders/1/confirm', {
    method: 'POST',
    body: JSON.stringify({
      paymentMethod: 'credit_card',
      paymentDetails: {
        cardNumber: '4242424242424242',
        expiryMonth: '12',
        expiryYear: '2025',
        cvc: '123'
      }
    })
  });
}

// Testes de Matrículas
async function testEnrollmentsRoutes() {
  console.log('\n🎓 ===== TESTANDO ROTAS DE MATRÍCULAS =====');
  
  // Listar matrículas
  await makeRequest('/enrollments');
  
  // Ver progresso do curso
  await makeRequest('/enrollments/1/progress');
  
  // Atualizar progresso
  await makeRequest('/enrollments/1/progress', {
    method: 'PUT',
    body: JSON.stringify({
      completedLessons: ['lesson1', 'lesson2'],
      currentLesson: 'lesson3',
      progressPercentage: 60
    })
  });
}

// Testes do Stripe
async function testStripeRoutes() {
  console.log('\n💳 ===== TESTANDO ROTAS DO STRIPE =====');
  
  // Criar sessão de checkout
  await makeRequest('/stripe/create-checkout-session', {
    method: 'POST',
    body: JSON.stringify({
      items: [{ courseId: 1, price: 99.99 }],
      successUrl: 'http://localhost:5173/success',
      cancelUrl: 'http://localhost:5173/cancel'
    })
  });
  
  // Verificar status do pagamento
  await makeRequest('/stripe/payment-status/test-session-id');
  
  // Pagamento mock (para desenvolvimento)
  await makeRequest('/stripe/mock-payment', {
    method: 'POST',
    body: JSON.stringify({
      amount: 9999,
      currency: 'brl',
      description: 'Pagamento teste'
    })
  });
  
  // Verificar pagamento mock
  await makeRequest('/stripe/mock-verify/test-payment-id');
  
  // Criar sessão de pagamento
  await makeRequest('/stripe/create-session', {
    method: 'POST',
    body: JSON.stringify({
      amount: 9999,
      currency: 'brl',
      description: 'Sessão de pagamento teste'
    })
  });
  
  // Verificar sessão
  await makeRequest('/stripe/verify-session/test-session-id');
}

// Teste de Health Check
async function testHealthCheck() {
  console.log('\n🏥 ===== TESTANDO HEALTH CHECK =====');
  await makeRequest('/health');
}

// Função principal
async function runAllTests() {
  console.log('🚀 Iniciando testes de todas as rotas da API...');
  console.log(`📍 URL Base: ${BASE_URL}`);
  
  try {
    // Teste de health check primeiro
    await testHealthCheck();
    
    // Testes de autenticação
    await testAuthRoutes();
    
    // Se conseguiu autenticar, testar as outras rotas
    if (authToken) {
      await testCategoriesRoutes();
      await testCoursesRoutes();
      await testCartRoutes();
      await testOrdersRoutes();
      await testEnrollmentsRoutes();
      await testStripeRoutes();
    } else {
      console.log('❌ Falha na autenticação. Alguns testes não puderam ser executados.');
    }
    
    console.log('\n✅ Todos os testes foram concluídos!');
    
  } catch (error) {
    console.error('❌ Erro durante os testes:', error);
  }
}

// Executar os testes
runAllTests();

