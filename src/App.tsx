import { useState } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { Header } from '@/components/Header';
import { DashboardSection } from '@/sections/DashboardSection';
import { InventorySection } from '@/sections/InventorySection';
import { SalesSection } from '@/sections/SalesSection';
import { AlertsSection } from '@/sections/AlertsSection';
import { BarsSection } from '@/sections/BarsSection';
import { SettingsSection } from '@/sections/SettingsSection';
import { Toaster } from '@/components/ui/sonner';

function App() {
  const [activeSection, setActiveSection] = useState('dashboard');

  const getBreadcrumbs = () => {
    const base = ['Dashboard'];
    
    switch (activeSection) {
      case 'dashboard':
        return base;
      case 'inventory':
        return [...base, 'Inventario'];
      case 'sales':
        return [...base, 'Ventas'];
      case 'bars':
        return [...base, 'Bares'];
      case 'reports':
        return [...base, 'Reportes'];
      case 'alerts':
        return [...base, 'Alertas'];
      case 'settings':
        return [...base, 'Configuración'];
      default:
        return base;
    }
  };

  const renderSection = () => {
    switch (activeSection) {
      case 'dashboard':
        return <DashboardSection onNavigate={setActiveSection} />;
      case 'inventory':
        return <InventorySection />;
      case 'sales':
        return <SalesSection />;
      case 'bars':
        return <BarsSection />;
      case 'alerts':
        return <AlertsSection />;
      case 'settings':
        return <SettingsSection />;
      case 'reports':
        return (
          <div className="p-6">
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-12 text-center">
              <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">📊</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Reportes</h3>
              <p className="text-gray-500">Módulo de reportes en desarrollo</p>
            </div>
          </div>
        );
      default:
        return <DashboardSection onNavigate={setActiveSection} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <Sidebar 
        activeSection={activeSection} 
        onSectionChange={setActiveSection} 
      />

      {/* Main Content */}
      <main className="flex-1 ml-[72px] min-h-screen">
        {/* Header */}
        <Header
          breadcrumbs={getBreadcrumbs()}
          onAddProduct={() => console.log('Add product')}
          onViewReport={() => console.log('View report')}
        />

        {/* Page Content */}
        <div className="animate-in fade-in duration-300">
          {renderSection()}
        </div>
      </main>

      {/* Toast notifications */}
      <Toaster 
        position="top-right"
        toastOptions={{
          style: {
            background: 'white',
            border: '1px solid #E5E7EB',
            borderRadius: '12px',
          },
        }}
      />
    </div>
  );
}

export default App;
