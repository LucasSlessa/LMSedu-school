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
import { coursesAPI } from '../lib/api';

interface CourseModule {
  id: string;
  title: string;
  description?: string;
  sortOrder: number;
  lessonsCount: number;
  lessons?: CourseLesson[];
  completed: boolean;
  locked: boolean;
}

interface CourseLesson {
  id: string;
  title: string;
  description?: string;
  contentType: 'video' | 'pdf' | 'pptx' | 'text' | 'quiz' | 'file';
  contentUrl?: string;
  durationMinutes: number;
  sortOrder: number;
  isFree: boolean;
  completed: boolean;
  quizQuestions?: any[];
}

export const CourseViewer: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuthStore();
  const { getCourseById, getPurchasedCourses, getUserProgress, updateProgress } = useCourseStore();
  const [activeModule, setActiveModule] = useState<CourseModule | null>(null);
  const [activeLesson, setActiveLesson] = useState<CourseLesson | null>(null);
  const [courseModules, setCourseModules] = useState<CourseModule[]>([]);
  const [loadingModules, setLoadingModules] = useState(true);
  const [quizAnswers, setQuizAnswers] = useState<{ [key: string]: string }>({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [quizScore, setQuizScore] = useState<number | null>(null);
  const [isGeneratingCertificate, setIsGeneratingCertificate] = useState(false);
  
  // Sistema de persistência local para aulas concluídas
  const getCompletedLessons = (courseId: string): string[] => {
    const key = `completed_lessons_${courseId}_${user?.id}`;
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : [];
  };
  
  const saveCompletedLesson = (courseId: string, lessonId: string) => {
    const key = `completed_lessons_${courseId}_${user?.id}`;
    const completed = getCompletedLessons(courseId);
    if (!completed.includes(lessonId)) {
      completed.push(lessonId);
      localStorage.setItem(key, JSON.stringify(completed));
    }
  };

  if (!id || !user) {
    return <Navigate to="/courses" replace />;
  }

  const course = getCourseById(id);
  const purchasedCourses = user ? getPurchasedCourses(user.id) : [];
  const hasPurchased = purchasedCourses.some(c => c.id === id);
  const userProgress = getUserProgress(id);
  const isAdmin = user?.role === 'admin';

  console.log('🔍 CourseViewer - Verificação de acesso:', {
    courseId: id,
    userId: user?.id,
    userRole: user?.role,
    hasPurchased,
    isAdmin,
    purchasedCoursesCount: purchasedCourses.length,
    courseExists: !!course
  });

  if (!course) {
    console.log('❌ Curso não encontrado, redirecionando para /courses');
    return <Navigate to="/courses" replace />;
  }

  // Permitir acesso se o usuário comprou o curso OU se é admin
  if (!hasPurchased && !isAdmin) {
    console.log('❌ Usuário não possui o curso e não é admin, redirecionando para página de compra');
    return <Navigate to={`/courses/${id}`} replace />;
  }

  // Carregar módulos e aulas do curso
  useEffect(() => {
    const loadCourseContent = async () => {
      if (!id) return;
      
      try {
        setLoadingModules(true);
        console.log('🔍 CourseViewer - Carregando módulos para curso:', id);
        const modules = await coursesAPI.getModules(id);
        console.log('📚 Módulos carregados:', modules);
        
        // Carregar aulas para cada módulo
        const modulesWithLessons = await Promise.all(
          modules.map(async (module: any, moduleIndex: number) => {
            try {
              console.log(`📂 Carregando aulas do módulo: ${module.title} (${module.id})`);
              const lessons = await coursesAPI.getLessons(id, module.id);
              console.log(`📖 Aulas carregadas para ${module.title}:`, lessons);
              
              const formattedLessons = lessons.map((lesson: any, lessonIndex: number) => {
                const baseLesson: any = {
                  id: lesson.id,
                  title: lesson.title,
                  description: lesson.description || '',
                  contentType: lesson.contentType || 'video',
                  contentUrl: lesson.contentUrl || '',
                  durationMinutes: lesson.durationMinutes || 15,
                  sortOrder: lesson.sortOrder || lessonIndex,
                  completed: getCompletedLessons(id).includes(lesson.id),
                  locked: false, // Será calculado depois baseado no progresso
                  isFree: moduleIndex === 0 && lessonIndex === 0
                };

                // Se for quiz, carregar as perguntas do banco
                if (lesson.contentType === 'quiz') {
                  console.log('🎯 Frontend processando aula de quiz:', {
                    lessonId: lesson.id,
                    lessonTitle: lesson.title,
                    hasQuizQuestions: !!lesson.quiz_questions,
                    quizQuestionsType: typeof lesson.quiz_questions,
                    quizQuestionsValue: lesson.quiz_questions,
                    fullLesson: lesson
                  });
                  
                  if (lesson.quiz_questions) {
                    try {
                      baseLesson.quizQuestions = typeof lesson.quiz_questions === 'string' 
                        ? JSON.parse(lesson.quiz_questions) 
                        : lesson.quiz_questions;
                      console.log('✅ Quiz questions parsed:', baseLesson.quizQuestions);
                    } catch (error) {
                      console.error('❌ Erro ao parsear dados do quiz:', error);
                      baseLesson.quizQuestions = [];
                    }
                  } else {
                    console.log('⚠️ lesson.quiz_questions é null/undefined');
                    baseLesson.quizQuestions = [];
                  }
                }

                return baseLesson;
              });

              return {
                id: module.id,
                title: module.title,
                description: module.description || '',
                sortOrder: module.sortOrder || moduleIndex,
                lessonsCount: formattedLessons.length,
                lessons: formattedLessons.sort((a, b) => a.sortOrder - b.sortOrder),
                completed: false, // Será calculado depois
                locked: false // Será calculado depois
              };
            } catch (error) {
              console.error(`Erro ao carregar aulas do módulo ${module.id}:`, error);
              return {
                id: module.id,
                title: module.title,
                description: module.description || '',
                sortOrder: module.sortOrder || moduleIndex,
                lessonsCount: 0,
                lessons: [],
                completed: false,
                locked: false
              };
            }
          })
        );
        
        // Ordenar módulos por sortOrder
        const sortedModules = modulesWithLessons.sort((a, b) => a.sortOrder - b.sortOrder);
        
        // Aplicar lógica de desbloqueio sequencial
        for (let i = 0; i < sortedModules.length; i++) {
          const currentModule = sortedModules[i];
          const previousModule = i > 0 ? sortedModules[i - 1] : null;
          
          // Calcular se o módulo atual está completo
          currentModule.completed = currentModule.lessons.length > 0 && 
            currentModule.lessons.every(lesson => lesson.completed);
          
          // Primeiro módulo sempre desbloqueado
          if (i === 0) {
            currentModule.locked = false;
            // Primeira aula do primeiro módulo sempre desbloqueada
            if (currentModule.lessons.length > 0) {
              currentModule.lessons[0].locked = false;
            }
          } else {
            // Módulos subsequentes só desbloqueiam se o anterior estiver completo
            currentModule.locked = !previousModule?.completed;
          }
          
          // Aplicar lógica de desbloqueio sequencial nas aulas do módulo
          if (!currentModule.locked) {
            for (let j = 0; j < currentModule.lessons.length; j++) {
              const currentLesson = currentModule.lessons[j];
              const previousLesson = j > 0 ? currentModule.lessons[j - 1] : null;
              
              if (j === 0) {
                // Primeira aula do módulo sempre desbloqueada se o módulo estiver desbloqueado
                currentLesson.locked = false;
              } else {
                // Aulas subsequentes só desbloqueiam se a anterior estiver completa
                currentLesson.locked = !previousLesson?.completed;
              }
            }
          } else {
            // Se o módulo estiver bloqueado, todas as aulas ficam bloqueadas
            currentModule.lessons.forEach(lesson => {
              lesson.locked = true;
            });
          }
        }
        
        setCourseModules(sortedModules);
        
        // Definir primeiro módulo como ativo
        if (sortedModules.length > 0) {
          setActiveModule(sortedModules[0]);
          
          // Definir primeira aula como ativa
          if (sortedModules[0].lessons.length > 0) {
            setActiveLesson(sortedModules[0].lessons[0]);
          }
        }
      } catch (error) {
        console.error('Erro ao carregar conteúdo do curso:', error);
        setCourseModules([]);
      } finally {
        setLoadingModules(false);
      }
    };

    loadCourseContent();
  }, [id, course, userProgress]);

  // Calcular progresso baseado nas aulas individuais, não módulos
  const allLessons = courseModules.flatMap(m => m.lessons || []);
  const completedLessons = allLessons.filter(lesson => lesson.completed).length;
  const totalLessons = allLessons.length;
  const progressPercentage = totalLessons > 0 ? (completedLessons / totalLessons) * 100 : 0;
  const isCompleted = progressPercentage === 100;

  // Remover o useEffect duplicado pois já está sendo tratado no loadCourseModules

  const handleLessonComplete = (lessonId: string) => {
    if (!activeModule || !activeLesson) return;
    
    // Atualizar o estado da aula como concluída
    let updatedModules = courseModules.map(module => {
      if (module.id === activeModule.id) {
        const updatedLessons = module.lessons?.map(lesson => 
          lesson.id === lessonId ? { ...lesson, completed: true } : lesson
        ) || [];
        
        return {
          ...module,
          lessons: updatedLessons
        };
      }
      return module;
    });
    
    // Recalcular lógica de desbloqueio sequencial
    for (let i = 0; i < updatedModules.length; i++) {
      const currentModule = updatedModules[i];
      const previousModule = i > 0 ? updatedModules[i - 1] : null;
      
      // Calcular se o módulo atual está completo
      currentModule.completed = currentModule.lessons.length > 0 && 
        currentModule.lessons.every(lesson => lesson.completed);
      
      // Primeiro módulo sempre desbloqueado
      if (i === 0) {
        currentModule.locked = false;
        // Primeira aula do primeiro módulo sempre desbloqueada
        if (currentModule.lessons.length > 0) {
          currentModule.lessons[0].locked = false;
        }
      } else {
        // Módulos subsequentes só desbloqueiam se o anterior estiver completo
        currentModule.locked = !previousModule?.completed;
      }
      
      // Aplicar lógica de desbloqueio sequencial nas aulas do módulo
      if (!currentModule.locked) {
        for (let j = 0; j < currentModule.lessons.length; j++) {
          const currentLesson = currentModule.lessons[j];
          const previousLesson = j > 0 ? currentModule.lessons[j - 1] : null;
          
          if (j === 0) {
            // Primeira aula do módulo sempre desbloqueada se o módulo estiver desbloqueado
            currentLesson.locked = false;
          } else {
            // Aulas subsequentes só desbloqueiam se a anterior estiver completa
            currentLesson.locked = !previousLesson?.completed;
          }
        }
      } else {
        // Se o módulo estiver bloqueado, todas as aulas ficam bloqueadas
        currentModule.lessons.forEach(lesson => {
          lesson.locked = true;
        });
      }
    }
    
    setCourseModules(updatedModules);
    
    // Calcular novo progresso baseado nas aulas concluídas
    const allLessons = updatedModules.flatMap(m => m.lessons || []);
    const completedLessonsCount = allLessons.filter(lesson => lesson.completed).length;
    const totalLessonsCount = allLessons.length;
    const newProgress = totalLessonsCount > 0 ? Math.round((completedLessonsCount / totalLessonsCount) * 100) : 0;
    
    // Salvar aula como concluída no localStorage
    saveCompletedLesson(id, lessonId);
    
    // Atualizar progresso no backend
    updateProgress(id, newProgress);
    
    console.log(`🎯 Aula "${activeLesson.title}" concluída! Progresso: ${newProgress}%`);
    
    // Verificar se um novo módulo foi desbloqueado
    const nextModuleIndex = updatedModules.findIndex(m => m.id === activeModule.id) + 1;
    if (nextModuleIndex < updatedModules.length && !updatedModules[nextModuleIndex].locked) {
      console.log(`🔓 Módulo "${updatedModules[nextModuleIndex].title}" desbloqueado!`);
    }
  };

  const handleQuizSubmit = () => {
    if (!activeLesson?.quizQuestions) return;
    
    // Calcular pontuação baseada nas perguntas reais do quiz
    const quizQuestions = activeLesson.quizQuestions;
    let correctAnswers = 0;
    
    console.log('🎯 Calculando pontuação do quiz:', {
      totalQuestions: quizQuestions.length,
      userAnswers: quizAnswers
    });
    
    quizQuestions.forEach((question: any, index: number) => {
      const questionKey = `question_${question.id || index}`;
      const userAnswer = quizAnswers[questionKey];
      const correctAnswer = question.correctAnswer;
      
      console.log(`Pergunta ${index + 1}:`, {
        question: question.question,
        userAnswer,
        correctAnswer,
        isCorrect: userAnswer && parseInt(userAnswer) === correctAnswer
      });
      
      if (userAnswer && parseInt(userAnswer) === correctAnswer) {
        correctAnswers++;
      }
    });
    
    const score = quizQuestions.length > 0 ? (correctAnswers / quizQuestions.length) * 100 : 0;
    
    console.log('📊 Resultado final:', {
      correctAnswers,
      totalQuestions: quizQuestions.length,
      score: Math.round(score)
    });
    
    setQuizScore(Math.round(score));
    setQuizSubmitted(true);
    
    // Só marcar como concluído se tiver 70% ou mais
    if (score >= 70 && activeLesson) {
      handleLessonComplete(activeLesson.id);
    }
  };

  const resetQuiz = () => {
    setQuizAnswers({});
    setQuizSubmitted(false);
    setQuizScore(null);
  };

  // Reset quiz state when changing lessons
  useEffect(() => {
    if (activeLesson?.contentType === 'quiz') {
      setQuizAnswers({});
      setQuizSubmitted(false);
      setQuizScore(null);
    }
  }, [activeLesson?.id]);

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

  const getContentIcon = (contentType: string) => {
    switch (contentType) {
      case 'video':
        return <Play className="h-4 w-4" />;
      case 'file':
      case 'text':
      case 'pdf':
      case 'pptx':
        return <FileText className="h-4 w-4" />;
      case 'quiz':
        return <HelpCircle className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const getYouTubeEmbedUrl = (url: string): string => {
    if (!url) return '';
    
    // Extrair ID do vídeo de diferentes formatos de URL do YouTube
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    
    if (match && match[2].length === 11) {
      return `https://www.youtube.com/embed/${match[2]}`;
    }
    
    return '';
  };

  const getGoogleDriveEmbedUrl = (url: string): string => {
    if (!url) return '';
    
    // Converter URL do Google Drive para formato de visualização
    const driveRegex = /drive\.google\.com\/file\/d\/([a-zA-Z0-9-_]+)/;
    const match = url.match(driveRegex);
    
    if (match && match[1]) {
      const fileId = match[1];
      return `https://drive.google.com/file/d/${fileId}/preview`;
    }
    
    // Se já estiver no formato correto, retornar como está
    if (url.includes('drive.google.com') && url.includes('preview')) {
      return url;
    }
    
    return url; // Retornar URL original se não for do Google Drive
  };

  const renderLessonContent = () => {
    if (!activeLesson) return null;

    const renderCompleteButton = () => (
      <div className="mt-6 flex justify-between items-center">
        <div className="flex items-center space-x-2 text-sm text-gray-600">
          <Clock className="h-4 w-4" />
          <span>{activeLesson.durationMinutes} minutos</span>
        </div>
        {!activeLesson.completed ? (
          <button
            onClick={() => handleLessonComplete(activeLesson.id)}
            className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
          >
            <CheckCircle className="h-4 w-4" />
            <span>Marcar como Concluído</span>
          </button>
        ) : (
          <div className="flex items-center space-x-2 text-green-600 bg-green-50 px-4 py-2 rounded-lg">
            <CheckCircle className="h-4 w-4" />
            <span className="text-sm font-medium">Aula Concluída</span>
          </div>
        )}
      </div>
    );

    switch (activeLesson.contentType) {
      case 'video':
        const embedUrl = getYouTubeEmbedUrl(activeLesson.contentUrl || '');
        return (
          <div className="space-y-4">
            {embedUrl ? (
              <div className="aspect-video bg-black rounded-lg overflow-hidden shadow-lg">
                <iframe
                  src={embedUrl}
                  className="w-full h-full"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  title={activeLesson.title}
                />
              </div>
            ) : (
              <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center">
                <div className="text-center">
                  <Play className="mx-auto h-12 w-12 text-gray-400 mb-2" />
                  <p className="text-gray-600">URL do vídeo inválida</p>
                  <p className="text-sm text-gray-500 mt-1">
                    URL fornecida: {activeLesson.contentUrl}
                  </p>
                </div>
              </div>
            )}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold text-gray-900 mb-2">{activeLesson.title}</h3>
              {activeLesson.description && (
                <p className="text-gray-700 text-sm mb-4">{activeLesson.description}</p>
              )}
              {renderCompleteButton()}
            </div>
          </div>
        );

      case 'pdf':
      case 'pptx':
      case 'file':
      case 'text':
        const driveEmbedUrl = getGoogleDriveEmbedUrl(activeLesson.contentUrl || '');
        
        return (
          <div className="space-y-4">
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
              <div className="h-[600px]">
                <iframe
                  src={driveEmbedUrl}
                  className="w-full h-full"
                  title={activeLesson.title}
                  allow="autoplay"
                />
              </div>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold text-gray-900 mb-2">{activeLesson.title}</h3>
              {activeLesson.description && (
                <p className="text-gray-700 text-sm mb-4">{activeLesson.description}</p>
              )}
              
              <div className="flex items-center justify-between">
                <a
                  href={activeLesson.contentUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center space-x-2 text-blue-600 hover:text-blue-700 transition-colors"
                >
                  <Download className="h-4 w-4" />
                  <span>Baixar Arquivo</span>
                </a>
                
                {!activeLesson.completed ? (
                  <button
                    onClick={() => handleLessonComplete(activeLesson.id)}
                    className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
                  >
                    <CheckCircle className="h-4 w-4" />
                    <span>Marcar como Concluído</span>
                  </button>
                ) : (
                  <div className="flex items-center space-x-2 text-green-600 bg-green-50 px-4 py-2 rounded-lg">
                    <CheckCircle className="h-4 w-4" />
                    <span className="text-sm font-medium">Aula Concluída</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        );

      case 'quiz':
        const quizQuestions = activeLesson.quizQuestions || [];
        
        console.log('🎯 Renderizando quiz:', {
          lessonTitle: activeLesson.title,
          lessonId: activeLesson.id,
          contentType: activeLesson.contentType,
          hasQuizQuestions: !!activeLesson.quizQuestions,
          quizQuestionsType: typeof activeLesson.quizQuestions,
          questionsCount: quizQuestions.length,
          questions: quizQuestions,
          fullLesson: activeLesson
        });
        
        if (quizQuestions.length === 0) {
          console.log('❌ Quiz sem perguntas - Debug completo:', {
            activeLesson,
            quizQuestions,
            hasQuizQuestions: !!activeLesson.quizQuestions,
            quizQuestionsType: typeof activeLesson.quizQuestions,
            quizQuestionsLength: activeLesson.quizQuestions?.length,
            rawQuizQuestions: activeLesson.quizQuestions
          });
          
          return (
            <div className="bg-yellow-50 p-6 rounded-lg border border-yellow-200">
              <h3 className="font-semibold text-yellow-900 mb-2">Quiz não configurado</h3>
              <p className="text-yellow-800">
                Este quiz ainda não possui perguntas configuradas. Entre em contato com o instrutor.
              </p>
              <div className="mt-4 text-xs text-yellow-700">
                Debug: Lesson ID {activeLesson.id} - Quiz Questions: {JSON.stringify(activeLesson.quizQuestions)}
              </div>
            </div>
          );
        }
        
        return (
          <div className="space-y-6">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="font-semibold text-blue-900 mb-2">{activeLesson.title}</h3>
              <p className="text-blue-800 text-sm">
                Responda todas as perguntas para concluir este quiz. 
                <strong> Você precisa de pelo menos 70% de aprovação para prosseguir.</strong>
              </p>
              <p className="text-blue-700 text-xs mt-2">
                Total de perguntas: {quizQuestions.length}
              </p>
            </div>

            {!quizSubmitted ? (
              <div className="space-y-6">
                {quizQuestions.map((question: any, questionIndex: number) => (
                  <div key={question.id || questionIndex} className="bg-white p-6 rounded-lg border border-gray-200">
                    <h4 className="font-medium text-gray-900 mb-4">
                      {questionIndex + 1}. {question.question}
                    </h4>
                    <div className="space-y-2">
                      {question.options?.map((option: string, optionIndex: number) => (
                        <label key={optionIndex} className="flex items-center space-x-2">
                          <input
                            type="radio"
                            name={`question_${question.id || questionIndex}`}
                            value={optionIndex.toString()}
                            checked={quizAnswers[`question_${question.id || questionIndex}`] === optionIndex.toString()}
                            onChange={(e) => setQuizAnswers({ 
                              ...quizAnswers, 
                              [`question_${question.id || questionIndex}`]: e.target.value 
                            })}
                            className="text-blue-600"
                          />
                          <span>{option}</span>
                        </label>
                      )) || <p className="text-gray-500 italic">Opções não configuradas</p>}
                    </div>
                  </div>
                ))}

                <button
                  onClick={handleQuizSubmit}
                  disabled={Object.keys(quizAnswers).length < quizQuestions.length}
                  className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Enviar Respostas ({Object.keys(quizAnswers).length}/{quizQuestions.length})
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
        return (
          <div className="text-center py-8">
            <BookOpen className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <p className="text-gray-600">Tipo de conteúdo não suportado</p>
          </div>
        );
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
            {completedLessons} de {totalLessons} aulas concluídas
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
            {loadingModules ? (
              <div className="text-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-2 border-blue-600 border-t-transparent mx-auto mb-2" />
                <p className="text-sm text-gray-600">Carregando módulos...</p>
              </div>
            ) : courseModules.length > 0 ? (
              <div className="space-y-2">
                {courseModules.map((module, index) => (
                  <div key={module.id}>
                    <button
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
                              <BookOpen className="h-4 w-4" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-medium ${
                            module.locked ? 'text-gray-400' : 'text-gray-900'
                          }`}>
                            {index + 1}. {module.title}
                          </p>
                          <p className="text-xs text-gray-500">{module.lessonsCount} aulas</p>
                        </div>
                      </div>
                    </button>
                    
                    {/* Lista de aulas do módulo ativo */}
                    {activeModule?.id === module.id && module.lessons && (
                      <div className="ml-8 mt-2 space-y-1">
                        {module.lessons.map((lesson, lessonIndex) => (
                          <button
                            key={lesson.id}
                            onClick={() => setActiveLesson(lesson)}
                            className={`w-full text-left p-2 rounded text-sm transition-colors ${
                              activeLesson?.id === lesson.id
                                ? 'bg-blue-100 text-blue-900'
                                : 'hover:bg-gray-100 text-gray-700'
                            }`}
                          >
                            <div className="flex items-center space-x-2">
                              <div className="flex-shrink-0">
                                {lesson.completed ? (
                                  <CheckCircle className="h-4 w-4 text-green-600" />
                                ) : (
                                  <div className="text-gray-400">
                                    {getContentIcon(lesson.contentType)}
                                  </div>
                                )}
                              </div>
                              <span>{lessonIndex + 1}. {lesson.title}</span>
                              {lesson.durationMinutes > 0 && (
                                <span className="text-xs text-gray-500">({lesson.durationMinutes}min)</span>
                              )}
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-4">
                <BookOpen className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                <p className="text-sm text-gray-600">Nenhum módulo encontrado</p>
              </div>
            )}
          </div>
        </div>

        {/* Conteúdo Principal */}
        <div className="lg:col-span-3">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            {activeLesson ? (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      {getContentIcon(activeLesson.contentType)}
                    </div>
                    <div>
                      <h2 className="text-xl font-semibold text-gray-900">
                        {activeLesson.title}
                      </h2>
                      <p className="text-gray-600 text-sm">
                        {activeModule?.title} - Aula {(activeModule?.lessons?.findIndex(l => l.id === activeLesson.id) ?? -1) + 1}
                      </p>
                    </div>
                  </div>
                  
                  {activeLesson.completed && (
                    <div className="flex items-center space-x-2 text-green-600 bg-green-50 px-3 py-1 rounded-full">
                      <CheckCircle className="h-4 w-4" />
                      <span className="text-sm font-medium">Concluído</span>
                    </div>
                  )}
                </div>

                {renderLessonContent()}
              </div>
            ) : activeModule ? (
              <div className="text-center py-12">
                <BookOpen className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {activeModule.title}
                </h3>
                <p className="text-gray-600 mb-4">
                  {activeModule.description || 'Selecione uma aula para começar'}
                </p>
                {activeModule.lessons && activeModule.lessons.length > 0 ? (
                  <div>
                    <p className="text-sm text-gray-500 mb-4">
                      {activeModule.lessons.length} aula{activeModule.lessons.length !== 1 ? 's' : ''} disponível{activeModule.lessons.length !== 1 ? 'is' : ''}
                    </p>
                    <div className="text-left max-w-md mx-auto space-y-2">
                      {activeModule.lessons.map((lesson, index) => (
                        <button
                          key={lesson.id}
                          onClick={() => setActiveLesson(lesson)}
                          className="w-full text-left p-3 rounded-lg border border-gray-200 hover:bg-blue-50 hover:border-blue-300 transition-colors"
                        >
                          <div className="flex items-center space-x-3">
                            <div className="flex-shrink-0">
                              {lesson.completed ? (
                                <CheckCircle className="h-5 w-5 text-green-600" />
                              ) : (
                                <div className="p-1 rounded text-gray-600">
                                  {getContentIcon(lesson.contentType)}
                                </div>
                              )}
                            </div>
                            <div className="flex-1">
                              <p className="font-medium text-gray-900">
                                {index + 1}. {lesson.title}
                              </p>
                              <p className="text-sm text-gray-500">
                                {lesson.durationMinutes} min • {lesson.contentType}
                              </p>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">
                    Nenhuma aula disponível neste módulo
                  </p>
                )}
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