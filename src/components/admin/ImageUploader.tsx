import React, { useState, useRef, useCallback } from 'react';
import { Upload, Image, X, CheckCircle, AlertCircle } from 'lucide-react';

interface ImageUploaderProps {
  onImageSelect: (imageUrl: string) => void;
  currentImage?: string;
  label?: string;
  description?: string;
  maxSize?: number; // em MB
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({
  onImageSelect,
  currentImage,
  label = "Imagem do Curso",
  description = "Arraste e solte uma imagem aqui ou clique para selecionar",
  maxSize = 5, // 5MB por padrão
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const validateImage = useCallback((file: File): string | null => {
    // Verificar se é uma imagem
    if (!file.type.startsWith('image/')) {
      return 'Por favor, selecione apenas arquivos de imagem';
    }
    
    // Verificar tamanho
    if (file.size > maxSize * 1024 * 1024) {
      return `Imagem muito grande. Tamanho máximo: ${maxSize}MB`;
    }
    
    // Verificar tipos suportados
    const supportedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
    if (!supportedTypes.includes(file.type)) {
      return 'Formato não suportado. Use: JPEG, PNG, WebP ou GIF';
    }
    
    return null;
  }, [maxSize]);
  
  const simulateUpload = useCallback((file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      setIsUploading(true);
      setUploadProgress(0);
      
      // Criar URL temporária imediatamente para preview
      const imageUrl = URL.createObjectURL(file);
      
      // Simular progresso de upload
      const interval = setInterval(() => {
        setUploadProgress(prev => {
          const newProgress = prev + Math.random() * 30;
          if (newProgress >= 100) {
            clearInterval(interval);
            setIsUploading(false);
            setUploadProgress(100);
            
            // Resolver com a URL da imagem
            resolve(imageUrl);
            
            return 100;
          }
          return newProgress;
        });
      }, 100); // Mais rápido para melhor UX
    });
  }, []);
  
  const handleFileSelect = useCallback(async (file: File) => {
    setError(null);
    
    const validationError = validateImage(file);
    if (validationError) {
      setError(validationError);
      return;
    }
    
    try {
      const imageUrl = await simulateUpload(file);
      onImageSelect(imageUrl);
    } catch (err) {
      setError('Erro ao fazer upload da imagem. Tente novamente.');
    }
  }, [validateImage, simulateUpload, onImageSelect]);
  
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  }, []);
  
  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);
  
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  }, [handleFileSelect]);
  
  const handleClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    fileInputRef.current?.click();
  }, []);
  
  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
  }, [handleFileSelect]);
  
  const removeImage = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onImageSelect('');
    setUploadProgress(0);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [onImageSelect]);
  
  const handleUrlChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    const url = e.target.value.trim();
    
    // Reset error state
    setError(null);
    setUploadProgress(0);
    
    // If URL is empty, clear the image
    if (!url) {
      onImageSelect('');
      return;
    }
    
    // Basic URL validation
    try {
      new URL(url);
      onImageSelect(url);
      setUploadProgress(100); // Mark as "uploaded" for URL images
    } catch (error) {
      // If URL is invalid, still pass it through but don't mark as complete
      onImageSelect(url);
    }
  }, [onImageSelect]);
  
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label}
        </label>
        
        {/* Área de Upload */}
        <div
          className={`relative border-2 border-dashed rounded-lg transition-colors ${
            isDragOver
              ? 'border-blue-400 bg-blue-50'
              : currentImage
              ? 'border-green-300 bg-green-50'
              : 'border-gray-300 hover:border-gray-400'
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileInputChange}
            className="hidden"
          />
          
          {currentImage ? (
            /* Preview da Imagem */
            <div className="relative">
              <img
                src={currentImage}
                alt="Preview"
                className="w-full h-48 object-cover rounded-lg"
                onError={() => {
                  console.error('Erro ao carregar imagem:', currentImage);
                  setError(`Erro ao carregar imagem: ${currentImage}`);
                }}
                onLoad={() => {
                  console.log('Imagem carregada com sucesso:', currentImage);
                  setError(null);
                }}
              />
              <div className="absolute inset-0 bg-black bg-opacity-40 rounded-lg flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                <div className="flex items-center space-x-3">
                  <button
                    type="button"
                    onClick={handleClick}
                    className="px-4 py-2 bg-white text-gray-900 rounded-lg hover:bg-gray-100 transition-colors font-medium"
                  >
                    Alterar
                  </button>
                  <button
                    type="button"
                    onClick={removeImage}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
                  >
                    Remover
                  </button>
                </div>
              </div>
              
              {uploadProgress === 100 && (
                <div className="absolute top-3 right-3 bg-green-600 text-white p-2 rounded-full">
                  <CheckCircle className="h-4 w-4" />
                </div>
              )}
            </div>
          ) : (
            /* Área de Upload Vazia */
            <div
              className="p-8 text-center cursor-pointer"
              onClick={handleClick}
            >
              <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">{description}</h3>
              <p className="text-sm text-gray-500 mb-2">
                Formatos suportados: JPEG, PNG, WebP, GIF
              </p>
              <p className="text-xs text-gray-400">
                Tamanho máximo: {maxSize}MB • Resolução recomendada: 1200x600px
              </p>
            </div>
          )}
          
          {/* Barra de Progresso */}
          {isUploading && (
            <div className="absolute bottom-0 left-0 right-0 bg-white bg-opacity-90 p-4 rounded-b-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Fazendo upload...</span>
                <span className="text-sm text-gray-600">{Math.round(uploadProgress)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}
        </div>
        
        {/* Erro */}
        {error && (
          <div className="mt-3 flex items-center space-x-2 text-red-600 text-sm">
            <AlertCircle className="h-4 w-4" />
            <span>{error}</span>
          </div>
        )}
        
        {/* URL Manual (Fallback) */}
        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Ou insira uma URL de imagem:
          </label>
          <input
            type="url"
            value={currentImage?.startsWith('blob:') ? '' : currentImage || ''}
            onChange={handleUrlChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="https://exemplo.com/imagem.jpg"
          />
        </div>
      </div>
    </div>
  );
};