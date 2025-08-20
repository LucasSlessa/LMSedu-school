export interface User {
  id: string;
  email: string;
  name: string;
  role: 'student' | 'admin';
  avatar?: string;
  createdAt: string;
}

export interface Course {
  id: string;
  title: string;
  description: string;
  shortDescription: string;
  price: number;
  duration: number; // em horas
  instructor: string;
  image: string;
  category: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  rating: number;
  studentsCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface CourseContent {
  id: string;
  courseId: string;
  type: 'video' | 'pdf' | 'quiz';
  title: string;
  content: string; // URL ou conteúdo
  order: number;
  duration?: number; // para vídeos
}

export interface Quiz {
  id: string;
  courseId: string;
  title: string;
  questions: QuizQuestion[];
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation?: string;
}

export interface Purchase {
  id: string;
  userId: string;
  courseId: string;
  amount: number;
  status: 'pending' | 'completed' | 'failed';
  paymentMethod: 'card' | 'boleto';
  createdAt: string;
}

export interface Progress {
  id: string;
  userId: string;
  courseId: string;
  completedContent: string[];
  quizScores: { [quizId: string]: number };
  completionPercentage: number;
  certificateGenerated: boolean;
  completedAt?: string;
}

export interface CartItem {
  course: Course;
  quantity: number;
}

export interface Certificate {
  id: string;
  userId: string;
  courseId: string;
  studentName: string;
  courseName: string;
  courseDuration: number;
  completionDate: string;
  certificateUrl: string;
}