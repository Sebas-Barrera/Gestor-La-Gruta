import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CodeLoginForm } from '@/components/shared/CodeLoginForm';
import { useAuth } from '@/contexts/AuthContext';

export function AdminLoginPage() {
  const navigate = useNavigate();
  const { login, isAuthenticated, currentUser } = useAuth();

  useEffect(() => {
    if (isAuthenticated && currentUser?.role === 'admin') {
      navigate('/admin/dashboard', { replace: true });
    }
  }, [isAuthenticated, currentUser, navigate]);

  const handleLogin = async (code: string) => {
    const result = await login(code, 'admin');
    if (result.success) {
      navigate('/admin/dashboard', { replace: true });
    }
    return result;
  };

  return (
    <CodeLoginForm
      title="Panel de Administración"
      subtitle="Ingresa tu código de acceso"
      icon={
        <div className="w-16 h-16 rounded-full bg-blue-500 flex items-center justify-center shadow-lg shadow-blue-500/25">
          <span className="text-white font-bold text-2xl">B</span>
        </div>
      }
      onSubmit={handleLogin}
      altLinkText="Acceso Almacén →"
      altLinkTo="/almacen/login"
    />
  );
}
