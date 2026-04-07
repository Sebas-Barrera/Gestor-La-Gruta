import { useEffect } from 'react';
import { useLocation, useNavigate, Outlet } from 'react-router-dom';
import { LogOut, Store } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Toaster } from '@/components/ui/sonner';
import lagrutaLogo from '@/assets/lagruta-logo.png';

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
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header con logo, nombre del almacén y cerrar sesión */}
      <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 sticky top-0 z-40">
        {/* Logo + Nombre del almacén */}
        <div className="flex items-center gap-4">
          <img src={lagrutaLogo} alt="La Gruta" className="h-9 object-contain" />
          {currentBar && (
            <>
              <div className="w-px h-8 bg-gray-200" />
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-500 flex items-center justify-center">
                  <Store className="w-4 h-4 text-white" />
                </div>
                <span className="text-sm font-semibold text-gray-900">{currentBar.name}</span>
              </div>
            </>
          )}
        </div>

        {/* Cerrar sesión */}
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 px-3 py-2 rounded-xl text-gray-500 active:bg-gray-100 active:text-red-600 transition-colors"
        >
          <LogOut className="w-5 h-5" />
          <span className="text-sm font-medium">Salir</span>
        </button>
      </header>

      {/* Contenido */}
      <main className="flex-1">
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
