import React, { useState } from 'react';
import { Plus, Trash2, GripVertical, Copy, Eye } from 'lucide-react';

interface QuizQuestion {
  id: string;
  type: 'multiple-choice' | 'true-false' | 'short-answer';
  question: string;
  options: string[];
  correctAnswer: number | string;
  explanation?: string;
  required: boolean;
  points: number;
}

interface QuizBuilderProps {
  questions: QuizQuestion[];
  onChange: (questions: QuizQuestion[]) => void;
}

export const QuizBuilder: React.FC<QuizBuilderProps> = ({ questions, onChange }) => {
  const [previewMode, setPreviewMode] = useState(false);
  
  const questionTypes = [
    { value: 'multiple-choice', label: 'Múltipla Escolha', icon: '◉' },
    { value: 'true-false', label: 'Verdadeiro/Falso', icon: '✓' },
    { value: 'short-answer', label: 'Resposta Curta', icon: '✎' },
  ];
  
  const addQuestion = () => {
    const newQuestion: QuizQuestion = {
      id: Date.now().toString(),
      type: 'multiple-choice',
      question: '',
      options: ['Opção 1', 'Opção 2', 'Opção 3', 'Opção 4'],
      correctAnswer: 0,
      explanation: '',
      required: true,
      points: 1,
    };
    onChange([...questions, newQuestion]);
  };
  
  const updateQuestion = (questionId: string, field: string, value: any) => {
    const updatedQuestions = questions.map(q => 
      q.id === questionId ? { ...q, [field]: value } : q
    );
    onChange(updatedQuestions);
  };
  
  const deleteQuestion = (questionId: string) => {
    onChange(questions.filter(q => q.id !== questionId));
  };
  
  const duplicateQuestion = (questionId: string) => {
    const questionToDuplicate = questions.find(q => q.id === questionId);
    if (questionToDuplicate) {
      const duplicated = {
        ...questionToDuplicate,
        id: Date.now().toString(),
        question: questionToDuplicate.question + ' (Cópia)',
      };
      onChange([...questions, duplicated]);
    }
  };
  
  const addOption = (questionId: string) => {
    const question = questions.find(q => q.id === questionId);
    if (question && question.options.length < 6) {
      const newOptions = [...question.options, `Opção ${question.options.length + 1}`];
      updateQuestion(questionId, 'options', newOptions);
    }
  };
  
  const removeOption = (questionId: string, optionIndex: number) => {
    const question = questions.find(q => q.id === questionId);
    if (question && question.options.length > 2) {
      const newOptions = question.options.filter((_, index) => index !== optionIndex);
      updateQuestion(questionId, 'options', newOptions);
      
      // Ajustar resposta correta se necessário
      if (question.correctAnswer === optionIndex) {
        updateQuestion(questionId, 'correctAnswer', 0);
      } else if (typeof question.correctAnswer === 'number' && question.correctAnswer > optionIndex) {
        updateQuestion(questionId, 'correctAnswer', question.correctAnswer - 1);
      }
    }
  };
  
  const updateOption = (questionId: string, optionIndex: number, value: string) => {
    const question = questions.find(q => q.id === questionId);
    if (question) {
      const newOptions = [...question.options];
      newOptions[optionIndex] = value;
      updateQuestion(questionId, 'options', newOptions);
    }
  };
  
  if (previewMode) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Visualização do Questionário</h3>
          <button
            onClick={() => setPreviewMode(false)}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            Voltar à Edição
          </button>
        </div>
        
        <div className="bg-gray-50 p-6 rounded-lg">
          {questions.map((question, index) => (
            <div key={question.id} className="bg-white p-6 rounded-lg mb-4 shadow-sm">
              <div className="flex items-start space-x-3 mb-4">
                <span className="bg-blue-100 text-blue-800 text-sm font-medium px-2 py-1 rounded">
                  {index + 1}
                </span>
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900 mb-2">
                    {question.question || 'Pergunta sem título'}
                    {question.required && <span className="text-red-500 ml-1">*</span>}
                  </h4>
                  
                  {question.type === 'multiple-choice' && (
                    <div className="space-y-2">
                      {question.options.map((option, optionIndex) => (
                        <label key={optionIndex} className="flex items-center space-x-2">
                          <input type="radio" name={`question-${question.id}`} className="text-blue-600" />
                          <span>{option}</span>
                        </label>
                      ))}
                    </div>
                  )}
                  
                  {question.type === 'true-false' && (
                    <div className="space-y-2">
                      <label className="flex items-center space-x-2">
                        <input type="radio" name={`question-${question.id}`} className="text-blue-600" />
                        <span>Verdadeiro</span>
                      </label>
                      <label className="flex items-center space-x-2">
                        <input type="radio" name={`question-${question.id}`} className="text-blue-600" />
                        <span>Falso</span>
                      </label>
                    </div>
                  )}
                  
                  {question.type === 'short-answer' && (
                    <input
                      type="text"
                      placeholder="Sua resposta..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      disabled
                    />
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">
          Construtor de Questionário ({questions.length} pergunta{questions.length !== 1 ? 's' : ''})
        </h3>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setPreviewMode(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            <Eye className="h-4 w-4" />
            <span>Visualizar</span>
          </button>
          <button
            onClick={addQuestion}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            <span>Adicionar Pergunta</span>
          </button>
        </div>
      </div>
      
      {questions.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
          <div className="text-gray-400 mb-4">
            <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhuma pergunta criada</h3>
          <p className="text-gray-500 mb-4">Comece adicionando sua primeira pergunta ao questionário</p>
          <button
            onClick={addQuestion}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-4 w-4 mr-2" />
            Criar Primeira Pergunta
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {questions.map((question, index) => (
            <div key={question.id} className="bg-white border border-gray-200 rounded-lg p-6">
              {/* Header da Pergunta */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="flex items-center space-x-2">
                    <GripVertical className="h-4 w-4 text-gray-400 cursor-move" />
                    <span className="bg-blue-100 text-blue-800 text-sm font-medium px-2 py-1 rounded">
                      {index + 1}
                    </span>
                  </div>
                  <select
                    value={question.type}
                    onChange={(e) => updateQuestion(question.id, 'type', e.target.value)}
                    className="text-sm border border-gray-300 rounded px-2 py-1"
                  >
                    {questionTypes.map(type => (
                      <option key={type.value} value={type.value}>
                        {type.icon} {type.label}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => duplicateQuestion(question.id)}
                    className="p-1 text-gray-400 hover:text-blue-600 rounded"
                    title="Duplicar pergunta"
                  >
                    <Copy className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => deleteQuestion(question.id)}
                    className="p-1 text-gray-400 hover:text-red-600 rounded"
                    title="Excluir pergunta"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
              
              {/* Configurações da Pergunta */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Pergunta *
                  </label>
                  <textarea
                    value={question.question}
                    onChange={(e) => updateQuestion(question.id, 'question', e.target.value)}
                    placeholder="Digite sua pergunta aqui..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={2}
                  />
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Pontos
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="10"
                      value={question.points}
                      onChange={(e) => updateQuestion(question.id, 'points', parseInt(e.target.value) || 1)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id={`required-${question.id}`}
                      checked={question.required}
                      onChange={(e) => updateQuestion(question.id, 'required', e.target.checked)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor={`required-${question.id}`} className="ml-2 text-sm text-gray-700">
                      Obrigatória
                    </label>
                  </div>
                </div>
              </div>
              
              {/* Opções de Resposta */}
              {question.type === 'multiple-choice' && (
                <div className="space-y-3">
                  <label className="block text-sm font-medium text-gray-700">
                    Opções de Resposta
                  </label>
                  {question.options.map((option, optionIndex) => (
                    <div key={optionIndex} className="flex items-center space-x-3">
                      <input
                        type="radio"
                        name={`correct-${question.id}`}
                        checked={question.correctAnswer === optionIndex}
                        onChange={() => updateQuestion(question.id, 'correctAnswer', optionIndex)}
                        className="text-blue-600"
                      />
                      <input
                        type="text"
                        value={option}
                        onChange={(e) => updateOption(question.id, optionIndex, e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder={`Opção ${optionIndex + 1}`}
                      />
                      {question.options.length > 2 && (
                        <button
                          onClick={() => removeOption(question.id, optionIndex)}
                          className="p-1 text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  ))}
                  
                  {question.options.length < 6 && (
                    <button
                      onClick={() => addOption(question.id)}
                      className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                    >
                      + Adicionar opção
                    </button>
                  )}
                </div>
              )}
              
              {question.type === 'true-false' && (
                <div className="space-y-3">
                  <label className="block text-sm font-medium text-gray-700">
                    Resposta Correta
                  </label>
                  <div className="space-y-2">
                    <label className="flex items-center space-x-2">
                      <input
                        type="radio"
                        name={`correct-${question.id}`}
                        checked={question.correctAnswer === 'true'}
                        onChange={() => updateQuestion(question.id, 'correctAnswer', 'true')}
                        className="text-blue-600"
                      />
                      <span>Verdadeiro</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input
                        type="radio"
                        name={`correct-${question.id}`}
                        checked={question.correctAnswer === 'false'}
                        onChange={() => updateQuestion(question.id, 'correctAnswer', 'false')}
                        className="text-blue-600"
                      />
                      <span>Falso</span>
                    </label>
                  </div>
                </div>
              )}
              
              {question.type === 'short-answer' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Resposta Esperada (para correção manual)
                  </label>
                  <input
                    type="text"
                    value={question.correctAnswer as string || ''}
                    onChange={(e) => updateQuestion(question.id, 'correctAnswer', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Resposta modelo ou palavras-chave"
                  />
                </div>
              )}
              
              {/* Explicação */}
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Explicação (opcional)
                </label>
                <textarea
                  value={question.explanation || ''}
                  onChange={(e) => updateQuestion(question.id, 'explanation', e.target.value)}
                  placeholder="Explicação que será mostrada após a resposta..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={2}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};