import { create } from 'zustand';
import { coursesAPI, enrollmentsAPI } from '../lib/api';

interface Course {
  id: string;
  title: string;
  slug: string;
  description: string;
  shortDescription: string;
  price: number;
  duration: number;
  instructor: string;
  category: string;
  categoryColor?: string;
  image: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  rating: number;
  studentsCount: number;
  createdAt: string;
  updatedAt: string;
}

interface Enrollment {
  id: string;
  status: 'active' | 'completed' | 'suspended' | 'cancelled';
  progressPercentage: number;
  startedAt: string;
  completedAt?: string;
  certificateUrl?: string;
  createdAt: string;
  course: Course;
}

interface CourseQueryParams {
  category?: string;
  level?: string;
  search?: string;
  sort?: string;
  order?: string;
}

interface CourseState {
  courses: Course[];
  enrollments: Enrollment[];
  loading: boolean;

  // Course methods
  fetchCourses: (params?: CourseQueryParams) => Promise<void>;
  getCourseById: (id: string) => Course | undefined;
  addCourse: (courseData: Omit<Course, 'id' | 'createdAt' | 'updatedAt' | 'rating' | 'studentsCount'>) => Promise<Course>;
  updateCourse: (id: string, courseData: Partial<Course>) => Promise<void>;
  deleteCourse: (id: string) => Promise<void>;
  
  // Métodos para módulos
  getModules: (courseId: string) => Promise<any[]>;
  createModule: (courseId: string, moduleData: any) => Promise<any>;
  updateModule: (courseId: string, moduleId: string, moduleData: any) => Promise<any>;
  deleteModule: (courseId: string, moduleId: string) => Promise<void>;

  // Métodos para aulas
  getLessons: (courseId: string, moduleId: string) => Promise<any[]>;
  createLesson: (courseId: string, moduleId: string, lessonData: any) => Promise<any>;
  updateLesson: (courseId: string, moduleId: string, lessonId: string, lessonData: any) => Promise<any>;
  deleteLesson: (courseId: string, moduleId: string, lessonId: string) => Promise<void>;
  
  // Enrollment methods
  fetchUserEnrollments: () => Promise<void>;
  getPurchasedCourses: () => Course[];
  updateProgress: (courseId: string, progressPercentage: number) => Promise<boolean>;
  getUserProgress: (courseId: string) => Enrollment | undefined;
}

export const useCourseStore = create<CourseState>((set, get) => ({
  courses: [],
  enrollments: [],
  loading: false,
  
  fetchCourses: async (params?: CourseQueryParams) => {
    set({ loading: true });
    try {
      const courses = await coursesAPI.getAll({ ...params, admin: true });
      set({ courses, loading: false });
    } catch (error) {
      console.error('Erro ao buscar cursos:', error);
      set({ loading: false });
    }
  },
  
  getCourseById: (id: string) => {
    return get().courses.find(course => course.id === id);
  },
  
  addCourse: async (courseData) => {
    try {
      const newCourse = await coursesAPI.create(courseData);
      set(state => ({
        courses: [...state.courses, newCourse]
      }));
      return newCourse; // CRITICAL: Return the created course
    } catch (error) {
      console.error('Erro ao criar curso:', error);
      throw error;
    }
  },
  
  updateCourse: async (id: string, courseData) => {
    try {
      const updatedCourse = await coursesAPI.update(id, courseData);
      set(state => ({
        courses: state.courses.map(course => 
          course.id === id ? { ...course, ...updatedCourse } : course
        )
      }));
    } catch (error) {
      console.error('Erro ao atualizar curso:', error);
      throw error;
    }
  },
  
  deleteCourse: async (id: string) => {
    try {
      await coursesAPI.delete(id);
      set(state => ({
        courses: state.courses.filter(course => course.id !== id)
      }));
    } catch (error) {
      console.error('Erro ao deletar curso:', error);
      throw error;
    }
  },

  // Métodos para módulos
  getModules: async (courseId: string) => {
    try {
      return await coursesAPI.getModules(courseId);
    } catch (error) {
      console.error('Erro ao buscar módulos:', error);
      throw error;
    }
  },

  createModule: async (courseId: string, moduleData) => {
    try {
      return await coursesAPI.createModule(courseId, moduleData);
    } catch (error) {
      console.error('Erro ao criar módulo:', error);
      throw error;
    }
  },

  updateModule: async (courseId: string, moduleId: string, moduleData) => {
    try {
      return await coursesAPI.updateModule(courseId, moduleId, moduleData);
    } catch (error) {
      console.error('Erro ao atualizar módulo:', error);
      throw error;
    }
  },

  deleteModule: async (courseId: string, moduleId: string) => {
    try {
      await coursesAPI.deleteModule(courseId, moduleId);
    } catch (error) {
      console.error('Erro ao deletar módulo:', error);
      throw error;
    }
  },

  // Métodos para aulas
  getLessons: async (courseId: string, moduleId: string) => {
    try {
      return await coursesAPI.getLessons(courseId, moduleId);
    } catch (error) {
      console.error('Erro ao buscar aulas:', error);
      throw error;
    }
  },

  createLesson: async (courseId: string, moduleId: string, lessonData) => {
    try {
      return await coursesAPI.createLesson(courseId, moduleId, lessonData);
    } catch (error) {
      console.error('Erro ao criar aula:', error);
      throw error;
    }
  },

  updateLesson: async (courseId: string, moduleId: string, lessonId: string, lessonData) => {
    try {
      return await coursesAPI.updateLesson(courseId, moduleId, lessonId, lessonData);
    } catch (error) {
      console.error('Erro ao atualizar aula:', error);
      throw error;
    }
  },

  deleteLesson: async (courseId: string, moduleId: string, lessonId: string) => {
    try {
      await coursesAPI.deleteLesson(courseId, moduleId, lessonId);
    } catch (error) {
      console.error('Erro ao deletar aula:', error);
      throw error;
    }
  },
  
  // Enrollment methods
  fetchUserEnrollments: async () => {
    try {
      const enrollments = await enrollmentsAPI.getAll();
      set({ enrollments });
    } catch (error) {
      console.error('Erro ao buscar matrículas:', error);
    }
  },
  
  getPurchasedCourses: () => {
    return get().enrollments
      .filter(enrollment => enrollment.status === 'active' || enrollment.status === 'completed')
      .map(enrollment => enrollment.course);
  },
  
  updateProgress: async (courseId: string, progressPercentage: number) => {
    try {
      await enrollmentsAPI.updateProgress(courseId, progressPercentage);
      return true;
    } catch (error) {
      console.error('Erro ao atualizar progresso:', error);
      return false;
    }
  },
  
  getUserProgress: (courseId: string) => {
    return get().enrollments.find(enrollment => enrollment.course.id === courseId);
  },
}));
