const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

// API principal
export const api = {
  get: async (endpoint: string) => {
    return apiRequest(endpoint);
  },
  
  post: async (endpoint: string, data?: unknown) => {
    return apiRequest(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  },
  
  put: async (endpoint: string, data?: unknown) => {
    return apiRequest(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  },
  
  delete: async (endpoint: string) => {
    return apiRequest(endpoint, {
      method: 'DELETE',
    });
  },
};

// Função para obter token do localStorage
const getToken = () => {
  const token = localStorage.getItem('auth_token');
  console.log('🔍 Token obtido do localStorage:', token ? token.substring(0, 20) + '...' : 'Nenhum token');
  return token;
};

// Função para deletar aula
export const deleteLessonAPI = async (courseId: string, moduleId: string, lessonId: string) => {
  return api.delete(`/courses/${courseId}/modules/${moduleId}/lessons/${lessonId}`);
};

// Função para fazer requisições autenticadas
const apiRequest = async (endpoint: string, options: RequestInit = {}) => {
  const token = getToken();
  
  const config: RequestInit = {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...(options.headers as Record<string, string>),
    },
  };

  console.log('🔐 Headers da requisição:', {
    'Content-Type': (config.headers as Record<string, string>)?.['Content-Type'],
    'Authorization': token ? `Bearer ${token.substring(0, 20)}...` : 'Não definido'
  });

  const url = `${API_BASE_URL}${endpoint}`;
  console.log('📡 Fazendo requisição:', { url, method: options.method || 'GET', body: options.body });

  const response = await fetch(url, config);
  
  console.log('📡 Resposta recebida:', { status: response.status, ok: response.ok });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Erro desconhecido' }));
    console.error('❌ Erro na requisição:', error);
    throw new Error(error.error || `HTTP ${response.status}`);
  }

  const data = await response.json();
  console.log('✅ Dados recebidos:', data);
  return data;
};

