import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/common/Layout';
import { Auth } from './pages/Auth';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Home } from './pages/Home';
import { Courses } from './pages/Courses';
import { CourseDetail } from './pages/CourseDetail';
import { Cart } from './pages/Cart';
import { MyCourses } from './pages/MyCourses';
import { CourseViewer } from './pages/CourseViewer';
import { PaymentSuccess } from './pages/PaymentSuccess';
import { PaymentCancel } from './pages/PaymentCancel';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { AdminCourses } from './pages/admin/AdminCourses';
import { AdminCourseForm } from './pages/admin/AdminCourseForm';
import { AdminStudents } from './pages/admin/AdminStudents';
import { AdminReports } from './pages/admin/AdminReports';
import { AdminCategories } from './pages/admin/AdminCategories';
import { GraduationCap } from 'lucide-react';
import { useAuthStore } from './store/authStore';
import { useCourseStore } from './store/courseStore';
import { useCategoryStore } from './store/categoryStore';
import { useCartStore } from './store/cartStore';

function App() {
  const { user, isAuthenticated, getCurrentUser } = useAuthStore();
  const { fetchCourses } = useCourseStore();
  const { fetchCategories } = useCategoryStore();
  const { fetchCartItems } = useCartStore();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Tentar obter usuário atual se houver token
        const token = localStorage.getItem('auth_token');
        if (token) {
          await getCurrentUser();
        }
        
        // Carregar dados iniciais
        await Promise.all([
          fetchCourses(),
          fetchCategories(),
        ]);
        
        // Se usuário logado, carregar carrinho
        if (isAuthenticated) {
          await fetchCartItems();
        }
      } catch (error) {
        console.error('Erro ao inicializar app:', error);
      } finally {
        setLoading(false);
      }
    };

    initializeApp();
  }, [getCurrentUser, fetchCourses, fetchCategories, fetchCartItems, isAuthenticated]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-xl mb-4">
            <GraduationCap className="h-8 w-8 text-white" />
          </div>
          <div className="animate-spin rounded-full h-8 w-8 border-4 border-blue-600 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando EduPlatform...</p>
        </div>
      </div>
    );
  }

  return (
    <Router>
      <Layout>
        <Routes>
          {/* Public routes */}
          <Route path="/auth" element={isAuthenticated ? <Navigate to="/" replace /> : <Auth />} />
          <Route path="/login" element={isAuthenticated ? <Navigate to="/" replace /> : <Login />} />
          <Route path="/register" element={isAuthenticated ? <Navigate to="/" replace /> : <Register />} />
          
          {/* Home route */}
          <Route path="/" element={<Home />} />
          
          {/* Course routes */}
          <Route path="/courses" element={<Courses />} />
          <Route path="/courses/:id" element={<CourseDetail />} />
          
          {/* Protected student routes */}
          <Route 
            path="/cart" 
            element={isAuthenticated && user?.role === 'student' ? <Cart /> : <Navigate to="/auth" replace />} 
          />
          <Route 
            path="/my-courses" 
            element={isAuthenticated && user?.role === 'student' ? <MyCourses /> : <Navigate to="/auth" replace />} 
          />
          <Route 
            path="/learn/:id" 
            element={isAuthenticated && user?.role === 'student' ? <CourseViewer /> : <Navigate to="/auth" replace />} 
          />
          
          {/* Payment routes */}
          <Route 
            path="/payment/success" 
            element={isAuthenticated ? <PaymentSuccess /> : <Navigate to="/auth" replace />} 
          />
          <Route 
            path="/payment/cancel" 
            element={isAuthenticated ? <PaymentCancel /> : <Navigate to="/auth" replace />} 
          />
          
          {/* Admin routes */}
          <Route 
            path="/admin" 
            element={isAuthenticated && user?.role === 'admin' ? <AdminDashboard /> : <Navigate to="/auth" replace />} 
          />
          <Route 
            path="/admin/courses" 
            element={isAuthenticated && user?.role === 'admin' ? <AdminCourses /> : <Navigate to="/auth" replace />} 
          />
          <Route 
            path="/admin/courses/new" 
            element={isAuthenticated && user?.role === 'admin' ? <AdminCourseForm /> : <Navigate to="/auth" replace />} 
          />
          <Route 
            path="/admin/courses/:id/edit" 
            element={isAuthenticated && user?.role === 'admin' ? <AdminCourseForm /> : <Navigate to="/auth" replace />} 
          />
          <Route 
            path="/admin/students" 
            element={isAuthenticated && user?.role === 'admin' ? <AdminStudents /> : <Navigate to="/auth" replace />} 
          />
          <Route 
            path="/admin/reports" 
            element={isAuthenticated && user?.role === 'admin' ? <AdminReports /> : <Navigate to="/auth" replace />} 
          />
          <Route 
            path="/admin/categories" 
            element={isAuthenticated && user?.role === 'admin' ? <AdminCategories /> : <Navigate to="/auth" replace />} 
          />
          
          {/* Catch all route */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;