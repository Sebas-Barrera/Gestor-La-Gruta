import { useEffect } from 'react';
import { useLocation, useNavigate, Outlet } from 'react-router-dom';
import { Sidebar } from '@/components/Sidebar';
import { Header } from '@/components/Header';
import { useAuth } from '@/contexts/AuthContext';
import { Toaster } from '@/components/ui/sonner';

export function AlmacenLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout, currentBar } = useAuth();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  const handleLogout = () => {
    logout();
    navigate('/almacen/login', { replace: true });
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar
        activeSection="inventory"
        onSectionChange={() => {}}
        role="worker"
        onLogout={handleLogout}
      />

      <main className="flex-1 ml-[72px] min-h-screen">
        <Header
          breadcrumbs={['Inventario']}
          userRole="worker"
          barName={currentBar?.name}
        />

        <div className="animate-in fade-in duration-300">
          <Outlet />
        </div>
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