// Auth API
export const authAPI = {
  login: async (email: string, password: string) => {
    return apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  },
  register: async (userData: { email: string; password: string; name: string; role?: string }) => {
    console.log('📝 Dados do registro:', userData);
    const body = JSON.stringify(userData);
    console.log('📝 Body do registro:', body);
    return apiRequest('/auth/register', {
      method: 'POST',
      body: body,
    });
  },
  loginWithGoogle: async (email: string, name: string, picture?: string) => {
    return apiRequest('/auth/google', {
      method: 'POST',
      body: JSON.stringify({ email, name, picture }),
    });
  },
  loginWithGitHub: async (email: string, name: string, picture?: string) => {
    return apiRequest('/auth/github', {
      method: 'POST',
      body: JSON.stringify({ email, name, picture }),
    });
  },
  me: async () => {
    return apiRequest('/auth/me');
  },
  getCurrentUser: async () => {
    return apiRequest('/auth/me');
  },
  logout: async () => {
    // Remove token from localStorage
    localStorage.removeItem('auth_token');
    return Promise.resolve();
  },
  forgotPassword: async (email: string) => {
    return apiRequest('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  },
  resetPassword: async (token: string, newPassword: string) => {
    return apiRequest('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token, newPassword }),
    });
  },
  verifyResetToken: async (token: string) => {
    return apiRequest(`/auth/verify-reset-token/${token}`);
  },
  updateProfile: async (data: { name?: string; avatar_url?: string }) => {
    return apiRequest('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },
};

// Courses API
export const coursesAPI = {
  getAll: async (params?: { category?: string; level?: string; search?: string; sort?: string; order?: string; admin?: boolean }) => {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value) searchParams.append(key, value.toString());
      });
    }
    
    const queryString = searchParams.toString();
    return apiRequest(`/courses${queryString ? `?${queryString}` : ''}`);
  },

  getById: async (id: string) => {
    return apiRequest(`/courses/${id}`);
  },

  create: async (courseData: unknown) => {
    const response = await apiRequest('/courses', {
      method: 'POST',
      body: JSON.stringify(courseData),
    });
    // Backend returns { message, course }, we need just the course
    return response.course || response;
  },

  update: async (id: string, courseData: unknown) => {
    return apiRequest(`/courses/${id}`, {
      method: 'PUT',
      body: JSON.stringify(courseData),
    });
  },

  delete: async (id: string) => {
    return apiRequest(`/courses/${id}`, {
      method: 'DELETE',
    });
  },

  // Módulos do curso
  getModules: async (courseId: string) => {
    return apiRequest(`/courses/${courseId}/modules`);
  },

  createModule: async (courseId: string, moduleData: unknown) => {
    return apiRequest(`/courses/${courseId}/modules`, {
      method: 'POST',
      body: JSON.stringify(moduleData),
    });
  },

  updateModule: async (courseId: string, moduleId: string, moduleData: unknown) => {
    return apiRequest(`/courses/${courseId}/modules/${moduleId}`, {
      method: 'PUT',
      body: JSON.stringify(moduleData),
    });
  },

  deleteModule: async (courseId: string, moduleId: string) => {
    return apiRequest(`/courses/${courseId}/modules/${moduleId}`, {
      method: 'DELETE',
    });
  },

  // Aulas do módulo
  getLessons: async (courseId: string, moduleId: string) => {
    console.log('🔍 API: Buscando aulas para módulo:', { courseId, moduleId });
    const response = await fetch(`${API_BASE_URL}/courses/${courseId}/modules/${moduleId}/lessons`);
    if (!response.ok) throw new Error('Erro ao buscar aulas');
    const lessons = await response.json();
    console.log('📚 API: Aulas recebidas:', lessons);
    
    // Log específico para aulas de quiz
    const quizLessons = lessons.filter((lesson: any) => lesson.contentType === 'quiz');
    if (quizLessons.length > 0) {
      console.log('🎯 API: Aulas de quiz encontradas:', quizLessons.map((lesson: any) => ({
        id: lesson.id,
        title: lesson.title,
        hasQuizQuestions: !!lesson.quizQuestions,
        questionsCount: lesson.quizQuestions?.length || 0
      })));
    }
    
    return lessons;
  },

  createLesson: async (courseId: string, moduleId: string, lessonData: unknown) => {
    return apiRequest(`/courses/${courseId}/modules/${moduleId}/lessons`, {
      method: 'POST',
      body: JSON.stringify(lessonData),
    });
  },

  updateLesson: async (courseId: string, moduleId: string, lessonId: string, lessonData: unknown) => {
    return apiRequest(`/courses/${courseId}/modules/${moduleId}/lessons/${lessonId}`, {
      method: 'PUT',
      body: JSON.stringify(lessonData),
    });
  },

  deleteLesson: async (courseId: string, moduleId: string, lessonId: string) => {
    return apiRequest(`/courses/${courseId}/modules/${moduleId}/lessons/${lessonId}`, {
      method: 'DELETE',
    });
  },
};

// Categories API
export const categoriesAPI = {
  getAll: async () => {
    return apiRequest('/categories');
  },

  create: async (categoryData: unknown) => {
    return apiRequest('/categories', {
      method: 'POST',
      body: JSON.stringify(categoryData),
    });
  },

  update: async (id: string, categoryData: unknown) => {
    return apiRequest(`/categories/${id}`, {
      method: 'PUT',
      body: JSON.stringify(categoryData),
    });
  },

  delete: async (id: string) => {
    return apiRequest(`/categories/${id}`, {
      method: 'DELETE',
    });
  },
};

