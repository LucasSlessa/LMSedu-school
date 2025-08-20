import React, { useState } from 'react';
import { useAuthStore } from '../../store/authStore';
import { Eye, EyeOff, Mail, Lock, User, AlertCircle, CheckCircle, Github } from 'lucide-react';

interface AuthFormProps {
  mode: 'login' | 'signup';
  onSuccess?: () => void;
  onModeChange?: (mode: 'login' | 'signup') => void;
}

export const AuthForm: React.FC<AuthFormProps> = ({ mode, onSuccess, onModeChange }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'error' | 'success'; text: string } | null>(null);
  const { login, register, loginWithGoogle, loginWithGitHub } = useAuthStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('🚀 Iniciando submissão do formulário:', { mode, email, name });
    console.log('🔍 Estado atual:', { email, password, name, loading });
    setLoading(true);
    setMessage(null);

    try {
      if (mode === 'signup') {
        console.log('📝 Tentando registro...');
        const success = await register(email, password, name, 'student');
        console.log('📝 Resultado do registro:', success);
        
        if (success) {
          setMessage({
            type: 'success',
            text: 'Conta criada com sucesso! Redirecionando...',
          });
          setTimeout(() => {
            onSuccess?.();
          }, 1500);
        } else {
          throw new Error('Falha ao criar conta');
        }
      } else {
        console.log('🔐 Tentando login...');
        console.log('📡 Fazendo requisição para:', `${import.meta.env.VITE_API_URL || 'http://localhost:3001/api'}/auth/login`);
        const success = await login(email, password);
        console.log('🔐 Resultado do login:', success);
        
        if (success) {
          setMessage({
            type: 'success',
            text: 'Login realizado com sucesso! Redirecionando...',
          });
          setTimeout(() => {
            onSuccess?.();
          }, 1000);
        } else {
          throw new Error('Email ou senha inválidos');
        }
      }
    } catch (error: any) {
      console.error('❌ Erro no formulário:', error);
      console.error('❌ Stack trace:', error.stack);
      
      if (mode === 'signup' && error.message?.includes('já está em uso')) {
        setMessage({
          type: 'error',
          text: 'Este email já está em uso. Tente fazer login ou use outro email.',
        });
        setTimeout(() => {
          onModeChange?.('login');
        }, 2000);
      } else {
        setMessage({
          type: 'error',
          text: error.message || 'Ocorreu um erro. Tente novamente.',
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setMessage(null);
    
    try {
      // Simular dados do Google
      const mockGoogleUser = {
        email: 'user@gmail.com',
        name: 'Usuário Google',
        picture: 'https://via.placeholder.com/40'
      };
      
      console.log('🔐 Tentando login com Google:', mockGoogleUser);
      const success = await loginWithGoogle(mockGoogleUser.email, mockGoogleUser.name, mockGoogleUser.picture);
      
      if (success) {
        setMessage({
          type: 'success',
          text: 'Login com Google realizado com sucesso! Redirecionando...',
        });
        setTimeout(() => {
          onSuccess?.();
        }, 1000);
      }
    } catch (error: any) {
      console.error('❌ Erro no login Google:', error);
      setMessage({
        type: 'error',
        text: error.message || 'Erro ao fazer login com Google. Tente novamente.',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGitHubLogin = async () => {
    setLoading(true);
    setMessage(null);
    
    try {
      // Simular dados do GitHub
      const mockGitHubUser = {
        email: 'user@github.com',
        name: 'Usuário GitHub',
        picture: 'https://via.placeholder.com/40'
      };
      
      console.log('🔐 Tentando login com GitHub:', mockGitHubUser);
      const success = await loginWithGitHub(mockGitHubUser.email, mockGitHubUser.name, mockGitHubUser.picture);
      
      if (success) {
        setMessage({
          type: 'success',
          text: 'Login com GitHub realizado com sucesso! Redirecionando...',
        });
        setTimeout(() => {
          onSuccess?.();
        }, 1000);
      }
    } catch (error: any) {
      console.error('❌ Erro no login GitHub:', error);
      setMessage({
        type: 'error',
        text: error.message || 'Erro ao fazer login com GitHub. Tente novamente.',
      });
    } finally {
      setLoading(false);
    }
  };

  const fillDemoCredentials = (role: 'admin' | 'student') => {
    if (role === 'admin') {
      setEmail('admin@lms.com');
      setName('Administrador');
    } else {
      setEmail('aluno@lms.com');
      setName('Aluno Demonstração');
    }
    setPassword('123456');
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="bg-white rounded-xl shadow-lg p-8">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-gray-900">
            {mode === 'login' ? 'Bem-vindo de volta' : 'Criar Conta'}
          </h2>
          <p className="text-gray-600 mt-2">
            {mode === 'login' 
              ? 'Faça login para acessar seus cursos' 
              : 'Junte-se a milhares de estudantes'
            }
          </p>
        </div>

        {/* Contas de Demonstração */}
        {mode === 'login' && (
          <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <h3 className="text-sm font-medium text-blue-900 mb-3">🚀 Contas de Demonstração:</h3>
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => fillDemoCredentials('admin')}
                className="w-full text-left text-sm text-blue-700 hover:text-blue-800 px-2 py-1 rounded hover:bg-blue-100 transition-colors"
              >
                👨‍💼 <span className="font-mono">admin@lms.com</span>
              </button>
              <button
                type="button"
                onClick={() => fillDemoCredentials('student')}
                className="w-full text-left text-sm text-blue-700 hover:text-blue-800 px-2 py-1 rounded hover:bg-blue-100 transition-colors"
              >
                👨‍🎓 <span className="font-mono">aluno@lms.com</span>
              </button>
              <div className="mt-3 pt-2 border-t border-blue-200">
                <p className="text-xs text-blue-600">
                  <strong>Senha:</strong> <span className="font-mono">123456</span>
                </p>
              </div>
            </div>
          </div>
        )}

        {message && (
          <div className={`mb-6 p-4 rounded-lg flex items-center space-x-2 ${
            message.type === 'error' 
              ? 'bg-red-50 border border-red-200 text-red-800' 
              : 'bg-green-50 border border-green-200 text-green-800'
          }`}>
            {message.type === 'error' ? (
              <AlertCircle className="h-5 w-5 flex-shrink-0" />
            ) : (
              <CheckCircle className="h-5 w-5 flex-shrink-0" />
            )}
            <span className="text-sm">{message.text}</span>
          </div>
        )}

        {/* Botões de Login Social */}
        <div className="mb-6 space-y-3">
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full flex items-center justify-center space-x-3 bg-white border border-gray-300 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            <span>Continuar com Google</span>
          </button>

          <button
            type="button"
            onClick={handleGitHubLogin}
            disabled={loading}
            className="w-full flex items-center justify-center space-x-3 bg-gray-900 text-white py-3 px-4 rounded-lg hover:bg-gray-800 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Github className="w-5 h-5" />
            <span>Continuar com GitHub</span>
          </button>
        </div>

        <div className="relative mb-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-gray-500">ou continue com email</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {mode === 'signup' && (
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                Nome Completo
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Digite seu nome completo"
                />
              </div>
            </div>
          )}

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Digite seu email"
              />
            </div>
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
              Senha
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Digite sua senha"
                minLength={6}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
            {mode === 'signup' && (
              <p className="text-xs text-gray-500 mt-1">
                A senha deve ter pelo menos 6 caracteres
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
          >
            {loading ? (
              <div className="flex items-center justify-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                <span>{mode === 'login' ? 'Entrando...' : 'Criando conta...'}</span>
              </div>
            ) : (
              mode === 'login' ? 'Entrar' : 'Criar Conta'
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            {mode === 'login' ? "Não tem uma conta? " : "Já tem uma conta? "}
            <button
              onClick={() => onModeChange?.(mode === 'login' ? 'signup' : 'login')}
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              {mode === 'login' ? 'Cadastre-se' : 'Faça login'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};