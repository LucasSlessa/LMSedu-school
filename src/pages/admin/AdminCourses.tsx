import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, Edit, Trash2, Users, DollarSign, Eye, Loader2 } from 'lucide-react';
import { useCourseStore } from '../../store/courseStore';

export const AdminCourses: React.FC = () => {
  const { courses, fetchCourses, deleteCourse } = useCourseStore();
  
  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Todas');
  const [deletingCourseId, setDeletingCourseId] = useState<string | null>(null);
  
  const categories = [
    'Todas',
    'Desenvolvimento Web',
    'Programação',
    'Backend',
    'Design',
    'Data Science',
  ];
  
  const filteredCourses = courses.filter(course => {
    const matchesSearch = (course.title?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
                         (course.instructor?.toLowerCase() || '').includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'Todas' || course.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });
  
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

  const handleDeleteCourse = async (courseId: string, courseTitle: string) => {
    if (!confirm(`Tem certeza que deseja excluir o curso "${courseTitle}"? Esta ação não pode ser desfeita.`)) {
      return;
    }

    try {
      setDeletingCourseId(courseId);
      await deleteCourse(courseId);
      // Recarregar a lista de cursos
      await fetchCourses();
    } catch (error: any) {
      console.error('Erro ao excluir curso:', error);
      const errorMessage = error.message || 'Erro ao excluir curso. Tente novamente.';
      alert(errorMessage);
    } finally {
      setDeletingCourseId(null);
    }
  };
  
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gerenciar Cursos</h1>
          <p className="mt-2 text-gray-600">
            {filteredCourses.length} curso{filteredCourses.length !== 1 ? 's' : ''} encontrado{filteredCourses.length !== 1 ? 's' : ''}
          </p>
        </div>
        
        <Link
          to="/admin/courses/new"
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="h-4 w-4 mr-2" />
          Novo Curso
        </Link>
      </div>
      
      {/* Filtros */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Busca */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Buscar cursos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          {/* Categoria */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {categories.map((category, index) => (
              <option key={`${category}-${index}`} value={category}>
                {category}
              </option>
            ))}
          </select>
        </div>
      </div>
      
      {/* Lista de Cursos */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Curso
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Categoria
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Nível
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Preço
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Alunos
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredCourses.map((course) => (
                <tr key={course.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <img
                        src={course.image}
                        alt={course.title}
                        className="w-12 h-12 rounded-lg object-cover mr-4"
                      />
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {course.title}
                        </div>
                        <div className="text-sm text-gray-500">
                          Por {course.instructor}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-gray-900">{course.category}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getLevelColor(course.level)}`}>
                      {getLevelText(course.level)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center text-sm text-gray-900">
                      <DollarSign className="h-4 w-4 mr-1" />
                      {formatPrice(course.price)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center text-sm text-gray-900">
                      <Users className="h-4 w-4 mr-1" />
                      {course.studentsCount}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                      Ativo
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end space-x-2">
                      <Link
                        to={`/courses/${course.id}`}
                        className="text-gray-600 hover:text-blue-600 p-1 rounded"
                        title="Visualizar"
                      >
                        <Eye className="h-4 w-4" />
                      </Link>
                      <Link
                        to={`/admin/courses/${course.id}/edit`}
                        className="text-blue-600 hover:text-blue-700 p-1 rounded"
                        title="Editar"
                      >
                        <Edit className="h-4 w-4" />
                      </Link>
                      <button
                        onClick={() => handleDeleteCourse(course.id, course.title)}
                        disabled={deletingCourseId === course.id}
                        className={`p-1 rounded transition-colors ${
                          deletingCourseId === course.id
                            ? 'text-gray-400 cursor-not-allowed'
                            : 'text-red-600 hover:text-red-700'
                        }`}
                        title="Excluir"
                      >
                        {deletingCourseId === course.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {filteredCourses.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <Search className="mx-auto h-12 w-12" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum curso encontrado</h3>
            <p className="text-gray-500 mb-6">Tente ajustar os filtros ou criar um novo curso</p>
            <Link
              to="/admin/courses/new"
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="h-4 w-4 mr-2" />
              Criar Primeiro Curso
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};