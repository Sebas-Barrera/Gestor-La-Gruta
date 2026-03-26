import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CodeLoginForm } from '@/components/shared/CodeLoginForm';
import { useAuth } from '@/contexts/AuthContext';
import lagrutaLogo from '@/assets/lagruta-logo.png';

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
        <img src={lagrutaLogo} alt="La Gruta" className="h-16 object-contain" />
      }
      onSubmit={handleLogin}
      altLinkText="Acceso Almacén →"
      altLinkTo="/almacen/login"
    />
  );
}
