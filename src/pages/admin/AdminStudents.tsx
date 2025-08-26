import React, { useState, useEffect } from 'react';
import { Search, Filter, Mail, Calendar, BookOpen, Award, Eye, MoreVertical, Loader2, KeyRound, CheckCircle2 } from 'lucide-react';
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

  // UI state for modals/actions
  const [modalType, setModalType] = useState<'none' | 'password' | 'grant' | 'certificate'>('none');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [tempPassword, setTempPassword] = useState<string | null>(null);
  const [selectedCourseIds, setSelectedCourseIds] = useState<string[]>([]);
  const [userEnrollments, setUserEnrollments] = useState<any[]>([]);
  const [selectedCertCourseIds, setSelectedCertCourseIds] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  
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
    const userEnrollmentsList = enrollments; // TODO: filtrar por userId quando disponível no store
    const coursesEnrolled = userEnrollmentsList.length;
    const coursesCompleted = userEnrollmentsList.filter(e => e.status === 'completed').length;
    const totalSpent = userEnrollmentsList.reduce((sum, e) => sum + (e.course.price || 0), 0);
    const lastActivity = userEnrollmentsList.length > 0 ? new Date(Math.max(...userEnrollmentsList.map(e => new Date(e.createdAt).getTime()))) : null;
    
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

  // ===== Modals handlers =====
  const openPasswordModal = async (user: User) => {
    if (currentUser?.role !== 'admin') return;
    setSelectedUser(user);
    setTempPassword(null);
    setFeedback(null);
    setModalType('password');
  };

  const generateTempPassword = async () => {
    if (!selectedUser) return;
    try {
      setSubmitting(true);
      const res = await usersAPI.resetPasswordTemp(selectedUser.id);
      setTempPassword(res.tempPassword);
      setFeedback('Senha temporária gerada com sucesso.');
    } catch (e) {
      setFeedback('Erro ao gerar senha temporária.');
    } finally {
      setSubmitting(false);
    }
  };

  const openGrantCoursesModal = (user: User) => {
    if (currentUser?.role !== 'admin') return;
    setSelectedUser(user);
    setSelectedCourseIds([]);
    setFeedback(null);
    setModalType('grant');
  };

  const confirmGrantCourses = async () => {
    if (!selectedUser || selectedCourseIds.length === 0) return;
    try {
      setSubmitting(true);
      // Atribui cada curso selecionado ao usuário
      for (const courseId of selectedCourseIds) {
        await enrollmentsAPI.adminGrant(selectedUser.id, courseId);
      }
      setFeedback('Cursos liberados com sucesso.');
    } catch (e) {
      setFeedback('Erro ao liberar cursos.');
    } finally {
      setSubmitting(false);
    }
  };

  const openCertificatesModal = async (user: User) => {
    if (currentUser?.role !== 'admin') return;
    setSelectedUser(user);
    setSelectedCertCourseIds([]);
    setFeedback(null);
    try {
      setSubmitting(true);
      const list = await enrollmentsAPI.adminListUser(user.id);
      setUserEnrollments(list);
    } catch (e) {
      setUserEnrollments([]);
    } finally {
      setSubmitting(false);
      setModalType('certificate');
    }
  };

  const confirmGrantCertificates = async () => {
    if (!selectedUser || selectedCertCourseIds.length === 0) return;
    try {
      setSubmitting(true);
      for (const courseId of selectedCertCourseIds) {
        await enrollmentsAPI.adminComplete(selectedUser.id, courseId);
      }
      setFeedback('Certificados liberados com sucesso.');
    } catch (e) {
      setFeedback('Erro ao liberar certificados.');
    } finally {
      setSubmitting(false);
    }
  };

  const closeModal = () => {
    setModalType('none');
    setSelectedUser(null);
    setTempPassword(null);
    setSelectedCourseIds([]);
    setSelectedCertCourseIds([]);
    setFeedback(null);
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
        <h1 className="text-3xl font-bold text-gray-900">Gerenciar Usuários</h1>
        <p className="mt-2 text-gray-600">
          {filteredStudents.length} usuário{filteredStudents.length !== 1 ? 's' : ''} encontrado{filteredStudents.length !== 1 ? 's' : ''}
        </p>
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
            <option value="all">Todos</option>
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
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Usuário</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Papel</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Criado em</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredStudents.map((user) => {
                return (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-blue-600 font-medium">{user.name.charAt(0).toUpperCase()}</span>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{user.name}</div>
                          <div className="text-sm text-gray-500">{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800">{user.role}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{new Date(user.created_at).toLocaleDateString('pt-BR')}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        {/* Consultar senha (apenas admin e não para si mesmo) */}
                        {currentUser?.role === 'admin' && currentUser?.id !== user.id && (
                          <button
                            onClick={() => openPasswordModal(user)}
                            className="text-amber-700 hover:text-amber-800 p-1 rounded text-sm border border-amber-300 px-3 py-1 flex items-center space-x-1"
                            title="Consultar senha (gera temporária)"
                          >
                            <KeyRound className="h-4 w-4" />
                            <span>Consultar Senha</span>
                          </button>
                        )}

                        {/* Alternar papel */}
                        <button
                          onClick={() => toggleRole(user)}
                          className="text-purple-600 hover:text-purple-700 p-1 rounded text-sm border border-purple-200 px-3 py-1 disabled:opacity-50"
                          title="Alternar papel (admin/aluno)"
                          disabled={currentUser?.id === user.id}
                        >
                          Alternar Papel
                        </button>

                        {/* Liberar curso */}
                        <button
                          onClick={() => openGrantCoursesModal(user)}
                          className="text-blue-600 hover:text-blue-700 p-1 rounded text-sm border border-blue-200 px-3 py-1"
                          title="Liberar curso para o usuário"
                        >
                          Liberar Curso
                        </button>

                        {/* Liberar certificado */}
                        <button
                          onClick={() => openCertificatesModal(user)}
                          className="text-green-600 hover:text-green-700 p-1 rounded text-sm border border-green-200 px-3 py-1"
                          title="Liberar certificado para o usuário"
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
      </div>

      {/* ===== Modals Section ===== */}
      {modalType !== 'none' && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white w-full max-w-xl rounded-xl shadow-lg border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">
                {modalType === 'password' && 'Consultar senha (gera temporária)'}
                {modalType === 'grant' && 'Liberar cursos para o usuário'}
                {modalType === 'certificate' && 'Liberar certificados para o usuário'}
              </h3>
              <button onClick={closeModal} className="text-gray-500 hover:text-gray-700">✕</button>
            </div>

            <div className="px-6 py-4 space-y-4">
              {modalType === 'password' && (
                <div>
                  <p className="text-sm text-gray-700 mb-3">Usuário: <span className="font-medium">{selectedUser?.name}</span> ({selectedUser?.email})</p>
                  <button
                    onClick={generateTempPassword}
                    className="bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-lg disabled:opacity-50"
                    disabled={submitting}
                  >
                    {submitting ? 'Gerando...' : 'Gerar senha temporária'}
                  </button>
                  {tempPassword && (
                    <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-center space-x-2">
                      <KeyRound className="h-4 w-4 text-amber-700" />
                      <div>
                        <p className="text-sm text-gray-800">Senha temporária:</p>
                        <p className="font-mono text-lg">{tempPassword}</p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {modalType === 'grant' && (
                <div>
                  <p className="text-sm text-gray-700 mb-3">Selecione um ou mais cursos para liberar para <span className="font-medium">{selectedUser?.name}</span></p>
                  <div className="max-h-64 overflow-auto border border-gray-200 rounded-lg">
                    <ul>
                      {courses.map((c) => (
                        <li key={c.id} className="flex items-center px-4 py-2 border-b border-gray-100 last:border-b-0">
                          <input
                            type="checkbox"
                            className="mr-3"
                            checked={selectedCourseIds.includes(c.id)}
                            onChange={(e) => {
                              if (e.target.checked) setSelectedCourseIds(prev => [...prev, c.id]);
                              else setSelectedCourseIds(prev => prev.filter(id => id !== c.id));
                            }}
                          />
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900">{c.title}</p>
                            <p className="text-xs text-gray-500">{c.level} • {c.duration}h</p>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="mt-4 flex items-center justify-end space-x-2">
                    {feedback && <span className="text-sm text-green-700 flex items-center"><CheckCircle2 className="h-4 w-4 mr-1" />{feedback}</span>}
                    <button onClick={closeModal} className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700">Cancelar</button>
                    <button
                      onClick={confirmGrantCourses}
                      className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
                      disabled={submitting || selectedCourseIds.length === 0}
                    >
                      {submitting ? 'Liberando...' : 'Liberar Cursos'}
                    </button>
                  </div>
                </div>
              )}

              {modalType === 'certificate' && (
                <div>
                  <p className="text-sm text-gray-700 mb-3">Selecione cursos para liberar certificado para <span className="font-medium">{selectedUser?.name}</span></p>
                  <div className="max-h-64 overflow-auto border border-gray-200 rounded-lg">
                    <ul>
                      {userEnrollments.map((e) => (
                        <li key={e.course.id} className="flex items-center px-4 py-2 border-b border-gray-100 last:border-b-0">
                          <input
                            type="checkbox"
                            className="mr-3"
                            checked={selectedCertCourseIds.includes(e.course.id)}
                            onChange={(ev) => {
                              if (ev.target.checked) setSelectedCertCourseIds(prev => [...prev, e.course.id]);
                              else setSelectedCertCourseIds(prev => prev.filter(id => id !== e.course.id));
                            }}
                          />
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900">{e.course.title}</p>
                            <p className="text-xs text-gray-500">Status: {e.status} • Progresso: {Math.round(e.progressPercentage || 0)}%</p>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="mt-4 flex items-center justify-end space-x-2">
                    {feedback && <span className="text-sm text-green-700 flex items-center"><CheckCircle2 className="h-4 w-4 mr-1" />{feedback}</span>}
                    <button onClick={closeModal} className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700">Cancelar</button>
                    <button
                      onClick={confirmGrantCertificates}
                      className="px-4 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700 disabled:opacity-50"
                      disabled={submitting || selectedCertCourseIds.length === 0}
                    >
                      {submitting ? 'Liberando...' : 'Liberar Certificados'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
