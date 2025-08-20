import React from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { Star, Clock, Users, Award, Play, FileText, HelpCircle, ShoppingCart, CheckCircle, CreditCard } from 'lucide-react';
import { useCourseStore } from '../store/courseStore';
import { useCartStore } from '../store/cartStore';
import { useAuthStore } from '../store/authStore';
import { paymentService } from '../services/paymentService';

export const CourseDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { getCourseById, getPurchasedCourses } = useCourseStore();
  const { addToCart, items } = useCartStore();
  const { user, isAuthenticated } = useAuthStore();
  
  if (!id) {
    return <Navigate to="/courses" replace />;
  }
  
  const course = getCourseById(id);
  
  if (!course) {
    return <Navigate to="/courses" replace />;
  }
  
  const isInCart = items.some(item => item.course.id === course.id);
  const purchasedCourses = user ? getPurchasedCourses(user.id) : [];
  const isPurchased = purchasedCourses.some(c => c.id === course.id);
  const canAddToCart = isAuthenticated && user?.role === 'student' && !isInCart && !isPurchased;
  
  const handleAddToCart = () => {
    if (canAddToCart) {
      addToCart(course);
    }
  };

  const handleBuyNow = async () => {
    if (!isAuthenticated || !user) {
      // Redirecionar para login
      window.location.href = '/login';
      return;
    }

    if (user.role !== 'student') {
      alert('Apenas alunos podem comprar cursos');
      return;
    }

    if (isPurchased) {
      // Redirecionar para o curso
      window.location.href = `/learn/${course.id}`;
      return;
    }

    try {
      // Criar pagamento
      const paymentResponse = await paymentService.createPayment(
        course,
        user.id,
        user.email,
        user.name
      );

      // Redirecionar para a página de pagamento
      window.location.href = paymentResponse.paymentUrl;
    } catch (error) {
      console.error('Erro ao processar pagamento:', error);
      alert('Erro ao processar pagamento. Tente novamente.');
    }
  };
  
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(price);
  };
  
  const getLevelColor = (level: string) => {
    switch (level) {
      case 'beginner':
        return 'bg-green-100 text-green-800';
      case 'intermediate':
        return 'bg-yellow-100 text-yellow-800';
      case 'advanced':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  
  const getLevelText = (level: string) => {
    switch (level) {
      case 'beginner':
        return 'Iniciante';
      case 'intermediate':
        return 'Intermediário';
      case 'advanced':
        return 'Avançado';
      default:
        return level;
    }
  };
  
  const courseContent = [
    { type: 'video', title: 'Introdução ao Curso', duration: 15 },
    { type: 'video', title: 'Conceitos Fundamentais', duration: 25 },
    { type: 'pdf', title: 'Material de Apoio - Capítulo 1', duration: null },
    { type: 'video', title: 'Projeto Prático 1', duration: 45 },
    { type: 'quiz', title: 'Quiz - Teste seus Conhecimentos', duration: null },
    { type: 'video', title: 'Conceitos Avançados', duration: 35 },
    { type: 'pdf', title: 'Referências e Links Úteis', duration: null },
    { type: 'video', title: 'Projeto Final', duration: 60 },
    { type: 'quiz', title: 'Avaliação Final', duration: null },
  ];
  
  const getContentIcon = (type: string) => {
    switch (type) {
      case 'video':
        return <Play className="h-4 w-4 text-blue-600" />;
      case 'pdf':
        return <FileText className="h-4 w-4 text-red-600" />;
      case 'quiz':
        return <HelpCircle className="h-4 w-4 text-green-600" />;
      default:
        return <FileText className="h-4 w-4 text-gray-600" />;
    }
  };
  
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Conteúdo Principal */}
        <div className="lg:col-span-2 space-y-8">
          {/* Header do Curso */}
          <div>
            <div className="flex items-center space-x-3 mb-4">
              <span className="text-sm text-blue-600 font-medium uppercase tracking-wide">
                {course.category}
              </span>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getLevelColor(course.level)}`}>
                {getLevelText(course.level)}
              </span>
            </div>
            
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              {course.title}
            </h1>
            
            <p className="text-lg text-gray-600 mb-6">
              {course.description}
            </p>
            
            <div className="flex flex-wrap items-center gap-6 text-sm text-gray-600">
              <div className="flex items-center space-x-1">
                <Clock className="h-4 w-4" />
                <span>{course.duration} horas</span>
              </div>
              
              <div className="flex items-center space-x-1">
                <Users className="h-4 w-4" />
                <span>{course.studentsCount} alunos</span>
              </div>
              
              <div className="flex items-center space-x-1">
                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                <span>{course.rating} ({Math.floor(course.studentsCount * 0.7)} avaliações)</span>
              </div>
              
              <div className="flex items-center space-x-1">
                <Award className="h-4 w-4" />
                <span>Certificado incluído</span>
              </div>
            </div>
          </div>
          
          {/* Imagem do Curso */}
          <div className="relative">
            <img
              src={course.image}
              alt={course.title}
              className="w-full h-64 md:h-80 object-cover rounded-xl"
            />
            <div className="absolute inset-0 bg-black bg-opacity-40 rounded-xl flex items-center justify-center">
              <button className="w-16 h-16 bg-white bg-opacity-90 rounded-full flex items-center justify-center hover:bg-opacity-100 transition-colors group">
                <Play className="h-6 w-6 text-gray-900 ml-1 group-hover:scale-110 transition-transform" />
              </button>
            </div>
          </div>
          
          {/* Sobre o Instrutor */}
          <div className="bg-gray-50 p-6 rounded-xl">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Sobre o Instrutor</h3>
            <div className="flex items-start space-x-4">
              <img
                src="https://images.pexels.com/photos/1181686/pexels-photo-1181686.jpeg?auto=compress&cs=tinysrgb&w=150"
                alt={course.instructor}
                className="w-16 h-16 rounded-full object-cover"
              />
              <div>
                <h4 className="font-semibold text-gray-900 mb-1">{course.instructor}</h4>
                <p className="text-sm text-gray-600 mb-2">Especialista em {course.category}</p>
                <p className="text-sm text-gray-600">
                  Profissional com mais de 10 anos de experiência na área, tendo trabalhado em grandes empresas 
                  e ajudado milhares de alunos a desenvolverem suas habilidades.
                </p>
              </div>
            </div>
          </div>
          
          {/* Conteúdo do Curso */}
          <div>
            <h3 className="text-xl font-semibold text-gray-900 mb-6">Conteúdo do Curso</h3>
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
              {courseContent.map((content, index) => (
                <div key={index} className="border-b border-gray-200 last:border-b-0">
                  <div className="p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        {getContentIcon(content.type)}
                        <span className="font-medium text-gray-900">{content.title}</span>
                      </div>
                      {content.duration && (
                        <span className="text-sm text-gray-500">{content.duration} min</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        {/* Sidebar */}
        <div className="lg:col-span-1">
          <div className="bg-white border border-gray-200 rounded-xl p-6 sticky top-24">
            <div className="text-center mb-6">
              <div className="text-3xl font-bold text-gray-900 mb-2">
                {formatPrice(course.price)}
              </div>
              <p className="text-sm text-gray-600">Acesso vitalício</p>
            </div>
            
            {isPurchased ? (
              <div className="space-y-4">
                <div className="flex items-center justify-center space-x-2 text-green-600 bg-green-50 py-3 px-4 rounded-lg">
                  <CheckCircle className="h-5 w-5" />
                  <span className="font-medium">Você possui este curso</span>
                </div>
                <button 
                  onClick={() => window.location.href = `/learn/${course.id}`}
                  className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  Acessar Curso
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Comprar Agora */}
                <button
                  onClick={handleBuyNow}
                  className="w-full bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 transition-colors font-medium flex items-center justify-center space-x-2"
                >
                  <CreditCard className="h-4 w-4" />
                  <span>Comprar Agora</span>
                </button>

                {/* Adicionar ao Carrinho */}
                {canAddToCart ? (
                  <button
                    onClick={handleAddToCart}
                    className="w-full border border-gray-300 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-50 transition-colors font-medium flex items-center justify-center space-x-2"
                  >
                    <ShoppingCart className="h-4 w-4" />
                    <span>Adicionar ao Carrinho</span>
                  </button>
                ) : isInCart ? (
                  <div className="text-center">
                    <div className="flex items-center justify-center space-x-2 text-green-600 bg-green-50 py-3 px-4 rounded-lg mb-4">
                      <CheckCircle className="h-5 w-5" />
                      <span className="font-medium">No carrinho</span>
                    </div>
                    <button 
                      onClick={() => window.location.href = '/cart'}
                      className="w-full bg-orange-600 text-white py-3 px-4 rounded-lg hover:bg-orange-700 transition-colors font-medium"
                    >
                      Finalizar Compra
                    </button>
                  </div>
                ) : !isAuthenticated ? (
                  <div className="text-center text-gray-600">
                    <p className="mb-4">Faça login para comprar este curso</p>
                    <button 
                      onClick={() => window.location.href = '/login'}
                      className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                    >
                      Fazer Login
                    </button>
                  </div>
                ) : null}
              </div>
            )}
            
            <div className="mt-6 pt-6 border-t border-gray-200 space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Nível:</span>
                <span className="font-medium text-gray-900">{getLevelText(course.level)}</span>
              </div>
              
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Duração:</span>
                <span className="font-medium text-gray-900">{course.duration} horas</span>
              </div>
              
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Certificado:</span>
                <span className="font-medium text-gray-900">Incluído</span>
              </div>
              
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Acesso:</span>
                <span className="font-medium text-gray-900">Vitalício</span>
              </div>
              
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Suporte:</span>
                <span className="font-medium text-gray-900">Incluído</span>
              </div>
            </div>

            {/* Garantia */}
            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="flex items-center space-x-2 text-sm text-gray-600 mb-2">
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                </svg>
                <span>Pagamento 100% seguro</span>
              </div>
              <div className="flex items-center space-x-2 text-sm text-gray-600 mb-2">
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>Acesso imediato após pagamento</span>
              </div>
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Garantia de 30 dias</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};