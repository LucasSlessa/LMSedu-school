import React, { useState } from 'react';

export const Debug: React.FC = () => {
  const [result, setResult] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const testLogin = async () => {
    setLoading(true);
    setResult('Testando...');
    
    try {
      const response = await fetch('http://localhost:3001/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: 'admin@lms.com',
          password: '123456'
        })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setResult(`✅ SUCESSO!\n\n${JSON.stringify(data, null, 2)}`);
      } else {
        setResult(`❌ ERRO (${response.status})\n\n${JSON.stringify(data, null, 2)}`);
      }
    } catch (error: any) {
      setResult(`❌ ERRO DE CONEXÃO\n\n${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const testHealth = async () => {
    setLoading(true);
    setResult('Testando health check...');
    
    try {
      const response = await fetch('http://localhost:3001/api/health');
      const data = await response.json();
      
      if (response.ok) {
        setResult(`✅ HEALTH CHECK OK!\n\n${JSON.stringify(data, null, 2)}`);
      } else {
        setResult(`❌ HEALTH CHECK FALHOU (${response.status})\n\n${JSON.stringify(data, null, 2)}`);
      }
    } catch (error: any) {
      setResult(`❌ ERRO DE CONEXÃO\n\n${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-4 right-4 bg-white border border-gray-300 rounded-lg p-4 shadow-lg max-w-md">
      <h3 className="text-lg font-bold mb-4">🐛 Debug API</h3>
      
      <div className="space-y-2 mb-4">
        <button
          onClick={testHealth}
          disabled={loading}
          className="w-full bg-green-500 text-white px-4 py-2 rounded text-sm disabled:opacity-50"
        >
          Testar Health Check
        </button>
        
        <button
          onClick={testLogin}
          disabled={loading}
          className="w-full bg-blue-500 text-white px-4 py-2 rounded text-sm disabled:opacity-50"
        >
          Testar Login
        </button>
      </div>
      
      {result && (
        <div className="bg-gray-100 p-3 rounded text-xs font-mono whitespace-pre-wrap max-h-40 overflow-y-auto">
          {result}
        </div>
      )}
    </div>
  );
}; 