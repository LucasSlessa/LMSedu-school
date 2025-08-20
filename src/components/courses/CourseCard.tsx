import React from 'react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Star, Clock, Users, ShoppingCart, CreditCard } from 'lucide-react';
import { useCartStore } from '../../store/cartStore';
import { useAuthStore } from '../../store/authStore';
import { stripeAPI } from '../../lib/api';

interface Course {
  id: string;
  title: string;
  description: string;
  shortDescription: string;
  price: number;
  duration: number;
  instructor: string;
  category: string;
  image: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  rating: number;
  studentsCount: number;
  createdAt: string;
  updatedAt: string;
}

interface CourseCardProps {
  course: Course;
  showActions?: boolean;
}

export const CourseCard: React.FC<CourseCardProps> = ({ course, showActions = true }) => {
  const { addToCart, items, fetchCartItems } = useCartStore();
  const { user, isAuthenticated } = useAuthStore();
  const [isAdding, setIsAdding] = useState(false);
  const [isBuying, setIsBuying] = useState(false);
  
  const isInCart = items.some(item => item.course.id === course.id);
  const canAddToCart = isAuthenticated && user?.role === 'student' && !isInCart;
  
  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (canAddToCart) {
      setIsAdding(true);
      const success = await addToCart(course.id);
      if (success) {
        await fetchCartItems();
      }
      setIsAdding(false);
    }
  };

  const handleBuyNow = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!isAuthenticated) {
      window.location.href = '/auth';
      return;
    }

    setIsBuying(true);
    try {
      const response = await stripeAPI.createCheckoutSession(course.id);
      window.location.href = response.url;
    } catch (error) {
      console.error('Erro ao criar checkout:', error);
      alert('Erro ao processar pagamento. Tente novamente.');
    } finally {
      setIsBuying(false);
    }
  };
  
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(price);
  };
  
  const getLevelColor = (level: string) => {
    switch (level) {
      case 'beginner':
        return 'bg-green-100 text-green-800';
      case 'intermediate':
        return 'bg-yellow-100 text-yellow-800';
      case 'advanced':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  
  const getLevelText = (level: string) => {
    switch (level) {
      case 'beginner':
        return 'Iniciante';
      case 'intermediate':
        return 'Intermediário';
      case 'advanced':
        return 'Avançado';
      default:
        return level;
    }
  };
  
  return (
    <div className="bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden group">
      <Link to={`/courses/${course.id}`} className="block">
        <div className="relative">
          <img
            src={course.image}
            alt={course.title}
            className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
          />
          <div className="absolute top-3 left-3">
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getLevelColor(course.level)}`}>
              {getLevelText(course.level)}
            </span>
          </div>
          <div className="absolute top-3 right-3 bg-white bg-opacity-90 px-2 py-1 rounded-lg">
            <span className="text-sm font-bold text-gray-900">{formatPrice(course.price)}</span>
          </div>
        </div>
        
        <div className="p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-blue-600 font-medium uppercase tracking-wide">
              {course.category}
            </span>
          </div>
          
          <h3 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors line-clamp-2">
            {course.title}
          </h3>
          
          <p className="text-gray-600 text-sm mb-4 line-clamp-2">
            {course.shortDescription}
          </p>
          
          <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
            <div className="flex items-center space-x-1">
              <Clock className="h-4 w-4" />
              <span>{course.duration}h</span>
            </div>
            
            <div className="flex items-center space-x-1">
              <Users className="h-4 w-4" />
              <span>{course.studentsCount}</span>
            </div>
            
            <div className="flex items-center space-x-1">
              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
              <span>{course.rating}</span>
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500">Instrutor</p>
              <p className="text-sm font-medium text-gray-900">{course.instructor}</p>
            </div>
            
            {showActions && isAuthenticated && user?.role === 'student' && (
              <div className="flex flex-col space-y-2">
                <button
                  onClick={handleBuyNow}
                  disabled={isBuying}
                  className="flex items-center justify-center space-x-1 bg-green-600 text-white px-3 py-2 rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                >
                  <CreditCard className="h-4 w-4" />
                  <span>{isBuying ? 'Processando...' : 'Comprar'}</span>
                </button>
                
                {canAddToCart && (
                  <button
                    onClick={handleAddToCart}
                    disabled={isAdding}
                    className="flex items-center justify-center space-x-1 bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                  >
                    <ShoppingCart className="h-4 w-4" />
                    <span>{isAdding ? 'Adicionando...' : 'Carrinho'}</span>
                  </button>
                )}
                
                {isInCart && (
                  <span className="text-green-600 text-sm font-medium text-center">No carrinho</span>
                )}
              </div>
            )}
          </div>
        </div>
      </Link>
    </div>
  );
};