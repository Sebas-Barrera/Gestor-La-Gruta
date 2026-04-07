import { useEffect } from 'react';
import { useLocation, useNavigate, Outlet } from 'react-router-dom';
import { Sidebar } from '@/components/Sidebar';
import { Header } from '@/components/Header';
import { useAuth } from '@/contexts/AuthContext';
import { Toaster } from '@/components/ui/sonner';

const sectionMap: Record<string, string> = {
  dashboard: 'Dashboard',
  inventory: 'Inventario',
  bars: 'Almacenes',
  reports: 'Reportes',
  history: 'Historial',
  alerts: 'Alertas',
  settings: 'Configuración',
};

export function AdminLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuth();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  const activeSection = location.pathname.split('/').pop() || 'dashboard';

  const getBreadcrumbs = () => {
    const base = ['Dashboard'];
    const label = sectionMap[activeSection];
    if (label && activeSection !== 'dashboard') {
      return [...base, label];
    }
    return base;
  };

  const handleSectionChange = (section: string) => {
    navigate(`/admin/${section}`);
  };

  const handleLogout = () => {
    logout();
    navigate('/admin/login', { replace: true });
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar
        activeSection={activeSection}
        onSectionChange={handleSectionChange}
        role="admin"
        onLogout={handleLogout}
      />

      <main className="flex-1 ml-[72px] min-h-screen">
        <Header
          breadcrumbs={getBreadcrumbs()}
          userRole="admin"
          onSectionChange={handleSectionChange}
        />

        <Outlet />
      </main>

      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: 'white',
            border: '1px solid #E5E7EB',
            borderRadius: '12px',
          },
          descriptionClassName: '!text-gray-600',
        }}
      />
    </div>
  );
}
