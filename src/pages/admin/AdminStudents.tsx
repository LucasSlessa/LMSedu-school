import React, { useState, useEffect } from 'react';
import { Search, Filter, Mail, Calendar, BookOpen, Award, Eye, MoreVertical, Loader2 } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useCourseStore } from '../../store/courseStore';
import { usersAPI, enrollmentsAPI } from '../../lib/api';

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  status: string;
  avatar_url?: string;
  created_at: string;
  last_login?: string;
}

export const AdminStudents: React.FC = () => {
  const { user: currentUser } = useAuthStore();
  const { enrollments, courses } = useCourseStore();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedCourseId, setSelectedCourseId] = useState<string>('');
  
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        const data = await usersAPI.getAll();
        setUsers(data);
        setError(null);
      } catch (err) {
        console.error('Erro ao buscar usuários:', err);
        setError('Erro ao carregar usuários');
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);
  
  const students = users.filter(user => user.role === 'student' || user.role === 'admin');
  
  const getStudentStats = (studentId: string) => {
    // Placeholder até implementarmos fetch de matrículas por usuário
    const userEnrollments = enrollments; // TODO: filtrar por userId quando disponível no store
    const coursesEnrolled = userEnrollments.length;
    const coursesCompleted = userEnrollments.filter(e => e.status === 'completed').length;
    const totalSpent = userEnrollments.reduce((sum, e) => sum + (e.course.price || 0), 0);
    const lastActivity = userEnrollments.length > 0 ? new Date(Math.max(...userEnrollments.map(e => new Date(e.createdAt).getTime()))) : null;
    
    return {
      coursesEnrolled,
      coursesCompleted,
      totalSpent,
      lastActivity
    };
  };
  
  const filteredStudents = students.filter(student => {
    const matchesSearch = student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         student.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (!matchesSearch) return false;
    
    if (statusFilter === 'all') return true;
    
    const stats = getStudentStats(student.id);
    if (statusFilter === 'active') return stats.coursesEnrolled > 0;
    if (statusFilter === 'inactive') return stats.coursesEnrolled === 0;
    
    return true;
  });
  
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(price);
  };
  
  const formatDate = (date: Date | null) => {
    if (!date) return 'Nunca';
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(date);
  };
  
  const getStatusColor = (coursesEnrolled: number) => {
    if (coursesEnrolled === 0) return 'bg-gray-100 text-gray-800';
    if (coursesEnrolled >= 3) return 'bg-green-100 text-green-800';
    return 'bg-blue-100 text-blue-800';
  };
  
  const getStatusText = (coursesEnrolled: number) => {
    if (coursesEnrolled === 0) return 'Inativo';
    if (coursesEnrolled >= 3) return 'Muito Ativo';
    return 'Ativo';
  };

  const toggleRole = async (user: User) => {
    const newRole = user.role === 'admin' ? 'student' : 'admin';
    try {
      await usersAPI.update(user.id, { role: newRole });
      setUsers(prev => prev.map(u => u.id === user.id ? { ...u, role: newRole } : u));
    } catch (err) {
      alert('Erro ao alterar papel do usuário');
    }
  };

  const grantCourse = async (user: User) => {
    if (!selectedCourseId) {
      alert('Selecione um curso');
      return;
    }
    try {
      await enrollmentsAPI.adminGrant(user.id, selectedCourseId);
      alert('Curso liberado para o aluno');
    } catch (err) {
      alert('Erro ao liberar curso');
    }
  };

  const completeCourse = async (user: User) => {
    if (!selectedCourseId) {
      alert('Selecione um curso');
      return;
    }
    try {
      await enrollmentsAPI.adminComplete(user.id, selectedCourseId);
      alert('Curso concluído e certificado liberado');
    } catch (err) {
      alert('Erro ao concluir curso');
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          <span className="ml-2 text-gray-600">Carregando usuários...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{error}</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Gerenciar Alunos</h1>
        <p className="mt-2 text-gray-600">
          {filteredStudents.length} aluno{filteredStudents.length !== 1 ? 's' : ''} encontrado{filteredStudents.length !== 1 ? 's' : ''}
        </p>
      </div>
      
      {/* Seletor de curso para ações */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 mb-6 flex items-center space-x-3">
        <label className="text-sm text-gray-700">Curso para ações:</label>
        <select
          value={selectedCourseId}
          onChange={(e) => setSelectedCourseId(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="">Selecione um curso</option>
          {courses.map((c) => (
            <option key={c.id} value={c.id}>{c.title}</option>
          ))}
        </select>
      </div>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="bg-blue-100 p-3 rounded-lg">
              <BookOpen className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total de Usuários</p>
              <p className="text-2xl font-bold text-gray-900">{students.length}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="bg-green-100 p-3 rounded-lg">
              <Award className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Admins</p>
              <p className="text-2xl font-bold text-gray-900">{users.filter(u => u.role === 'admin').length}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="bg-purple-100 p-3 rounded-lg">
              <Calendar className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Novos este Mês</p>
              <p className="text-2xl font-bold text-gray-900">
                {users.filter(s => {
                  const createdDate = new Date(s.created_at);
                  const now = new Date();
                  return createdDate.getMonth() === now.getMonth() && 
                         createdDate.getFullYear() === now.getFullYear();
                }).length}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="bg-orange-100 p-3 rounded-lg">
              <Mail className="h-6 w-6 text-orange-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total de Matrículas</p>
              <p className="text-2xl font-bold text-gray-900">{enrollments.length}</p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Filtros */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 mb-8">
        <div className="flex items-center space-x-2 mb-4">
          <Filter className="h-5 w-5 text-gray-600" />
          <h3 className="text-lg font-semibold text-gray-900">Filtros</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Buscar usuários..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">Todos os Status</option>
            <option value="active">Com matrículas</option>
            <option value="inactive">Sem matrículas</option>
          </select>
        </div>
      </div>
      
      {/* Lista de Usuários */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Usuário
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Papel
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Criado em
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredStudents.map((user) => {
                return (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-blue-600 font-medium">
                            {user.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {user.name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {user.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800">
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {new Date(user.created_at).toLocaleDateString('pt-BR')}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => toggleRole(user)}
                          className="text-purple-600 hover:text-purple-700 p-1 rounded text-sm border border-purple-200 px-3 py-1 disabled:opacity-50"
                          title="Alternar papel (admin/aluno)"
                          disabled={currentUser?.id === user.id}
                        >
                          Alternar Papel
                        </button>

                        <button
                          onClick={() => grantCourse(user)}
                          className="text-blue-600 hover:text-blue-700 p-1 rounded text-sm border border-blue-200 px-3 py-1"
                          title="Liberar curso para o aluno"
                          disabled={!selectedCourseId}
                        >
                          Liberar Curso
                        </button>

                        <button
                          onClick={() => completeCourse(user)}
                          className="text-green-600 hover:text-green-700 p-1 rounded text-sm border border-green-200 px-3 py-1"
                          title="Marcar curso como concluído e liberar certificado"
                          disabled={!selectedCourseId}
                        >
                          Liberar Certificado
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        
        {filteredStudents.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <Search className="mx-auto h-12 w-12" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum aluno encontrado</h3>
            <p className="text-gray-500">Tente ajustar os filtros de busca</p>
          </div>
        )}
      </div>
    </div>
  );
};
