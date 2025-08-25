import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Save, X, Tag } from 'lucide-react';
import { categoriesAPI } from '../../lib/api';
import { useCategoryStore } from '../../store/categoryStore';

interface Category {
  id: string;
  name: string;
  description: string;
  color: string;
  slug: string;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export const AdminCategories: React.FC = () => {
  const { categories, fetchCategories } = useCategoryStore();
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [newCategory, setNewCategory] = useState({
    name: '',
    description: '',
    color: '#3B82F6',
    sortOrder: 0,
    isActive: true,
  });

  const [editData, setEditData] = useState({
    name: '',
    description: '',
    color: '#3B82F6',
    sortOrder: 0,
    isActive: true,
  });

  const predefinedColors = [
    '#3B82F6', // Blue
    '#10B981', // Green
    '#F59E0B', // Yellow
    '#EF4444', // Red
    '#8B5CF6', // Purple
    '#F97316', // Orange
    '#06B6D4', // Cyan
    '#84CC16', // Lime
    '#EC4899', // Pink
    '#6B7280', // Gray
  ];

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const handleAddCategory = async () => {
    if (!newCategory.name.trim()) {
      setError('Nome da categoria é obrigatório');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await categoriesAPI.create({
        name: newCategory.name.trim(),
        description: newCategory.description.trim(),
        color: newCategory.color,
        sortOrder: newCategory.sortOrder,
        isActive: newCategory.isActive,
      });

      setNewCategory({ name: '', description: '', color: '#3B82F6', sortOrder: 0, isActive: true });
      setIsAddingCategory(false);
      fetchCategories();
    } catch (err: any) {
      setError(err.message || 'Erro ao criar categoria');
    } finally {
      setLoading(false);
    }
  };

  const handleEditCategory = async (categoryId: string) => {
    if (!editData.name.trim()) {
      setError('Nome da categoria é obrigatório');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await categoriesAPI.update(categoryId, {
        name: editData.name.trim(),
        description: editData.description.trim(),
        color: editData.color,
        sortOrder: editData.sortOrder,
        isActive: editData.isActive,
      });

      setEditingCategory(null);
      fetchCategories();
    } catch (err: any) {
      setError(err.message || 'Erro ao atualizar categoria');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCategory = async (categoryId: string) => {
    if (!window.confirm('Tem certeza que deseja excluir esta categoria?')) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await categoriesAPI.delete(categoryId);
      fetchCategories();
    } catch (err: any) {
      setError(err.message || 'Erro ao excluir categoria');
    } finally {
      setLoading(false);
    }
  };

  const startEditing = (category: Category) => {
    setEditData({
      name: category.name,
      description: category.description || '',
      color: category.color,
      sortOrder: category.sort_order,
      isActive: category.is_active,
    });
    setEditingCategory(category.id);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Gerenciar Categorias</h1>
        <p className="mt-2 text-gray-600">Crie e gerencie as categorias dos cursos</p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <X className="h-5 w-5 text-red-600 mr-2" />
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        </div>
      )}

      {/* Add Category Button */}
      <div className="mb-6">
        <button
          onClick={() => setIsAddingCategory(true)}
          disabled={loading}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
        >
          <Plus className="h-4 w-4" />
          <span>Nova Categoria</span>
        </button>
      </div>

      {/* Add Category Form */}
      {isAddingCategory && (
        <div className="mb-8 bg-gray-50 p-6 rounded-lg border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Adicionar Nova Categoria</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nome da Categoria *
              </label>
              <input
                type="text"
                value={newCategory.name}
                onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Ex: Desenvolvimento Web"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Cor da Categoria
              </label>
              <div className="flex items-center space-x-2">
                <input
                  type="color"
                  value={newCategory.color}
                  onChange={(e) => setNewCategory({ ...newCategory, color: e.target.value })}
                  className="w-12 h-10 border border-gray-300 rounded cursor-pointer"
                />
                <div className="flex flex-wrap gap-1">
                  {predefinedColors.map((color) => (
                    <button
                      key={color}
                      onClick={() => setNewCategory({ ...newCategory, color })}
                      className="w-6 h-6 rounded border-2 border-gray-300 hover:border-gray-400 transition-colors"
                      style={{ backgroundColor: color }}
                      title={color}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Ordem de Exibição
              </label>
              <input
                type="number"
                value={newCategory.sortOrder}
                onChange={(e) => setNewCategory({ ...newCategory, sortOrder: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="0"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                value={newCategory.isActive ? 'true' : 'false'}
                onChange={(e) => setNewCategory({ ...newCategory, isActive: e.target.value === 'true' })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="true">Ativa</option>
                <option value="false">Inativa</option>
              </select>
            </div>
          </div>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Descrição (opcional)
            </label>
            <textarea
              value={newCategory.description}
              onChange={(e) => setNewCategory({ ...newCategory, description: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={3}
              placeholder="Descrição da categoria..."
            />
          </div>
          
          <div className="flex items-center space-x-3">
            <button
              onClick={handleAddCategory}
              disabled={loading}
              className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
            >
              <Save className="h-4 w-4" />
              <span>{loading ? 'Salvando...' : 'Salvar'}</span>
            </button>
            <button
              onClick={() => {
                setIsAddingCategory(false);
                setNewCategory({ name: '', description: '', color: '#3B82F6', sortOrder: 0, isActive: true });
              }}
              disabled={loading}
              className="flex items-center space-x-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              <X className="h-4 w-4" />
              <span>Cancelar</span>
            </button>
          </div>
        </div>
      )}

      {/* Categories List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Categorias ({categories.length})</h3>
        </div>
        
        <div className="divide-y divide-gray-200">
          {categories.map((category) => (
            <div key={category.id} className="p-6">
              {editingCategory === category.id ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Nome da Categoria *
                      </label>
                      <input
                        type="text"
                        value={editData.name}
                        onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Cor da Categoria
                      </label>
                      <div className="flex items-center space-x-2">
                        <input
                          type="color"
                          value={editData.color}
                          onChange={(e) => setEditData({ ...editData, color: e.target.value })}
                          className="w-12 h-10 border border-gray-300 rounded cursor-pointer"
                        />
                        <div className="flex flex-wrap gap-1">
                          {predefinedColors.map((color) => (
                            <button
                              key={color}
                              onClick={() => setEditData({ ...editData, color })}
                              className="w-6 h-6 rounded border-2 border-gray-300 hover:border-gray-400 transition-colors"
                              style={{ backgroundColor: color }}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Ordem de Exibição
                      </label>
                      <input
                        type="number"
                        value={editData.sortOrder}
                        onChange={(e) => setEditData({ ...editData, sortOrder: parseInt(e.target.value) || 0 })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Status
                      </label>
                      <select
                        value={editData.isActive ? 'true' : 'false'}
                        onChange={(e) => setEditData({ ...editData, isActive: e.target.value === 'true' })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="true">Ativa</option>
                        <option value="false">Inativa</option>
                      </select>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Descrição (opcional)
                    </label>
                    <textarea
                      value={editData.description}
                      onChange={(e) => setEditData({ ...editData, description: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      rows={3}
                    />
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={() => handleEditCategory(category.id)}
                      disabled={loading}
                      className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                    >
                      <Save className="h-4 w-4" />
                      <span>{loading ? 'Salvando...' : 'Salvar'}</span>
                    </button>
                    <button
                      onClick={() => setEditingCategory(null)}
                      disabled={loading}
                      className="flex items-center space-x-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                    >
                      <X className="h-4 w-4" />
                      <span>Cancelar</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div
                      className="w-4 h-4 rounded-full border border-gray-300"
                      style={{ backgroundColor: category.color }}
                    />
                    <div>
                      <h4 className="font-medium text-gray-900">{category.name}</h4>
                      {category.description && (
                        <p className="text-sm text-gray-600">{category.description}</p>
                      )}
                      <div className="flex items-center space-x-4 mt-1">
                        <span className="text-xs text-gray-500">Slug: {category.slug}</span>
                        <span className="text-xs text-gray-500">Ordem: {category.sort_order}</span>
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          category.is_active 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {category.is_active ? 'Ativa' : 'Inativa'}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => startEditing(category)}
                      disabled={loading}
                      className="p-2 text-gray-400 hover:text-blue-600 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50"
                      title="Editar categoria"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteCategory(category.id)}
                      disabled={loading}
                      className="p-2 text-gray-400 hover:text-red-600 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50"
                      title="Excluir categoria"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {categories.length === 0 && !isAddingCategory && (
          <div className="text-center py-12 text-gray-500">
            <Tag className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <p className="text-lg font-medium">Nenhuma categoria criada ainda</p>
            <p className="text-sm">Comece criando sua primeira categoria</p>
            <button
              onClick={() => setIsAddingCategory(true)}
              className="mt-4 text-blue-600 hover:text-blue-700 font-medium"
            >
              Criar primeira categoria
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
