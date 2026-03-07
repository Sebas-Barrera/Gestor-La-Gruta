import { useState } from 'react';
import { 
  Package, 
  DollarSign, 
  AlertTriangle, 
  TrendingUp, 
  Store,
  ShoppingCart
} from 'lucide-react';
import { StatCard } from '@/components/StatCard';
import { CapacityChart } from '@/components/CapacityChart';
import { ActivityLog } from '@/components/ActivityLog';
import { InventoryAlerts } from '@/components/InventoryAlerts';
import { BarPerformanceChart } from '@/components/BarPerformanceChart';
import { RecentSalesByBar } from '@/components/RecentSalesByBar';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { dashboardStats, recentActivities, inventoryAlerts, bars, products, recentSales } from '@/data/mockData';

interface DashboardSectionProps {
  onNavigate: (section: string) => void;
}

export function DashboardSection({ onNavigate }: DashboardSectionProps) {
  const [selectedBarId, setSelectedBarId] = useState<string | 'all'>('all');

  // Calcular estadísticas por bar
  const barStats = bars.map(bar => {
    const barProducts = products.filter(p => p.barId === bar.id || bar.id === '1');
    const barSales = recentSales.filter(s => s.barId === bar.id);
    const totalValue = barProducts.reduce((acc, p) => acc + (p.stock * p.price), 0);
    const lowStock = barProducts.filter(p => p.status === 'low_stock').length;
    const outOfStock = barProducts.filter(p => p.status === 'out_of_stock').length;
    const totalSales = barSales.reduce((acc, s) => acc + s.total, 0);
    
    return {
      ...bar,
      productCount: barProducts.length,
      inventoryValue: totalValue,
      lowStockCount: lowStock,
      outOfStockCount: outOfStock,
      todaySales: totalSales,
      salesTrend: Math.floor(Math.random() * 20) - 5, // Simulado
    };
  });

  // Filtrar alertas por bar seleccionado
  const filteredAlerts = selectedBarId === 'all' 
    ? inventoryAlerts 
    : inventoryAlerts.filter(a => {
        const product = products.find(p => p.id === a.productId);
        return product?.barId === selectedBarId;
      });

  // Filtrar actividades por bar
  const filteredActivities = selectedBarId === 'all'
    ? recentActivities
    : recentActivities.filter(a => a.barId === selectedBarId);

  return (
    <div className="p-6 space-y-6">
      {/* Bar Selector - Filtro Principal */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
        <div className="flex items-center gap-4 overflow-x-auto pb-2 scrollbar-hide">
          <span className="text-sm font-medium text-gray-500 whitespace-nowrap flex-shrink-0">
            Ver datos de:
          </span>
          
          <button
            onClick={() => setSelectedBarId('all')}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-lg border-2 whitespace-nowrap flex-shrink-0',
              'transition-all duration-200',
              selectedBarId === 'all'
                ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                : 'border-gray-200 hover:border-emerald-300'
            )}
          >
            <Store className="w-4 h-4" />
            <span className="text-sm font-medium">Todos los Bares</span>
          </button>

          {barStats.map(bar => (
            <button
              key={bar.id}
              onClick={() => setSelectedBarId(bar.id)}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-lg border-2 whitespace-nowrap flex-shrink-0',
                'transition-all duration-200',
                selectedBarId === bar.id
                  ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                  : 'border-gray-200 hover:border-emerald-300'
              )}
            >
              <div className={cn(
                'w-2 h-2 rounded-full',
                bar.outOfStockCount > 0 ? 'bg-red-500' :
                bar.lowStockCount > 0 ? 'bg-amber-500' : 'bg-emerald-500'
              )} />
              <span className="text-sm font-medium">{bar.name}</span>
              {(bar.lowStockCount > 0 || bar.outOfStockCount > 0) && (
                <span className="ml-1 px-1.5 py-0.5 bg-red-500 text-white text-xs rounded-full">
                  {bar.lowStockCount + bar.outOfStockCount}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Stats Grid - Globales o por Bar */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard
          icon={Package}
          iconBgColor="bg-emerald-100"
          iconColor="text-emerald-600"
          value={selectedBarId === 'all' ? dashboardStats.totalProducts : barStats.find(b => b.id === selectedBarId)?.productCount || 0}
          label={selectedBarId === 'all' ? "Total Productos" : "Productos en Bar"}
          change={dashboardStats.totalProductsChange}
          changeLabel="vs mes pasado"
          delay={0}
        />
        <StatCard
          icon={DollarSign}
          iconBgColor="bg-blue-100"
          iconColor="text-blue-600"
          value={`$${(selectedBarId === 'all' ? dashboardStats.inventoryValue : barStats.find(b => b.id === selectedBarId)?.inventoryValue || 0).toLocaleString()}`}
          label="Valor en Inventario"
          change={dashboardStats.inventoryValueChange}
          changeLabel="vs mes pasado"
          delay={100}
        />
        <StatCard
          icon={AlertTriangle}
          iconBgColor="bg-amber-100"
          iconColor="text-amber-600"
          value={selectedBarId === 'all' ? dashboardStats.lowStockCount : filteredAlerts.length}
          label="Productos Stock Bajo"
          changeLabel="Requiere atención"
          delay={200}
        />
        <StatCard
          icon={TrendingUp}
          iconBgColor="bg-emerald-100"
          iconColor="text-emerald-600"
          value={`$${(selectedBarId === 'all' ? dashboardStats.todaySales : barStats.find(b => b.id === selectedBarId)?.todaySales || 0).toLocaleString()}`}
          label="Ventas Hoy"
          change={dashboardStats.todaySalesChange}
          changeLabel="vs ayer"
          delay={300}
        />
      </div>

      {/* Bar Performance Overview */}
      {selectedBarId === 'all' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <BarPerformanceChart bars={barStats} delay={400} />
          </div>
          <div>
            <CapacityChart
              percentage={68}
              currentLoad={850}
              maxCapacity={1250}
              delay={500}
            />
          </div>
        </div>
      )}

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Alerts & Sales */}
        <div className="space-y-6">
          <InventoryAlerts
            alerts={filteredAlerts}
            bars={bars}
            products={products}
            onViewAll={() => onNavigate('alerts')}
            delay={600}
          />
          
          {selectedBarId !== 'all' && (
            <RecentSalesByBar 
              barId={selectedBarId} 
              barName={bars.find(b => b.id === selectedBarId)?.name || ''}
              delay={650} 
            />
          )}
        </div>

        {/* Right Column - Activity Log */}
        <div className="lg:col-span-2">
          <ActivityLog
            activities={filteredActivities}
            bars={bars}
            delay={700}
          />
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
        <h3 className="text-sm font-semibold text-gray-700 mb-4">Acciones Rápidas</h3>
        <div className="flex flex-wrap gap-3">
          <Button 
            onClick={() => onNavigate('inventory')}
            className="gap-2 bg-emerald-500 hover:bg-emerald-600"
          >
            <Package className="w-4 h-4" />
            Ver Inventario Completo
          </Button>
          <Button 
            variant="outline"
            onClick={() => onNavigate('sales')}
            className="gap-2 hover:border-emerald-500 hover:text-emerald-600"
          >
            <ShoppingCart className="w-4 h-4" />
            Registrar Venta
          </Button>
          <Button 
            variant="outline"
            onClick={() => onNavigate('bars')}
            className="gap-2 hover:border-emerald-500 hover:text-emerald-600"
          >
            <Store className="w-4 h-4" />
            Gestionar Bares
          </Button>
        </div>
      </div>
    </div>
  );
}
