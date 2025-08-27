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

interface CourseModule {
  id: string;
  title: string;
  type: 'video' | 'pdf' | 'quiz';
  content: string;
  duration?: number;
  order: number;
  quizQuestions?: unknown[];
  files?: unknown[];
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

interface CourseState {
  courses: Course[];
  enrollments: Enrollment[];
  loading: boolean;
  
  // Course methods
  fetchCourses: (params?: Record<string, string>) => Promise<void>;
  getCourseById: (id: string) => Course | undefined;
  addCourse: (
    courseData: Omit<Course, 'id' | 'createdAt' | 'updatedAt' | 'rating' | 'studentsCount'>,
    modules: CourseModule[]
  ) => Promise<void>;
  updateCourse: (
    id: string,
    courseData: Partial<Course>,
    modules: CourseModule[]
  ) => Promise<void>;
  deleteCourse: (id: string) => Promise<void>;
  
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
  
  fetchCourses: async (params?: Record<string, string>) => {
    set({ loading: true });
    try {
      const courses = await coursesAPI.getAll(params);
      set({ courses, loading: false });
    } catch (error) {
      console.error('Erro ao buscar cursos:', error);
      set({ loading: false });
    }
  },
  
  getCourseById: (id: string) => {
    return get().courses.find(course => course.id === id);
  },
  
  addCourse: async (
    courseData: Omit<Course, 'id' | 'createdAt' | 'updatedAt' | 'rating' | 'studentsCount'>,
    modules: CourseModule[]
  ) => {
    try {
      const newCourse = await coursesAPI.create(courseData, modules);
      set(state => ({
        courses: [...state.courses, newCourse]
      }));
    } catch (error) {
      console.error('Erro ao criar curso:', error);
      throw error;
    }
  },

  updateCourse: async (
    id: string,
    courseData: Partial<Course>,
    modules: CourseModule[]
  ) => {
    try {
      const updatedCourse = await coursesAPI.update(id, courseData, modules);
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
  
  fetchUserEnrollments: async () => {
    try {
      const enrollments = await enrollmentsAPI.getAll();
      set({ enrollments });
    } catch (error) {
      console.error('Erro ao buscar matrículas:', error);
    }
  },
  
  getPurchasedCourses: () => {
    return get().enrollments.map(enrollment => enrollment.course);
  },
  
  updateProgress: async (courseId: string, progressPercentage: number) => {
    try {
      await enrollmentsAPI.updateProgress(courseId, progressPercentage);
      
      // Atualizar estado local
      const { enrollments } = get();
      const updatedEnrollments = enrollments.map(enrollment => 
        enrollment.course.id === courseId 
          ? { ...enrollment, progressPercentage }
          : enrollment
      );
      
      set({ enrollments: updatedEnrollments });
      return true;
    } catch (error) {
      console.error('Erro ao atualizar progresso:', error);
      return false;
    }
  },
  
  getUserProgress: (courseId: string) => {
    return get().enrollments.find(e => e.course.id === courseId);
  },
}));