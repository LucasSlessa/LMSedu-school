import React, { useState, useRef } from 'react';
import { Upload, File, X, CheckCircle, AlertCircle, Image, FileText, Video } from 'lucide-react';

interface FileUploaderProps {
  accept?: string;
  multiple?: boolean;
  maxSize?: number; // em MB
  onFileSelect: (files: File[]) => void;
  uploadedFiles?: UploadedFile[];
  onFileRemove?: (fileId: string) => void;
  label?: string;
  description?: string;
}

interface UploadedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  url: string;
  status: 'uploading' | 'completed' | 'error';
  progress?: number;
}

export const FileUploader: React.FC<FileUploaderProps> = ({
  accept = "*/*",
  multiple = false,
  maxSize = 100, // 100MB por padrão
  onFileSelect,
  uploadedFiles = [],
  onFileRemove,
  label = "Upload de Arquivos",
  description = "Arraste e solte arquivos aqui ou clique para selecionar"
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return <Image className="h-8 w-8 text-blue-500" />;
    if (type.startsWith('video/')) return <Video className="h-8 w-8 text-purple-500" />;
    if (type.includes('pdf')) return <FileText className="h-8 w-8 text-red-500" />;
    return <File className="h-8 w-8 text-gray-500" />;
  };
  
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };
  
  const validateFiles = (files: File[]) => {
    const newErrors: string[] = [];
    const validFiles: File[] = [];
    
    files.forEach(file => {
      // Verificar tamanho
      if (file.size > maxSize * 1024 * 1024) {
        newErrors.push(`${file.name}: Arquivo muito grande (máximo ${maxSize}MB)`);
        return;
      }
      
      // Verificar tipo se especificado
      if (accept !== "*/*") {
        const acceptedTypes = accept.split(',').map(type => type.trim());
        const isValidType = acceptedTypes.some(acceptedType => {
          if (acceptedType.startsWith('.')) {
            return file.name.toLowerCase().endsWith(acceptedType.toLowerCase());
          }
          return file.type.match(acceptedType.replace('*', '.*'));
        });
        
        if (!isValidType) {
          newErrors.push(`${file.name}: Tipo de arquivo não permitido`);
          return;
        }
      }
      
      validFiles.push(file);
    });
    
    setErrors(newErrors);
    return validFiles;
  };
  
  const handleFileSelect = (files: FileList | null) => {
    if (!files) return;
    
    const fileArray = Array.from(files);
    const validFiles = validateFiles(fileArray);
    
    if (validFiles.length > 0) {
      onFileSelect(validFiles);
    }
  };
  
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };
  
  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };
  
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    handleFileSelect(e.dataTransfer.files);
  };
  
  const handleClick = () => {
    fileInputRef.current?.click();
  };
  
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label}
        </label>
        
        {/* Área de Upload */}
        <div
          className={`relative border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
            isDragOver
              ? 'border-blue-400 bg-blue-50'
              : 'border-gray-300 hover:border-gray-400'
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={handleClick}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept={accept}
            multiple={multiple}
            onChange={(e) => handleFileSelect(e.target.files)}
            className="hidden"
          />
          
          <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">{description}</h3>
          <p className="text-sm text-gray-500 mb-2">
            {accept !== "*/*" && `Tipos aceitos: ${accept}`}
          </p>
          <p className="text-xs text-gray-400">
            Tamanho máximo: {maxSize}MB {multiple && '• Múltiplos arquivos permitidos'}
          </p>
        </div>
        
        {/* Erros */}
        {errors.length > 0 && (
          <div className="mt-3 space-y-1">
            {errors.map((error, index) => (
              <div key={index} className="flex items-center space-x-2 text-red-600 text-sm">
                <AlertCircle className="h-4 w-4" />
                <span>{error}</span>
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* Lista de Arquivos Enviados */}
      {uploadedFiles.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-gray-700">
            Arquivos Enviados ({uploadedFiles.length})
          </h4>
          
          <div className="space-y-2">
            {uploadedFiles.map((file) => (
              <div key={file.id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                {getFileIcon(file.type)}
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {file.name}
                    </p>
                    <div className="flex items-center space-x-2">
                      {file.status === 'completed' && (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      )}
                      {file.status === 'error' && (
                        <AlertCircle className="h-4 w-4 text-red-500" />
                      )}
                      {onFileRemove && (
                        <button
                          onClick={() => onFileRemove(file.id)}
                          className="p-1 text-gray-400 hover:text-red-500 rounded"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between mt-1">
                    <p className="text-xs text-gray-500">
                      {formatFileSize(file.size)}
                    </p>
                    
                    {file.status === 'uploading' && file.progress !== undefined && (
                      <div className="flex items-center space-x-2">
                        <div className="w-20 bg-gray-200 rounded-full h-1">
                          <div
                            className="bg-blue-600 h-1 rounded-full transition-all duration-300"
                            style={{ width: `${file.progress}%` }}
                          />
                        </div>
                        <span className="text-xs text-gray-500">{file.progress}%</span>
                      </div>
                    )}
                  </div>
                  
                  {file.status === 'completed' && file.url && (
                    <a
                      href={file.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-blue-600 hover:text-blue-700"
                    >
                      Visualizar arquivo
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};