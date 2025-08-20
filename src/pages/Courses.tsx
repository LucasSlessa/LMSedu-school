import React, { useState, useMemo } from 'react';
import { CourseCard } from '../components/courses/CourseCard';
import { CourseFilters } from '../components/courses/CourseFilters';
import { useCourseStore } from '../store/courseStore';

export const Courses: React.FC = () => {
  const { courses } = useCourseStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Todas');
  const [selectedLevel, setSelectedLevel] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  
  const filteredAndSortedCourses = useMemo(() => {
    let filtered = courses.filter(course => {
      const matchesSearch = course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           course.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory === 'Todas' || course.category === selectedCategory;
      const matchesLevel = selectedLevel === '' || course.level === selectedLevel;
      
      return matchesSearch && matchesCategory && matchesLevel;
    });
    
    // Ordenação
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'popular':
          return b.studentsCount - a.studentsCount;
        case 'price-low':
          return a.price - b.price;
        case 'price-high':
          return b.price - a.price;
        case 'rating':
          return b.rating - a.rating;
        case 'newest':
        default:
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
    });
    
    return filtered;
  }, [courses, searchTerm, selectedCategory, selectedLevel, sortBy]);
  
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
          Catálogo de Cursos
        </h1>
        <p className="text-lg text-gray-600">
          Encontre o curso perfeito para desenvolver suas habilidades
        </p>
      </div>
      
      {/* Filtros */}
      <CourseFilters
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        selectedCategory={selectedCategory}
        setSelectedCategory={setSelectedCategory}
        selectedLevel={selectedLevel}
        setSelectedLevel={setSelectedLevel}
        sortBy={sortBy}
        setSortBy={setSortBy}
      />
      
      {/* Resultados */}
      <div className="mb-6 flex items-center justify-between">
        <p className="text-gray-600">
          {filteredAndSortedCourses.length} curso{filteredAndSortedCourses.length !== 1 ? 's' : ''} encontrado{filteredAndSortedCourses.length !== 1 ? 's' : ''}
        </p>
      </div>
      
      {/* Grid de Cursos */}
      {filteredAndSortedCourses.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredAndSortedCourses.map((course) => (
            <CourseCard key={course.id} course={course} />
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
          <div className="text-gray-400 mb-4">
            <svg className="mx-auto h-24 w-24" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0112 15c-2.34 0-4.47-.881-6.08-2.33" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum curso encontrado</h3>
          <p className="text-gray-500 mb-6">Tente ajustar os filtros ou pesquisar por outros termos</p>
          <button
            onClick={() => {
              setSearchTerm('');
              setSelectedCategory('Todas');
              setSelectedLevel('');
              setSortBy('newest');
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Limpar Filtros
          </button>
        </div>
      )}
    </div>
  );
};