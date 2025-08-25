import { create } from 'zustand';
import { authAPI } from '../lib/api';

interface User {
  id: string;
  email: string;
  name: string;
  role: 'student' | 'admin' | 'instructor';
  avatar_url?: string;
  created_at: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  loginWithGoogle: (email: string, name: string, picture?: string) => Promise<boolean>;
  loginWithGitHub: (email: string, name: string, picture?: string) => Promise<boolean>;
  register: (email: string, password: string, name: string, role: 'student') => Promise<boolean>;
  logout: () => Promise<void>;
  getCurrentUser: () => Promise<User | null>;
  updateProfile: (data: Partial<User>) => Promise<boolean>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isAuthenticated: false,
  loading: false,
  
  login: async (email: string, password: string) => {
    console.log('🔐 Tentando login:', { email });
    console.log('🔍 Estado antes do login:', { user: get().user, isAuthenticated: get().isAuthenticated });
    set({ loading: true });
    
    try {
      console.log('📡 Chamando authAPI.login...');
      const response = await authAPI.login(email, password);
      console.log('✅ Login bem-sucedido:', response);
      
      set({ 
        user: response.user, 
        isAuthenticated: true,
        loading: false 
      });
      
      console.log('🔍 Estado após login:', { user: get().user, isAuthenticated: get().isAuthenticated });
      return true;
    } catch (error) {
      console.error('❌ Erro no login:', error);
      console.error('❌ Stack trace:', error.stack);
      set({ loading: false });
      
      // Re-throw para que o componente possa tratar o erro
      throw error;
    }
  },
  
  loginWithGoogle: async (email: string, name: string, picture?: string) => {
    console.log('🔐 Tentando login com Google:', { email, name });
    console.log('🔍 Estado antes do login Google:', { user: get().user, isAuthenticated: get().isAuthenticated });
    set({ loading: true });
    
    try {
      console.log('📡 Chamando authAPI.loginWithGoogle...');
      const response = await authAPI.loginWithGoogle(email, name, picture);
      console.log('✅ Login Google bem-sucedido:', response);
      
      set({ 
        user: response.user, 
        isAuthenticated: true,
        loading: false 
      });
      
      console.log('🔍 Estado após login Google:', { user: get().user, isAuthenticated: get().isAuthenticated });
      return true;
    } catch (error) {
      console.error('❌ Erro no login Google:', error);
      console.error('❌ Stack trace:', error.stack);
      set({ loading: false });
      
      throw error;
    }
  },
  
  loginWithGitHub: async (email: string, name: string, picture?: string) => {
    console.log('🔐 Tentando login com GitHub:', { email, name });
    console.log('🔍 Estado antes do login GitHub:', { user: get().user, isAuthenticated: get().isAuthenticated });
    set({ loading: true });
    
    try {
      console.log('📡 Chamando authAPI.loginWithGitHub...');
      const response = await authAPI.loginWithGitHub(email, name, picture);
      console.log('✅ Login GitHub bem-sucedido:', response);
      
      set({ 
        user: response.user, 
        isAuthenticated: true,
        loading: false 
      });
      
      console.log('🔍 Estado após login GitHub:', { user: get().user, isAuthenticated: get().isAuthenticated });
      return true;
    } catch (error) {
      console.error('❌ Erro no login GitHub:', error);
      console.error('❌ Stack trace:', error.stack);
      set({ loading: false });
      
      throw error;
    }
  },
  
  register: async (email: string, password: string, name: string, role: 'student') => {
    console.log('📝 Tentando registro:', { email, name, role });
    set({ loading: true });
    
    try {
      const response = await authAPI.register(email, password, name, role);
      console.log('✅ Registro bem-sucedido:', response);
      
      set({ 
        user: response.user, 
        isAuthenticated: true,
        loading: false 
      });
      
      return true;
    } catch (error) {
      console.error('❌ Erro no registro:', error);
      set({ loading: false });
      
      // Re-throw para que o componente possa tratar o erro
      throw error;
    }
  },
  
  logout: async () => {
    console.log('🚪 Fazendo logout');
    try {
      authAPI.logout();
      set({ user: null, isAuthenticated: false });
      console.log('✅ Logout realizado');
    } catch (error) {
      console.error('❌ Erro ao fazer logout:', error);
    }
  },
  
  getCurrentUser: async () => {
    console.log('👤 Obtendo usuário atual');
    try {
      const response = await authAPI.getCurrentUser();
      console.log('✅ Usuário atual obtido:', response);
      
      set({ user: response.user, isAuthenticated: true });
      return response.user;
    } catch (error) {
      console.error('❌ Erro ao obter usuário atual:', error);
      set({ user: null, isAuthenticated: false });
      return null;
    }
  },
  
  updateProfile: async (data: Partial<User>) => {
    const { user } = get();
    if (!user) return false;

    console.log('📝 Atualizando perfil:', data);
    try {
      const response = await authAPI.updateProfile({
        name: data.name || user.name,
        avatar_url: data.avatar_url
      });

      set({ user: response.user });
      console.log('✅ Perfil atualizado:', response);
      return true;
    } catch (error) {
      console.error('❌ Erro ao atualizar perfil:', error);
      return false;
    }
  },
}));