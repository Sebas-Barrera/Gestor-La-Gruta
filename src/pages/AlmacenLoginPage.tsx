import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Store } from 'lucide-react';
import { CodeLoginForm } from '@/components/shared/CodeLoginForm';
import { useAuth } from '@/contexts/AuthContext';

export function AlmacenLoginPage() {
  const navigate = useNavigate();
  const { login, isAuthenticated, currentUser } = useAuth();

  useEffect(() => {
    if (isAuthenticated && currentUser?.role === 'worker') {
      navigate('/almacen/inventory', { replace: true });
    }
  }, [isAuthenticated, currentUser, navigate]);

  const handleLogin = async (code: string) => {
    const result = await login(code, 'worker');
    if (result.success) {
      navigate('/almacen/inventory', { replace: true });
    }
    return result;
  };

  return (
    <CodeLoginForm
      title="Acceso Almacén"
      subtitle="Ingresa el código de acceso del bar"
      icon={
        <div className="w-16 h-16 rounded-full bg-blue-500 flex items-center justify-center shadow-lg shadow-blue-500/25">
          <Store className="w-8 h-8 text-white" />
        </div>
      }
      onSubmit={handleLogin}
      altLinkText="← Acceso Administrador"
      altLinkTo="/admin/login"
    />
  );
}
