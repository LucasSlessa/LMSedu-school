import React, { useState, useEffect } from 'react';
import { useParams, Navigate, Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  Play, 
  FileText, 
  HelpCircle, 
  CheckCircle, 
  Lock, 
  Download,
  Award,
  Clock,
  BookOpen,
  RotateCcw,
  XCircle
} from 'lucide-react';
import { useCourseStore } from '../store/courseStore';
import { useAuthStore } from '../store/authStore';
import { generateCertificatePDF } from '../utils/certificateGenerator';

interface CourseModule {
  id: string;
  title: string;
  type: 'video' | 'pdf' | 'quiz';
  content: string;
  duration?: number;
  completed: boolean;
  locked: boolean;
}

export const CourseViewer: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuthStore();
  const { getCourseById, getPurchasedCourses, getUserProgress, updateProgress } = useCourseStore();
  const [activeModule, setActiveModule] = useState<CourseModule | null>(null);
  const [quizAnswers, setQuizAnswers] = useState<{ [key: string]: string }>({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [quizScore, setQuizScore] = useState<number | null>(null);
  const [isGeneratingCertificate, setIsGeneratingCertificate] = useState(false);

  if (!id || !user) {
    return <Navigate to="/courses" replace />;
  }

  const course = getCourseById(id);
  const purchasedCourses = getPurchasedCourses();
  const hasPurchased = purchasedCourses.some(c => c.id === id);
  const userProgress = getUserProgress(id);

  if (!course) {
    return <Navigate to="/courses" replace />;
  }

  if (!hasPurchased) {
    return <Navigate to={`/courses/${id}`} replace />;
  }

  // Função para calcular módulos concluídos baseado no progressPercentage
  const getCompletedModules = (progressPercentage: number, totalModules: number) => {
    if (!progressPercentage || typeof progressPercentage !== 'number' || progressPercentage <= 0) return [];
    const completedCount = Math.floor((progressPercentage / 100) * totalModules);
    return Array.from({ length: totalModules }, (_, i) => (i + 1).toString()).slice(0, completedCount);
  };

  // Módulos do curso (simulados - em produção viriam do banco)
  const courseModules: CourseModule[] = [
    {
      id: '1',
      title: 'Introdução ao Curso',
      type: 'video',
      content: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
      duration: 15,
      completed: userProgress ? getCompletedModules(userProgress.progressPercentage, 8).includes('1') : false,
      locked: false,
    },
    {
      id: '2',
      title: 'Conceitos Fundamentais',
      type: 'video',
      content: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
      duration: 25,
      completed: userProgress ? getCompletedModules(userProgress.progressPercentage, 8).includes('2') : false,
      locked: userProgress ? !getCompletedModules(userProgress.progressPercentage, 8).includes('1') : true,
    },
    {
      id: '3',
      title: 'Material de Apoio - Capítulo 1',
      type: 'pdf',
      content: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
      completed: userProgress ? getCompletedModules(userProgress.progressPercentage, 8).includes('3') : false,
      locked: userProgress ? !getCompletedModules(userProgress.progressPercentage, 8).includes('2') : true,
    },
    {
      id: '4',
      title: 'Projeto Prático 1',
      type: 'video',
      content: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
      duration: 45,
      completed: userProgress ? getCompletedModules(userProgress.progressPercentage, 8).includes('4') : false,
      locked: userProgress ? !getCompletedModules(userProgress.progressPercentage, 8).includes('3') : true,
    },
    {
      id: '5',
      title: 'Quiz - Teste seus Conhecimentos',
      type: 'quiz',
      content: '',
      completed: userProgress ? getCompletedModules(userProgress.progressPercentage, 8).includes('5') : false,
      locked: userProgress ? !getCompletedModules(userProgress.progressPercentage, 8).includes('4') : true,
    },
    {
      id: '6',
      title: 'Conceitos Avançados',
      type: 'video',
      content: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
      duration: 35,
      completed: userProgress ? getCompletedModules(userProgress.progressPercentage, 8).includes('6') : false,
      locked: userProgress ? !getCompletedModules(userProgress.progressPercentage, 8).includes('5') : true,
    },
    {
      id: '7',
      title: 'Projeto Final',
      type: 'video',
      content: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
      duration: 60,
      completed: userProgress ? getCompletedModules(userProgress.progressPercentage, 8).includes('7') : false,
      locked: userProgress ? !getCompletedModules(userProgress.progressPercentage, 8).includes('6') : true,
    },
    {
      id: '8',
      title: 'Avaliação Final',
      type: 'quiz',
      content: '',
      completed: userProgress ? getCompletedModules(userProgress.progressPercentage, 8).includes('8') : false,
      locked: userProgress ? !getCompletedModules(userProgress.progressPercentage, 8).includes('7') : true,
    },
  ];

  const completedModules = courseModules.filter(m => m.completed).length;
  const totalModules = courseModules.length;
  const progressPercentage = (completedModules / totalModules) * 100;
  const isCompleted = progressPercentage === 100;

  useEffect(() => {
    if (!activeModule && courseModules.length > 0) {
      // Encontrar o primeiro módulo não completado ou o primeiro se todos estiverem completos
      const nextModule = courseModules.find(m => !m.completed && !m.locked) || courseModules[0];
      setActiveModule(nextModule);
    }
  }, []);

  const handleModuleComplete = (moduleId: string) => {
    // Calcula novo progresso com o módulo atual marcado como concluído
    const moduleIndex = courseModules.findIndex(m => m.id === moduleId);
    if (moduleIndex !== -1 && !courseModules[moduleIndex].completed) {
      // Marca o módulo como concluído
      courseModules[moduleIndex].completed = true;
      
      // Calcula novo progresso
      const completedCount = courseModules.filter(m => m.completed).length;
      const newProgress = Math.min(100, Math.round((completedCount / totalModules) * 100));
      
      // Atualiza no backend
      updateProgress(id, newProgress);
      
      // Desbloquear próximo módulo
      if (moduleIndex + 1 < courseModules.length) {
        courseModules[moduleIndex + 1].locked = false;
      }
      
      // Força re-render
      setActiveModule({ ...courseModules[moduleIndex] });
    }
  };

  const handleQuizSubmit = () => {
    // Simular correção do quiz
    const totalQuestions = 3;
    const correctAnswers = Object.values(quizAnswers).filter(answer => answer === 'correct').length;
    const score = (correctAnswers / totalQuestions) * 100;
    
    setQuizScore(score);
    setQuizSubmitted(true);
    
    // Só marcar como concluído se tiver 70% ou mais
    if (score >= 70 && activeModule) {
      handleModuleComplete(activeModule.id);
    }
  };

  const resetQuiz = () => {
    setQuizAnswers({});
    setQuizSubmitted(false);
    setQuizScore(null);
  };

  const handleDownloadCertificate = async () => {
    if (!isCompleted) {
      alert('Você precisa concluir 100% do curso para baixar o certificado.');
      return;
    }

    setIsGeneratingCertificate(true);
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
      setIsGeneratingCertificate(false);
    }
  };

  const getModuleIcon = (type: string) => {
    switch (type) {
      case 'video':
        return <Play className="h-4 w-4" />;
      case 'pdf':
        return <FileText className="h-4 w-4" />;
      case 'quiz':
        return <HelpCircle className="h-4 w-4" />;
      default:
        return <BookOpen className="h-4 w-4" />;
    }
  };

  const renderModuleContent = () => {
    if (!activeModule) return null;

    switch (activeModule.type) {
      case 'video':
        return (
          <div className="space-y-4">
            <div className="aspect-video bg-black rounded-lg overflow-hidden">
              <iframe
                src={activeModule.content}
                className="w-full h-full"
                frameBorder="0"
                allowFullScreen
                title={activeModule.title}
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <Clock className="h-4 w-4" />
                <span>{activeModule.duration} minutos</span>
              </div>
              {!activeModule.completed && (
                <button
                  onClick={() => handleModuleComplete(activeModule.id)}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  Marcar como Concluído
                </button>
              )}
            </div>
          </div>
        );

      case 'pdf':
        return (
          <div className="space-y-4">
            <div className="h-96 border border-gray-300 rounded-lg overflow-hidden">
              <iframe
                src={activeModule.content}
                className="w-full h-full"
                title={activeModule.title}
              />
            </div>
            <div className="flex items-center justify-between">
              <a
                href={activeModule.content}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center space-x-2 text-blue-600 hover:text-blue-700"
              >
                <Download className="h-4 w-4" />
                <span>Baixar PDF</span>
              </a>
              {!activeModule.completed && (
                <button
                  onClick={() => handleModuleComplete(activeModule.id)}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  Marcar como Concluído
                </button>
              )}
            </div>
          </div>
        );

      case 'quiz':
        return (
          <div className="space-y-6">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="font-semibold text-blue-900 mb-2">Instruções do Quiz</h3>
              <p className="text-blue-800 text-sm">
                Responda todas as perguntas para concluir este módulo. 
                <strong> Você precisa de pelo menos 70% de aprovação para prosseguir.</strong>
              </p>
            </div>

            {!quizSubmitted ? (
              <div className="space-y-6">
                {/* Pergunta 1 */}
                <div className="bg-white p-6 rounded-lg border border-gray-200">
                  <h4 className="font-medium text-gray-900 mb-4">
                    1. Qual é o conceito principal abordado neste curso?
                  </h4>
                  <div className="space-y-2">
                    {[
                      { value: 'wrong1', label: 'Conceito incorreto A' },
                      { value: 'correct', label: 'Conceito correto principal' },
                      { value: 'wrong2', label: 'Conceito incorreto B' },
                      { value: 'wrong3', label: 'Conceito incorreto C' },
                    ].map((option) => (
                      <label key={option.value} className="flex items-center space-x-2">
                        <input
                          type="radio"
                          name="question1"
                          value={option.value}
                          checked={quizAnswers.question1 === option.value}
                          onChange={(e) => setQuizAnswers({ ...quizAnswers, question1: e.target.value })}
                          className="text-blue-600"
                        />
                        <span>{option.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Pergunta 2 */}
                <div className="bg-white p-6 rounded-lg border border-gray-200">
                  <h4 className="font-medium text-gray-900 mb-4">
                    2. Qual é a melhor prática mencionada no curso?
                  </h4>
                  <div className="space-y-2">
                    {[
                      { value: 'wrong1', label: 'Prática incorreta A' },
                      { value: 'wrong2', label: 'Prática incorreta B' },
                      { value: 'correct', label: 'Prática correta recomendada' },
                      { value: 'wrong3', label: 'Prática incorreta C' },
                    ].map((option) => (
                      <label key={option.value} className="flex items-center space-x-2">
                        <input
                          type="radio"
                          name="question2"
                          value={option.value}
                          checked={quizAnswers.question2 === option.value}
                          onChange={(e) => setQuizAnswers({ ...quizAnswers, question2: e.target.value })}
                          className="text-blue-600"
                        />
                        <span>{option.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Pergunta 3 */}
                <div className="bg-white p-6 rounded-lg border border-gray-200">
                  <h4 className="font-medium text-gray-900 mb-4">
                    3. Como aplicar o conhecimento na prática?
                  </h4>
                  <div className="space-y-2">
                    {[
                      { value: 'correct', label: 'Aplicação prática correta' },
                      { value: 'wrong1', label: 'Aplicação incorreta A' },
                      { value: 'wrong2', label: 'Aplicação incorreta B' },
                      { value: 'wrong3', label: 'Aplicação incorreta C' },
                    ].map((option) => (
                      <label key={option.value} className="flex items-center space-x-2">
                        <input
                          type="radio"
                          name="question3"
                          value={option.value}
                          checked={quizAnswers.question3 === option.value}
                          onChange={(e) => setQuizAnswers({ ...quizAnswers, question3: e.target.value })}
                          className="text-blue-600"
                        />
                        <span>{option.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <button
                  onClick={handleQuizSubmit}
                  disabled={Object.keys(quizAnswers).length < 3}
                  className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Enviar Respostas
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className={`p-6 rounded-lg ${
                  quizScore! >= 70 
                    ? 'bg-green-50 border border-green-200' 
                    : 'bg-red-50 border border-red-200'
                }`}>
                  <div className="flex items-center space-x-3 mb-4">
                    {quizScore! >= 70 ? (
                      <CheckCircle className="h-6 w-6 text-green-600" />
                    ) : (
                      <XCircle className="h-6 w-6 text-red-600" />
                    )}
                    <h3 className={`font-semibold ${
                      quizScore! >= 70 ? 'text-green-900' : 'text-red-900'
                    }`}>
                      {quizScore! >= 70 
                        ? 'Parabéns! Você foi aprovado!' 
                        : 'Não foi dessa vez. Tente novamente!'
                      }
                    </h3>
                  </div>
                  <p className={`${quizScore! >= 70 ? 'text-green-800' : 'text-red-800'}`}>
                    Sua pontuação: {quizScore}%
                  </p>
                  <p className={`${quizScore! >= 70 ? 'text-green-700' : 'text-red-700'} mt-2`}>
                    {quizScore! >= 70 
                      ? 'Módulo concluído com sucesso! Você pode prosseguir para o próximo módulo.'
                      : 'Você precisa de pelo menos 70% para prosseguir. Estude o conteúdo novamente e tente outra vez.'
                    }
                  </p>
                </div>

                <button
                  onClick={resetQuiz}
                  className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
                >
                  <RotateCcw className="h-4 w-4" />
                  <span>Tentar Novamente</span>
                </button>
              </div>
            )}
          </div>
        );

      default:
        return <div>Tipo de conteúdo não suportado</div>;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center space-x-4">
          <Link
            to="/my-courses"
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
              {course.title}
            </h1>
            <p className="text-gray-600">Por {course.instructor}</p>
          </div>
        </div>

        {/* Certificado só disponível com 100% */}
        {isCompleted ? (
          <button
            onClick={handleDownloadCertificate}
            disabled={isGeneratingCertificate}
            className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
          >
            {isGeneratingCertificate ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                <span>Gerando...</span>
              </>
            ) : (
              <>
                <Award className="h-4 w-4" />
                <span>Baixar Certificado</span>
              </>
            )}
          </button>
        ) : (
          <div className="flex items-center space-x-2 px-4 py-2 bg-gray-100 text-gray-500 rounded-lg">
            <Lock className="h-4 w-4" />
            <span>Certificado bloqueado</span>
          </div>
        )}
      </div>

      {/* Progress Bar */}
      <div className="mb-8 bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900">Progresso do Curso</h3>
          <span className="text-sm text-gray-600">
            {completedModules} de {totalModules} módulos concluídos
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div
            className="bg-blue-600 h-3 rounded-full transition-all duration-300"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
        <div className="flex items-center justify-between mt-2">
          <span className="text-sm text-gray-600">{Math.round(progressPercentage)}% concluído</span>
          {isCompleted ? (
            <span className="flex items-center space-x-1 text-green-600 text-sm font-medium">
              <CheckCircle className="h-4 w-4" />
              <span>Curso Concluído!</span>
            </span>
          ) : (
            <span className="text-sm text-gray-500">
              Complete 100% para liberar o certificado
            </span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Sidebar - Lista de Módulos */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 sticky top-24">
            <h3 className="font-semibold text-gray-900 mb-4">Módulos do Curso</h3>
            <div className="space-y-2">
              {courseModules.map((module, index) => (
                <button
                  key={module.id}
                  onClick={() => !module.locked && setActiveModule(module)}
                  disabled={module.locked}
                  className={`w-full text-left p-3 rounded-lg transition-colors ${
                    activeModule?.id === module.id
                      ? 'bg-blue-50 border border-blue-200'
                      : module.locked
                      ? 'bg-gray-50 text-gray-400 cursor-not-allowed'
                      : 'hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className="flex-shrink-0">
                      {module.completed ? (
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      ) : module.locked ? (
                        <Lock className="h-5 w-5 text-gray-400" />
                      ) : (
                        <div className={`p-1 rounded ${
                          activeModule?.id === module.id ? 'text-blue-600' : 'text-gray-600'
                        }`}>
                          {getModuleIcon(module.type)}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium ${
                        module.locked ? 'text-gray-400' : 'text-gray-900'
                      }`}>
                        {index + 1}. {module.title}
                      </p>
                      {module.duration && (
                        <p className="text-xs text-gray-500">{module.duration} min</p>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Conteúdo Principal */}
        <div className="lg:col-span-3">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            {activeModule ? (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      {getModuleIcon(activeModule.type)}
                    </div>
                    <div>
                      <h2 className="text-xl font-semibold text-gray-900">
                        {activeModule.title}
                      </h2>
                      <p className="text-gray-600 text-sm">
                        Módulo {courseModules.findIndex(m => m.id === activeModule.id) + 1} de {courseModules.length}
                      </p>
                    </div>
                  </div>
                  
                  {activeModule.completed && (
                    <div className="flex items-center space-x-2 text-green-600 bg-green-50 px-3 py-1 rounded-full">
                      <CheckCircle className="h-4 w-4" />
                      <span className="text-sm font-medium">Concluído</span>
                    </div>
                  )}
                </div>

                {renderModuleContent()}
              </div>
            ) : (
              <div className="text-center py-12">
                <BookOpen className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Selecione um módulo para começar
                </h3>
                <p className="text-gray-600">
                  Escolha um módulo na barra lateral para visualizar o conteúdo
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};