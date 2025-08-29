import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save, Plus, Trash2, Video, FileText, HelpCircle, Settings } from 'lucide-react';
import { useCourseStore } from '../../store/courseStore';
import { useCategoryStore } from '../../store/categoryStore';
import { Course, CourseModule, CourseContent } from '../../types';
import { api, deleteLessonAPI } from '../../lib/api';
import { QuizBuilder } from '../../components/admin/QuizBuilder';
import { FileUploader } from '../../components/admin/FileUploader';
import { ImageUploader } from '../../components/admin/ImageUploader';
import { CategoryManager } from '../../components/admin/CategoryManager';
import { coursesAPI } from '../../lib/api';

interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  type?: 'multiple-choice';
  explanation?: string;
  required?: boolean;
  points?: number;
}

interface CourseLesson {
  id: string;
  title: string;
  type: 'video' | 'pdf' | 'pptx' | 'quiz' | 'text' | 'file';
  content: string;
  contentUrl?: string;
  duration: number;
  order: number;
  files: any[];
  quizQuestions?: QuizQuestion[];
}

interface CourseModule {
  id: string;
  title: string;
  description: string;
  order: number;
  lessons: CourseLesson[];
}

interface UploadedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  url: string;
  status: 'uploading' | 'completed' | 'error';
  progress?: number;
}

