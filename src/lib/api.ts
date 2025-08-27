const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

// API principal
export const api = {
  get: async (endpoint: string) => {
    return apiRequest(endpoint);
  },
  
  post: async (endpoint: string, data?: any) => {
    return apiRequest(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  },
  
  put: async (endpoint: string, data?: any) => {
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
  return localStorage.getItem('auth_token');
};

// Função para fazer requisições autenticadas
const apiRequest = async (endpoint: string, options: RequestInit = {}) => {
  const token = getToken();
  
  const config: RequestInit = {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
  };

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
    const response = await apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    
    if (response.token) {
      localStorage.setItem('auth_token', response.token);
    }
    
    return response;
  },

  loginWithGoogle: async (email: string, name: string, picture?: string) => {
    const response = await apiRequest('/auth/google', {
      method: 'POST',
      body: JSON.stringify({ email, name, picture }),
    });
    
    if (response.token) {
      localStorage.setItem('auth_token', response.token);
    }
    
    return response;
  },

  loginWithGitHub: async (email: string, name: string, picture?: string) => {
    const response = await apiRequest('/auth/github', {
      method: 'POST',
      body: JSON.stringify({ email, name, picture }),
    });
    
    if (response.token) {
      localStorage.setItem('auth_token', response.token);
    }
    
    return response;
  },

  register: async (email: string, password: string, name: string, role: string = 'student') => {
    const response = await apiRequest('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, name, role }),
    });
    
    if (response.token) {
      localStorage.setItem('auth_token', response.token);
    }
    
    return response;
  },

  getCurrentUser: async () => {
    return apiRequest('/auth/me');
  },

  updateProfile: async (data: { name: string; avatar_url?: string }) => {
    return apiRequest('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  logout: () => {
    localStorage.removeItem('auth_token');
  },
};

// Courses API
export const coursesAPI = {
  getAll: async (params?: { category?: string; level?: string; search?: string; sort?: string; order?: string }) => {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value) searchParams.append(key, value);
      });
    }
    
    const queryString = searchParams.toString();
    return apiRequest(`/courses${queryString ? `?${queryString}` : ''}`);
  },

  getById: async (id: string) => {
    return apiRequest(`/courses/${id}`);
  },

  getModules: async (id: string) => {
    return apiRequest(`/courses/${id}/modules`);
  },

  create: async (courseData: any) => {
    return apiRequest('/courses', {
      method: 'POST',
      body: JSON.stringify(courseData),
    });
  },

  update: async (id: string, courseData: any) => {
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
};

// Categories API
export const categoriesAPI = {
  getAll: async () => {
    return apiRequest('/categories');
  },

  create: async (categoryData: any) => {
    return apiRequest('/categories', {
      method: 'POST',
      body: JSON.stringify(categoryData),
    });
  },

  update: async (id: string, categoryData: any) => {
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
};

// Stripe API
export const stripeAPI = {
  createCheckoutSession: async (courseId: string) => {
    return apiRequest('/stripe/create-checkout-session', {
      method: 'POST',
      body: JSON.stringify({ courseId }),
    });
  },

  getPaymentStatus: async (sessionId: string) => {
    return apiRequest(`/stripe/payment-status/${sessionId}`);
  },
};