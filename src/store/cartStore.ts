import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { cartAPI } from '../lib/api';

interface CartItem {
  id: string;
  quantity: number;
  addedAt: string;
  course: {
    id: string;
    title: string;
    description: string;
    shortDescription: string;
    price: number;
    duration: number;
    image: string;
    level: string;
    category: string;
    instructor: string;
  };
}

interface CartState {
  items: CartItem[];
  loading: boolean;
  
  fetchCartItems: () => Promise<void>;
  addToCart: (courseId: string) => Promise<boolean>;
  removeFromCart: (courseId: string) => Promise<boolean>;
  clearCart: () => Promise<boolean>;
  getTotal: () => number;
  getItemCount: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      loading: false,
      
      fetchCartItems: async () => {
        set({ loading: true });
        try {
          const items = await cartAPI.getItems();
          set({ items, loading: false });
        } catch (error) {
          console.error('Erro ao buscar carrinho:', error);
          set({ loading: false });
        }
      },
      
      addToCart: async (courseId: string) => {
        try {
          await cartAPI.addItem(courseId);
          await get().fetchCartItems();
          return true;
        } catch (error) {
          console.error('Erro ao adicionar ao carrinho:', error);
          return false;
        }
      },
      
      removeFromCart: async (courseId: string) => {
        try {
          await cartAPI.removeItem(courseId);
          await get().fetchCartItems();
          return true;
        } catch (error) {
          console.error('Erro ao remover do carrinho:', error);
          return false;
        }
      },
      
      clearCart: async () => {
        try {
          await cartAPI.clear();
          set({ items: [] });
          return true;
        } catch (error) {
          console.error('Erro ao limpar carrinho:', error);
          return false;
        }
      },
      
      getTotal: () => {
        return get().items.reduce((total, item) => total + (item.course.price * item.quantity), 0);
      },
      
      getItemCount: () => {
        return get().items.reduce((count, item) => count + item.quantity, 0);
      },
    }),
    {
      name: 'cart-storage',
      partialize: () => ({ items: [] }), // Não persistir itens do carrinho
    }
  )
);
