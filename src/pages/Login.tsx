import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { GraduationCap, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { useAuthStore } from '../store/authStore';

export const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { login } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  
  const from = location.state?.from?.pathname || '/';
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      const success = await login(email, password);
      if (success) {
        navigate(from, { replace: true });
      } else {
        setError('Email ou senha inválidos');
      }
    } catch (err: any) {
      // Melhorar mensagens de erro para dar mais direção ao usuário
      if (err.message) {
        if (err.message.includes('Credenciais inválidas')) {
          setError('Email ou senha incorretos');
        } else if (err.message.includes('usuário não encontrado')) {
          setError('Usuário não encontrado. Verifique o email ou registre-se.');
        } else if (err.message.includes('senha incorreta')) {
          setError('Senha incorreta. Verifique sua senha.');
        } else if (err.message.includes('conta desativada')) {
          setError('Conta desativada. Entre em contato com o suporte.');
        } else if (err.message.includes('muitas tentativas')) {
          setError('Muitas tentativas de login. Aguarde alguns minutos.');
        } else if (err.message.includes('rede') || err.message.includes('conexão')) {
          setError('Erro de conexão. Verifique sua internet e tente novamente.');
        } else if (err.message.includes('servidor')) {
          setError('Erro no servidor. Tente novamente em alguns minutos.');
        } else {
          setError(`Erro: ${err.message}`);
        }
      } else {
        setError('Erro inesperado. Tente novamente.');
      }
    } finally {
      setLoading(false);
    }
  };
  

  
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="bg-blue-600 p-3 rounded-xl">
            <GraduationCap className="h-8 w-8 text-white" />
          </div>
        </div>
        <h2 className="mt-6 text-center text-3xl font-bold text-gray-900">
          Faça login em sua conta
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Ou{' '}
          <Link
            to="/register"
            className="font-medium text-blue-600 hover:text-blue-500"
          >
            crie uma nova conta
          </Link>
        </p>
      </div>
      
      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">

          
          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 space-y-3">
                <div className="flex items-center">
                  <AlertCircle className="h-5 w-5 text-red-600 mr-2" />
                  <p className="text-red-800 text-sm">{error}</p>
                </div>
                                 {error.includes('incorretos') && (
                   <div className="bg-yellow-50 border border-yellow-200 rounded p-3">
                     <p className="text-yellow-800 text-sm">
                       <strong>🔍 Verifique:</strong>
                     </p>
                     <ul className="text-yellow-800 text-sm mt-2 space-y-1 list-disc list-inside">
                       <li>Se o email está escrito corretamente</li>
                       <li>Se a senha está correta (incluindo maiúsculas/minúsculas)</li>
                       <li>Se o CAPS LOCK está ativado</li>
                     </ul>
                   </div>
                 )}
                 
                 {error.includes('não encontrado') && (
                   <div className="bg-blue-50 border border-blue-200 rounded p-3">
                     <p className="text-blue-800 text-sm">
                       <strong>📝 Ações possíveis:</strong>
                     </p>
                     <ul className="text-blue-800 text-sm mt-2 space-y-1 list-disc list-inside">
                       <li>Verifique se o email está correto</li>
                       <li>Crie uma nova conta</li>
                     </ul>
                     <div className="mt-3 pt-2 border-t border-blue-200">
                       <Link 
                         to="/register" 
                         className="inline-flex items-center px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
                       >
                         📝 Criar nova conta
                       </Link>
                     </div>
                   </div>
                 )}
                 
                 {/* Dica geral para qualquer erro */}
                 <div className="bg-gray-50 border border-gray-200 rounded p-3">
                   <p className="text-gray-700 text-sm">
                     <strong>💡 Precisa de ajuda?</strong>
                   </p>
                   <div className="mt-2 space-y-2">
                     <p className="text-gray-600 text-sm">
                       • Verifique se digitou o email e senha corretos
                     </p>
                     <p className="text-gray-600 text-sm">
                       • Se não tem conta, <Link to="/register" className="text-blue-600 hover:text-blue-800 underline">registre-se aqui</Link>
                     </p>
                   </div>
                 </div>
              </div>
            )}
            
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email
              </label>
              <div className="mt-1">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="seu@email.com"
                />
              </div>
            </div>
            
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Senha
              </label>
              <div className="mt-1 relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 pr-10 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Sua senha"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-gray-400" />
                  ) : (
                    <Eye className="h-4 w-4 text-gray-400" />
                  )}
                </button>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900">
                  Lembrar de mim
                </label>
              </div>
              
                              <div className="text-sm">
                  <Link to="/forgot-password" className="font-medium text-blue-600 hover:text-blue-500">
                    Esqueceu sua senha?
                  </Link>
                </div>
            </div>
            
            <div>
              <button
                type="submit"
                disabled={loading}
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? 'Entrando...' : 'Entrar'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};