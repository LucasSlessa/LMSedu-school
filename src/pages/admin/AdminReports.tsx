import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  DollarSign, 
  Users, 
  BookOpen, 
  Calendar,
  Download,
  Filter,
  BarChart3,
  PieChart,
  Activity,
  RefreshCw
} from 'lucide-react';
import { useReportsStore } from '../../store/reportsStore';

export const AdminReports: React.FC = () => {
  const { 
    metrics, 
    monthlyRevenue, 
    coursesByCategory, 
    topCourses, 
    newStudents,
    loading,
    error,
    fetchOverview,
    clearError
  } = useReportsStore();
  
  const [dateRange, setDateRange] = useState('30');
  const [reportType, setReportType] = useState('overview');
  
  useEffect(() => {
    fetchOverview(parseInt(dateRange));
  }, [dateRange, fetchOverview]);
  
  // Limpar erro quando componente montar
  useEffect(() => {
    clearError();
  }, [clearError]);
  
  // Função para formatar mês
  const formatMonth = (monthString: string) => {
    const date = new Date(monthString);
    return date.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' });
  };
  
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(price);
  };
  
  const formatDate = (dateString: string) => {
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(new Date(dateString));
  };
  
  const exportReport = () => {
    if (!metrics) return;
    
    const reportData = {
      periodo: `Últimos ${dateRange} dias`,
      geradoEm: new Date().toLocaleString('pt-BR'),
      metricas: {
        receitaTotal: metrics.totalRevenue,
        totalAlunos: metrics.totalStudents,
        totalCursos: metrics.totalCourses,
        cursosCompletos: metrics.completedCourses,
        taxaConclusao: metrics.completionRate,
      },
      topCursos: topCourses,
      vendasPorMes: monthlyRevenue,
      cursosPorCategoria: coursesByCategory,
      novosAlunos: newStudents,
    };
    
    const dataStr = JSON.stringify(reportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `relatorio-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
  };
  
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Relatórios e Analytics</h1>
          <p className="mt-2 text-gray-600">Acompanhe o desempenho da sua plataforma</p>
        </div>
        
        <div className="flex items-center space-x-4">
          <button
            onClick={() => fetchOverview(parseInt(dateRange))}
            disabled={loading}
            className="flex items-center space-x-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            <span>{loading ? 'Carregando...' : 'Atualizar'}</span>
          </button>
          
          <button
            onClick={exportReport}
            disabled={!metrics}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            <Download className="h-4 w-4" />
            <span>Exportar Relatório</span>
          </button>
        </div>
      </div>
      
      {/* Erro */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-8">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Erro ao carregar relatórios</h3>
              <div className="mt-2 text-sm text-red-700">
                <p>{error}</p>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Filtros */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 mb-8">
        <div className="flex items-center space-x-2 mb-4">
          <Filter className="h-5 w-5 text-gray-600" />
          <h3 className="text-lg font-semibold text-gray-900">Filtros</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Período
            </label>
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="7">Últimos 7 dias</option>
              <option value="30">Últimos 30 dias</option>
              <option value="90">Últimos 90 dias</option>
              <option value="365">Último ano</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tipo de Relatório
            </label>
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="overview">Visão Geral</option>
              <option value="revenue">Receita</option>
              <option value="courses">Cursos</option>
              <option value="students">Alunos</option>
            </select>
          </div>
        </div>
      </div>
      
      {/* Métricas Principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="bg-green-100 p-3 rounded-lg">
              <DollarSign className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Receita Total</p>
              <p className="text-2xl font-bold text-gray-900">
                {loading ? '...' : formatPrice(metrics?.totalRevenue || 0)}
              </p>
            </div>
          </div>
          <div className="mt-4 flex items-center">
            <TrendingUp className="h-4 w-4 text-green-500" />
            <span className="text-sm text-green-600 ml-1">R$ 0,00</span>
            <span className="text-sm text-gray-500 ml-1">vs. período anterior</span>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="bg-blue-100 p-3 rounded-lg">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total de Alunos</p>
              <p className="text-2xl font-bold text-gray-900">
                {loading ? '...' : metrics?.totalStudents || 0}
              </p>
            </div>
          </div>
          <div className="mt-4 flex items-center">
            <TrendingUp className="h-4 w-4 text-green-500" />
            <span className="text-sm text-green-600 ml-1">0</span>
            <span className="text-sm text-gray-500 ml-1">vs. período anterior</span>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="bg-purple-100 p-3 rounded-lg">
              <BookOpen className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Cursos Ativos</p>
              <p className="text-2xl font-bold text-gray-900">
                {loading ? '...' : metrics?.totalCourses || 0}
              </p>
            </div>
          </div>
          <div className="mt-4 flex items-center">
            <TrendingUp className="h-4 w-4 text-green-500" />
            <span className="text-sm text-green-600 ml-1">0</span>
            <span className="text-sm text-gray-500 ml-1">vs. período anterior</span>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="bg-orange-100 p-3 rounded-lg">
              <Activity className="h-6 w-6 text-orange-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Taxa de Conclusão</p>
              <p className="text-2xl font-bold text-gray-900">
                {loading ? '...' : `${metrics?.completionRate || 0}%`}
              </p>
            </div>
          </div>
          <div className="mt-4 flex items-center">
            <TrendingUp className="h-4 w-4 text-green-500" />
            <span className="text-sm text-green-600 ml-1">0%</span>
            <span className="text-sm text-gray-500 ml-1">vs. período anterior</span>
          </div>
        </div>
      </div>
      
      {/* Mensagem quando não há dados */}
      {!loading && metrics && metrics.totalRevenue === 0 && metrics.totalStudents === 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-8 mb-8 text-center">
          <BarChart3 className="mx-auto h-12 w-12 text-blue-400 mb-4" />
          <h3 className="text-lg font-medium text-blue-900 mb-2">Banco de dados limpo</h3>
          <p className="text-blue-700 mb-4">
            O banco foi limpo com sucesso! Agora você pode testar o sistema do zero.
          </p>
          <div className="text-sm text-blue-600">
            <p>✅ Usuários mantidos: {metrics.totalStudents}</p>
            <p>✅ Cursos mantidos: {metrics.totalCourses}</p>
            <p>🗑️ Dados removidos: pedidos, matrículas, progresso, certificados</p>
          </div>
        </div>
      )}
      
      {/* Gráficos e Tabelas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Receita por Mês */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Receita por Mês</h3>
            <BarChart3 className="h-5 w-5 text-gray-400" />
          </div>
          
          <div className="space-y-4">
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="text-sm text-gray-500 mt-2">Carregando dados...</p>
              </div>
            ) : monthlyRevenue.length > 0 ? (
              monthlyRevenue.slice(-6).map((item, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">{formatMonth(item.month)}</span>
                  <div className="flex items-center space-x-3">
                    <div className="w-32 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{
                          width: `${(item.revenue / Math.max(...monthlyRevenue.map(r => r.revenue))) * 100}%`
                        }}
                      />
                    </div>
                    <span className="text-sm font-medium text-gray-900 w-20 text-right">
                      {formatPrice(item.revenue)}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <BarChart3 className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                <p className="text-sm text-gray-500">Nenhum dado de receita disponível</p>
              </div>
            )}
          </div>
        </div>
        
        {/* Cursos por Categoria */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Cursos por Categoria</h3>
            <PieChart className="h-5 w-5 text-gray-400" />
          </div>
          
          <div className="space-y-4">
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
                <p className="text-sm text-gray-500 mt-2">Carregando dados...</p>
              </div>
            ) : coursesByCategory.length > 0 ? (
              coursesByCategory.map((item, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">{item.category}</span>
                  <div className="flex items-center space-x-3">
                    <div className="w-32 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-green-600 h-2 rounded-full"
                        style={{
                          width: `${(item.count / Math.max(...coursesByCategory.map(c => c.count))) * 100}%`
                        }}
                      />
                    </div>
                    <span className="text-sm font-medium text-gray-900 w-8 text-right">
                      {item.count}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <PieChart className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                <p className="text-sm text-gray-500">Nenhum dado de categoria disponível</p>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Top Cursos */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Top 5 Cursos por Receita</h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Curso
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Vendas
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Receita
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ticket Médio
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="text-sm text-gray-500 mt-2">Carregando dados...</p>
                  </td>
                </tr>
              ) : topCourses.length > 0 ? (
                topCourses.map((course, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{course.title}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{course.sales}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {formatPrice(course.revenue)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {formatPrice(course.avgTicket)}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center">
                    <BarChart3 className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                    <p className="text-sm text-gray-500">Nenhum curso encontrado</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        {!loading && topCourses.length === 0 && (
          <div className="text-center py-12">
            <BarChart3 className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhuma venda registrada</h3>
            <p className="text-gray-500">Os dados aparecerão aqui quando houver vendas</p>
          </div>
        )}
      </div>
    </div>
  );
};