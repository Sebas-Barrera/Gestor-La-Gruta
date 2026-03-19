import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import type { UserRole } from '@/types/auth';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole: UserRole;
}

export function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const { isAuthenticated, currentUser } = useAuth();

  if (!isAuthenticated || !currentUser) {
    const loginPath = requiredRole === 'admin' ? '/admin/login' : '/almacen/login';
    return <Navigate to={loginPath} replace />;
  }

  if (currentUser.role !== requiredRole) {
    const redirectPath = currentUser.role === 'admin' ? '/admin/dashboard' : '/almacen/inventory';
    return <Navigate to={redirectPath} replace />;
  }

  return <>{children}</>;
}