// Cart API
export const cartAPI = {
  getItems: async () => {
    return apiRequest('/cart');
  },

  addItem: async (courseId: string) => {
    return apiRequest('/cart/add', {
      method: 'POST',
      body: JSON.stringify({ courseId }),
    });
  },

  removeItem: async (courseId: string) => {
    return apiRequest(`/cart/${courseId}`, {
      method: 'DELETE',
    });
  },

  clear: async () => {
    return apiRequest('/cart', {
      method: 'DELETE',
    });
  },

  getTotal: async () => {
    return apiRequest('/cart/total');
  },
};

// Orders API
export const ordersAPI = {
  create: async () => {
    return apiRequest('/orders/create', {
      method: 'POST',
    });
  },

  confirm: async (orderId: string) => {
    return apiRequest(`/orders/${orderId}/confirm`, {
      method: 'POST',
    });
  },

  getAll: async () => {
    return apiRequest('/orders');
  },

  getById: async (orderId: string) => {
    return apiRequest(`/orders/${orderId}`);
  },
};

// Enrollments API
export const enrollmentsAPI = {
  getAll: async () => {
    return apiRequest('/enrollments');
  },

  getProgress: async (courseId: string) => {
    return apiRequest(`/enrollments/${courseId}/progress`);
  },

  updateProgress: async (courseId: string, progressPercentage: number) => {
    return apiRequest(`/enrollments/${courseId}/progress`, {
      method: 'PUT',
      body: JSON.stringify({ progressPercentage }),
    });
  },

  // Admin endpoints
  adminGrant: async (userId: string, courseId: string) => {
    return apiRequest('/enrollments/admin/grant', {
      method: 'POST',
      body: JSON.stringify({ userId, courseId }),
    });
  },

  adminComplete: async (userId: string, courseId: string) => {
    return apiRequest('/enrollments/admin/complete', {
      method: 'POST',
      body: JSON.stringify({ userId, courseId }),
    });
  },

  adminListUser: async (userId: string) => {
    return apiRequest(`/enrollments/admin/user/${userId}`);
  },
};

// Stripe API
export const stripeAPI = {
  createCheckoutSession: async (courseId: string) => {
    return apiRequest('/stripe/create-checkout-session', {
      method: 'POST',
      body: JSON.stringify({ courseId }),
    });
  },

  createCartCheckoutSession: async (courseIds: string[]) => {
    return apiRequest('/stripe/create-cart-checkout-session', {
      method: 'POST',
      body: JSON.stringify({ courseIds }),
    });
  },

  getPaymentStatus: async (sessionId: string) => {
    return apiRequest(`/stripe/payment-status/${sessionId}`);
  },

  forceEnrollment: async (sessionId: string) => {
    return apiRequest('/stripe/force-enrollment', {
      method: 'POST',
      body: JSON.stringify({ sessionId }),
    });
  },
};

// Reports API
export const reportsAPI = {
  getOverview: async (days: number = 30) => {
    return apiRequest(`/reports/overview?days=${days}`);
  },
  
  getRevenue: async (startDate?: string, endDate?: string) => {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    return apiRequest(`/reports/revenue?${params.toString()}`);
  },
  
  getStudents: async () => {
    return apiRequest('/reports/students');
  },
  
  getCourses: async () => {
    return apiRequest('/reports/courses');
  },
};

// Users API
export const usersAPI = {
  getAll: async () => {
    return apiRequest('/users');
  },

  getById: async (id: string) => {
    return apiRequest(`/users/${id}`);
  },

  create: async (userData: { name: string; email: string; role: string; password: string }) => {
    return apiRequest('/users', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  },

  update: async (id: string, userData: Partial<{ name: string; email: string; role: string; status: string }>) => {
    return apiRequest(`/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(userData),
    });
  },

  delete: async (id: string) => {
    return apiRequest(`/users/${id}`, {
      method: 'DELETE',
    });
  },

  updateStatus: async (id: string, status: string) => {
    return apiRequest(`/users/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  },

  resetPasswordTemp: async (id: string) => {
    return apiRequest(`/users/${id}/reset-password-temp`, {
      method: 'POST',
    });
  },
};
