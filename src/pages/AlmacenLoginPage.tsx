import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Store, ArrowLeft, Check, MapPin } from 'lucide-react';
import { CodeLoginForm } from '@/components/shared/CodeLoginForm';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import type { Bar, Worker } from '@/types';
import lagrutaLogo from '@/assets/lagruta-logo.png';

export function AlmacenLoginPage() {
  const navigate = useNavigate();
  const { isAuthenticated, currentUser, workerLogin, selectWorkerBar } = useAuth();

  // Estado del flujo de 2 pasos
  const [pendingWorker, setPendingWorker] = useState<Worker | null>(null);
  const [availableBars, setAvailableBars] = useState<Bar[]>([]);

  useEffect(() => {
    if (isAuthenticated && currentUser?.role === 'worker') {
      navigate('/almacen/inventory', { replace: true });
    }
  }, [isAuthenticated, currentUser, navigate]);

  // Paso 1: Trabajador ingresa su PIN
  const handleLogin = async (code: string) => {
    const result = await workerLogin(code);

    if (result.success && !result.requiresBarSelection) {
      // Un solo bar → login directo
      navigate('/almacen/inventory', { replace: true });
    }

    if (result.success && result.requiresBarSelection && result.worker && result.workerBars) {
      // Múltiples bares → mostrar selección
      setPendingWorker(result.worker);
      setAvailableBars(result.workerBars);
    }

    return result;
  };

  // Paso 2: Trabajador selecciona un bar
  const handleBarSelect = (bar: Bar) => {
    if (!pendingWorker) return;
    selectWorkerBar(pendingWorker, bar);
    navigate('/almacen/inventory', { replace: true });
  };

  const handleBack = () => {
    setPendingWorker(null);
    setAvailableBars([]);
  };

  // ── Paso 2: Selección de Bar ──
  if (pendingWorker && availableBars.length > 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-lg p-8">
            {/* Logo */}
            <div className="flex justify-center mb-6">
              <img src={lagrutaLogo} alt="La Gruta" className="h-16 object-contain" />
            </div>

            {/* Saludo */}
            <h1 className="text-2xl font-bold text-gray-900 text-center mb-1">
              Hola, {pendingWorker.name.split(' ')[0]}
            </h1>
            <p className="text-sm text-gray-500 text-center mb-6">
              Selecciona el bar al que deseas ingresar
            </p>

            {/* Cards de bares */}
            <div className="space-y-3">
              {availableBars.map((bar, index) => (
                <button
                  key={bar.id}
                  onClick={() => handleBarSelect(bar)}
                  className={cn(
                    'w-full flex items-center gap-4 px-4 py-4 rounded-xl border-2',
                    'transition-all duration-300 ease-out',
                    'border-gray-200 bg-white',
                    'hover:border-blue-500 hover:bg-blue-50 hover:shadow-md hover:scale-[1.02]',
                    'group'
                  )}
                  style={{ animationDelay: `${index * 80}ms` }}
                >
                  <div className={cn(
                    'w-12 h-12 rounded-xl flex items-center justify-center',
                    'bg-gray-100 transition-colors duration-300',
                    'group-hover:bg-blue-500'
                  )}>
                    <Store className={cn(
                      'w-6 h-6 text-gray-500 transition-colors duration-300',
                      'group-hover:text-white'
                    )} />
                  </div>

                  <div className="flex-1 text-left">
                    <p className={cn(
                      'text-sm font-semibold text-gray-900 transition-colors duration-300',
                      'group-hover:text-blue-700'
                    )}>
                      {bar.name}
                    </p>
                    <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                      <MapPin className="w-3 h-3" />
                      {bar.location}
                    </p>
                  </div>

                  <div className={cn(
                    'w-8 h-8 rounded-full flex items-center justify-center',
                    'opacity-0 transition-all duration-200',
                    'group-hover:opacity-100',
                    'bg-blue-500'
                  )}>
                    <Check className="w-4 h-4 text-white" />
                  </div>
                </button>
              ))}
            </div>

            {/* Botón volver */}
            <div className="mt-6 text-center">
              <button
                onClick={handleBack}
                className="text-sm text-blue-600 hover:text-blue-700 hover:underline transition-colors inline-flex items-center gap-1"
              >
                <ArrowLeft className="w-4 h-4" />
                Volver al inicio
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Paso 1: Ingreso de PIN ──
  return (
    <CodeLoginForm
      title="Acceso Almacén"
      subtitle="Ingresa tu clave de trabajador"
      icon={
        <img src={lagrutaLogo} alt="La Gruta" className="h-16 object-contain" />
      }
      onSubmit={handleLogin}
      altLinkText="← Acceso Administrador"
      altLinkTo="/admin/login"
    />
  );
}
