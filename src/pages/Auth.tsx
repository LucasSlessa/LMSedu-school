import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthForm } from '../components/auth/AuthForm';
import { useAuthStore } from '../store/authStore';
import { GraduationCap } from 'lucide-react';
import { Debug } from '../components/Debug';

export const Auth: React.FC = () => {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const { isAuthenticated } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);

  const handleAuthSuccess = () => {
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-xl mb-4">
            <GraduationCap className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">EduPlatform</h1>
          <p className="text-gray-600 mt-2">Sua jornada de aprendizado começa aqui</p>
        </div>

        <AuthForm 
          mode={mode} 
          onSuccess={handleAuthSuccess}
          onModeChange={setMode}
        />
        
        {/* Debug Component */}
        <div className="mt-8">
          <Debug />
        </div>
      </div>
    </div>
  );
};