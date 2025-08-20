import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { CheckCircle, Download, Play, ArrowRight, Loader } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { stripeAPI } from '../lib/api';

export const PaymentSuccess: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [paymentData, setPaymentData] = useState<any>(null);

  const sessionId = searchParams.get('session_id');
  const courseId = searchParams.get('course_id');

  useEffect(() => {
    const fetchPaymentStatus = async () => {
      if (!sessionId || !user) {
        setError('Informações do pagamento incompletas');
        setLoading(false);
        return;
      }

      try {
        const paymentStatus = await stripeAPI.getPaymentStatus(sessionId);
        setPaymentData(paymentStatus);
      } catch (err) {
        console.error('Erro ao buscar status do pagamento:', err);
        setError('Erro ao buscar informações do pagamento.');
      } finally {
        setLoading(false);
      }
    };

    fetchPaymentStatus();
  }, [sessionId, user]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader className="h-12 w-12 text-blue-600 animate-spin mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Verificando seu pagamento...
          </h2>
          <p className="text-gray-600">
            Aguarde enquanto confirmamos sua compra
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md mx-auto text-center">
          <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Ops! Algo deu errado
            </h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <div className="space-y-3">
              <Link
                to="/courses"
                className="block w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Voltar aos Cursos
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!paymentData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Processando...
          </h2>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Success Header */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            🎉 Pagamento Confirmado!
          </h1>
          <p className="text-xl text-gray-600">
            Parabéns! Seu acesso ao curso foi liberado
          </p>
        </div>

        {/* Payment Details Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-8">
          <div className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Detalhes do Pagamento
            </h2>
            
            <div className="bg-gray-50 p-4 rounded-lg mb-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Status do Pagamento:</span>
                  <span className="ml-2 font-semibold text-green-600">
                    {paymentData.paymentStatus === 'paid' ? 'Pago' : paymentData.paymentStatus}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">Valor:</span>
                  <span className="ml-2 font-semibold text-gray-900">
                    {new Intl.NumberFormat('pt-BR', {
                      style: 'currency',
                      currency: 'BRL',
                    }).format(paymentData.amount)}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">Email:</span>
                  <span className="ml-2 font-medium text-gray-900">{paymentData.customerEmail}</span>
                </div>
                <div>
                  <span className="text-gray-600">ID da Sessão:</span>
                  <span className="ml-2 font-mono text-xs text-gray-600">{sessionId}</span>
                </div>
              </div>
            </div>
            
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="font-semibold text-blue-900 mb-2">✅ Curso Liberado</h3>
              <p className="text-blue-800 text-sm">
                Seu acesso ao <strong>Curso Teste - Marketing</strong> foi ativado automaticamente. 
                Você já pode começar a estudar!
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <Link
            to="/my-courses"
            className="flex items-center justify-center space-x-2 bg-blue-600 text-white py-4 px-6 rounded-xl hover:bg-blue-700 transition-colors font-semibold"
          >
            <Play className="w-5 h-5" />
            <span>Acessar Cursos</span>
          </Link>
          
          <Link
            to="/my-courses"
            className="flex items-center justify-center space-x-2 border border-gray-300 text-gray-700 py-4 px-6 rounded-xl hover:bg-gray-50 transition-colors font-semibold"
          >
            <Download className="w-5 h-5" />
            <span>Meus Cursos</span>
          </Link>
        </div>

        {/* Email Confirmation Notice */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mb-8">
          <div className="flex items-start space-x-3">
            <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
              </svg>
            </div>
            <div>
              <h3 className="font-semibold text-blue-900 mb-1">
                📧 Confirmação por Email
              </h3>
              <p className="text-blue-800 text-sm">
                Enviamos um email de confirmação com todos os detalhes da sua compra e 
                instruções para acessar o curso. Verifique sua caixa de entrada e spam.
              </p>
            </div>
          </div>
        </div>

        {/* Next Steps */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            🚀 Próximos Passos
          </h3>
          <div className="space-y-3">
            <div className="flex items-center space-x-3">
              <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                <span className="text-green-600 text-sm font-bold">1</span>
              </div>
              <span className="text-gray-700">Acesse seu curso e comece a primeira aula</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                <span className="text-green-600 text-sm font-bold">2</span>
              </div>
              <span className="text-gray-700">Complete seu perfil na plataforma</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                <span className="text-green-600 text-sm font-bold">3</span>
              </div>
              <span className="text-gray-700">Participe da comunidade e tire suas dúvidas</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                <span className="text-green-600 text-sm font-bold">4</span>
              </div>
              <span className="text-gray-700">Complete 100% para receber seu certificado</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            to="/my-courses"
            className="inline-flex items-center justify-center px-8 py-4 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
          >
            <span>Acessar Meus Cursos</span>
            <ArrowRight className="ml-2 h-5 w-5" />
          </Link>
          
          <Link
            to="/courses"
            className="inline-flex items-center justify-center px-8 py-4 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors"
          >
            <span>Explorar Mais Cursos</span>
          </Link>
        </div>

        {/* Support Section */}
        <div className="mt-12 text-center">
          <div className="bg-blue-50 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Precisa de Ajuda?
            </h3>
            <p className="text-gray-600 mb-4">
              Nossa equipe de suporte está aqui para ajudar você a aproveitar ao máximo seu curso.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="mailto:suporte@eduplatform.com"
                className="text-blue-600 hover:text-blue-700 font-medium"
              >
                📧 suporte@eduplatform.com
              </a>
              <a
                href="tel:+5511999999999"
                className="text-blue-600 hover:text-blue-700 font-medium"
              >
                📞 (11) 99999-9999
              </a>
            </div>
          </div>
        </div>

        {/* Continue Learning */}
        <div className="mt-12 text-center">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Continue Aprendendo
          </h3>
          <Link
            to="/courses"
            className="inline-flex items-center space-x-2 text-blue-600 hover:text-blue-700 font-medium"
          >
            <span>Explorar mais cursos</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
};