export const AdminCourseForm: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { 
    courses, 
    addCourse, 
    updateCourse, 
    getModules, 
    createModule: createModuleAPI, 
    updateModule: updateModuleAPI, 
    deleteModule: deleteModuleAPI,
    createLesson: createLessonAPI,
    updateLesson: updateLessonAPI,
    deleteLesson: deleteLessonAPI
  } = useCourseStore();
  const { categories, addCategory, updateCategory, deleteCategory } = useCategoryStore();
  const isEditing = Boolean(id);
  const existingCourse = isEditing ? courses.find(c => c.id === id) : null;
  
  const [formData, setFormData] = useState({
    title: existingCourse?.title || '',
    description: existingCourse?.description || '',
    shortDescription: existingCourse?.shortDescription || '',
    price: existingCourse?.price || 0,
    duration: existingCourse?.duration || 0,
    instructor: existingCourse?.instructor || '',
    category: existingCourse?.category || (categories.length > 0 ? categories[0].name : ''),
    level: existingCourse?.level || 'beginner',
    image: existingCourse?.image || '',
  });
  
  const [modules, setModules] = useState<CourseModule[]>([
    { 
      id: '1', 
      title: 'Módulo 1', 
      description: 'Descrição do primeiro módulo',
      order: 0,
      lessons: [
        {
          id: '1-1',
          title: 'Aula 1',
          type: 'video',
          content: '',
          duration: 15,
          order: 0,
          files: []
        }
      ]
    },
  ]);
  
  const [uploadedFiles, setUploadedFiles] = useState<{ [moduleId: string]: UploadedFile[] }>({});
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('basic');
  const [showCategoryManager, setShowCategoryManager] = useState(false);
  const [loadingModules, setLoadingModules] = useState(false);
  
  // Carregar módulos existentes quando estiver editando
  useEffect(() => {
    const loadExistingModules = async () => {
      if (isEditing && existingCourse) {
        setLoadingModules(true);
        console.log('🔄 Carregando módulos existentes para o curso:', existingCourse.id);
        try {
          const courseModules = await getModules(existingCourse.id);
          console.log('📚 Módulos encontrados:', courseModules);
          if (courseModules && courseModules.length > 0) {
            const formattedModules = await Promise.all(
              courseModules.map(async (module: any, index: number) => {
                // Carregar aulas do módulo
                let lessons: CourseLesson[] = [];
                try {
                  const moduleLessons = await coursesAPI.getLessons(existingCourse.id, module.id);
                  lessons = moduleLessons.map((lesson: any, lessonIndex: number) => {
                    const baseLesson: any = {
                      id: lesson.id,
                      title: lesson.title,
                      type: lesson.contentType || 'video',
                      content: lesson.description || '',
                      contentUrl: lesson.contentUrl || '',
                      duration: lesson.durationMinutes || 15,
                      order: lesson.sortOrder || lessonIndex,
                      files: []
                    };

                    // Se for quiz, carregar as perguntas
                    if (lesson.contentType === 'quiz' && lesson.quizQuestions) {
                      baseLesson.quizQuestions = lesson.quizQuestions;
                    } else if (lesson.contentType === 'quiz') {
                      baseLesson.quizQuestions = [];
                    }

                    return baseLesson;
                  });
                } catch (error) {
                  console.error(`Erro ao carregar aulas do módulo ${module.id}:`, error);
                }

                return {
                  id: module.id,
                  title: module.title,
                  description: module.description || '',
                  order: module.sortOrder || index,
                  lessons: lessons
                };
              })
            );
            console.log('✅ Módulos formatados e carregados:', formattedModules);
            setModules(formattedModules);
          } else {
            console.log('📭 Nenhum módulo encontrado para este curso');
            setModules([]);
          }
        } catch (error) {
          console.error('❌ Erro ao carregar módulos:', error);
          setModules([]);
        } finally {
          setLoadingModules(false);
        }
      }
    };

    loadExistingModules();
  }, [isEditing, existingCourse, getModules]);
  
  const levels = [
    { value: 'beginner', label: 'Iniciante' },
    { value: 'intermediate', label: 'Intermediário' },
    { value: 'advanced', label: 'Avançado' },
  ];
  
  const moduleTypes = [
    { value: 'video', label: 'Vídeo Aula', icon: Video, accept: 'video/*,.mp4,.avi,.mov,.wmv' },
    { value: 'pdf', label: 'Material PDF/PPT', icon: FileText, accept: '.pdf,application/pdf,.ppt,.pptx,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation' },
    { value: 'quiz', label: 'Questionário', icon: HelpCircle, accept: '' },
  ];
  

  
  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};
    
    if (!formData.title.trim()) newErrors.title = 'Título é obrigatório';
    if (!formData.description.trim()) newErrors.description = 'Descrição é obrigatória';
    if (!formData.shortDescription.trim()) newErrors.shortDescription = 'Descrição curta é obrigatória';
    if (formData.price <= 0) newErrors.price = 'Preço deve ser maior que zero';
    if (!formData.instructor.trim()) newErrors.instructor = 'Instrutor é obrigatório';
    if (!formData.image.trim()) newErrors.image = 'Imagem é obrigatória';
    if (!formData.category.trim()) newErrors.category = 'Categoria é obrigatória';
    
    // Validar módulos
    modules.forEach((module, index) => {
      if (!module.title.trim()) {
        newErrors[`module-${index}-title`] = `Título do módulo ${index + 1} é obrigatório`;
      }
      
      // Validar aulas do módulo
      module.lessons.forEach((lesson, lessonIndex) => {
        if (!lesson.title.trim()) {
          newErrors[`module-${index}-lesson-${lessonIndex}-title`] = `Título da aula ${lessonIndex + 1} do módulo ${index + 1} é obrigatório`;
        }
        // Validação mais flexível para quiz - permitir salvar mesmo com perguntas vazias para permitir edição posterior
        if (lesson.type === 'quiz' && lesson.quizQuestions && lesson.quizQuestions.length > 0) {
          // Só validar se houver perguntas criadas
          const hasValidQuestions = lesson.quizQuestions.some(q => 
            q.question && q.question.trim() && 
            q.options && q.options.some(opt => opt && opt.trim())
          );
          
          if (!hasValidQuestions) {
            newErrors[`module-${index}-lesson-${lessonIndex}-quiz`] = `Aula ${lessonIndex + 1} do módulo ${index + 1}: Complete pelo menos uma pergunta do questionário`;
          }
        }
        if (lesson.type === 'quiz' && lesson.quizQuestions && lesson.quizQuestions.length > 0) {
          lesson.quizQuestions.forEach((question, qIndex) => {
            if (!question.question || !question.question.trim()) {
              newErrors[`module-${index}-lesson-${lessonIndex}-question-${qIndex}`] = `Pergunta ${qIndex + 1} da aula ${lessonIndex + 1} do módulo ${index + 1}: Texto da pergunta é obrigatório`;
            }
            if (!question.options || !Array.isArray(question.options) || !question.options.some(opt => opt && opt.trim())) {
              newErrors[`module-${index}-lesson-${lessonIndex}-question-${qIndex}-options`] = `Pergunta ${qIndex + 1} da aula ${lessonIndex + 1} do módulo ${index + 1}: Adicione pelo menos uma opção válida`;
            }
          });
        }
      });
    });
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    console.log('📝 Tentando submeter formulário...');
    
    if (!validateForm()) {
      console.log('❌ Validação falhou, voltando para aba básica');
      setActiveTab('basic'); // Voltar para a aba básica se houver erros
      return;
    }
    
    console.log('✅ Validação passou, salvando curso...');
    setLoading(true);
    
    try {
      const courseData: Omit<Course, 'id' | 'createdAt' | 'updatedAt' | 'rating' | 'studentsCount'> = {
        ...formData,
      };
      
      console.log('📊 Dados do curso para salvar:', courseData);
      
      let savedCourse;
      if (isEditing && existingCourse) {
        console.log('🔄 Atualizando curso existente...');
        await updateCourse(existingCourse.id, courseData);
        savedCourse = existingCourse;
      } else {
        console.log('🆕 Criando novo curso...');
        const newCourse = await addCourse(courseData);
        savedCourse = newCourse;
      }
      
      // Salvar módulos e aulas
      if (savedCourse && modules.length > 0) {
        console.log('📚 Salvando módulos e aulas...');
        
        for (let i = 0; i < modules.length; i++) {
          const module = modules[i];
          let savedModuleId = module.id;
          
          if (isEditing && module.id && !module.id.startsWith('temp-')) {
            // Atualizar módulo existente
            try {
              await updateModuleAPI(savedCourse.id, module.id, {
                title: module.title,
                description: module.description,
                sortOrder: i
              });
              console.log(`✅ Módulo "${module.title}" atualizado com sucesso`);
            } catch (error) {
              console.error(`❌ Erro ao atualizar módulo "${module.title}":`, error);
            }
          } else {
            // Criar novo módulo
            try {
              const newModule = await createModuleAPI(savedCourse.id, {
                title: module.title,
                description: module.description,
                sortOrder: i
              });
              savedModuleId = newModule.id;
              console.log(`✅ Módulo "${module.title}" criado com sucesso`);
            } catch (error) {
              console.error(`❌ Erro ao criar módulo "${module.title}":`, error);
              continue; // Pular para o próximo módulo se houver erro
            }
          }
          
          // Salvar aulas do módulo
          if (module.lessons && module.lessons.length > 0) {
            console.log(`📖 Salvando ${module.lessons.length} aulas do módulo "${module.title}"`);
            
            for (let j = 0; j < module.lessons.length; j++) {
              const lesson = module.lessons[j];
              
              try {
                // Preparar quiz questions com estrutura correta
                let processedQuizQuestions = null;
                if (lesson.type === 'quiz' && lesson.quizQuestions && lesson.quizQuestions.length > 0) {
                  processedQuizQuestions = lesson.quizQuestions.map(q => ({
                    id: q.id,
                    question: q.question,
                    options: q.options,
                    correctAnswer: q.correctAnswer,
                    type: q.type || 'multiple-choice',
                    explanation: q.explanation || '',
                    required: q.required !== false,
                    points: q.points || 1
                  }));
                }

                const lessonData = {
                  title: lesson.title,
                  description: lesson.content,
                  contentType: lesson.type,
                  contentUrl: lesson.contentUrl || lesson.content,
                  durationMinutes: lesson.duration,
                  sortOrder: j,
                  isFree: j === 0 && i === 0,
                  quizQuestions: processedQuizQuestions
                };

                console.log(`🔍 Dados da aula "${lesson.title}":`, {
                  type: lesson.type,
                  hasQuizQuestions: !!processedQuizQuestions,
                  quizQuestionsCount: processedQuizQuestions?.length || 0,
                  rawQuizQuestions: lesson.quizQuestions,
                  processedQuizQuestions,
                  lessonDataToSend: lessonData
                });

                if (isEditing && lesson.id && !lesson.id.startsWith('temp-')) {
                  // Atualizar aula existente
                  await updateLessonAPI(savedCourse.id, savedModuleId, lesson.id, lessonData);
                  console.log(`✅ Aula "${lesson.title}" atualizada com sucesso`);
                } else {
                  // Criar nova aula
                  await createLessonAPI(savedCourse.id, savedModuleId, lessonData);
                  console.log(`✅ Aula "${lesson.title}" criada com sucesso`);
                }
              } catch (error) {
                console.error(`❌ Erro ao salvar aula "${lesson.title}":`, error);
              }
            }
          }
        }
      }
      
      console.log('✅ Curso e módulos salvos com sucesso!');
      
      // Só navegar se não houver erros
      if (Object.keys(errors).length === 0) {
        console.log('🚀 Navegando para lista de cursos...');
        navigate('/admin/courses');
      } else {
        console.log('⚠️ Não navegando devido a erros:', errors);
      }
    } catch (error) {
      console.error('❌ Erro ao salvar curso:', error);
      setErrors({ general: 'Erro ao salvar curso. Tente novamente.' });
    } finally {
      setLoading(false);
    }
  };
  
  const addModule = () => {
    const newModule: CourseModule = {
      id: `temp-${Date.now()}`,
      title: `Módulo ${modules.length + 1}`,
      description: `Descrição do módulo ${modules.length + 1}`,
      order: modules.length,
      lessons: [
        {
          id: `temp-${Date.now()}-1`,
          title: 'Aula 1',
          type: 'video',
          content: '',
          duration: 15,
          order: 0,
          files: []
        }
      ]
    };
    setModules([...modules, newModule]);
  };
  
  const removeModule = async (moduleId: string) => {
    // Se for um módulo existente (não temporário), deletar do backend
    if (isEditing && existingCourse && !moduleId.startsWith('temp-')) {
      try {
        await deleteModuleAPI(existingCourse.id, moduleId);
        console.log(`✅ Módulo ${moduleId} deletado do backend`);
      } catch (error) {
        console.error(`❌ Erro ao deletar módulo ${moduleId}:`, error);
        // Continuar mesmo com erro para permitir remoção da UI
      }
    }
    
    // Remover da UI
    setModules(modules.filter(m => m.id !== moduleId));
    
    // Remover arquivos associados
    const newUploadedFiles = { ...uploadedFiles };
    delete newUploadedFiles[moduleId];
    setUploadedFiles(newUploadedFiles);
  };
  
  const updateModule = (moduleId: string, field: string, value: any) => {
    setModules(modules.map(m => 
      m.id === moduleId ? { ...m, [field]: value } : m
    ));
  };

  const addLesson = (moduleId: string) => {
    const moduleIndex = modules.findIndex(m => m.id === moduleId);
    if (moduleIndex === -1) return;

    const newLesson: CourseLesson = {
      id: `temp-${Date.now()}-${Math.random()}`,
      title: 'Nova Aula',
      type: 'video',
      content: '',
      duration: 15,
      order: 0,
      files: []
    };

    const updatedModules = [...modules];
    updatedModules[moduleIndex] = {
      ...modules[moduleIndex],
      lessons: [...modules[moduleIndex].lessons, newLesson]
    };
    setModules(updatedModules);
  };

  const removeLesson = async (moduleId: string, lessonId: string) => {
    const moduleIndex = modules.findIndex(m => m.id === moduleId);
    if (moduleIndex === -1) return;

    const lesson = modules[moduleIndex].lessons.find(l => l.id === lessonId);
    if (!lesson) return;

    // Confirmar exclusão
    if (!confirm(`Tem certeza que deseja excluir a aula "${lesson.title}"? Esta ação não pode ser desfeita.`)) {
      return;
    }

    try {
      // Se for aula existente (não temporária), deletar do backend
      if (isEditing && existingCourse && !lessonId.startsWith('temp-')) {
        await deleteLessonAPI(existingCourse.id, moduleId, lessonId);
        console.log(`✅ Aula "${lesson.title}" deletada do backend`);
      }

      // Remover da UI
      const module = modules[moduleIndex];
      const updatedModules = [...modules];
      updatedModules[moduleIndex] = {
        ...module,
        lessons: module.lessons.filter(l => l.id !== lessonId)
      };
      setModules(updatedModules);
      
      console.log(`🗑️ Aula "${lesson.title}" removida da interface`);
    } catch (error) {
      console.error('Erro ao excluir aula:', error);
      alert('Erro ao excluir aula. Tente novamente.');
    }
  };

  const updateLesson = (moduleId: string, lessonId: string, field: string, value: any) => {
    const moduleIndex = modules.findIndex(m => m.id === moduleId);
    if (moduleIndex === -1) return;

    const module = modules[moduleIndex];
    const updatedModules = [...modules];
    updatedModules[moduleIndex] = {
      ...module,
      lessons: module.lessons.map(l => 
        l.id === lessonId ? { ...l, [field]: value } : l
      )
    };
    setModules(updatedModules);
  };

  const addQuizQuestion = (moduleId: string, lessonId: string) => {
    const newQuestion: QuizQuestion = {
      id: `temp-question-${Date.now()}`,
      question: '',
      options: ['Opção 1', 'Opção 2', 'Opção 3', 'Opção 4'],
      correctAnswer: 0,
      type: 'multiple-choice',
      explanation: '',
      required: true,
      points: 1
    };

    const moduleIndex = modules.findIndex(m => m.id === moduleId);
    if (moduleIndex === -1) return;

    const module = modules[moduleIndex];
    const updatedModules = [...modules];
    updatedModules[moduleIndex] = {
      ...module,
      lessons: module.lessons.map(l => 
        l.id === lessonId 
          ? { 
              ...l, 
              quizQuestions: [...(l.quizQuestions || []), newQuestion] 
            } 
          : l
      )
    };
    setModules(updatedModules);
  };

  const updateQuizQuestion = (moduleId: string, lessonId: string, questionId: string, field: string, value: any) => {
    const moduleIndex = modules.findIndex(m => m.id === moduleId);
    if (moduleIndex === -1) return;

    const module = modules[moduleIndex];
    const updatedModules = [...modules];
    updatedModules[moduleIndex] = {
      ...module,
      lessons: module.lessons.map(l => 
        l.id === lessonId 
          ? {
              ...l,
              quizQuestions: l.quizQuestions?.map(q => 
                q.id === questionId ? { ...q, [field]: value } : q
              )
            }
          : l
      )
    };
    setModules(updatedModules);
  };

  const removeQuizQuestion = (moduleId: string, lessonId: string, questionId: string) => {
    const moduleIndex = modules.findIndex(m => m.id === moduleId);
    if (moduleIndex === -1) return;

    const module = modules[moduleIndex];
    const updatedModules = [...modules];
    updatedModules[moduleIndex] = {
      ...module,
      lessons: module.lessons.map(l => 
        l.id === lessonId 
          ? {
              ...l,
              quizQuestions: l.quizQuestions?.filter(q => q.id !== questionId)
            }
          : l
      )
    };
    setModules(updatedModules);
  };
  
  const handleFileSelect = (moduleId: string, files: File[]) => {
    // Simular upload
    const newFiles: UploadedFile[] = files.map(file => ({
      id: Date.now().toString() + Math.random(),
      name: file.name,
      size: file.size,
      type: file.type,
      url: URL.createObjectURL(file), // Em produção, seria a URL real após upload
      status: 'uploading',
      progress: 0,
    }));
    
    setUploadedFiles(prev => ({
      ...prev,
      [moduleId]: [...(prev[moduleId] || []), ...newFiles]
    }));
    
    // Simular progresso de upload
    newFiles.forEach(file => {
      let progress = 0;
      const interval = setInterval(() => {
        progress += Math.random() * 30;
        if (progress >= 100) {
          progress = 100;
          clearInterval(interval);
          setUploadedFiles(prev => ({
            ...prev,
            [moduleId]: prev[moduleId]?.map(f => 
              f.id === file.id ? { ...f, status: 'completed', progress: 100 } : f
            ) || []
          }));
        } else {
          setUploadedFiles(prev => ({
            ...prev,
            [moduleId]: prev[moduleId]?.map(f => 
              f.id === file.id ? { ...f, progress } : f
            ) || []
          }));
        }
      }, 200);
    });
  };
  
  const handleFileRemove = (moduleId: string, fileId: string) => {
    setUploadedFiles(prev => ({
      ...prev,
      [moduleId]: prev[moduleId]?.filter(f => f.id !== fileId) || []
    }));
  };
  
  const handleCategoriesChange = (newCategories: any[]) => {
    // Atualizar as categorias no store
    newCategories.forEach(category => {
      if (!categories.find(c => c.id === category.id)) {
        addCategory(category);
      }
    });
  };
  
  const tabs = [
    { id: 'basic', label: 'Informações Básicas', icon: '📝' },
    { id: 'content', label: 'Conteúdo do Curso', icon: '📚' },
    { id: 'categories', label: 'Gerenciar Categorias', icon: '🏷️' },
    { id: 'preview', label: 'Visualização', icon: '👁️' },
  ];
  
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex items-center space-x-4 mb-8">
        <button
          onClick={() => navigate('/admin/courses')}
          className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            {isEditing ? 'Editar Curso' : 'Novo Curso'}
          </h1>
          <p className="text-gray-600">
            {isEditing ? 'Atualize as informações do curso' : 'Preencha os dados para criar um novo curso'}
          </p>
        </div>
      </div>
      
      {/* Tabs */}
      <div className="border-b border-gray-200 mb-8">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </nav>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-8">
        {errors.general && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800 text-sm">{errors.general}</p>
          </div>
        )}
        
        {/* Tab: Informações Básicas */}
        {activeTab === 'basic' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Informações Básicas</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Título do Curso *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.title ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="Ex: React do Zero ao Avançado"
                />
                {errors.title && <p className="mt-1 text-sm text-red-600">{errors.title}</p>}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Categoria *
                </label>
                <div className="flex items-center space-x-2">
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className={`flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.category ? 'border-red-300' : 'border-gray-300'
                    }`}
                  >
                    <option value="">Selecione uma categoria</option>
                    {categories.map(category => (
                      <option key={category.id} value={category.name}>{category.name}</option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => setActiveTab('categories')}
                    className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title="Gerenciar categorias"
                  >
                    <Settings className="h-5 w-5" />
                  </button>
                </div>
                {errors.category && <p className="mt-1 text-sm text-red-600">{errors.category}</p>}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nível *
                </label>
                <select
                  value={formData.level}
                  onChange={(e) => setFormData({ ...formData, level: e.target.value as any })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {levels.map(level => (
                    <option key={level.value} value={level.value}>{level.label}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Preço (R$) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.price ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="199.90"
                />
                {errors.price && <p className="mt-1 text-sm text-red-600">{errors.price}</p>}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Duração (horas) *
                </label>
                <input
                  type="number"
                  min="1"
                  value={formData.duration}
                  onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Insira a duração em horas"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Duração total do curso em horas
                </p>
              </div>
              
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Instrutor *
                </label>
                <input
                  type="text"
                  value={formData.instructor}
                  onChange={(e) => setFormData({ ...formData, instructor: e.target.value })}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.instructor ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="Nome do instrutor"
                />
                {errors.instructor && <p className="mt-1 text-sm text-red-600">{errors.instructor}</p>}
              </div>
              
              <div className="md:col-span-2">
                <ImageUploader
                  onImageSelect={(imageUrl) => setFormData({ ...formData, image: imageUrl })}
                  currentImage={formData.image}
                  label="Imagem do Curso *"
                  description="Arraste e solte uma imagem aqui ou clique para selecionar"
                />
                {errors.image && <p className="mt-1 text-sm text-red-600">{errors.image}</p>}
              </div>
              
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Descrição Curta *
                </label>
                <input
                  type="text"
                  value={formData.shortDescription}
                  onChange={(e) => setFormData({ ...formData, shortDescription: e.target.value })}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.shortDescription ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="Descrição que aparece no card do curso"
                  maxLength={120}
                />
                {errors.shortDescription && <p className="mt-1 text-sm text-red-600">{errors.shortDescription}</p>}
                <p className="mt-1 text-xs text-gray-500">{formData.shortDescription.length}/120 caracteres</p>
              </div>
              
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Descrição Completa *
                </label>
                <textarea
                  rows={4}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.description ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="Descrição detalhada do curso, objetivos e o que o aluno irá aprender"
                />
                {errors.description && <p className="mt-1 text-sm text-red-600">{errors.description}</p>}
              </div>
            </div>
          </div>
        )}
        
        {/* Tab: Conteúdo do Curso */}
        {activeTab === 'content' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Conteúdo do Curso</h2>
              <button
                type="button"
                onClick={addModule}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                disabled={loadingModules}
              >
                <Plus className="h-4 w-4" />
                <span>Adicionar Módulo</span>
              </button>
            </div>
            
            {loadingModules ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-600 border-t-transparent mx-auto mb-4" />
                <p className="text-gray-600">Carregando módulos existentes...</p>
              </div>
            ) : (
              <div className="space-y-6">
                {modules.map((module, index) => (
                  <div key={module.id} className="border border-gray-200 rounded-lg p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <Video className="h-5 w-5 text-blue-600" />
                        <h3 className="font-medium text-gray-900">Módulo {index + 1}</h3>
                      </div>
                      {modules.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeModule(module.id)}
                          className="text-red-600 hover:text-red-700 p-1"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Título do Módulo *
                        </label>
                        <input
                          type="text"
                          value={module.title}
                          onChange={(e) => updateModule(module.id, 'title', e.target.value)}
                          className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                            errors[`module-${index}-title`] ? 'border-red-300' : 'border-gray-300'
                          }`}
                          placeholder="Nome do módulo"
                        />
                        {errors[`module-${index}-title`] && (
                          <p className="mt-1 text-sm text-red-600">{errors[`module-${index}-title`]}</p>
                        )}
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Descrição do Módulo
                        </label>
                        <input
                          type="text"
                          value={module.description}
                          onChange={(e) => updateModule(module.id, 'description', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Descrição do módulo"
                        />
                      </div>
                    </div>

                    {/* Aulas do Módulo */}
                    <div className="border-t border-gray-200 pt-4">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="font-medium text-gray-900">Aulas do Módulo</h4>
                        <button
                          type="button"
                          onClick={() => addLesson(module.id)}
                          className="flex items-center space-x-2 px-3 py-1 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors text-sm"
                        >
                          <Plus className="h-3 w-3" />
                          <span>Adicionar Aula</span>
                        </button>
                      </div>

                      <div className="space-y-4">
                        {module.lessons.map((lesson, lessonIndex) => {
                          const LessonIcon = lesson.type === 'video' ? Video : lesson.type === 'pdf' ? FileText : HelpCircle;
                          
                          return (
                            <div key={lesson.id} className="border border-gray-100 rounded-lg p-4 bg-gray-50">
                              <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center space-x-2">
                                  <LessonIcon className="h-4 w-4 text-gray-600" />
                                  <span className="text-sm font-medium text-gray-700">Aula {lessonIndex + 1}</span>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => removeLesson(module.id, lesson.id)}
                                  className="text-red-500 hover:text-red-700 p-1"
                                  title="Excluir aula"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </button>
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                <div>
                                  <label className="block text-xs font-medium text-gray-600 mb-1">
                                    Título da Aula *
                                  </label>
                                  <input
                                    type="text"
                                    value={lesson.title}
                                    onChange={(e) => updateLesson(module.id, lesson.id, 'title', e.target.value)}
                                    className={`w-full px-2 py-1 border rounded text-sm focus:ring-1 focus:ring-blue-500 focus:border-transparent ${
                                      errors[`module-${index}-lesson-${lessonIndex}-title`] ? 'border-red-300' : 'border-gray-300'
                                    }`}
                                    placeholder="Nome da aula"
                                  />
                                  {errors[`module-${index}-lesson-${lessonIndex}-title`] && (
                                    <p className="mt-1 text-xs text-red-600">{errors[`module-${index}-lesson-${lessonIndex}-title`]}</p>
                                  )}
                                </div>

                                <div>
                                  <label className="block text-xs font-medium text-gray-600 mb-1">
                                    Tipo de Conteúdo
                                  </label>
                                  <select
                                    value={lesson.type}
                                    onChange={(e) => updateLesson(module.id, lesson.id, 'type', e.target.value)}
                                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                                  >
                                    <option value="video">Vídeo</option>
                                    <option value="pdf">PDF/PPT</option>
                                    <option value="quiz">Quiz</option>
                                  </select>
                                </div>

                                <div>
                                  <label className="block text-xs font-medium text-gray-600 mb-1">
                                    Duração (min)
                                  </label>
                                  <input
                                    type="number"
                                    min="1"
                                    value={lesson.duration || 15}
                                    onChange={(e) => updateLesson(module.id, lesson.id, 'duration', parseInt(e.target.value) || 15)}
                                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="15"
                                  />
                                </div>
                              </div>

                              {lesson.type !== 'quiz' && (
                                <div className="mt-3">
                                  <label className="block text-xs font-medium text-gray-600 mb-1">
                                    {lesson.type === 'video' ? 'URL do Vídeo' : 'URL do Arquivo (Google Drive)'}
                                  </label>
                                  <input
                                    type="text"
                                    value={lesson.contentUrl || lesson.content}
                                    onChange={(e) => {
                                      updateLesson(module.id, lesson.id, 'contentUrl', e.target.value);
                                      updateLesson(module.id, lesson.id, 'content', e.target.value);
                                    }}
                                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                                    placeholder={lesson.type === 'video' ? 'https://www.youtube.com/watch?v=...' : 'https://drive.google.com/file/d/.../view'}
                                  />
                                </div>
                              )}

                              {lesson.type === 'quiz' && (
                                <div className="mt-3 space-y-3">
                                  <div className="flex items-center justify-between">
                                    <label className="block text-xs font-medium text-gray-600">
                                      Perguntas do Quiz
                                    </label>
                                    <button
                                      type="button"
                                      onClick={() => addQuizQuestion(module.id, lesson.id)}
                                      className="flex items-center space-x-1 px-2 py-1 bg-blue-500 text-white rounded text-xs hover:bg-blue-600"
                                    >
                                      <Plus className="h-3 w-3" />
                                      <span>Adicionar Pergunta</span>
                                    </button>
                                  </div>

                                  {lesson.quizQuestions?.map((question, qIndex) => (
                                    <div key={question.id} className="border border-gray-200 rounded p-3 bg-white">
                                      <div className="flex items-center justify-between mb-2">
                                        <span className="text-xs font-medium text-gray-700">Pergunta {qIndex + 1}</span>
                                        <button
                                          type="button"
                                          onClick={() => removeQuizQuestion(module.id, lesson.id, question.id)}
                                          className="text-red-500 hover:text-red-700"
                                        >
                                          <Trash2 className="h-3 w-3" />
                                        </button>
                                      </div>

                                      <div className="space-y-2">
                                        <input
                                          type="text"
                                          value={question.question}
                                          onChange={(e) => updateQuizQuestion(module.id, lesson.id, question.id, 'question', e.target.value)}
                                          className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                                          placeholder="Digite a pergunta..."
                                        />

                                        <div className="grid grid-cols-1 gap-2">
                                          {question.options.map((option, optIndex) => (
                                            <div key={optIndex} className="flex items-center space-x-2">
                                              <input
                                                type="radio"
                                                name={`correct-${question.id}`}
                                                checked={question.correctAnswer === optIndex}
                                                onChange={() => updateQuizQuestion(module.id, lesson.id, question.id, 'correctAnswer', optIndex)}
                                                className="text-green-600"
                                              />
                                              <input
                                                type="text"
                                                value={option}
                                                onChange={(e) => {
                                                  const newOptions = [...question.options];
                                                  newOptions[optIndex] = e.target.value;
                                                  updateQuizQuestion(module.id, lesson.id, question.id, 'options', newOptions);
                                                }}
                                                className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm"
                                                placeholder={`Opção ${optIndex + 1}`}
                                              />
                                            </div>
                                          ))}
                                        </div>
                                        <p className="text-xs text-gray-500">Selecione o botão de rádio da resposta correta</p>
                                      </div>
                                    </div>
                                  ))}

                                  {(!lesson.quizQuestions || lesson.quizQuestions.length === 0) && (
                                    <div className="text-center py-4 text-gray-500 text-sm">
                                      Nenhuma pergunta adicionada. Clique em "Adicionar Pergunta" para começar.
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
        
        {/* Tab: Gerenciar Categorias */}
        {activeTab === 'categories' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <CategoryManager
              categories={categories}
              onCategoriesChange={handleCategoriesChange}
              selectedCategory={formData.category}
              onCategorySelect={(categoryName) => {
                setFormData({ ...formData, category: categoryName });
                setActiveTab('basic');
              }}
            />
          </div>
        )}
        
        {/* Tab: Visualização */}
        {activeTab === 'preview' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="text-center py-12">
              <div className="mx-auto h-24 w-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <Video className="h-12 w-12 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Visualização do Curso
              </h3>
              <p className="text-gray-600">
                A visualização será implementada em breve
              </p>
            </div>
          </div>
        )}

        {/* Botões de Ação */}
        <div className="flex items-center justify-between pt-6 border-t border-gray-200">
          <button
            type="button"
            onClick={() => navigate('/admin/courses')}
            className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Voltar</span>
          </button>
          
          <button
            type="submit"
            disabled={loading}
            className="flex items-center space-x-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            <Save className="h-4 w-4" />
            <span>{loading ? 'Salvando...' : isEditing ? 'Atualizar Curso' : 'Criar Curso'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};

export default AdminCourseForm;