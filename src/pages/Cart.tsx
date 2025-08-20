import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { ShoppingCart, Trash2, ArrowRight, ShoppingBag, CreditCard } from 'lucide-react';
import { useCartStore } from '../store/cartStore';
import { useAuthStore } from '../store/authStore';
import { ordersAPI } from '../lib/api';

export const Cart: React.FC = () => {
  const { items, removeFromCart, clearCart, getTotal, fetchCartItems } = useCartStore();
  const { user } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      fetchCartItems();
    }
  }, [user, fetchCartItems]);
  
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(price);
  };
  
  const handleCheckout = async () => {
    if (!user || items.length === 0) return;
    
    try {
      const order = await ordersAPI.create();
      window.location.href = order.order.paymentUrl;
    } catch (error) {
      console.error('Erro no checkout:', error);
      alert('Erro ao processar pagamento. Tente novamente.');
    }
  };

  const handleBuyNow = async (courseId: string) => {
    try {
      const order = await ordersAPI.create();
      window.location.href = order.order.paymentUrl;
    } catch (error) {
      console.error('Erro ao processar pagamento:', error);
      alert('Erro ao processar pagamento. Tente novamente.');
    }
  };
  
  if (items.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center">
          <ShoppingBag className="mx-auto h-24 w-24 text-gray-400 mb-6" />
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Seu carrinho está vazio</h2>
          <p className="text-gray-600 mb-8">
            Explore nosso catálogo e adicione cursos ao seu carrinho
          </p>
          <Link
            to="/courses"
            className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            Explorar Cursos
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </div>
      </div>
    );
  }
  
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center space-x-2 mb-8">
        <ShoppingCart className="h-6 w-6 text-gray-600" />
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
          Carrinho de Compras
        </h1>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Lista de Itens */}
        <div className="lg:col-span-2 space-y-4">
          {items.map((item) => (
            <div key={item.course.id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <div className="flex items-start space-x-4">
                <img
                  src={item.course.image}
                  alt={item.course.title}
                  className="w-24 h-16 object-cover rounded-lg flex-shrink-0"
                />
                
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">
                    {item.course.title}
                  </h3>
                  <p className="text-sm text-gray-600 mb-2">
                    Por {item.course.instructor}
                  </p>
                  <div className="flex items-center space-x-4 text-sm text-gray-500">
                    <span>{item.course.duration}h de conteúdo</span>
                    <span>•</span>
                    <span>Certificado incluído</span>
                  </div>
                </div>
                
                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <div className="text-lg font-bold text-gray-900">
                      {formatPrice(item.course.price)}
                    </div>
                  </div>
                  
                  <div className="flex flex-col space-y-2">
                    <button
                      onClick={() => handleBuyNow(item.course.id)}
                      className="flex items-center space-x-1 bg-green-600 text-white px-3 py-2 rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                    >
                      <CreditCard className="h-4 w-4" />
                      <span>Comprar</span>
                    </button>
                    
                    <button
                      onClick={() => removeFromCart(item.course.id)}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Remover do carrinho"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {/* Resumo do Pedido */}
        <div className="lg:col-span-1">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 sticky top-24">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">
              Resumo do Pedido
            </h3>
            
            <div className="space-y-4 mb-6">
              <div className="flex justify-between">
                <span className="text-gray-600">
                  {items.length} curso{items.length !== 1 ? 's' : ''}
                </span>
                <span className="font-medium text-gray-900">
                  {formatPrice(getTotal())}
                </span>
              </div>
              
              <div className="border-t border-gray-200 pt-4">
                <div className="flex justify-between text-lg font-bold">
                  <span>Total</span>
                  <span className="text-blue-600">{formatPrice(getTotal())}</span>
                </div>
              </div>
            </div>
            
            <div className="space-y-3">
              <button
                onClick={handleCheckout}
                className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Finalizar Compra
              </button>
              
              <button
                onClick={clearCart}
                className="w-full border border-gray-300 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-50 transition-colors font-medium"
              >
                Limpar Carrinho
              </button>
            </div>
            
            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="flex items-center space-x-2 text-sm text-gray-600 mb-2">
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                </svg>
                <span>Pagamento seguro</span>
              </div>
              <div className="flex items-center space-x-2 text-sm text-gray-600 mb-2">
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>Acesso imediato</span>
              </div>
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Garantia de 30 dias</span>
              </div>
            </div>

            {/* Métodos de Pagamento */}
            <div className="mt-6 pt-6 border-t border-gray-200">
              <h4 className="text-sm font-medium text-gray-700 mb-3">Métodos de Pagamento</h4>
              <div className="flex items-center space-x-2">
                <div className="bg-gray-100 p-2 rounded text-xs font-medium">VISA</div>
                <div className="bg-gray-100 p-2 rounded text-xs font-medium">MASTER</div>
                <div className="bg-gray-100 p-2 rounded text-xs font-medium">PIX</div>
                <div className="bg-gray-100 p-2 rounded text-xs font-medium">BOLETO</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};