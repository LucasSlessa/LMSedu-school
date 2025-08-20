import { create } from 'zustand';
import { categoriesAPI } from '../lib/api';

interface Category {
  id: string;
  name: string;
  description?: string;
  color: string;
  slug: string;
}

interface CategoryState {
  categories: Category[];
  loading: boolean;
  
  fetchCategories: () => Promise<void>;
  getCategoryByName: (name: string) => Category | undefined;
  getCategoryById: (id: string) => Category | undefined;
  addCategory: (categoryData: Omit<Category, 'id'>) => Promise<void>;
  updateCategory: (id: string, categoryData: Partial<Category>) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
}

export const useCategoryStore = create<CategoryState>((set, get) => ({
  categories: [],
  loading: false,
  
  fetchCategories: async () => {
    set({ loading: true });
    try {
      const categories = await categoriesAPI.getAll();
      set({ categories, loading: false });
    } catch (error) {
      console.error('Erro ao buscar categorias:', error);
      set({ loading: false });
    }
  },
  
  getCategoryByName: (name: string) => {
    return get().categories.find(category => category.name === name);
  },
  
  getCategoryById: (id: string) => {
    return get().categories.find(category => category.id === id);
  },
  
  addCategory: async (categoryData) => {
    try {
      const newCategory = await categoriesAPI.create(categoryData);
      set(state => ({
        categories: [...state.categories, newCategory]
      }));
    } catch (error) {
      console.error('Erro ao criar categoria:', error);
      throw error;
    }
  },
  
  updateCategory: async (id: string, categoryData) => {
    try {
      const updatedCategory = await categoriesAPI.update(id, categoryData);
      set(state => ({
        categories: state.categories.map(category => 
          category.id === id ? { ...category, ...updatedCategory } : category
        )
      }));
    } catch (error) {
      console.error('Erro ao atualizar categoria:', error);
      throw error;
    }
  },
  
  deleteCategory: async (id: string) => {
    try {
      await categoriesAPI.delete(id);
      set(state => ({
        categories: state.categories.filter(category => category.id !== id)
      }));
    } catch (error) {
      console.error('Erro ao deletar categoria:', error);
      throw error;
    }
  },
}));