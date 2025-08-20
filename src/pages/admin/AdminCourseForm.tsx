import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save, Plus, Trash2, Video, FileText, HelpCircle, Settings } from 'lucide-react';
import { useCourseStore } from '../../store/courseStore';
import { useCategoryStore } from '../../store/categoryStore';
import { Course } from '../../types';
import { QuizBuilder } from '../../components/admin/QuizBuilder';
import { FileUploader } from '../../components/admin/FileUploader';
import { ImageUploader } from '../../components/admin/ImageUploader';
import { CategoryManager } from '../../components/admin/CategoryManager';

interface CourseModule {
  id: string;
  title: string;
  type: 'video' | 'pdf' | 'quiz';
  content: string;
  duration?: number;
  quizQuestions?: any[];
  files?: any[];
  order: number;
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
  const { courses, addCourse, updateCourse } = useCourseStore();
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
      title: 'Introdução', 
      type: 'video', 
      content: '', 
      duration: 15, 
      order: 0,
      files: []
    },
  ]);
  
  const [uploadedFiles, setUploadedFiles] = useState<{ [moduleId: string]: UploadedFile[] }>({});
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('basic');
  const [showCategoryManager, setShowCategoryManager] = useState(false);
  
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
      if (module.type === 'quiz' && (!module.quizQuestions || module.quizQuestions.length === 0)) {
        newErrors[`module-${index}-quiz`] = `Módulo ${index + 1}: Adicione pelo menos uma pergunta ao questionário`;
      }
    });
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      setActiveTab('basic'); // Voltar para a aba básica se houver erros
      return;
    }
    
    setLoading(true);
    
    try {
      const courseData: Omit<Course, 'id' | 'createdAt' | 'updatedAt' | 'rating' | 'studentsCount'> = {
        ...formData,
      };
      
      if (isEditing && existingCourse) {
        await updateCourse(existingCourse.id, courseData);
      } else {
        await addCourse(courseData);
      }
      
      navigate('/admin/courses');
    } catch (error) {
      setErrors({ general: 'Erro ao salvar curso. Tente novamente.' });
    } finally {
      setLoading(false);
    }
  };
  
  const addModule = () => {
    const newModule: CourseModule = {
      id: Date.now().toString(),
      title: '',
      type: 'video',
      content: '',
      duration: 0,
      order: modules.length,
      files: [],
    };
    setModules([...modules, newModule]);
  };
  
  const removeModule = (moduleId: string) => {
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
              >
                <Plus className="h-4 w-4" />
                <span>Adicionar Módulo</span>
              </button>
            </div>
            
            <div className="space-y-6">
              {modules.map((module, index) => {
                const ModuleIcon = moduleTypes.find(t => t.value === module.type)?.icon || Video;
                
                return (
                  <div key={module.id} className="border border-gray-200 rounded-lg p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <ModuleIcon className="h-5 w-5 text-blue-600" />
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
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Título *
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
                          Tipo
                        </label>
                        <select
                          value={module.type}
                          onChange={(e) => updateModule(module.id, 'type', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          {moduleTypes.map(type => (
                            <option key={type.value} value={type.value}>{type.label}</option>
                          ))}
                        </select>
                      </div>
                      
                      {module.type === 'video' && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Duração (min)
                          </label>
                          <input
                            type="number"
                            min="1"
                            value={module.duration || 0}
                            onChange={(e) => updateModule(module.id, 'duration', parseInt(e.target.value) || 0)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="15"
                          />
                        </div>
                      )}
                    </div>
                    
                    {/* Conteúdo específico por tipo */}
                    {module.type === 'quiz' ? (
                      <div>
                        <QuizBuilder
                          questions={module.quizQuestions || []}
                          onChange={(questions) => updateModule(module.id, 'quizQuestions', questions)}
                        />
                        {errors[`module-${index}-quiz`] && (
                          <p className="mt-2 text-sm text-red-600">{errors[`module-${index}-quiz`]}</p>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            {module.type === 'video' ? 'URL do Vídeo ou Upload' : 'URL do PDF ou Upload'}
                          </label>
                          <input
                            type="text"
                            value={module.content}
                            onChange={(e) => updateModule(module.id, 'content', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder={
                              module.type === 'video' 
                                ? 'https://youtube.com/watch?v=... ou faça upload abaixo' 
                                : 'https://exemplo.com/arquivo.pdf ou faça upload abaixo'
                            }
                          />
                        </div>
                        
                        <FileUploader
                          accept={moduleTypes.find(t => t.value === module.type)?.accept || '*/*'}
                          multiple={false}
                          maxSize={module.type === 'video' ? 500 : 50}
                          onFileSelect={(files) => handleFileSelect(module.id, files)}
                          uploadedFiles={uploadedFiles[module.id] || []}
                          onFileRemove={(fileId) => handleFileRemove(module.id, fileId)}
                          label={`Upload de ${module.type === 'video' ? 'Vídeo' : 'PDF/PPT'}`}
                          description={`Arraste e solte ${module.type === 'video' ? 'vídeos' : 'arquivos PDF ou PowerPoint'} aqui ou clique para selecionar`}
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
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
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Visualização do Curso</h2>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Preview do Card */}
              <div className="lg:col-span-2">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Como aparecerá no catálogo:</h3>
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden max-w-sm">
                  {formData.image && (
                    <img
                      src={formData.image}
                      alt={formData.title}
                      className="w-full h-48 object-cover"
                    />
                  )}
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-blue-600 font-medium uppercase">
                        {formData.category}
                      </span>
                      <span className="text-sm font-bold text-gray-900">
                        R$ {formData.price.toFixed(2)}
                      </span>
                    </div>
                    <h4 className="font-bold text-gray-900 mb-2">
                      {formData.title || 'Título do curso'}
                    </h4>
                    <p className="text-gray-600 text-sm mb-3">
                      {formData.shortDescription || 'Descrição curta do curso'}
                    </p>
                    <div className="flex items-center justify-between text-sm text-gray-500">
                      <span>{formData.duration}h</span>
                      <span>Por {formData.instructor || 'Instrutor'}</span>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Resumo do Conteúdo */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Resumo do Conteúdo:</h3>
                <div className="space-y-3">
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-sm font-medium text-gray-700">Total de Módulos</p>
                    <p className="text-2xl font-bold text-blue-600">{modules.length}</p>
                  </div>
                  
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-sm font-medium text-gray-700">Duração Total</p>
                    <p className="text-2xl font-bold text-green-600">{formData.duration}h</p>
                  </div>
                  
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-sm font-medium text-gray-700">Tipos de Conteúdo</p>
                    <div className="mt-2 space-y-1">
                      {moduleTypes.map(type => {
                        const count = modules.filter(m => m.type === type.value).length;
                        return count > 0 ? (
                          <div key={type.value} className="flex items-center justify-between text-sm">
                            <span>{type.label}</span>
                            <span className="font-medium">{count}</span>
                          </div>
                        ) : null;
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Botões de Ação */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            {activeTab !== 'basic' && (
              <button
                type="button"
                onClick={() => {
                  const currentIndex = tabs.findIndex(tab => tab.id === activeTab);
                  if (currentIndex > 0) {
                    setActiveTab(tabs[currentIndex - 1].id);
                  }
                }}
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Anterior
              </button>
            )}
            
            {activeTab !== 'preview' && (
              <button
                type="button"
                onClick={() => {
                  const currentIndex = tabs.findIndex(tab => tab.id === activeTab);
                  if (currentIndex < tabs.length - 1) {
                    setActiveTab(tabs[currentIndex + 1].id);
                  }
                }}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Próximo
              </button>
            )}
          </div>
          
          <div className="flex items-center space-x-4">
            <button
              type="button"
              onClick={() => navigate('/admin/courses')}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center space-x-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
            >
              <Save className="h-4 w-4" />
              <span>{loading ? 'Salvando...' : isEditing ? 'Atualizar Curso' : 'Criar Curso'}</span>
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};