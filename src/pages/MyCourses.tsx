import React, { useEffect, useState } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { BookOpen, Download, Play, Award, Clock, CheckCircle, AlertCircle, Lock } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { useCourseStore } from '../store/courseStore';
import { generateCertificatePDF } from '../utils/certificateGenerator';

export const MyCourses: React.FC = () => {
  const { user } = useAuthStore();
  const { getPurchasedCourses, progress } = useCourseStore();
  const location = useLocation();
  const [notification, setNotification] = useState<string | null>(null);
  const [generatingCertificate, setGeneratingCertificate] = useState<string | null>(null);
  
  useEffect(() => {
    if (location.state?.message) {
      setNotification(location.state.message);
      // Limpar a mensagem após 5 segundos
      const timer = setTimeout(() => setNotification(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [location]);
  
  if (!user) {
    return null;
  }
  
  const purchasedCourses = getPurchasedCourses(user.id);
  const userProgress = progress.filter(p => p.userId === user.id);
  
  const getCourseProgress = (courseId: string) => {
    return userProgress.find(p => p.courseId === courseId);
  };
  
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(price);
  };
  
  const handleDownloadCertificate = async (course: any) => {
    const courseProgress = getCourseProgress(course.id);
    const isCompleted = courseProgress?.completionPercentage === 100;
    
    if (!isCompleted) {
      alert('Você precisa concluir 100% do curso para baixar o certificado.');
      return;
    }

    setGeneratingCertificate(course.id);
    try {
      await generateCertificatePDF({
        studentName: user.name,
        courseName: course.title,
        courseDuration: course.duration,
        completionDate: new Date().toLocaleDateString('pt-BR'),
        instructor: course.instructor,
      });
    } catch (error) {
      console.error('Erro ao gerar certificado:', error);
      alert('Erro ao gerar certificado. Tente novamente.');
    } finally {
      setGeneratingCertificate(null);
    }
  };
  
  if (purchasedCourses.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center">
          <BookOpen className="mx-auto h-24 w-24 text-gray-400 mb-6" />
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Você ainda não possui cursos</h2>
          <p className="text-gray-600 mb-8">
            Explore nosso catálogo e comece sua jornada de aprendizado
          </p>
          <Link
            to="/courses"
            className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            Explorar Cursos
            <BookOpen className="ml-2 h-4 w-4" />
          </Link>
        </div>
      </div>
    );
  }
  
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Notificação */}
      {notification && (
        <div className="mb-8 bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center">
            <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
            <p className="text-green-800">{notification}</p>
          </div>
        </div>
      )}
      
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
          Meus Cursos
        </h1>
        <div className="flex items-center space-x-6 text-sm text-gray-600">
          <span>{purchasedCourses.length} curso{purchasedCourses.length !== 1 ? 's' : ''} adquirido{purchasedCourses.length !== 1 ? 's' : ''}</span>
          <span>•</span>
          <span>{userProgress.filter(p => p.completionPercentage === 100).length} concluído{userProgress.filter(p => p.completionPercentage === 100).length !== 1 ? 's' : ''}</span>
        </div>
      </div>
      
      {/* Lista de Cursos */}
      <div className="space-y-6">
        {purchasedCourses.map((course) => {
          const courseProgress = getCourseProgress(course.id);
          const completionPercentage = courseProgress?.completionPercentage || 0;
          const isCompleted = completionPercentage === 100;
          
          return (
            <div key={course.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
              <div className="p-6">
                <div className="flex items-start space-x-6">
                  {/* Imagem do Curso */}
                  <div className="flex-shrink-0">
                    <img
                      src={course.image}
                      alt={course.title}
                      className="w-32 h-20 object-cover rounded-lg"
                    />
                  </div>
                  
                  {/* Informações do Curso */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">
                          {course.title}
                        </h3>
                        <p className="text-gray-600 mb-2">
                          Por {course.instructor}
                        </p>
                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          <span className="flex items-center space-x-1">
                            <Clock className="h-4 w-4" />
                            <span>{course.duration}h</span>
                          </span>
                          <span className="flex items-center space-x-1">
                            <Award className="h-4 w-4" />
                            <span>Certificado</span>
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-3">
                        {isCompleted ? (
                          <div className="flex items-center space-x-1 text-green-600 bg-green-50 px-3 py-1 rounded-full text-sm font-medium">
                            <CheckCircle className="h-4 w-4" />
                            <span>Concluído</span>
                          </div>
                        ) : (
                          <div className="flex items-center space-x-1 text-blue-600 bg-blue-50 px-3 py-1 rounded-full text-sm font-medium">
                            <AlertCircle className="h-4 w-4" />
                            <span>Em progresso</span>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* Barra de Progresso */}
                    <div className="mb-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-900">
                          Progresso do curso
                        </span>
                        <span className="text-sm text-gray-600">
                          {Math.round(completionPercentage)}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${completionPercentage}%` }}
                        />
                      </div>
                    </div>
                    
                    {/* Ações */}
                    <div className="flex items-center space-x-4">
                      <Link
                        to={`/learn/${course.id}`}
                        className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                      >
                        <Play className="h-4 w-4" />
                        <span>{completionPercentage > 0 ? 'Continuar' : 'Começar'}</span>
                      </Link>
                      
                      {/* Certificado só disponível com 100% */}
                      {isCompleted ? (
                        <button
                          onClick={() => handleDownloadCertificate(course)}
                          disabled={generatingCertificate === course.id}
                          className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors font-medium disabled:opacity-50"
                        >
                          {generatingCertificate === course.id ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                              <span>Gerando...</span>
                            </>
                          ) : (
                            <>
                              <Download className="h-4 w-4" />
                              <span>Baixar Certificado</span>
                            </>
                          )}
                        </button>
                      ) : (
                        <div className="flex items-center space-x-2 bg-gray-100 text-gray-500 px-4 py-2 rounded-lg font-medium">
                          <Lock className="h-4 w-4" />
                          <span>Certificado Bloqueado</span>
                        </div>
                      )}
                      
                      <Link
                        to={`/courses/${course.id}`}
                        className="text-gray-600 hover:text-blue-600 transition-colors text-sm font-medium"
                      >
                        Ver detalhes
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};