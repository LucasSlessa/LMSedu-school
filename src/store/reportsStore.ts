import { create } from 'zustand';
import { reportsAPI } from '../lib/api';

interface ReportMetrics {
  totalRevenue: number;
  totalStudents: number;
  totalCourses: number;
  completedCourses: number;
  completionRate: number;
}

interface MonthlyRevenue {
  month: string;
  revenue: number;
}

interface CourseCategory {
  category: string;
  count: number;
}

interface TopCourse {
  title: string;
  id: string;
  sales: number;
  revenue: number;
  avgTicket: number;
}

interface NewStudents {
  month: string;
  newStudents: number;
}

interface ReportsState {
  metrics: ReportMetrics | null;
  monthlyRevenue: MonthlyRevenue[];
  coursesByCategory: CourseCategory[];
  topCourses: TopCourse[];
  newStudents: NewStudents[];
  loading: boolean;
  error: string | null;
  
  fetchOverview: (days?: number) => Promise<void>;
  clearError: () => void;
}

export const useReportsStore = create<ReportsState>((set, get) => ({
  metrics: null,
  monthlyRevenue: [],
  coursesByCategory: [],
  topCourses: [],
  newStudents: [],
  loading: false,
  error: null,
  
  fetchOverview: async (days: number = 30) => {
    set({ loading: true, error: null });
    
    try {
      const data = await reportsAPI.getOverview(days);
      
      set({
        metrics: data.metrics,
        monthlyRevenue: data.monthlyRevenue,
        coursesByCategory: data.coursesByCategory,
        topCourses: data.topCourses,
        newStudents: data.newStudents,
        loading: false,
        error: null
      });
    } catch (error) {
      console.error('Erro ao buscar relatórios:', error);
      set({ 
        loading: false, 
        error: error instanceof Error ? error.message : 'Erro ao carregar relatórios' 
      });
    }
  },
  
  clearError: () => {
    set({ error: null });
  }
}));
