import React, { useState } from 'react';
import { Plus, Edit, Trash2, Tag, Save, X } from 'lucide-react';

interface Category {
  id: string;
  name: string;
  description: string;
  color: string;
  createdAt: string;
}

interface CategoryManagerProps {
  categories: Category[];
  onCategoriesChange: (categories: Category[]) => void;
  selectedCategory?: string;
  onCategorySelect?: (categoryName: string) => void;
}

export const CategoryManager: React.FC<CategoryManagerProps> = ({
  categories,
  onCategoriesChange,
  selectedCategory,
  onCategorySelect,
}) => {
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [newCategory, setNewCategory] = useState({
    name: '',
    description: '',
    color: '#3B82F6',
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

  const handleAddCategory = () => {
    if (!newCategory.name.trim()) return;

    const category: Category = {
      id: Date.now().toString(),
      name: newCategory.name.trim(),
      description: newCategory.description.trim(),
      color: newCategory.color,
      createdAt: new Date().toISOString(),
    };

    onCategoriesChange([...categories, category]);
    setNewCategory({ name: '', description: '', color: '#3B82F6' });
    setIsAddingCategory(false);
  };

  const handleEditCategory = (categoryId: string, updatedData: Partial<Category>) => {
    const updatedCategories = categories.map(cat =>
      cat.id === categoryId ? { ...cat, ...updatedData } : cat
    );
    onCategoriesChange(updatedCategories);
    setEditingCategory(null);
  };

  const handleDeleteCategory = (categoryId: string) => {
    if (window.confirm('Tem certeza que deseja excluir esta categoria?')) {
      const updatedCategories = categories.filter(cat => cat.id !== categoryId);
      onCategoriesChange(updatedCategories);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Gerenciar Categorias</h3>
        <button
          onClick={() => setIsAddingCategory(true)}
          className="flex items-center space-x-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
        >
          <Plus className="h-4 w-4" />
          <span>Nova Categoria</span>
        </button>
      </div>

      {/* Formulário de Nova Categoria */}
      {isAddingCategory && (
        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
          <h4 className="font-medium text-gray-900 mb-3">Adicionar Nova Categoria</h4>
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
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Descrição (opcional)
            </label>
            <textarea
              value={newCategory.description}
              onChange={(e) => setNewCategory({ ...newCategory, description: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={2}
              placeholder="Descrição da categoria..."
            />
          </div>
          
          <div className="flex items-center space-x-3">
            <button
              onClick={handleAddCategory}
              className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <Save className="h-4 w-4" />
              <span>Salvar</span>
            </button>
            <button
              onClick={() => {
                setIsAddingCategory(false);
                setNewCategory({ name: '', description: '', color: '#3B82F6' });
              }}
              className="flex items-center space-x-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <X className="h-4 w-4" />
              <span>Cancelar</span>
            </button>
          </div>
        </div>
      )}

      {/* Lista de Categorias */}
      <div className="space-y-2">
        {categories.map((category) => (
          <div
            key={category.id}
            className={`p-4 border rounded-lg transition-colors ${
              selectedCategory === category.name
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            {editingCategory === category.id ? (
              <EditCategoryForm
                category={category}
                onSave={(updatedData) => handleEditCategory(category.id, updatedData)}
                onCancel={() => setEditingCategory(null)}
                predefinedColors={predefinedColors}
              />
            ) : (
              <div className="flex items-center justify-between">
                <div 
                  className={`flex items-center space-x-3 ${onCategorySelect ? 'cursor-pointer' : ''}`}
                  onClick={() => onCategorySelect?.(category.name)}
                >
                  <div
                    className="w-4 h-4 rounded-full border border-gray-300"
                    style={{ backgroundColor: category.color }}
                  />
                  <div>
                    <h4 className="font-medium text-gray-900">{category.name}</h4>
                    {category.description && (
                      <p className="text-sm text-gray-600">{category.description}</p>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setEditingCategory(category.id)}
                    className="p-1 text-gray-400 hover:text-blue-600 rounded"
                    title="Editar categoria"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteCategory(category.id)}
                    className="p-1 text-gray-400 hover:text-red-600 rounded"
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
        <div className="text-center py-8 text-gray-500">
          <Tag className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <p>Nenhuma categoria criada ainda</p>
          <button
            onClick={() => setIsAddingCategory(true)}
            className="mt-2 text-blue-600 hover:text-blue-700 font-medium"
          >
            Criar primeira categoria
          </button>
        </div>
      )}
    </div>
  );
};

interface EditCategoryFormProps {
  category: Category;
  onSave: (data: Partial<Category>) => void;
  onCancel: () => void;
  predefinedColors: string[];
}

const EditCategoryForm: React.FC<EditCategoryFormProps> = ({
  category,
  onSave,
  onCancel,
  predefinedColors,
}) => {
  const [editData, setEditData] = useState({
    name: category.name,
    description: category.description,
    color: category.color,
  });

  const handleSave = () => {
    if (!editData.name.trim()) return;
    onSave(editData);
  };

  return (
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
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Descrição (opcional)
        </label>
        <textarea
          value={editData.description}
          onChange={(e) => setEditData({ ...editData, description: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          rows={2}
        />
      </div>
      
      <div className="flex items-center space-x-3">
        <button
          onClick={handleSave}
          className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
        >
          <Save className="h-4 w-4" />
          <span>Salvar</span>
        </button>
        <button
          onClick={onCancel}
          className="flex items-center space-x-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <X className="h-4 w-4" />
          <span>Cancelar</span>
        </button>
      </div>
    </div>
  );
};