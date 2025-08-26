import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { GraduationCap, Mail, ArrowLeft, CheckCircle, AlertCircle } from 'lucide-react';
import { authAPI } from '../lib/api';

export const ForgotPassword: React.FC = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [resetInfo, setResetInfo] = useState<{
    resetUrl?: string;
    token?: string;
    expiresAt?: string;
  } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    setResetInfo(null);

    try {
      const response = await authAPI.forgotPassword(email);
      
      if (response.resetUrl) {
        setSuccess(true);
        setResetInfo({
          resetUrl: response.resetUrl,
          token: response.token,
          expiresAt: response.expiresAt
        });
      } else {
        setSuccess(true);
      }
    } catch (err: any) {
      setError(err.message || 'Erro ao processar solicitação');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    // Você pode adicionar uma notificação de "copiado" aqui
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
          Esqueceu sua senha?
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Digite seu email e enviaremos um link para resetar sua senha
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {!success ? (
            <form className="space-y-6" onSubmit={handleSubmit}>
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-center">
                    <AlertCircle className="h-5 w-5 text-red-600 mr-2" />
                    <p className="text-red-800 text-sm">{error}</p>
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
                <button
                  type="submit"
                  disabled={loading}
                  className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {loading ? 'Enviando...' : 'Enviar link de reset'}
                </button>
              </div>

              <div className="text-center">
                <Link
                  to="/login"
                  className="inline-flex items-center text-sm text-blue-600 hover:text-blue-500"
                >
                  <ArrowLeft className="h-4 w-4 mr-1" />
                  Voltar para o login
                </Link>
              </div>
            </form>
          ) : (
            <div className="space-y-6">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                  <p className="text-green-800 text-sm font-medium">
                    Link de reset enviado com sucesso!
                  </p>
                </div>
              </div>

              <div className="text-center space-y-4">
                <div className="flex items-center justify-center">
                  <Mail className="h-12 w-12 text-blue-600" />
                </div>
                
                <div>
                  <h3 className="text-lg font-medium text-gray-900">
                    Verifique seu email
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Enviamos um link para <strong>{email}</strong> para resetar sua senha.
                  </p>
                </div>



                <div className="pt-4">
                  <Link
                    to="/login"
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Voltar para o login
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
