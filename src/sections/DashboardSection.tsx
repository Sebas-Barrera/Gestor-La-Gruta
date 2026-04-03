import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Package,
  DollarSign,
  AlertTriangle,
  TrendingUp,
  Store,
} from 'lucide-react';
import { StatCard } from '@/components/StatCard';
import { ActivityLog } from '@/components/ActivityLog';
import { InventoryAlerts } from '@/components/InventoryAlerts';
import { BarPerformanceChart } from '@/components/BarPerformanceChart';
import { RecentSalesByBar } from '@/components/RecentSalesByBar';
import { cn } from '@/lib/utils';
import { useInventory } from '@/contexts/InventoryContext';
import { useBarManagement } from '@/hooks/useBarManagement';
import type { InventoryAlert, Activity } from '@/types';

export function DashboardSection() {
  const nav = useNavigate();
  const onNavigate = (section: string, params?: string) => nav(`/admin/${section}${params || ''}`);
  const [selectedBarId, setSelectedBarId] = useState<string | 'all'>('all');

  const { products, inventoryMovements } = useInventory();
  const { bars } = useBarManagement();

  // ── Alertas calculadas en tiempo real desde el stock actual ──────────
  const allAlerts = useMemo((): InventoryAlert[] => {
    return products
      .filter(p => p.stock <= p.minStock || p.stock <= 0)
      .map(p => ({
        id: p.id,
        productId: p.id,
        productName: p.name,
        type: p.stock <= 0 ? 'out_of_stock' as const : 'low_stock' as const,
        currentStock: p.stock,
        threshold: p.minStock,
        timestamp: new Date().toISOString(),
        barId: p.barId ?? '',
        barName: bars.find(b => b.id === p.barId)?.name,
      }));
  }, [products, bars]);

  const filteredAlerts = useMemo(() => {
    if (selectedBarId === 'all') return allAlerts;
    return allAlerts.filter(a => a.barId === selectedBarId);
  }, [allAlerts, selectedBarId]);

  // ── Actividades derivadas de movimientos de inventario ───────────────
  const filteredActivities = useMemo((): Activity[] => {
    const source = selectedBarId === 'all'
      ? inventoryMovements
      : inventoryMovements.filter(m => m.barId === selectedBarId);

    return source.slice(0, 30).map(m => ({
      id: m.id,
      type: m.type === 'in' ? 'stock_in' as const : 'stock_out' as const,
      message: `${m.type === 'in' ? '+' : '-'}${m.quantity} ${m.unit} de "${m.productName}"`,
      timestamp: m.timestamp,
      user: m.workerName,
      barId: m.barId,
      barName: bars.find(b => b.id === m.barId)?.name,
      productId: m.productId,
      productName: m.productName,
    }));
  }, [inventoryMovements, selectedBarId, bars]);

  // ── Stats globales calculadas ────────────────────────────────────────
  const dashboardStats = useMemo(() => {
    const filtered = selectedBarId === 'all' ? products : products.filter(p => p.barId === selectedBarId);
    return {
      totalProducts: filtered.length,
      inventoryValue: filtered.reduce((sum, p) => sum + p.stock * p.price, 0),
      lowStockCount: filtered.filter(p => p.status === 'low_stock' || p.status === 'out_of_stock').length,
      todaySales: 0,
      totalProductsChange: 0,
      inventoryValueChange: 0,
      todaySalesChange: 0,
    };
  }, [products, selectedBarId]);

  // ── Stats por bar (para BarPerformanceChart y el selector) ───────────
  const barStats = useMemo(() => {
    return bars.map(bar => {
      const barProducts = products.filter(p => p.barId === bar.id);
      return {
        ...bar,
        productCount: barProducts.length,
        inventoryValue: barProducts.reduce((acc, p) => acc + p.stock * p.price, 0),
        lowStockCount: barProducts.filter(p => p.status === 'low_stock').length,
        outOfStockCount: barProducts.filter(p => p.status === 'out_of_stock').length,
        todaySales: 0,
        salesTrend: 0,
      };
    });
  }, [bars, products]);

  return (
    <div className="p-6 space-y-6">
      {/* Bar Selector */}
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
                ? 'border-blue-500 bg-blue-50 text-blue-700'
                : 'border-gray-200 hover:border-blue-300',
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
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-200 hover:border-blue-300',
              )}
            >
              <div className={cn(
                'w-2 h-2 rounded-full',
                bar.outOfStockCount > 0 ? 'bg-red-500' :
                bar.lowStockCount > 0 ? 'bg-amber-500' : 'bg-blue-500',
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

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard
          icon={Package}
          iconBgColor="bg-blue-100"
          iconColor="text-blue-600"
          value={dashboardStats.totalProducts}
          label={selectedBarId === 'all' ? 'Total Productos' : 'Productos en Bar'}
          change={dashboardStats.totalProductsChange}
          changeLabel="vs mes pasado"
          delay={0}
        />
        <StatCard
          icon={DollarSign}
          iconBgColor="bg-blue-100"
          iconColor="text-blue-600"
          value={`$${dashboardStats.inventoryValue.toLocaleString()}`}
          label="Valor en Inventario"
          change={dashboardStats.inventoryValueChange}
          changeLabel="vs mes pasado"
          delay={100}
        />
        <StatCard
          icon={AlertTriangle}
          iconBgColor="bg-amber-100"
          iconColor="text-amber-600"
          value={filteredAlerts.length}
          label="Productos Stock Bajo"
          changeLabel="Requiere atención"
          delay={200}
        />
        <StatCard
          icon={TrendingUp}
          iconBgColor="bg-blue-100"
          iconColor="text-blue-600"
          value={`$${dashboardStats.todaySales.toLocaleString()}`}
          label="Salidas Hoy"
          change={dashboardStats.todaySalesChange}
          changeLabel="vs ayer"
          delay={300}
        />
      </div>

      {/* Bar Performance Overview */}
      {selectedBarId === 'all' && (
        <div className="grid grid-cols-1 gap-6">
          <div>
            <BarPerformanceChart
              bars={barStats}
              onViewReport={() => onNavigate('inventory')}
              delay={400}
            />
          </div>
        </div>
      )}

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="space-y-6">
          <InventoryAlerts
            alerts={filteredAlerts}
            bars={bars}
            products={products}
            onViewAll={() => onNavigate('alerts', selectedBarId !== 'all' ? `?bar=${selectedBarId}` : '')}
            onAlertClick={() => {
              onNavigate('alerts', selectedBarId !== 'all' ? `?bar=${selectedBarId}` : '');
            }}
            delay={600}
          />

          {selectedBarId !== 'all' && (
            <RecentSalesByBar
              barId={selectedBarId}
              barName={bars.find(b => b.id === selectedBarId)?.name || ''}
              onViewAll={() => onNavigate('reports')}
              delay={650}
            />
          )}
        </div>

        {/* Right Column - Activity Log */}
        <div className="lg:col-span-2">
          <ActivityLog
            activities={filteredActivities}
            bars={bars}
            onViewAll={() => onNavigate('reports', selectedBarId !== 'all' ? `?bar=${selectedBarId}` : '')}
            delay={700}
          />
        </div>
      </div>
    </div>
  );
}
