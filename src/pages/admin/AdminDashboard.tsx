import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Users, 
  BookOpen, 
  DollarSign, 
  Award, 
  TrendingUp, 
  Calendar,
  Plus,
  Eye,
  Tag,
  Loader2,
  Shield
} from 'lucide-react';
import { useCourseStore } from '../../store/courseStore';
import { reportsAPI } from '../../lib/api';

interface DashboardData {
  metrics: {
    totalRevenue: number;
    totalStudents: number;
    totalCourses: number;
    completedCourses: number;
    completionRate: number;
  };
  monthlyRevenue: Array<{
    month: string;
    revenue: number;
  }>;
  coursesByCategory: Array<{
    category: string;
    count: number;
  }>;
  topCourses: Array<{
    title: string;
    id: string;
    sales: number;
    revenue: number;
    avgTicket: number;
  }>;
  newStudents: Array<{
    month: string;
    newStudents: number;
  }>;
}

export const AdminDashboard: React.FC = () => {
  const { courses } = useCourseStore();
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const data = await reportsAPI.getOverview(30); // Últimos 30 dias
        setDashboardData(data);
        setError(null);
      } catch (err) {
        console.error('Erro ao carregar dados do dashboard:', err);
        setError('Erro ao carregar dados do dashboard');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('pt-BR').format(value);
  };

  const getCurrentMonthData = () => {
    if (!dashboardData) return { newCourses: 0, newStudents: 0, revenue: 0 };
    
    const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
    const currentMonthData = dashboardData.monthlyRevenue.find(item => 
      item.month.startsWith(currentMonth)
    );
    
    const currentMonthStudents = dashboardData.newStudents.find(item => 
      item.month.startsWith(currentMonth)
    );
    
    return {
      newCourses: 0, // Não temos dados de novos cursos por mês ainda
      newStudents: currentMonthStudents?.newStudents || 0,
      revenue: currentMonthData?.revenue || 0
    };
  };

  const getPreviousMonthData = () => {
    if (!dashboardData) return { newCourses: 0, newStudents: 0, revenue: 0 };
    
    const currentDate = new Date();
    currentDate.setMonth(currentDate.getMonth() - 1);
    const previousMonth = currentDate.toISOString().slice(0, 7);
    
    const previousMonthData = dashboardData.monthlyRevenue.find(item => 
      item.month.startsWith(previousMonth)
    );
    
    const previousMonthStudents = dashboardData.newStudents.find(item => 
      item.month.startsWith(previousMonth)
    );
    
    return {
      newCourses: 0,
      newStudents: previousMonthStudents?.newStudents || 0,
      revenue: previousMonthData?.revenue || 0
    };
  };

  const calculatePercentageChange = (current: number, previous: number) => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return Math.round(((current - previous) / previous) * 100);
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          <span className="ml-2 text-gray-600">Carregando dados do dashboard...</span>
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

  const currentMonth = getCurrentMonthData();
  const previousMonth = getPreviousMonthData();
  
  const stats = [
    {
      name: 'Total de Cursos',
      value: dashboardData?.metrics.totalCourses || 0,
      change: `+${dashboardData?.metrics.totalCourses || 0}`,
      changeType: 'increase' as const,
      icon: BookOpen,
    },
    {
      name: 'Alunos Ativos',
      value: formatNumber(dashboardData?.metrics.totalStudents || 0),
      change: `+${currentMonth.newStudents}`,
      changeType: 'increase' as const,
      icon: Users,
    },
    {
      name: 'Receita Total',
      value: formatCurrency(dashboardData?.metrics.totalRevenue || 0),
      change: `+${calculatePercentageChange(currentMonth.revenue, previousMonth.revenue)}%`,
      changeType: currentMonth.revenue >= previousMonth.revenue ? 'increase' as const : 'decrease' as const,
      icon: DollarSign,
    },
    {
      name: 'Certificados Emitidos',
      value: formatNumber(dashboardData?.metrics.completedCourses || 0),
      change: `+${dashboardData?.metrics.completionRate || 0}%`,
      changeType: 'increase' as const,
      icon: Award,
    },
  ];
  
  const recentCourses = courses.slice(0, 5);
  
  const formatPrice = (price: number) => {
    return formatCurrency(price);
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
                <TrendingUp className={`h-4 w-4 ${item.changeType === 'increase' ? 'text-green-500' : 'text-red-500'}`} />
                <span className={`text-sm ${item.changeType === 'increase' ? 'text-green-600' : 'text-red-600'} ml-1`}>
                  {item.change}
                </span>
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
            <div className="p-4 sm:p-6 border-b border-gray-200">
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
            <div className="p-4 sm:p-6">
              <div className="space-y-4">
                {recentCourses.map((course) => (
                  <div key={course.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 bg-gray-50 rounded-lg space-y-3 sm:space-y-0">
                    <div className="flex items-center space-x-4">
                      <img
                        src={course.image}
                        alt={course.title}
                        className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
                      />
                      <div className="min-w-0 flex-1">
                        <h4 className="font-medium text-gray-900 truncate">{course.title}</h4>
                        <p className="text-sm text-gray-600">{course.studentsCount} alunos</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between sm:flex-col sm:items-end sm:text-right">
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
              
              <Link
                to="/admin/categories"
                className="flex items-center space-x-3 p-3 bg-orange-50 text-orange-700 rounded-lg hover:bg-orange-100 transition-colors"
              >
                <Tag className="h-5 w-5" />
                <span className="font-medium">Gerenciar Categorias</span>
              </Link>
              
              <Link
                to="/admin/users"
                className="flex items-center space-x-3 p-3 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition-colors"
              >
                <Shield className="h-5 w-5" />
                <span className="font-medium">Gerenciar Usuários</span>
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
            <span className="text-sm text-gray-600">
              {new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
            </span>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-600 mb-2">
              {dashboardData?.metrics.totalCourses || 0}
            </div>
            <div className="text-sm text-gray-600">Total de Cursos</div>
            <div className="text-xs text-green-600 mt-1">
              {dashboardData?.metrics.totalCourses || 0} cursos ativos
            </div>
          </div>
          
          <div className="text-center">
            <div className="text-3xl font-bold text-green-600 mb-2">
              {formatNumber(currentMonth.newStudents)}
            </div>
            <div className="text-sm text-gray-600">Novos Alunos</div>
            <div className="text-xs text-green-600 mt-1">
              +{calculatePercentageChange(currentMonth.newStudents, previousMonth.newStudents)}% vs. mês anterior
            </div>
          </div>
          
          <div className="text-center">
            <div className="text-3xl font-bold text-purple-600 mb-2">
              {formatCurrency(currentMonth.revenue)}
            </div>
            <div className="text-sm text-gray-600">Receita do Mês</div>
            <div className="text-xs text-green-600 mt-1">
              +{calculatePercentageChange(currentMonth.revenue, previousMonth.revenue)}% vs. mês anterior
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};