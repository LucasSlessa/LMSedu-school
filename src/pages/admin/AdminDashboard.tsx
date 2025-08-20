import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Users, 
  BookOpen, 
  DollarSign, 
  Award, 
  TrendingUp, 
  Calendar,
  Plus,
  Eye
} from 'lucide-react';
import { useCourseStore } from '../../store/courseStore';

export const AdminDashboard: React.FC = () => {
  const { courses, purchases } = useCourseStore();
  
  const stats = [
    {
      name: 'Total de Cursos',
      value: courses.length,
      change: '+12%',
      changeType: 'increase',
      icon: BookOpen,
    },
    {
      name: 'Alunos Ativos',
      value: '2,847',
      change: '+8%',
      changeType: 'increase',
      icon: Users,
    },
    {
      name: 'Receita Total',
      value: 'R$ 45.290',
      change: '+23%',
      changeType: 'increase',
      icon: DollarSign,
    },
    {
      name: 'Certificados Emitidos',
      value: '1,239',
      change: '+15%',
      changeType: 'increase',
      icon: Award,
    },
  ];
  
  const recentCourses = courses.slice(0, 5);
  
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(price);
  };
  
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard Administrativo</h1>
        <p className="mt-2 text-gray-600">Gerencie sua plataforma de ensino online</p>
      </div>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((item) => {
          const IconComponent = item.icon;
          return (
            <div key={item.name} className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="bg-blue-100 p-3 rounded-lg">
                    <IconComponent className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">{item.name}</p>
                  <p className="text-2xl font-bold text-gray-900">{item.value}</p>
                </div>
              </div>
              <div className="mt-4 flex items-center">
                <TrendingUp className="h-4 w-4 text-green-500" />
                <span className="text-sm text-green-600 ml-1">{item.change}</span>
                <span className="text-sm text-gray-500 ml-1">vs. mês anterior</span>
              </div>
            </div>
          );
        })}
      </div>
      
      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Cursos Recentes</h3>
                <Link
                  to="/admin/courses"
                  className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                >
                  Ver todos
                </Link>
              </div>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {recentCourses.map((course) => (
                  <div key={course.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-4">
                      <img
                        src={course.image}
                        alt={course.title}
                        className="w-12 h-12 rounded-lg object-cover"
                      />
                      <div>
                        <h4 className="font-medium text-gray-900">{course.title}</h4>
                        <p className="text-sm text-gray-600">{course.studentsCount} alunos</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900">{formatPrice(course.price)}</p>
                      <div className="flex items-center space-x-2 mt-1">
                        <Link
                          to={`/admin/courses/${course.id}/edit`}
                          className="text-blue-600 hover:text-blue-700 text-sm"
                        >
                          Editar
                        </Link>
                        <Link
                          to={`/courses/${course.id}`}
                          className="text-gray-600 hover:text-gray-700 text-sm"
                        >
                          <Eye className="h-4 w-4" />
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
        
        <div className="space-y-6">
          {/* Quick Actions */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Ações Rápidas</h3>
            <div className="space-y-3">
              <Link
                to="/admin/courses/new"
                className="flex items-center space-x-3 p-3 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors"
              >
                <Plus className="h-5 w-5" />
                <span className="font-medium">Criar Novo Curso</span>
              </Link>
              
              <Link
                to="/admin/students"
                className="flex items-center space-x-3 p-3 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors"
              >
                <Users className="h-5 w-5" />
                <span className="font-medium">Gerenciar Alunos</span>
              </Link>
              
              <Link
                to="/admin/reports"
                className="flex items-center space-x-3 p-3 bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 transition-colors"
              >
                <TrendingUp className="h-5 w-5" />
                <span className="font-medium">Ver Relatórios</span>
              </Link>
            </div>
          </div>
          
          {/* Recent Activity */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Atividade Recente</h3>
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <div className="bg-green-100 p-2 rounded-full">
                  <Users className="h-4 w-4 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-900">Novo aluno cadastrado</p>
                  <p className="text-xs text-gray-500">há 2 horas</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <div className="bg-blue-100 p-2 rounded-full">
                  <BookOpen className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-900">Curso atualizado</p>
                  <p className="text-xs text-gray-500">há 4 horas</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <div className="bg-purple-100 p-2 rounded-full">
                  <Award className="h-4 w-4 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-900">Certificado emitido</p>
                  <p className="text-xs text-gray-500">há 6 horas</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Monthly Overview */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Visão Geral Mensal</h3>
          <div className="flex items-center space-x-2">
            <Calendar className="h-4 w-4 text-gray-400" />
            <span className="text-sm text-gray-600">Dezembro 2024</span>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-600 mb-2">12</div>
            <div className="text-sm text-gray-600">Novos Cursos</div>
            <div className="text-xs text-green-600 mt-1">+20% vs. nov</div>
          </div>
          
          <div className="text-center">
            <div className="text-3xl font-bold text-green-600 mb-2">847</div>
            <div className="text-sm text-gray-600">Novos Alunos</div>
            <div className="text-xs text-green-600 mt-1">+15% vs. nov</div>
          </div>
          
          <div className="text-center">
            <div className="text-3xl font-bold text-purple-600 mb-2">R$ 12.4k</div>
            <div className="text-sm text-gray-600">Receita</div>
            <div className="text-xs text-green-600 mt-1">+28% vs. nov</div>
          </div>
        </div>
      </div>
    </div>
  );
};